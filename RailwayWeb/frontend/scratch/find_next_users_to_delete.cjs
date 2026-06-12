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
  'AOM_NGP', 'PM_6374654', 'SM_QA918797', 'sm_3', 'sm_1', 'sm_5',
  'ss_1', 'tm_2', 'TM_QA918797', 'tm_999', 'tm_981', 'tm_12121323',
  'tm_1907', 'tm_232323232323232', 'tm_2323', 'TI_3', 'ti_34',
  'ti_56', 'ti_12', 'ti_1', 'ti_2', 'ti_789'
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

  console.log(`Found ${users.length} users to delete out of ${ids.length} requested:`);
  users.forEach(u => {
    console.log(`HRMS: ${u.hrms_id} | Name: ${u.full_name} | Role: ${u.ROLE?.role_name} | UUID: ${u.user_id}`);
  });
}

findUsers();
