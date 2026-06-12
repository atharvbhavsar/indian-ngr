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

async function deleteAllUsers() {
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

  // 1. Find assessments associated with these users (either as employee or conductor)
  console.log("Fetching assessments associated with these users...");
  const { data: assessments, error: assessFindErr } = await supabase
    .from('ASSESSMENT')
    .select('assessment_id')
    .or(`employee_id.in.(${userIds.join(',')}),conducted_by.in.(${userIds.join(',')})`);

  if (assessFindErr) {
    console.warn("Warning/Error finding assessments:", assessFindErr.message);
  }

  const assessmentIds = assessments ? assessments.map(a => a.assessment_id) : [];
  console.log(`Found ${assessmentIds.length} assessments to clean up.`);

  if (assessmentIds.length > 0) {
    // 2. Find approvals for these assessments
    const { data: approvals } = await supabase
      .from('APPROVAL')
      .select('approval_id')
      .in('assessment_id', assessmentIds);
    
    const approvalIds = approvals ? approvals.map(a => a.approval_id) : [];
    
    if (approvalIds.length > 0) {
      console.log(`Cleaning up ${approvalIds.length} approvals and reviews...`);
      // Delete from REVIEW
      await supabase.from('REVIEW').delete().in('approval_id', approvalIds);
      // Delete from APPROVAL
      await supabase.from('APPROVAL').delete().in('approval_id', approvalIds);
    }

    // Delete approvals by approved_by user_id directly
    await supabase.from('APPROVAL').delete().in('approved_by', userIds);

    // Delete from TEST_ATTEMPT
    console.log("Cleaning up TEST_ATTEMPT table...");
    await supabase.from('TEST_ATTEMPT').delete().in('assessment_id', assessmentIds);

    // Delete from ASSESSMENT
    console.log("Deleting assessments...");
    await supabase.from('ASSESSMENT').delete().in('assessment_id', assessmentIds);
  }

  // Double check direct references in ASSESSMENT
  await supabase.from('ASSESSMENT').delete().in('employee_id', userIds);
  await supabase.from('ASSESSMENT').delete().in('conducted_by', userIds);

  // 3. Delete from child tables referencing user_id
  const childTables = [
    'MONITORING',
    'TRAINING_RECORD',
    'PME_RECORD',
    'COUNSELLING_RECORD',
    'EMPLOYEE_PROFILE'
  ];

  for (const table of childTables) {
    console.log(`Cleaning up ${table} table...`);
    const { error } = await supabase
      .from(table)
      .delete()
      .in('user_id', userIds);
    if (error) {
      console.warn(`Warning/Error deleting from ${table}:`, error.message);
    }
  }

  // 4. Delete from USERS
  console.log("Deleting users from USERS table...");
  const { error: finalErr } = await supabase
    .from('USERS')
    .delete()
    .in('user_id', userIds);

  if (finalErr) {
    console.error("Error deleting users from USERS table:", finalErr);
  } else {
    console.log(`Successfully deleted all ${users.length} users and their related database records!`);
  }
}

deleteAllUsers();
