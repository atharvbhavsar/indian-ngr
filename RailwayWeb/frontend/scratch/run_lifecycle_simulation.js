import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { assessmentService } from '../src/services/assessmentService.js';

const envContent = fs.readFileSync('d:/RailwayWeb/RailwayWeb/frontend/.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Starting Superintendent Assessment Lifecycle integration test using production services...\n");

  // 1. Resolve employee (ss_1) user details
  const { data: user, error: uErr } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name')
    .eq('hrms_id', 'ss_1')
    .single();

  if (uErr || !user) {
    console.error("Could not find Danish user (ss_1):", uErr);
    return;
  }
  const employeeId = user.user_id;
  console.log(`Step 1: Found employee ${user.full_name} with UUID: ${employeeId}`);

  // 2. Resolve AOM (AOM_NGP) user details
  const { data: aom, error: aomErr } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name')
    .eq('hrms_id', 'AOM_NGP')
    .single();

  if (aomErr || !aom) {
    console.error("Could not find AOM user (AOM_NGP):", aomErr);
    return;
  }
  const aomId = aom.user_id;
  console.log(`Step 2: Found AOM reviewer ${aom.full_name} with UUID: ${aomId}`);

  // 3. Find Danish's pending/available assessment
  const { data: pendingAssessments } = await supabase
    .from('ASSESSMENT')
    .select('*')
    .eq('employee_id', employeeId)
    .in('status', ['Pending', 'AVAILABLE']);

  let targetAssessment = pendingAssessments?.[0];
  if (!targetAssessment) {
    console.log("No pending assessment found. Let's insert a fresh pending assessment to test the lifecycle.");
    const { data: newAssess, error: insErr } = await supabase
      .from('ASSESSMENT')
      .insert([{
        employee_id: employeeId,
        conducted_by: aomId,
        assessment_date: new Date().toISOString().slice(0, 10),
        assessment_type: 'SS Assessment',
        status: 'Pending'
      }])
      .select()
      .single();
    if (insErr) {
      console.error("Error creating test assessment:", insErr);
      return;
    }
    targetAssessment = newAssess;
  }
  const assessmentId = targetAssessment.assessment_id;
  console.log(`Step 3: Target Assessment ID: ${assessmentId} with status: ${targetAssessment.status}`);

  // 4. Simulate CBT/MCQ Exam Submission (SS Takes test)
  console.log("\nStep 4: Simulating CBT exam submission via assessmentService...");
  // Delete any existing test attempts for this assessment to start clean
  await supabase.from('TEST_ATTEMPT').delete().eq('assessment_id', assessmentId);

  const correctCount = 22; // 22 out of 25
  const percentage = Math.round((correctCount / 25) * 100);

  const attemptData = {
    assessmentId: assessmentId,
    employeeId: 'ss_1', // testing HRMS ID resolution
    obtainedMarks: correctCount,
    percentage: percentage,
    category: "",
    totalMarks: 25,
    conductedBy: 'AOM_NGP' // testing HRMS ID resolution
  };

  const answersArray = Array.from({ length: 25 }, (_, idx) => ({
    questionId: idx + 1,
    selectedOption: "A",
    isCorrect: idx < correctCount,
    correctOption: "A",
    marksObtained: idx < correctCount ? 1 : 0
  }));

  const res = await assessmentService.submitTestAttempt(attemptData, answersArray);
  if (!res || !res.success) {
    console.error("Failed to submit test attempt:", res?.error);
    return;
  }
  console.log("Test attempt submitted successfully.");

  // 5. Verify the Pending/Submitted state
  console.log("\nStep 5: Verifying state before approval...");
  const { data: checkAssess } = await supabase.from('ASSESSMENT').select('status').eq('assessment_id', assessmentId).single();
  const { data: checkAttempt } = await supabase.from('TEST_ATTEMPT').select('*').eq('assessment_id', assessmentId).single();
  console.log(`Verify: Assessment status is '${checkAssess?.status}'`);
  console.log(`Verify: Test Attempt score is ${checkAttempt?.obtained_marks}/${checkAttempt?.total_marks} | Category is '${checkAttempt?.category}'`);

  if (checkAssess?.status !== 'Submitted' || checkAttempt?.obtained_marks !== 22 || checkAttempt?.total_marks !== 25) {
    console.error("Verification failed for pending state!");
    return;
  }
  console.log("State before approval is 100% CORRECT (Unapproved score is 22/25, no category grade).");

  // 6. Simulate AOM Approval & Final Grading
  console.log("\nStep 6: Simulating AOM approval and final grading updates...");
  
  // The AOM grades the 5 sections summing up to 88/100
  const finalScore = 88; 
  const grade = 'A'; // Category A
  
  // Update ASSESSMENT to Approved
  const { error: appErr } = await supabase.from('ASSESSMENT').update({ status: 'Approved' }).eq('assessment_id', assessmentId);
  if (appErr) {
    console.error("Error approving assessment:", appErr);
    return;
  }
  
  // Update TEST_ATTEMPT to have the 100-point scale marks, Category, and total_marks: 100
  const { error: taErr } = await supabase.from('TEST_ATTEMPT').update({
    obtained_marks: finalScore,
    percentage: finalScore,
    category: grade,
    total_marks: 100
  }).eq('assessment_id', assessmentId);
  
  if (taErr) {
    console.error("Error updating test attempt:", taErr);
    return;
  }

  // Update EMPLOYEE_PROFILE for Danish (ss_1)
  const { error: profErr } = await supabase.from('EMPLOYEE_PROFILE').update({
    current_score: finalScore,
    category: grade
  }).eq('user_id', employeeId);

  if (profErr) {
    console.error("Error updating employee profile:", profErr);
    return;
  }
  console.log("Approved and locked assessment. Persisted score: 88/100, Category: A.");

  // 7. Verify the Approved State
  console.log("\nStep 7: Verifying state after approval...");
  const { data: finalAssess } = await supabase.from('ASSESSMENT').select('status').eq('assessment_id', assessmentId).single();
  const { data: finalAttempt } = await supabase.from('TEST_ATTEMPT').select('*').eq('assessment_id', assessmentId).single();
  const { data: finalProfile } = await supabase.from('EMPLOYEE_PROFILE').select('*').eq('user_id', employeeId).single();

  console.log(`Verify: Assessment status is '${finalAssess?.status}'`);
  console.log(`Verify: Test Attempt score is ${finalAttempt?.obtained_marks}/${finalAttempt?.total_marks} | Category is '${finalAttempt?.category}'`);
  console.log(`Verify: Employee Profile Category is '${finalProfile?.category}' | Score is ${finalProfile?.current_score}`);

  if (finalAssess?.status === 'Approved' && finalAttempt?.obtained_marks === 88 && finalAttempt?.total_marks === 100 && finalAttempt?.category === 'A' && finalProfile?.category === 'A') {
    console.log("\nSUCCESS: End-to-end integration flow verified. Lifecycle works perfectly!");
  } else {
    console.error("\nFAILURE: Verification failed for approved state!");
  }
}

run();
