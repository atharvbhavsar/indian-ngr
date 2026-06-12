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
  const { data: attempts, error: err } = await supabase
    .from('TEST_ATTEMPT')
    .select('*')
    .eq('employee_id', '7de77da7-0364-4e5b-a757-002b22cd9179');
  
  if (err) {
    console.error("Error fetching test attempts:", err);
    return;
  }
  
  console.log("Test attempts for 7de77da7-0364-4e5b-a757-002b22cd9179:");
  console.log(attempts);
}

run();
