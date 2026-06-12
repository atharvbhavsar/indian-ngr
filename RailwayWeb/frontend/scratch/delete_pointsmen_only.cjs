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

// List of 12 Pointsmen HRMS IDs (excluding AOM_NGP)
const pointsmenHrmsIds = [
  'PM_4366', 'PM_7418', 'pm_4348u', 'pm_1', 'PM_4712', 
  'PM_6744', 'PM_2650', 'pm_5', 'pm_3', 'PM_4672', 'PM_8271', 'PM_8624'
];

async function deletePointsmen() {
  console.log("Resolving Pointsmen UUIDs...");
  const { data: users, error: userError } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name')
    .in('hrms_id', pointsmenHrmsIds);

  if (userError) {
    console.error("Error fetching users:", userError);
    return;
  }

  if (!users || users.length === 0) {
    console.log("No pointsmen found to delete.");
    return;
  }

  const userIds = users.map(u => u.user_id);
  console.log(`Found ${users.length} pointsmen with UUIDs:`, userIds);

  // 1. Delete from child tables referencing user_id
  const tablesByUserId = [
    'MONITORING',
    'TRAINING_RECORD',
    'PME_RECORD',
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

  // 2. Delete from tables where employee_id / conducted_by references these pointsmen as UUIDs
  console.log("Cleaning up ASSESSMENT table where pointsmen are employees...");
  const { error: assessErr } = await supabase
    .from('ASSESSMENT')
    .delete()
    .in('employee_id', userIds);
  if (assessErr) {
    console.warn("Warning/Error deleting from ASSESSMENT:", assessErr.message);
  }

  console.log("Cleaning up ASSESSMENT table where pointsmen are conducted_by...");
  const { error: assessErr2 } = await supabase
    .from('ASSESSMENT')
    .delete()
    .in('conducted_by', userIds);
  if (assessErr2) {
    console.warn("Warning/Error deleting from ASSESSMENT (conducted_by):", assessErr2.message);
  }

  // 3. Delete from USERS
  console.log("Deleting pointsmen from USERS table...");
  const { error: finalErr } = await supabase
    .from('USERS')
    .delete()
    .in('user_id', userIds);

  if (finalErr) {
    console.error("Error deleting pointsmen from USERS table:", finalErr);
  } else {
    console.log("Successfully deleted all 12 pointsmen and their related records!");
  }
}

deletePointsmen();
