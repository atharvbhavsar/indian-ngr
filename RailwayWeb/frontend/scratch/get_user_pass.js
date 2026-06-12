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
  const { data: userData, error: uErr } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, email, password_hash, full_name')
    .eq('hrms_id', 'si_2323232')
    .single();
  
  if (uErr) {
    console.error("Error fetching user:", uErr);
    return;
  }
  
  console.log("User data for si_2323232:");
  console.log(userData);
}

run();
