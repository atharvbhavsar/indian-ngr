import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  // Find ss_69 user
  const { data: user, error: uErr } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name')
    .eq('hrms_id', 'ss_69')
    .single();
  console.log("User ss_69:", user, uErr);

  if (user) {
    // Check ALL assessments for this user
    const { data: assess, error: aErr } = await supabase
      .from('ASSESSMENT')
      .select('assessment_id, status, assessment_type, employee_id, created_at, TEST_ATTEMPT(*)')
      .eq('employee_id', user.user_id);
    console.log("Assessments for ss_69:", JSON.stringify(assess, null, 2), aErr);
  }
}
run();
