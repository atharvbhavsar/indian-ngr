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

const testQuestionsAnswers = [
  1, 1, 2, 1, 0, 2, 1, 1, 1, 0, 0, 0, 2, 1, 1, 2, 1, 0, 0, 2, 2, 1, 1, 1, 1
]; // correct indexes 0-3 for all 25 questions

async function run() {
  const tmUid = '71881d85-2fdd-4d3c-b91c-e0d597760893';
  const assessmentId = 'c209fd2a-60f4-4e0b-9a29-bdbc45cef4a4';

  const answersArray = Array(25).fill(null).map((_, idx) => {
    const correctIdx = testQuestionsAnswers[idx];
    const isCorrect = idx < 18; // 18 correct, 7 incorrect
    const selectedIdx = isCorrect ? correctIdx : (correctIdx + 1) % 4;

    return {
      questionId: idx + 1,
      selectedOption: ["A", "B", "C", "D"][selectedIdx],
      isCorrect: isCorrect,
      correctOption: ["A", "B", "C", "D"][correctIdx],
      marksObtained: isCorrect ? 1 : 0
    };
  });

  console.log("Submitting test attempt via RPC...");
  const { data: rpcData, error: rpcError } = await supabase.rpc("submit_test_attempt_rpc", {
    p_employee_id: tmUid,
    p_assessment_id: assessmentId,
    p_total_marks: 25,
    p_obtained_marks: 18,
    p_percentage: 72,
    p_category: 'B',
    p_conducted_by: tmUid,
    p_answers: answersArray
  });

  if (rpcError) {
    console.error("RPC Error:", rpcError);
  } else {
    console.log("RPC Success:", rpcData);
  }
}

run();
