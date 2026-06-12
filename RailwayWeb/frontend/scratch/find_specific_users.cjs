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

const ids = [
  'PM_4366', 'PM_7418', 'pm_4348u', 'AOM_NGP', 'pm_1', 'PM_4712', 
  'PM_6744', 'PM_2650', 'pm_5', 'pm_3', 'PM_4672', 'PM_8271', 'PM_8624'
];

async function findUsers() {
  const { data: users, error } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name, ROLE(role_name)')
    .in('hrms_id', ids);

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  console.log("Users found in DB:");
  users.forEach(u => {
    console.log(`HRMS: ${u.hrms_id} | Name: ${u.full_name} | Role: ${u.ROLE?.role_name} | UUID: ${u.user_id}`);
  });
}

findUsers();
