import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
  const resolvedEmployeeId = '7de77da7-0364-4e5b-a757-002b22cd9179'; // sscscsc
  const assessmentId = 'aa6fd4f9-1ec5-4715-bb88-93887d27f0fc';
  const score = 10;
  const percentage = 40;
  const resolvedConductedBy = 'e6c542d6-6752-4571-822b-f75cd3ba2a0d';
  
  const answersArray = Array(25).fill(null).map((_, idx) => ({
    questionId: idx + 1,
    selectedOption: "A",
    isCorrect: true,
    correctOption: "A",
    marksObtained: 1
  }));

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
    p_total_marks: 25,
    p_obtained_marks: score,
    p_percentage: percentage,
    p_category: "D",
    p_conducted_by: resolvedConductedBy || resolvedEmployeeId,
    p_answers: rpcAnswers
  });

  if (rpcError) {
    console.error("RPC Error:", rpcError);
  } else {
    console.log("RPC Success:", rpcData);
  }
}

run();
