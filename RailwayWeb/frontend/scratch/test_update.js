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
  console.log("Updating sm_1 profile via Supabase API...");

  // Let's first fetch the user to get their user_id
  const { data: user, error: fetchErr } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name, email, mobile_no')
    .eq('hrms_id', 'sm_1')
    .single();

  if (fetchErr) {
    console.error("Error fetching user:", fetchErr);
    return;
  }

  console.log("Fetched user:", user);

  // Try to update the user in USERS table
  const { data: updateData, error: updateErr } = await supabase
    .from('USERS')
    .update({
      mobile_no: '8767171316', // Same number or slightly changed
      email: 'a@gmail.com'
    })
    .eq('user_id', user.user_id)
    .select();

  console.log("USERS update result:", updateData, "Error:", updateErr);

  // Try to update the EMPLOYEE_PROFILE table
  const { data: profileData, error: profileErr } = await supabase
    .from('EMPLOYEE_PROFILE')
    .update({
      monitoring_status: 'Active'
    })
    .eq('user_id', user.user_id)
    .select();

  console.log("EMPLOYEE_PROFILE update result:", profileData, "Error:", profileErr);
}

run();
