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
  const { data: user1 } = await supabase
    .from('USERS')
    .select('*, ROLE(*), EMPLOYEE_PROFILE(*)')
    .ilike('full_name', '%sunil%');
  console.log("=== SUNIL BY NAME ===");
  console.log(user1);

  const { data: user2 } = await supabase
    .from('USERS')
    .select('*, ROLE(*), EMPLOYEE_PROFILE(*)')
    .eq('hrms_id', 'ti_789');
  console.log("=== USER BY HRMS ID ti_789 ===");
  console.log(user2);
}

run();
