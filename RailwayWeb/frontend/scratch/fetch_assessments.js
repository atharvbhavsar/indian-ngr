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
  const { data: users } = await supabase.from('USERS').select('user_id, hrms_id, full_name');
  const userMap = {};
  users.forEach(u => { userMap[u.user_id] = u; });

  const { data: assessments, error: aErr } = await supabase
    .from('ASSESSMENT')
    .select('*');
  if (aErr) {
    console.error("Error fetching assessments:", aErr);
    return;
  }
  
  console.log("Assessments:");
  assessments.forEach(a => {
    const emp = userMap[a.employee_id] || { hrms_id: 'unknown', full_name: 'unknown' };
    const cb = userMap[a.conducted_by] || { hrms_id: 'unknown', full_name: 'unknown' };
    console.log(`ID: ${a.assessment_id} | Employee: ${emp.full_name} (${emp.hrms_id}) | Conducted by: ${cb.full_name} | Date: ${a.assessment_date} | Type: ${a.assessment_type} | Status: ${a.status} | Period: ${a.period}`);
  });

  const { data: attempts } = await supabase.from('TEST_ATTEMPT').select('*');
  console.log("\nTest Attempts:");
  attempts.forEach(t => {
    console.log(`Attempt ID: ${t.attempt_id} | Assessment ID: ${t.assessment_id} | Score: ${t.obtained_marks}/${t.total_marks} | Pct: ${t.percentage}% | Cat: ${t.category}`);
  });
}

run();
