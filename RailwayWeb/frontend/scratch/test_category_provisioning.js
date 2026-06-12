import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runTest() {
  console.log("--- Starting Category Provisioning DB Test ---");

  // 1. Get Role ID for Pointsman
  const { data: roleData, error: roleErr } = await supabase
    .from('ROLE')
    .select('role_id')
    .eq('role_name', 'Pointsman')
    .single();
  
  if (roleErr || !roleData) {
    console.error("Failed to get role ID for Pointsman:", roleErr);
    process.exit(1);
  }
  const roleId = roleData.role_id;
  console.log("Pointsman Role ID:", roleId);

  // 2. Get first Station
  const { data: stationData, error: stationErr } = await supabase
    .from('STATION')
    .select('station_id, station_name')
    .limit(1)
    .single();

  if (stationErr || !stationData) {
    console.error("Failed to get a station:", stationErr);
    process.exit(1);
  }
  const { station_id, station_name } = stationData;
  console.log("Using Station:", station_name, `(${station_id})`);

  // 3. Define Test User details (Category C => Score 55)
  const hrmsId = `PM_T_CAT_${Date.now().toString().slice(-4)}`;
  const catVal = "C";
  const scoreVal = 55;

  console.log(`Inserting test user ${hrmsId} with Category: ${catVal}, Score: ${scoreVal}...`);

  // 4. Insert into USERS
  const { data: userRecord, error: userErr } = await supabase
    .from('USERS')
    .insert([{
      hrms_id: hrmsId,
      username: hrmsId.toLowerCase(),
      full_name: 'Test Category User',
      email: `${hrmsId.toLowerCase()}@rail.in`,
      mobile_no: '9999991111',
      password_hash: 'password123',
      role_id: roleId,
      status: 'Active',
      pf_number: `PF_${hrmsId}`
    }])
    .select()
    .single();

  if (userErr || !userRecord) {
    console.error("Failed to insert user:", userErr);
    process.exit(1);
  }
  const userId = userRecord.user_id;
  console.log("User record created. user_id:", userId);

  // 5. Insert into EMPLOYEE_PROFILE
  const { error: profileErr } = await supabase
    .from('EMPLOYEE_PROFILE')
    .insert([{
      user_id: userId,
      dob: '1995-05-05',
      joining_date: new Date().toISOString().split('T')[0],
      qualification: 'Graduate',
      address: 'Test address',
      blood_group: 'O+',
      current_score: scoreVal,
      safety_score: scoreVal,
      category: catVal,
      monitoring_status: 'Active',
      station_id: station_id,
      division: 'Nagpur',
      reporting_sm: '',
      work_location: 'Yard',
      shift: 'Morning Shift (06:00 - 14:00)',
      pme_status: 'Fit',
      refresher_status: 'Cleared'
    }]);

  if (profileErr) {
    console.error("Failed to insert profile:", profileErr);
    // Cleanup user
    await supabase.from('USERS').delete().eq('user_id', userId);
    process.exit(1);
  }
  console.log("EMPLOYEE_PROFILE record created.");

  // 6. Verify insertion and values
  const { data: verifiedProfile, error: verifyErr } = await supabase
    .from('EMPLOYEE_PROFILE')
    .select('category, current_score, safety_score')
    .eq('user_id', userId)
    .single();

  if (verifyErr || !verifiedProfile) {
    console.error("Failed to retrieve profile for verification:", verifyErr);
  } else {
    console.log("Verified Profile Data from DB:", verifiedProfile);
    if (verifiedProfile.category === catVal && verifiedProfile.current_score === scoreVal) {
      console.log("\x1b[32m✔ SUCCESS: Category and Score mapped and saved correctly in database!\x1b[0m");
    } else {
      console.error("\x1b[31m✗ FAILURE: Category/Score mismatch in database!\x1b[0m");
    }
  }

  // 7. Cleanup
  console.log("Cleaning up test user...");
  await supabase.from('EMPLOYEE_PROFILE').delete().eq('user_id', userId);
  await supabase.from('USERS').delete().eq('user_id', userId);
  console.log("Cleanup complete!");
}

runTest();
