import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Mock assessmentService submit logic
async function submitTestAttempt(attemptData, answers = []) {
  try {
    let normData = {
      assessmentId: attemptData.assessmentId || attemptData.assessment_id,
      employeeId: attemptData.employeeId || attemptData.employee_id,
      totalMarks: attemptData.totalMarks || attemptData.total_marks || 100,
      obtainedMarks: attemptData.obtainedMarks !== undefined ? attemptData.obtainedMarks : attemptData.obtained_marks,
      percentage: attemptData.percentage !== undefined ? attemptData.percentage : (attemptData.obtainedMarks || 0),
      category: attemptData.category || "A",
      conductedBy: attemptData.conductedBy || attemptData.conducted_by
    };
    let answersArray = Array.isArray(answers) ? answers : [];

    // Resolve employeeId HRMS ID to USERS UUID if needed
    let resolvedEmployeeId = normData.employeeId;
    if (resolvedEmployeeId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedEmployeeId)) {
      const { data: uData, error: uErr } = await supabase
        .from("USERS")
        .select("user_id")
        .eq("hrms_id", resolvedEmployeeId)
        .single();
      if (!uErr && uData) {
        resolvedEmployeeId = uData.user_id;
      } else {
        throw new Error(`User UUID could not be resolved for employee HRMS ID ${resolvedEmployeeId}`);
      }
    }

    // Resolve conductedBy HRMS ID to USERS UUID if needed
    let resolvedConductedBy = normData.conductedBy;
    if (resolvedConductedBy && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedConductedBy)) {
      const { data: cData, error: cErr } = await supabase
        .from("USERS")
        .select("user_id")
        .eq("hrms_id", resolvedConductedBy)
        .single();
      if (!cErr && cData) {
        resolvedConductedBy = cData.user_id;
      } else {
        resolvedConductedBy = null;
      }
    }

    const score = Number(normData.obtainedMarks !== undefined ? normData.obtainedMarks : (normData.percentage || 0));

    // Resolve assessment_id if not provided
    let assessmentId = normData.assessmentId;
    if (!assessmentId && resolvedEmployeeId) {
      const { data: activeAssessments, error: activeErr } = await supabase
        .from("ASSESSMENT")
        .select("assessment_id")
        .eq("employee_id", resolvedEmployeeId)
        .in("status", ["AVAILABLE", "LOCKED", "IN_PROGRESS", "Draft", "Pending", "Scheduled"])
        .order("created_at", { ascending: false })
        .limit(1);
      if (!activeErr && activeAssessments && activeAssessments.length > 0) {
        assessmentId = activeAssessments[0].assessment_id;
      }
    }

    console.log("Submitting test attempt with data:", {
      p_employee_id: resolvedEmployeeId,
      p_assessment_id: assessmentId,
      score,
      resolvedConductedBy
    });

    const rpcAnswers = answersArray.map(ans => ({
      questionId: ans.questionId,
      selectedOption: ans.selectedOption || "A",
      isCorrect: ans.isCorrect !== undefined ? ans.isCorrect : true,
      correctOption: ans.correctOption || "A",
      marksObtained: ans.marksObtained !== undefined ? ans.marksObtained : 4
    }));

    const { data: rpcData, error: rpcError } = await supabase.rpc("submit_test_attempt_rpc", {
      p_employee_id: resolvedEmployeeId,
      p_assessment_id: assessmentId || null,
      p_total_marks: Number(normData.totalMarks || 100),
      p_obtained_marks: Number(normData.obtainedMarks !== undefined ? normData.obtainedMarks : score),
      p_percentage: Number(normData.percentage !== undefined ? normData.percentage : score),
      p_category: normData.category || "A",
      p_conducted_by: resolvedConductedBy || resolvedEmployeeId,
      p_answers: rpcAnswers
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw rpcError;
    }

    console.log("RPC Success:", rpcData);
    return { success: true, rpcData };

  } catch (err) {
    console.error("Submission failed:", err);
    return { success: false, error: err.message };
  }
}

async function test() {
  const attemptData = {
    employeeId: "ss_13234",
    obtainedMarks: 18,
    percentage: 72,
    category: "B",
    totalMarks: 25,
    conductedBy: "AOM"
  };
  const answersArray = Array(25).fill(null).map((_, i) => ({
    questionId: i + 1,
    selectedOption: "A",
    isCorrect: true,
    correctOption: "A",
    marksObtained: 1
  }));

  await submitTestAttempt(attemptData, answersArray);
}

test();
