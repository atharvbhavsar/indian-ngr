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

const dummyStationCodes = ['EG', 'DSS'];

async function run() {
  console.log("Resolving dummy station IDs...");
  const { data: stations, error: stationErr } = await supabase
    .from('STATION')
    .select('station_id, station_name, station_code')
    .in('station_code', dummyStationCodes);

  if (stationErr) {
    console.error("Error fetching stations:", stationErr);
    return;
  }

  if (!stations || stations.length === 0) {
    console.log("No dummy stations found in DB.");
    return;
  }

  const stationIds = stations.map(s => s.station_id);
  console.log("Found dummy stations:", stations);

  console.log("Finding employee profiles assigned to these stations...");
  const { data: profiles, error: profileErr } = await supabase
    .from('EMPLOYEE_PROFILE')
    .select('user_id, profile_id')
    .in('station_id', stationIds);

  if (profileErr) {
    console.error("Error fetching employee profiles:", profileErr);
    return;
  }

  const userIds = profiles ? profiles.map(p => p.user_id).filter(Boolean) : [];
  console.log(`Found ${userIds.length} users assigned to these dummy stations.`);

  if (userIds.length > 0) {
    console.log("Resolving user details...");
    const { data: users, error: userErr } = await supabase
      .from('USERS')
      .select('user_id, hrms_id, full_name')
      .in('user_id', userIds);

    if (userErr) {
      console.error("Error fetching user details:", userErr);
    } else {
      console.log("Users to delete:", users);
    }

    // Cleanup child tables
    console.log("Fetching assessments for these users...");
    const { data: assessments, error: assessFindErr } = await supabase
      .from('ASSESSMENT')
      .select('assessment_id')
      .or(`employee_id.in.(${userIds.join(',')}),conducted_by.in.(${userIds.join(',')})`);

    const assessmentIds = assessments ? assessments.map(a => a.assessment_id) : [];
    console.log(`Found ${assessmentIds.length} assessments to clean up.`);

    if (assessmentIds.length > 0) {
      const { data: approvals } = await supabase
        .from('APPROVAL')
        .select('approval_id')
        .in('assessment_id', assessmentIds);
      
      const approvalIds = approvals ? approvals.map(a => a.approval_id) : [];
      if (approvalIds.length > 0) {
        console.log(`Deleting ${approvalIds.length} approvals/reviews...`);
        await supabase.from('REVIEW').delete().in('approval_id', approvalIds);
        await supabase.from('APPROVAL').delete().in('approval_id', approvalIds);
      }
      
      await supabase.from('APPROVAL').delete().in('approved_by', userIds);
      await supabase.from('TEST_ATTEMPT').delete().in('assessment_id', assessmentIds);
      await supabase.from('ASSESSMENT').delete().in('assessment_id', assessmentIds);
    }

    await supabase.from('ASSESSMENT').delete().in('employee_id', userIds);
    await supabase.from('ASSESSMENT').delete().in('conducted_by', userIds);

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

    console.log("Deleting users from USERS...");
    const { error: deleteUserErr } = await supabase
      .from('USERS')
      .delete()
      .in('user_id', userIds);
    if (deleteUserErr) {
      console.error("Error deleting users:", deleteUserErr);
    } else {
      console.log("Successfully deleted all users associated with dummy stations.");
    }
  }

  // Now delete the stations
  console.log("Deleting stations from STATION table...");
  const { error: deleteStationErr } = await supabase
    .from('STATION')
    .delete()
    .in('station_id', stationIds);

  if (deleteStationErr) {
    console.error("Error deleting stations:", deleteStationErr.message);
  } else {
    console.log("Successfully deleted dummy stations from database!");
  }
}

run();
