import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: user } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name')
    .eq('hrms_id', 'ss_13234')
    .single();
  console.log("User ss_13234 info:", user);

  if (user) {
    const { data: assess } = await supabase
      .from('ASSESSMENT')
      .select('*, TEST_ATTEMPT(*)')
      .eq('employee_id', user.user_id);
    console.log("Assessments for ss_13234:", JSON.stringify(assess, null, 2));
  }
}
run();
