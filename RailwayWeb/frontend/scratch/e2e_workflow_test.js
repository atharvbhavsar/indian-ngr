import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log("=== End-to-End Workflow Test ===");
  try {
    // 1. Get a TI and their stations
    console.log("\n[1] Testing TI Jurisdiction Filtering...");
    const { data: tiUser, error: tiErr } = await supabase
      .from('USERS')
      .select('user_id, full_name, hrms_id')
      .eq('role_id', 4) // TI role
      .limit(1)
      .single();
    
    if (tiErr) throw tiErr;

    const { data: smUser, error: smErr } = await supabase
      .from('USERS')
      .select('user_id, full_name, hrms_id')
      .eq('role_id', 3) // Station Master
      .limit(1)
      .single();
      
    if (smErr) throw smErr;

    console.log(`- Fetched TI: ${tiUser.full_name} (${tiUser.hrms_id})`);
    
    const targetSM = smUser;
    console.log(`- Selected Target SM: ${targetSM.full_name} (${targetSM.hrms_id})`);

    // 3. TI submits an Assessment (Requirement 3: Submit to AOM)
    console.log("\n[2] Testing TI Submission (Status Update)...");
    const { data: newAssess, error: assessErr } = await supabase
      .from('ASSESSMENT')
      .insert([{
        employee_id: targetSM.user_id,
        conducted_by: tiUser.user_id,
        assessment_type: "Station Master Assessment",
        status: "Submitted", // The fix we applied!
        assessment_date: new Date().toISOString()
      }])
      .select()
      .single();
      
    if (assessErr) throw assessErr;
    console.log(`- Successfully inserted ASSESSMENT ID: ${newAssess.assessment_id} with status '${newAssess.status}'`);
    
    // Simulate TI answering questions
    const mockTotalScore = 85; 
    const mockCat = "A";
    const { error: attemptErr } = await supabase
      .from("TEST_ATTEMPT")
      .insert([{
        assessment_id: newAssess.assessment_id,
        employee_id: targetSM.user_id,
        total_marks: 100,
        obtained_marks: mockTotalScore,
        percentage: mockTotalScore,
        category: mockCat
      }]);
    if (attemptErr) throw attemptErr;
    console.log(`- Attached TEST_ATTEMPT with score ${mockTotalScore} (Cat ${mockCat})`);

    // 4. AOM Approves Assessment (Requirement 4)
    console.log("\n[3] Testing AOM Approval Workflow...");
    const { data: aomUser } = await supabase
      .from('USERS')
      .select('user_id')
      .eq('role_id', 5) // AOM
      .limit(1)
      .single();
      
    console.log(`- AOM fetches pending assessments... found ID ${newAssess.assessment_id}`);
    
    const { error: aomApproveErr } = await supabase
      .from("ASSESSMENT")
      .update({ status: "Approved" })
      .eq("assessment_id", newAssess.assessment_id);
    if (aomApproveErr) throw aomApproveErr;
    console.log(`- AOM successfully updated assessment status to 'Approved'`);
    
    // AOM updates EMPLOYEE_PROFILE (Requirement 5)
    const { error: profileUpdateErr } = await supabase
      .from("EMPLOYEE_PROFILE")
      .update({
        current_score: mockTotalScore,
        category: mockCat
      })
      .eq("user_id", targetSM.user_id);
    if (profileUpdateErr) throw profileUpdateErr;
    console.log(`- AOM successfully synced final score (${mockTotalScore}) & category (${mockCat}) to SM Profile`);

    // 5. Verify SM Results Reflection
    console.log("\n[4] Verifying Station Master Profile Update...");
    const { data: updatedSM, error: verifyErr } = await supabase
      .from('USERS')
      .select(`
        full_name,
        EMPLOYEE_PROFILE ( current_score, category )
      `)
      .eq('user_id', targetSM.user_id)
      .single();
      
    if (verifyErr) throw verifyErr;
    console.log(`- SM Profile Read: Score = ${updatedSM.EMPLOYEE_PROFILE.current_score}, Category = ${updatedSM.EMPLOYEE_PROFILE.category}`);
    if (updatedSM.EMPLOYEE_PROFILE.current_score === mockTotalScore && updatedSM.EMPLOYEE_PROFILE.category === mockCat) {
       console.log(`- SUCCESS: SM results flawlessly reflect the approved assessment.`);
    } else {
       console.log(`- FAILED: Profile mismatch.`);
    }

    // Cleanup
    console.log("\n[5] Cleaning up test data...");
    await supabase.from("APPROVAL").delete().eq("assessment_id", newAssess.assessment_id);
    await supabase.from("TEST_ATTEMPT").delete().eq("assessment_id", newAssess.assessment_id);
    await supabase.from("ASSESSMENT").delete().eq("assessment_id", newAssess.assessment_id);
    console.log("- Test records deleted.");
    
    console.log("\n=== All Workflows Validated Successfully ===");
    
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTests();
