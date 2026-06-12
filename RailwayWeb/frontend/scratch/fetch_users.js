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
    .select('user_id, hrms_id, full_name, email, password_hash, role_id');
  if (uErr) {
    console.error("Error fetching users:", uErr);
    return;
  }
  
  const { data: roles, error: rErr } = await supabase
    .from('ROLE')
    .select('role_id, role_name');
  if (rErr) {
    console.error("Error fetching roles:", rErr);
    return;
  }
  
  const roleMap = {};
  roles.forEach(r => {
    roleMap[r.role_id] = r.role_name;
  });
  
  console.log("Users and their roles:");
  users.forEach(u => {
    console.log(`HRMS: ${u.hrms_id} | Name: ${u.full_name} | Role: ${roleMap[u.role_id]} | Password: ${u.password_hash}`);
  });
}

run();
