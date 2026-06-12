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
  const { data: user, error } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name, email, password_hash, role_id, ROLE (role_name)')
    .eq('hrms_id', 'AOM_NGP')
    .single();

  if (error) {
    console.error("Error fetching AOM_NGP:", error);
  } else {
    console.log("AOM_NGP User details:", user);
  }
}

run();
