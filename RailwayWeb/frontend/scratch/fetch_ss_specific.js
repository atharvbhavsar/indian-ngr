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
  const { data: assess, error: aErr } = await supabase
    .from('ASSESSMENT')
    .select(`
      *,
      employee:USERS!employee_id (
        user_id,
        hrms_id,
        full_name,
        ROLE (role_name)
      ),
      TEST_ATTEMPT (*)
    `)
    .eq('employee_id', '7de77da7-0364-4e5b-a757-002b22cd9179');
  
  if (aErr) {
    console.error("Error fetching assessments for sscscsc:", aErr);
    return;
  }
  
  console.log("Assessments for sscscsc:");
  console.log(JSON.stringify(assess, null, 2));
}

run();
