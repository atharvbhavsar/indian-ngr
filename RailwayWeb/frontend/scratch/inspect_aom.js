const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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
    .select('user_id, hrms_id, full_name, email, password, ROLE (role_name)')
    .eq('role_id', 2);

  if (error) {
    console.error("Error fetching AOM users:", error);
    // If password doesn't exist, try password_hash
    const { data: usersAlt, error: errorAlt } = await supabase
      .from('USERS')
      .select('user_id, hrms_id, full_name, email, password_hash, ROLE (role_name)')
      .eq('role_id', 2);
    if (errorAlt) {
      console.error("Error fetching AOM users with password_hash:", errorAlt);
    } else {
      console.log("AOM Users found (with password_hash):", usersAlt);
    }
  } else {
    console.log("AOM Users found (with password):", users);
  }
}

run();
