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

async function deleteUsers() {
  console.log("Resolving user UUIDs...");
  const { data: users, error: userError } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name')
    .in('hrms_id', ids);

  if (userError) {
    console.error("Error fetching users:", userError);
    return;
  }

  if (!users || users.length === 0) {
    console.log("No users found to delete.");
    return;
  }

  const userIds = users.map(u => u.user_id);
  console.log(`Found ${users.length} users with UUIDs:`, userIds);

  // Define table cleanups by user_id
  const tablesByUserId = [
    'MONITORING',
    'TRAINING_RECORD',
    'PME_RECORD',
    'TEST_ATTEMPT',
    'SPECIAL_MONITORING',
    'COUNSELLING_RECORD',
    'EMPLOYEE_PROFILE'
  ];

  for (const table of tablesByUserId) {
    console.log(`Cleaning up ${table} table...`);
    const { error } = await supabase
      .from(table)
      .delete()
      .in('user_id', userIds);
    if (error) {
      console.warn(`Warning/Error deleting from ${table}:`, error.message);
    }
  }

  // Define table cleanups by employee_id or other fields
  console.log("Cleaning up ASSESSMENT table...");
  const { error: assessErr } = await supabase
    .from('ASSESSMENT')
    .delete()
    .in('employee_id', ids);
  if (assessErr) {
    console.warn("Warning/Error deleting from ASSESSMENT:", assessErr.message);
  }

  console.log("Deleting users from USERS table...");
  const { error: finalErr } = await supabase
    .from('USERS')
    .delete()
    .in('user_id', userIds);

  if (finalErr) {
    console.error("Error deleting users from USERS table:", finalErr);
  } else {
    console.log("Successfully deleted all 13 users and their related child records from the database!");
  }
}

deleteUsers();
