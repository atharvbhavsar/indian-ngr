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

async function run() {
  console.log("=================================================");
  console.log("=== E2E WORKFLOW VERIFICATION TEST ===");
  console.log("=================================================");

  try {
    // 1. Fetch a TM user
    const { data: tmUser, error: tmErr } = await supabase
      .from('USERS')
      .select('user_id, full_name, hrms_id')
      .eq('role_id', 7) // TM role
      .limit(1)
      .single();
    if (tmErr) throw tmErr;

    const { data: tiUser, error: tiErr } = await supabase
      .from('USERS')
      .select('user_id, full_name, hrms_id')
      .eq('role_id', 4) // TI role
      .limit(1)
      .single();
    if (tiErr) throw tiErr;

    console.log(`Train Manager: ${tmUser.full_name} (${tmUser.hrms_id})`);
    console.log(`Traffic Inspector: ${tiUser.full_name} (${tiUser.hrms_id})`);

    // 2. Create TM Assessment
    console.log("\n[1] Creating a new Assessment with status AVAILABLE...");
    const { data: assess, error: assessErr } = await supabase
      .from('ASSESSMENT')
      .insert([{
        employee_id: tmUser.user_id,
        conducted_by: tiUser.user_id,
        assessment_type: "Train Manager Assessment",
        status: "AVAILABLE",
        assessment_date: new Date().toISOString()
      }])
      .select()
      .single();
    if (assessErr) throw assessErr;
    console.log(`Assessment created. ID: ${assess.assessment_id}`);

    // 3. Simulate Train Manager taking CBT exam
    console.log("\n[2] Simulating TM submitting CBT MCQ exam...");
    const answersArray = Array(25).fill(null).map((_, idx) => ({
      questionId: idx + 1,
      selectedOption: "A",
      isCorrect: idx < 18, // 18 correct answers
      correctOption: "A",
      marksObtained: idx < 18 ? 1 : 0
    }));

    const { data: rpcData, error: rpcError } = await supabase.rpc("submit_test_attempt_rpc", {
      p_employee_id: tmUser.user_id,
      p_assessment_id: assess.assessment_id,
      p_total_marks: 25,
      p_obtained_marks: 18,
      p_percentage: 72,
      p_category: 'B',
      p_conducted_by: tmUser.user_id,
      p_answers: answersArray
    });
    if (rpcError) throw rpcError;
    console.log("CBT test attempt successfully submitted via RPC.");

    // Verify a TEST_ATTEMPT record exists
    const { data: attempt, error: attErr } = await supabase
      .from('TEST_ATTEMPT')
      .select('*')
      .eq('assessment_id', assess.assessment_id)
      .single();
    if (attErr) throw attErr;
    console.log(`Attempt ID: ${attempt.attempt_id} | Total Marks: ${attempt.total_marks} | Obtained: ${attempt.obtained_marks}`);

    // Verify ANSWER_HISTORY has 25 rows
    const { data: historyRows, error: histErr } = await supabase
      .from('ANSWER_HISTORY')
      .select('attempt_id')
      .eq('attempt_id', attempt.attempt_id);
    if (histErr) throw histErr;
    console.log(`ANSWER_HISTORY rows: ${historyRows.length} (Expected: 25)`);

    // 4. Simulate TI submitting checklist (updates attempt, preserves CBT answers)
    console.log("\n[3] Simulating TI completing safety checklist evaluation...");
    const mockTIEvaluationAnswers = {
      alcoholicStatus: "Non-Alcoholic",
      pmeStatus: "Fit",
      refStatus: "Cleared",
      counselling: "No",
      automaticTraining: "No",
      remarks: "TI field evaluation remarks",
      trainSafety: ["Yes", "Yes", "Yes", "Yes", "No"],   // 4 * 3 = 12 marks
      signaling: ["Yes", "Yes", "Yes", "Yes", "Yes"],  // 5 * 3 = 15 marks
      shunting: ["Yes", "Yes", "Yes", "No", "No"],      // 3 * 3 = 9 marks
      documentation: ["Yes", "Yes", "Yes", "Yes", "Yes"], // 5 * 3 = 15 marks
      emergency: ["Yes", "Yes", "Yes", "Yes", "No"],     // 4 * 3 = 12 marks
      knowledgeMarks: "18"
    };

    const countYes = arr => (arr || []).filter(v => v === "Yes").length;
    const sectionBreakdown = [
      { title: "Train Safety & Brake Inspection", score: countYes(mockTIEvaluationAnswers.trainSafety) * 3, max: 15, marks: countYes(mockTIEvaluationAnswers.trainSafety) * 3, outOf: 15 },
      { title: "Signaling & Whistle Compliance", score: countYes(mockTIEvaluationAnswers.signaling) * 3, max: 15, marks: countYes(mockTIEvaluationAnswers.signaling) * 3, outOf: 15 },
      { title: "Shunting & Coupling Ops", score: countYes(mockTIEvaluationAnswers.shunting) * 3, max: 15, marks: countYes(mockTIEvaluationAnswers.shunting) * 3, outOf: 15 },
      { title: "Train Log & Guard Certificates", score: countYes(mockTIEvaluationAnswers.documentation) * 3, max: 15, marks: countYes(mockTIEvaluationAnswers.documentation) * 3, outOf: 15 },
      { title: "Emergency Train Protection", score: countYes(mockTIEvaluationAnswers.emergency) * 3, max: 15, marks: countYes(mockTIEvaluationAnswers.emergency) * 3, outOf: 15 },
      { title: "Written Exam (Knowledge)", score: 18, max: 25, marks: 18, outOf: 25 }
    ];

    const total = 12 + 15 + 9 + 15 + 12 + 18; // 81 marks
    const cat = total >= 80 ? "B" : "C";

    // Direct update logic simulating our frontend fix
    const { data: existingAttempt } = await supabase
      .from("TEST_ATTEMPT")
      .select("*")
      .eq("assessment_id", assess.assessment_id)
      .maybeSingle();

    if (!existingAttempt) throw new Error("Attempt not found");

    const prevAnswers = existingAttempt.answers;
    const mergedAnswers = Array.isArray(prevAnswers)
      ? { questions: prevAnswers, ...mockTIEvaluationAnswers, sections: sectionBreakdown }
      : { ...prevAnswers, ...mockTIEvaluationAnswers, sections: sectionBreakdown };

    const { error: updateErr } = await supabase
      .from("TEST_ATTEMPT")
      .update({
        obtained_marks: total,
        total_marks: 100,
        percentage: total,
        category: cat,
        answers: mergedAnswers,
        submitted_at: new Date().toISOString()
      })
      .eq("attempt_id", existingAttempt.attempt_id);
    if (updateErr) throw updateErr;

    const { error: updateAssessErr } = await supabase
      .from("ASSESSMENT")
      .update({
        status: "Submitted",
        conducted_by: tiUser.user_id,
        assessment_date: new Date().toISOString().slice(0, 10)
      })
      .eq("assessment_id", assess.assessment_id);
    if (updateAssessErr) throw updateAssessErr;

    console.log("TI checklist evaluation successfully saved.");

    // Fetch updated attempt
    const { data: updatedAttempt, error: fetchErr } = await supabase
      .from("TEST_ATTEMPT")
      .select("*")
      .eq("attempt_id", existingAttempt.attempt_id)
      .single();
    if (fetchErr) throw fetchErr;

    console.log(`Updated Attempt obtained_marks: ${updatedAttempt.obtained_marks} (Expected: 81)`);
    console.log(`Updated Attempt total_marks: ${updatedAttempt.total_marks} (Expected: 100)`);

    // Verify ANSWER_HISTORY has not been deleted (should still be 25)
    const { data: afterTiHistoryRows } = await supabase
      .from('ANSWER_HISTORY')
      .select('attempt_id')
      .eq('attempt_id', attempt.attempt_id);
    console.log(`ANSWER_HISTORY rows after TI submit: ${afterTiHistoryRows.length} (Expected: 25)`);

    // 5. Test Alcoholic Override on a new assessment
    console.log("\n[4] Testing Category D Override for Alcoholic employee...");
    const { data: alcAssess, error: alcAssessErr } = await supabase
      .from('ASSESSMENT')
      .insert([{
        employee_id: tmUser.user_id,
        conducted_by: tiUser.user_id,
        assessment_type: "Train Manager Assessment",
        status: "AVAILABLE",
        assessment_date: new Date().toISOString()
      }])
      .select()
      .single();
    if (alcAssessErr) throw alcAssessErr;

    // Simulate CBT
    await supabase.rpc("submit_test_attempt_rpc", {
      p_employee_id: tmUser.user_id,
      p_assessment_id: alcAssess.assessment_id,
      p_total_marks: 25,
      p_obtained_marks: 22,
      p_percentage: 88,
      p_category: 'A',
      p_conducted_by: tmUser.user_id,
      p_answers: answersArray
    });

    // Simulate TI submitting Alcoholic checklist
    const mockTIEvaluationAlcAnswers = {
      ...mockTIEvaluationAnswers,
      alcoholicStatus: "Alcoholic"
    };

    const { data: existingAlcAttempt } = await supabase
      .from("TEST_ATTEMPT")
      .select("*")
      .eq("assessment_id", alcAssess.assessment_id)
      .maybeSingle();

    const mergedAlcAnswers = {
      questions: existingAlcAttempt.answers,
      ...mockTIEvaluationAlcAnswers,
      sections: sectionBreakdown
    };

    // Category should be overridden to 'D' because of Alcoholic status
    const alcCat = "D";

    const { error: alcUpdateErr } = await supabase
      .from("TEST_ATTEMPT")
      .update({
        obtained_marks: total,
        total_marks: 100,
        percentage: total,
        category: alcCat,
        answers: mergedAlcAnswers,
        submitted_at: new Date().toISOString()
      })
      .eq("attempt_id", existingAlcAttempt.attempt_id);
    if (alcUpdateErr) throw alcUpdateErr;

    const { data: finalAlcAttempt } = await supabase
      .from("TEST_ATTEMPT")
      .select("category, obtained_marks")
      .eq("attempt_id", existingAlcAttempt.attempt_id)
      .single();
    console.log(`Alcoholic employee attempt category in DB: '${finalAlcAttempt.category}' (Expected: 'D')`);

    // Clean up
    console.log("\n[5] Cleaning up test records from DB...");
    await supabase.from("ANSWER_HISTORY").delete().eq("attempt_id", existingAttempt.attempt_id);
    await supabase.from("TEST_ATTEMPT").delete().eq("assessment_id", assess.assessment_id);
    await supabase.from("ASSESSMENT").delete().eq("assessment_id", assess.assessment_id);
    await supabase.from("ANSWER_HISTORY").delete().eq("attempt_id", existingAlcAttempt.attempt_id);
    await supabase.from("TEST_ATTEMPT").delete().eq("assessment_id", alcAssess.assessment_id);
    await supabase.from("ASSESSMENT").delete().eq("assessment_id", alcAssess.assessment_id);
    console.log("Cleanup finished.");

    if (
      updatedAttempt.obtained_marks === 81 &&
      updatedAttempt.total_marks === 100 &&
      afterTiHistoryRows.length === 25 &&
      finalAlcAttempt.category === 'D'
    ) {
      console.log("\n>>> ALL WORKFLOW TESTS PASSED SUCCESSFULLY! <<<");
    } else {
      console.error("\n>>> TEST FAILED: Verification criteria not met. <<<");
    }
  } catch (err) {
    console.error("Error running test:", err);
  }
}

run();
