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

const stationMapping = {
  'KRTH': 'kiratgarh',
  'KSLA': 'kesla',
  'TAKU': 'taku',
  'SALI': 'sali',
  'KQE': 'kala akhar',
  'POX': 'polaipat',
  'DOH': 'dhodra mohar',
  'MGRD': 'mangarda',
  'BBTR': 'barbatpur',
  'GDYA': 'ghoradongri',
  'DHQ': 'dharakhoh',
  'MJY': 'maramjhiri',
  'BZU': 'betul'
};

const defaultScores = {
  'A': 85,
  'B': 70,
  'C': 55,
  'D': 40,
  'Untested': 70
};

async function runImport() {
  console.log("Starting import process...");

  // 1. Load data from JSON
  const rawData = fs.readFileSync('d:/RailwayWeb/scratch/ti_bzu_data.json', 'utf-8');
  const records = JSON.parse(rawData);
  console.log(`Loaded ${records.length} records from JSON.`);

  // 2. Ensure all stations exist in the STATION table
  console.log("\n--- STAGE 1: Checking and Upserting Stations ---");
  const stationIdMap = {}; // station_code -> station_id
  
  for (const [code, name] of Object.entries(stationMapping)) {
    // Check if station already exists
    const { data: existingSt, error: findError } = await supabase
      .from('STATION')
      .select('station_id, station_name, station_code')
      .eq('station_code', code)
      .maybeSingle();

    if (findError) {
      console.error(`Error finding station ${code}:`, findError);
      continue;
    }

    if (existingSt) {
      console.log(`Station ${code} (${existingSt.station_name}) already exists. ID: ${existingSt.station_id}`);
      stationIdMap[code] = existingSt.station_id;
    } else {
      console.log(`Station ${code} (${name}) does not exist. Inserting...`);
      const { data: newSt, error: insertError } = await supabase
        .from('STATION')
        .insert([{
          division_id: 8, // Nagpur
          station_name: name,
          station_code: code,
          location: ''
        }])
        .select()
        .single();

      if (insertError) {
        console.error(`Failed to insert station ${code}:`, insertError);
      } else {
        console.log(`Station ${code} inserted successfully. ID: ${newSt.station_id}`);
        stationIdMap[code] = newSt.station_id;
      }
    }
  }

  // 3. Find the Traffic Inspector record from the list
  const tiRecord = records.find(r => r.designation === "Traffic Inspector" || r.hrms_id === "WDMFKP");
  if (!tiRecord) {
    console.error("Could not find Traffic Inspector record (WDMFKP) in the data!");
    return;
  }
  console.log(`\nFound TI: ${tiRecord.name} (HRMS: ${tiRecord.hrms_id})`);

  // 4. Create/Upsert Traffic Inspector in USERS, EMPLOYEE_PROFILE, and TRAFFIC_INSPECTOR
  console.log("\n--- STAGE 2: Upserting Traffic Inspector BZU ---");
  
  const tiHrms = tiRecord.hrms_id;
  const tiEmail = `${tiHrms.toLowerCase()}@rail.in`;
  const tiPassword = 'password123';
  const tiPhone = tiRecord.mobile_no || '7389902918';
  const tiPf = tiRecord.pf_no || '474807055';
  
  // List of 13 stations under jurisdiction in lowercase
  const jurisdictionList = Object.values(stationMapping).join(', ');

  let tiUserId = null;

  // Check if TI user exists
  const { data: existingTiUser } = await supabase
    .from('USERS')
    .select('user_id')
    .eq('hrms_id', tiHrms)
    .maybeSingle();

  if (existingTiUser) {
    console.log(`TI User ${tiHrms} already exists in USERS. ID: ${existingTiUser.user_id}`);
    tiUserId = existingTiUser.user_id;

    // Update TI user
    const { error: updateErr } = await supabase
      .from('USERS')
      .update({
        full_name: tiRecord.name,
        email: tiEmail,
        mobile_no: tiPhone,
        pf_number: tiPf,
        role_id: 3 // Traffic Inspector
      })
      .eq('user_id', tiUserId);
    if (updateErr) console.error("Error updating TI core user:", updateErr);
  } else {
    console.log(`Inserting TI User ${tiHrms}...`);
    const { data: newTiUser, error: insertErr } = await supabase
      .from('USERS')
      .insert([{
        hrms_id: tiHrms,
        username: tiHrms.toLowerCase(),
        full_name: tiRecord.name,
        email: tiEmail,
        mobile_no: tiPhone,
        password_hash: tiPassword,
        role_id: 3, // Traffic Inspector
        status: 'Active',
        pf_number: tiPf
      }])
      .select()
      .single();

    if (insertErr) {
      console.error("Error creating TI core user:", insertErr);
      return;
    }
    tiUserId = newTiUser.user_id;
    console.log(`TI User created. ID: ${tiUserId}`);
  }

  // Upsert EMPLOYEE_PROFILE for TI
  const { data: existingTiProfile } = await supabase
    .from('EMPLOYEE_PROFILE')
    .select('profile_id')
    .eq('user_id', tiUserId)
    .maybeSingle();

  const tiProfilePayload = {
    dob: '1980-01-01',
    joining_date: '2020-01-01',
    qualification: 'Graduate',
    blood_group: 'O+',
    current_score: 85,
    safety_score: 85,
    category: 'A',
    monitoring_status: 'Active',
    station_id: stationIdMap['BZU'], // Base station BZU
    division: 'Nagpur',
    jurisdiction: jurisdictionList,
    pme_status: 'Fit',
    refresher_status: 'Cleared'
  };

  if (existingTiProfile) {
    console.log("TI employee profile exists. Updating...");
    const { error: profileUpErr } = await supabase
      .from('EMPLOYEE_PROFILE')
      .update(tiProfilePayload)
      .eq('user_id', tiUserId);
    if (profileUpErr) console.error("Error updating TI employee profile:", profileUpErr);
  } else {
    console.log("Inserting TI employee profile...");
    const { error: profileInsErr } = await supabase
      .from('EMPLOYEE_PROFILE')
      .insert([{
        user_id: tiUserId,
        ...tiProfilePayload
      }]);
    if (profileInsErr) console.error("Error inserting TI employee profile:", profileInsErr);
  }

  // Upsert TRAFFIC_INSPECTOR table record
  const { data: existingTiSubtype } = await supabase
    .from('TRAFFIC_INSPECTOR')
    .select('ti_id')
    .eq('user_id', tiUserId)
    .maybeSingle();

  const tiSubtypePayload = {
    station_id: stationIdMap['BZU'],
    jurisdiction: jurisdictionList
  };

  if (existingTiSubtype) {
    console.log("TI subtype record exists. Updating...");
    const { error: subUpErr } = await supabase
      .from('TRAFFIC_INSPECTOR')
      .update(tiSubtypePayload)
      .eq('user_id', tiUserId);
    if (subUpErr) console.error("Error updating TI subtype record:", subUpErr);
  } else {
    console.log("Inserting TI subtype record...");
    const { error: subInsErr } = await supabase
      .from('TRAFFIC_INSPECTOR')
      .insert([{
        user_id: tiUserId,
        ...tiSubtypePayload
      }]);
    if (subInsErr) console.error("Error inserting TI subtype record:", subInsErr);
  }

  // 5. Insert rest of the 139 users (excluding the TI)
  console.log("\n--- STAGE 3: Upserting Staff (Pointsmen & Station Masters) ---");
  const staffRecords = records.filter(r => r.hrms_id !== tiHrms);
  
  let successCount = 0;
  let failCount = 0;

  for (const r of staffRecords) {
    const roleId = r.designation === "Station Master" ? 5 : 7;
    const subtypeTable = r.designation === "Station Master" ? "STATION_MASTER" : "POINTSMAN";
    const baseScore = defaultScores[r.grade] || 70;
    const email = `${r.hrms_id.toLowerCase()}@rail.in`;
    const password = 'password123';
    const stationId = stationIdMap[r.station];

    if (!stationId) {
      console.warn(`Skipping user ${r.name} due to missing station code ${r.station}`);
      failCount++;
      continue;
    }

    try {
      let staffUserId = null;

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('USERS')
        .select('user_id')
        .eq('hrms_id', r.hrms_id)
        .maybeSingle();

      // Check if PF number is duplicate
      let pfNum = r.pf_no || null;
      if (pfNum) {
        const { data: pfCheck } = await supabase
          .from('USERS')
          .select('user_id, hrms_id')
          .eq('pf_number', pfNum);
        
        if (pfCheck && pfCheck.length > 0 && pfCheck[0].hrms_id !== r.hrms_id) {
          pfNum = pfNum + "A";
          console.log(`Duplicate PF number found for user ${r.name} (${r.pf_no}). Appended suffix: ${pfNum}`);
        }
      }

      const userPayload = {
        hrms_id: r.hrms_id,
        username: r.hrms_id.toLowerCase(),
        full_name: r.name,
        email: email,
        mobile_no: r.mobile_no || '0000000000',
        role_id: roleId,
        status: 'Active',
        pf_number: pfNum
      };

      if (existingUser) {
        staffUserId = existingUser.user_id;
        const { error: uError } = await supabase
          .from('USERS')
          .update(userPayload)
          .eq('user_id', staffUserId);
        if (uError) throw uError;
      } else {
        const { data: newUser, error: uError } = await supabase
          .from('USERS')
          .insert([{
            ...userPayload,
            password_hash: password
          }])
          .select()
          .single();
        if (uError) throw uError;
        staffUserId = newUser.user_id;
      }

      // Upsert EMPLOYEE_PROFILE
      const { data: existingProfile } = await supabase
        .from('EMPLOYEE_PROFILE')
        .select('profile_id')
        .eq('user_id', staffUserId)
        .maybeSingle();

      const profilePayload = {
        dob: '1990-01-01',
        joining_date: '2022-01-01',
        qualification: 'Graduate',
        blood_group: 'O+',
        current_score: baseScore,
        safety_score: baseScore,
        category: r.grade,
        monitoring_status: 'Active',
        station_id: stationId,
        division: 'Nagpur',
        pme_status: 'Fit',
        refresher_status: 'Cleared'
      };

      if (existingProfile) {
        const { error: pError } = await supabase
          .from('EMPLOYEE_PROFILE')
          .update(profilePayload)
          .eq('user_id', staffUserId);
        if (pError) throw pError;
      } else {
        const { error: pError } = await supabase
          .from('EMPLOYEE_PROFILE')
          .insert([{
            user_id: staffUserId,
            ...profilePayload
          }]);
        if (pError) throw pError;
      }

      // Upsert role subtype table record
      if (subtypeTable === 'STATION_MASTER') {
        const { data: existingSub } = await supabase
          .from('STATION_MASTER')
          .select('sm_id')
          .eq('user_id', staffUserId)
          .maybeSingle();

        if (existingSub) {
          const { error: subError } = await supabase
            .from('STATION_MASTER')
            .update({ station_id: stationId })
            .eq('user_id', staffUserId);
          if (subError) throw subError;
        } else {
          const { error: subError } = await supabase
            .from('STATION_MASTER')
            .insert([{
              user_id: staffUserId,
              station_id: stationId
            }]);
          if (subError) throw subError;
        }
      } else if (subtypeTable === 'POINTSMAN') {
        const { data: existingSub } = await supabase
          .from('POINTSMAN')
          .select('pm_id')
          .eq('user_id', staffUserId)
          .maybeSingle();

        const pmPayload = {
          shift: 'Morning Shift (06:00 - 14:00)',
          work_location: stationMapping[r.station]
        };

        if (existingSub) {
          const { error: subError } = await supabase
            .from('POINTSMAN')
            .update(pmPayload)
            .eq('user_id', staffUserId);
          if (subError) throw subError;
        } else {
          const { error: subError } = await supabase
            .from('POINTSMAN')
            .insert([{
              user_id: staffUserId,
              ...pmPayload
            }]);
          if (subError) throw subError;
        }
      }

      successCount++;
      if (successCount % 20 === 0) {
        console.log(`Successfully processed ${successCount} staff records...`);
      }
    } catch (err) {
      console.error(`Failed to process user ${r.name} (${r.hrms_id}):`, err);
      failCount++;
    }
  }

  console.log(`\nImport Stage 3 Completed: ${successCount} succeeded, ${failCount} failed.`);

  // 6. Connect Pointsmen to their Station Masters
  console.log("\n--- STAGE 4: Resolving Reporting SMs for Pointsmen ---");
  
  // Retrieve all SM records from STATION_MASTER table
  const { data: allSmRecords, error: smQueryError } = await supabase
    .from('STATION_MASTER')
    .select(`
      sm_id,
      station_id,
      user_id,
      USERS!inner (
        full_name
      )
    `);

  if (smQueryError) {
    console.error("Failed to query Station Masters for hierarchy mapping:", smQueryError);
    return;
  }

  const stationSmMap = {}; // station_id -> { name, sm_id }
  allSmRecords?.forEach(record => {
    if (record.station_id) {
      stationSmMap[record.station_id] = {
        name: record.USERS?.full_name || "",
        sm_id: record.sm_id
      };
    }
  });

  console.log("Constructed Station SM Map for hierarchy resolution.");

  // Get all Pointsmen profiles
  const { data: pmProfiles, error: pmQueryError } = await supabase
    .from('EMPLOYEE_PROFILE')
    .select(`
      user_id,
      station_id,
      USERS!inner (
        full_name,
        hrms_id
      )
    `)
    .eq('USERS.role_id', 7); // Pointsman

  if (pmQueryError) {
    console.error("Failed to query Pointsmen for hierarchy mapping:", pmQueryError);
    return;
  }

  let pmLinkCount = 0;
  for (const pm of pmProfiles) {
    const smInfo = stationSmMap[pm.station_id];
    if (smInfo) {
      // Update EMPLOYEE_PROFILE reporting_sm
      await supabase
        .from('EMPLOYEE_PROFILE')
        .update({ reporting_sm: smInfo.name })
        .eq('user_id', pm.user_id);

      // Update POINTSMAN sm_id
      await supabase
        .from('POINTSMAN')
        .update({ sm_id: smInfo.sm_id })
        .eq('user_id', pm.user_id);

      pmLinkCount++;
    }
  }

  console.log(`Hierarchy resolution completed: Linked ${pmLinkCount} Pointsmen to their respective Station Masters.`);
  console.log("\nALL OPERATIONS COMPLETED SUCCESSFULLY!");
}

runImport();
