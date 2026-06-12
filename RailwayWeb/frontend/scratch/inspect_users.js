import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually
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
  const { data: users, error } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name, email, mobile_no, ROLE (role_name)')
    .limit(100);

  if (error) {
    console.error("Error fetching users:", error);
  } else {
    console.log("Users in DB:");
    users.forEach(u => {
      console.log(`- ${u.hrms_id} | ${u.full_name} | ${u.email} | ${u.mobile_no} | Role: ${u.ROLE?.role_name}`);
    });
  }
}

run();
