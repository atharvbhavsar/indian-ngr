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
  const { data: users, error: uErr } = await supabase
    .from('USERS')
    .select('*');
  
  if (uErr) {
    console.error("Error fetching users:", uErr);
    return;
  }
  
  console.log("All USERS:");
  users.forEach(u => {
    console.log(`user_id: ${u.user_id} | hrms_id: ${u.hrms_id} | full_name: ${u.full_name}`);
  });
}

run();
