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
      assessment_id,
      employee_id,
      status,
      assessment_type,
      TEST_ATTEMPT (*)
    `);
  
  if (aErr) {
    console.error("Error fetching assessments:", aErr);
    return;
  }
  
  console.log("Assessments:");
  console.log(JSON.stringify(assess, null, 2));
}

run();
