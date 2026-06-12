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

async function check() {
  const attemptData = {
    assessmentId: null,
    employeeId: 'si_23232',
    obtainedMarks: 20,
    percentage: 80,
    category: "",
    totalMarks: 25,
    conductedBy: "AOM"
  };

  const answersArray = Array.from({ length: 25 }, (_, idx) => ({
    questionId: idx + 1,
    selectedOption: "A",
    isCorrect: true,
    correctOption: "A",
    marksObtained: 1
  }));

  console.log("Calling submitTestAttempt...");
  const res = await assessmentService.submitTestAttempt(attemptData, answersArray);
  console.log("Result:", res);
}

check();
