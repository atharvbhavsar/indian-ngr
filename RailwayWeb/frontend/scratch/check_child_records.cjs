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

async function checkChildren() {
  const { data: users, error } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name')
    .in('hrms_id', ids);

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  const userIds = users.map(u => u.user_id);
  
  // Tables to check
  const tables = [
    'EMPLOYEE_PROFILE',
    'MONITORING',
    'PME_RECORD',
    'TRAINING_RECORD',
    'ASSESSMENT',
    'INCIDENT',
    'COUNSELLING_RECORD',
    'SPECIAL_MONITORING'
  ];

  console.log(`Checking child records for ${users.length} users...`);
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .or(`user_id.in.(${userIds.join(',')}),employee_id.in.(${ids.join(',')})`);
      
      if (error) {
        // Some tables might have different column names or not exist
        // Let's try matching just user_id or employee_id
        const { data: data2, error: error2 } = await supabase
          .from(table)
          .select('*')
          .in('user_id', userIds);
        
        if (!error2 && data2.length > 0) {
          console.log(`Table: ${table} | Found ${data2.length} records matching user_id`);
        }
      } else if (data && data.length > 0) {
        console.log(`Table: ${table} | Found ${data.length} records`);
      }
    } catch (e) {
      // Ignore errors for non-existent tables
    }
  }
}

checkChildren();
