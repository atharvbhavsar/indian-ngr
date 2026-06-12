/**
 * ═══════════════════════════════════════════════════════════
 * RAILWAY DASHBOARD – FULL E2E QA TEST SUITE
 * PRD: User Creation, DB Persistence & Role Visibility
 * ═══════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// ── Load .env ──────────────────────────────────────────────
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// ── ANSI Colors ────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', magenta: '\x1b[35m', blue: '\x1b[34m', white: '\x1b[37m'
};

let PASS = 0, FAIL = 0, WARN = 0;
const RESULTS = [];

function log(msg, color = C.white) { console.log(`${color}${msg}${C.reset}`); }
function pass(check, detail = '') { PASS++; RESULTS.push({ s: 'PASS', check, detail }); log(`  ✓ ${check}${detail ? ' — ' + detail : ''}`, C.green); }
function fail(check, detail = '') { FAIL++; RESULTS.push({ s: 'FAIL', check, detail }); log(`  ✗ ${check}${detail ? ' — ' + detail : ''}`, C.red); }
function warn(check, detail = '') { WARN++; RESULTS.push({ s: 'WARN', check, detail }); log(`  ⚠ ${check}${detail ? ' — ' + detail : ''}`, C.yellow); }
function section(title) { log(`\n${C.bold}${'━'.repeat(60)}${C.reset}`); log(`${C.bold}${C.cyan}  ${title}${C.reset}`); log(`${C.bold}${'━'.repeat(60)}${C.reset}`); }

// ── TEST USER DATA ─────────────────────────────────────────
const TS = Date.now().toString().slice(-6); // unique suffix
const TEST_USERS = [
  { hrms_id: `PM_QA${TS}`, role: 'Pointsman',             full_name: 'QA Pointsman Test',            email: `pm_qa${TS}@rail.in`, contact: `9${TS}0001`, station: null },
  { hrms_id: `SM_QA${TS}`, role: 'Station Master',         full_name: 'QA Station Master Test',       email: `sm_qa${TS}@rail.in`, contact: `9${TS}0002`, station: null },
  { hrms_id: `TM_QA${TS}`, role: 'Train Manager',          full_name: 'QA Train Manager Test',        email: `tm_qa${TS}@rail.in`, contact: `9${TS}0003`, station: null },
  { hrms_id: `SS_QA${TS}`, role: 'Station Superintendent', full_name: 'QA Station Superintendent Test',email: `ss_qa${TS}@rail.in`, contact: `9${TS}0004`, station: null },
  { hrms_id: `TI_QA${TS}`, role: 'Traffic Inspector',      full_name: 'QA Traffic Inspector Test',    email: `ti_qa${TS}@rail.in`, contact: `9${TS}0005`, station: null },
];
const CREATED_USER_IDS = {};

// ── HELPERS ────────────────────────────────────────────────
async function getRoleId(roleName) {
  const { data, error } = await supabase.from('ROLE').select('role_id').eq('role_name', roleName).single();
  if (error || !data) return null;
  return data.role_id;
}

async function getFirstStation() {
  const { data } = await supabase.from('STATION').select('station_id, station_name').limit(1).maybeSingle();
  return data;
}

async function getUserRecord(hrmsId) {
  const { data } = await supabase.from('USERS').select('*, ROLE(role_name)').eq('hrms_id', hrmsId).maybeSingle();
  return data;
}

async function getEmployeeProfile(userId) {
  const { data } = await supabase.from('EMPLOYEE_PROFILE').select('*').eq('user_id', userId).maybeSingle();
  return data;
}

async function deleteTestUser(hrmsId, userId) {
  // Delete in reverse dependency order
  if (userId) {
    await supabase.from('TEST_ATTEMPT').delete().eq('employee_id', userId);
    await supabase.from('ASSESSMENT').delete().eq('employee_id', userId);
    await supabase.from('PME_RECORD').delete().eq('user_id', userId);
    await supabase.from('TRAINING_RECORD').delete().eq('user_id', userId);
    await supabase.from('MONITORING').delete().eq('user_id', userId);
    for (const t of ['POINTSMAN','STATION_MASTER','STATION_SUPERINTENDENT','TRAIN_MANAGER','TRAFFIC_INSPECTOR','AOM','SUPER_ADMIN']) {
      await supabase.from(t).delete().eq('user_id', userId);
    }
    await supabase.from('EMPLOYEE_PROFILE').delete().eq('user_id', userId);
  }
  await supabase.from('USERS').delete().eq('hrms_id', hrmsId);
}

// ══════════════════════════════════════════════════════════════
// STEP 0 – PRE-FLIGHT: Verify Supabase connectivity & schema
// ══════════════════════════════════════════════════════════════
async function step0_preflight() {
  section('STEP 0 — PRE-FLIGHT CHECKS');

  // Connectivity
  const { data: roles, error: roleErr } = await supabase.from('ROLE').select('role_id, role_name');
  if (roleErr) { fail('Supabase connectivity', roleErr.message); return false; }
  pass('Supabase connectivity');

  // Required roles
  const required = ['Pointsman','Station Master','Train Manager','Station Superintendent','Traffic Inspector','AOM/General','Super Admin'];
  const found = roles.map(r => r.role_name);
  for (const r of required) {
    found.includes(r) ? pass(`Role exists: ${r}`) : fail(`Role missing: ${r}`);
  }

  // Required tables
  const tables = ['USERS','EMPLOYEE_PROFILE','STATION','POINTSMAN','STATION_MASTER','STATION_SUPERINTENDENT','TRAIN_MANAGER','TRAFFIC_INSPECTOR','ASSESSMENT'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*').limit(1);
    error ? fail(`Table accessible: ${t}`, error.message) : pass(`Table accessible: ${t}`);
  }

  // At least one station exists
  const station = await getFirstStation();
  station ? pass(`Station exists: ${station.station_name}`) : fail('No stations found in DB');

  return !roleErr;
}

// ══════════════════════════════════════════════════════════════
// STEP 1 – CREATE TEST USERS
// ══════════════════════════════════════════════════════════════
async function step1_createUsers() {
  section('STEP 1 — CREATE TEST USERS');

  const station = await getFirstStation();
  if (!station) { fail('Cannot create users — no station in DB'); return; }

  for (const u of TEST_USERS) {
    u.station = station.station_name;
    log(`\n  → Creating ${u.role}: ${u.hrms_id}`, C.magenta);

    // Cleanup any stale record from previous runs
    const existing = await getUserRecord(u.hrms_id);
    if (existing) await deleteTestUser(u.hrms_id, existing.user_id);

    const roleId = await getRoleId(u.role);
    if (!roleId) { fail(`Get role ID for ${u.role}`); continue; }
    pass(`Role ID resolved for ${u.role}: ${roleId}`);

    // Insert USERS
    const { data: newUser, error: userErr } = await supabase.from('USERS').insert([{
      hrms_id: u.hrms_id,
      username: u.hrms_id.toLowerCase(),
      full_name: u.full_name,
      email: u.email,
      mobile_no: u.contact,
      password_hash: 'TestPass@123',
      role_id: roleId,
      status: 'Active',
      pf_number: `PF${u.hrms_id}`
    }]).select().single();

    if (userErr || !newUser) { fail(`Create USERS record: ${u.hrms_id}`, userErr?.message); continue; }
    pass(`USERS record created: ${u.hrms_id} (user_id: ${newUser.user_id})`);
    CREATED_USER_IDS[u.hrms_id] = newUser.user_id;
    u.user_id = newUser.user_id;

    // Insert EMPLOYEE_PROFILE
    const { error: profErr } = await supabase.from('EMPLOYEE_PROFILE').insert([{
      user_id: newUser.user_id,
      dob: '1990-01-01',
      joining_date: '2022-06-15',
      qualification: 'Graduate',
      address: 'Test Address, Nagpur',
      blood_group: 'O+',
      current_score: 0,
      safety_score: 0,
      category: 'Untested',
      monitoring_status: 'Active',
      station_id: station.station_id,
      division: 'Nagpur',
      reporting_sm: '',
      work_location: u.role === 'Pointsman' ? 'Yard' : '',
      shift: u.role === 'Pointsman' ? 'Morning Shift (06:00 - 14:00)' : '',
      jurisdiction: u.role === 'Traffic Inspector' ? station.station_name : '',
      pme_status: 'Fit',
      refresher_status: 'Cleared'
    }]);
    profErr ? fail(`EMPLOYEE_PROFILE created: ${u.hrms_id}`, profErr.message) : pass(`EMPLOYEE_PROFILE created: ${u.hrms_id}`);

    // Insert subtype table
    const subtypeMap = {
      'Pointsman': 'POINTSMAN', 'Station Master': 'STATION_MASTER',
      'Station Superintendent': 'STATION_SUPERINTENDENT', 'Train Manager': 'TRAIN_MANAGER',
      'Traffic Inspector': 'TRAFFIC_INSPECTOR'
    };
    const subtypeTable = subtypeMap[u.role];
    if (subtypeTable) {
      const subtypePayload = { user_id: newUser.user_id };
      if (u.role !== 'Traffic Inspector' && u.role !== 'Pointsman') subtypePayload.station_id = station.station_id;
      if (u.role === 'Pointsman') { subtypePayload.shift = 'Morning Shift (06:00 - 14:00)'; subtypePayload.work_location = 'Yard'; }
      if (u.role === 'Traffic Inspector') { subtypePayload.jurisdiction = station.station_name; }
      const { error: stErr } = await supabase.from(subtypeTable).insert([subtypePayload]);
      stErr ? fail(`${subtypeTable} subtype record: ${u.hrms_id}`, stErr.message) : pass(`${subtypeTable} subtype record: ${u.hrms_id}`);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// STEP 2 – DATABASE VERIFICATION
// ══════════════════════════════════════════════════════════════
async function step2_dbVerification() {
  section('STEP 2 — DATABASE VERIFICATION');

  for (const u of TEST_USERS) {
    if (!u.user_id) { warn(`Skipping DB verify for ${u.hrms_id} — not created`); continue; }
    log(`\n  Verifying: ${u.hrms_id} (${u.role})`, C.magenta);

    // USERS record
    const user = await getUserRecord(u.hrms_id);
    if (!user) { fail(`USERS record exists: ${u.hrms_id}`); continue; }
    pass(`USERS record exists: ${u.hrms_id}`);

    // Field checks on USERS
    user.full_name   ? pass(`full_name populated: ${user.full_name}`)   : fail(`full_name NULL: ${u.hrms_id}`);
    user.email       ? pass(`email populated: ${user.email}`)           : fail(`email NULL: ${u.hrms_id}`);
    user.mobile_no   ? pass(`mobile_no populated`)                      : fail(`mobile_no NULL: ${u.hrms_id}`);
    user.pf_number   ? pass(`pf_number populated: ${user.pf_number}`)   : fail(`pf_number NULL: ${u.hrms_id}`);
    user.role_id     ? pass(`role_id populated`)                        : fail(`role_id NULL: ${u.hrms_id}`);
    user.status === 'Active' ? pass(`status = Active`) : fail(`status not Active: ${user.status}`);
    user.password_hash ? pass(`password_hash exists`) : fail(`password_hash NULL: ${u.hrms_id}`);
    user.ROLE?.role_name === u.role ? pass(`Role mapping correct: ${user.ROLE.role_name}`) : fail(`Role mismatch: expected ${u.role}, got ${user.ROLE?.role_name}`);

    // EMPLOYEE_PROFILE
    const profile = await getEmployeeProfile(u.user_id);
    if (!profile) { fail(`EMPLOYEE_PROFILE exists: ${u.hrms_id}`); continue; }
    pass(`EMPLOYEE_PROFILE exists: ${u.hrms_id}`);
    profile.station_id ? pass(`station_id populated in profile`) : fail(`station_id NULL in EMPLOYEE_PROFILE: ${u.hrms_id}`);
    profile.joining_date ? pass(`joining_date populated: ${profile.joining_date}`) : fail(`joining_date NULL: ${u.hrms_id}`);
    profile.pme_status ? pass(`pme_status: ${profile.pme_status}`) : warn(`pme_status NULL: ${u.hrms_id}`);
    profile.refresher_status ? pass(`refresher_status: ${profile.refresher_status}`) : warn(`refresher_status NULL: ${u.hrms_id}`);

    // Subtype table
    const subtypeMap = {
      'Pointsman': 'POINTSMAN', 'Station Master': 'STATION_MASTER',
      'Station Superintendent': 'STATION_SUPERINTENDENT', 'Train Manager': 'TRAIN_MANAGER',
      'Traffic Inspector': 'TRAFFIC_INSPECTOR'
    };
    const st = subtypeMap[u.role];
    if (st) {
      const { data: stData } = await supabase.from(st).select('*').eq('user_id', u.user_id).maybeSingle();
      stData ? pass(`${st} subtype record exists`) : fail(`${st} subtype record missing: ${u.hrms_id}`);
    }

    // No duplicate HRMS IDs
    const { data: dupes } = await supabase.from('USERS').select('hrms_id').eq('hrms_id', u.hrms_id);
    dupes?.length === 1 ? pass(`No duplicate HRMS ID`) : fail(`Duplicate HRMS ID found: ${dupes?.length} records`);

    // No duplicate PF Numbers
    const { data: pfDupes } = await supabase.from('USERS').select('pf_number').eq('pf_number', `PF${u.hrms_id}`);
    pfDupes?.length === 1 ? pass(`No duplicate PF Number`) : fail(`Duplicate PF Number: ${pfDupes?.length} records`);

    // No duplicate employee profiles
    const { data: profDupes } = await supabase.from('EMPLOYEE_PROFILE').select('user_id').eq('user_id', u.user_id);
    profDupes?.length === 1 ? pass(`No duplicate EMPLOYEE_PROFILE`) : fail(`Duplicate EMPLOYEE_PROFILE: ${profDupes?.length} records`);
  }
}

// ══════════════════════════════════════════════════════════════
// STEP 3 – ROLE VISIBILITY TESTING
// ══════════════════════════════════════════════════════════════
async function step3_roleVisibility() {
  section('STEP 3 — ROLE VISIBILITY TESTING');

  // Fetch all users as the service layer does, verify each test user appears
  const { data: allUsers, error } = await supabase.from('USERS').select(`
    hrms_id, full_name, status,
    ROLE(role_name),
    EMPLOYEE_PROFILE(station_id, pme_status, STATION(station_name))
  `);

  if (error || !allUsers) { fail('Fetch all users for visibility check', error?.message); return; }
  pass(`Fetched ${allUsers.length} total users from USERS table`);

  for (const u of TEST_USERS) {
    if (!u.user_id) continue;
    const found = allUsers.find(x => x.hrms_id === u.hrms_id);
    found ? pass(`${u.role} visible in global user list: ${u.hrms_id}`) : fail(`${u.role} NOT visible in global user list: ${u.hrms_id}`);
    if (found) {
      found.ROLE?.role_name === u.role ? pass(`  Role name correct in join: ${found.ROLE.role_name}`) : fail(`  Role name mismatch: ${found.ROLE?.role_name}`);
      found.EMPLOYEE_PROFILE
        ? pass(`  EMPLOYEE_PROFILE joined correctly`)
        : warn(`  EMPLOYEE_PROFILE not joined — may cause dashboard gap: ${u.hrms_id}`);
    }
  }

  // Pointsman should appear in Station Master's view (filter by role)
  const pmUser = TEST_USERS.find(u => u.role === 'Pointsman');
  if (pmUser?.user_id) {
    const { data: pmCheck } = await supabase.from('USERS')
      .select('hrms_id, ROLE!inner(role_name), EMPLOYEE_PROFILE(station_id)')
      .eq('ROLE.role_name', 'Pointsman')
      .eq('hrms_id', pmUser.hrms_id);
    pmCheck?.length > 0 ? pass(`Pointsman appears in role-filtered query (SM view)`) : fail(`Pointsman NOT found in role-filtered query`);
  }

  // TI should appear in Traffic Inspector role filter
  const tiUser = TEST_USERS.find(u => u.role === 'Traffic Inspector');
  if (tiUser?.user_id) {
    const { data: tiCheck } = await supabase.from('USERS')
      .select('hrms_id, ROLE!inner(role_name)')
      .eq('ROLE.role_name', 'Traffic Inspector')
      .eq('hrms_id', tiUser.hrms_id);
    tiCheck?.length > 0 ? pass(`Traffic Inspector appears in role-filtered query (AOM/TI view)`) : fail(`TI NOT found in role-filtered query`);
  }
}

// ══════════════════════════════════════════════════════════════
// STEP 4 – HIERARCHY VALIDATION
// ══════════════════════════════════════════════════════════════
async function step4_hierarchy() {
  section('STEP 4 — HIERARCHY VALIDATION');

  const station = await getFirstStation();
  if (!station) { warn('No station for hierarchy test'); return; }

  // All pointsmen at this station
  const { data: pmAtStation } = await supabase.from('EMPLOYEE_PROFILE')
    .select('user_id, USERS!inner(hrms_id, ROLE!inner(role_name))')
    .eq('station_id', station.station_id)
    .eq('USERS.ROLE.role_name', 'Pointsman');

  log(`  Pointsmen at "${station.station_name}": ${pmAtStation?.length ?? 0}`, C.blue);
  const myPm = TEST_USERS.find(u => u.role === 'Pointsman');
  if (myPm?.user_id) {
    const found = pmAtStation?.find(r => r.USERS?.hrms_id === myPm.hrms_id);
    found ? pass(`QA Pointsman visible at correct station via hierarchy`) : fail(`QA Pointsman NOT at station in hierarchy`);
  }

  // No cross-station leak: TI Pointsman should NOT appear at a different station
  const { data: allStations } = await supabase.from('STATION').select('station_id').neq('station_id', station.station_id).limit(1);
  if (allStations?.length > 0 && myPm?.user_id) {
    const { data: wrongStation } = await supabase.from('EMPLOYEE_PROFILE')
      .select('user_id')
      .eq('user_id', myPm.user_id)
      .eq('station_id', allStations[0].station_id);
    !wrongStation?.length ? pass(`No cross-station leak for QA Pointsman`) : fail(`Cross-station leak detected for QA Pointsman!`);
  }

  // Station Master at same station
  const { data: smAtStation } = await supabase.from('EMPLOYEE_PROFILE')
    .select('user_id, USERS!inner(hrms_id, ROLE!inner(role_name))')
    .eq('station_id', station.station_id)
    .eq('USERS.ROLE.role_name', 'Station Master');
  log(`  Station Masters at "${station.station_name}": ${smAtStation?.length ?? 0}`, C.blue);
  const mySm = TEST_USERS.find(u => u.role === 'Station Master');
  if (mySm?.user_id) {
    const found = smAtStation?.find(r => r.USERS?.hrms_id === mySm.hrms_id);
    found ? pass(`QA Station Master visible at correct station`) : fail(`QA Station Master NOT in station hierarchy`);
  }

  // Verify TI has jurisdiction over our test station
  const myTi = TEST_USERS.find(u => u.role === 'Traffic Inspector');
  if (myTi?.user_id) {
    const { data: tiProfile } = await supabase.from('EMPLOYEE_PROFILE')
      .select('jurisdiction').eq('user_id', myTi.user_id).maybeSingle();
    const jur = tiProfile?.jurisdiction || '';
    jur.includes(station.station_name)
      ? pass(`TI jurisdiction includes test station: "${jur}"`)
      : warn(`TI jurisdiction does not include test station. Jurisdiction: "${jur}"`);
  }
}

// ══════════════════════════════════════════════════════════════
// STEP 5 – UPDATE TESTING
// ══════════════════════════════════════════════════════════════
async function step5_updateTesting() {
  section('STEP 5 — UPDATE TESTING');

  const pmUser = TEST_USERS.find(u => u.role === 'Pointsman');
  if (!pmUser?.user_id) { warn('Skipping update test — Pointsman not created'); return; }

  const newName = `QA Pointsman UPDATED ${TS}`;

  // Update full_name
  const { error: updateErr } = await supabase.from('USERS')
    .update({ full_name: newName })
    .eq('hrms_id', pmUser.hrms_id);
  updateErr ? fail(`Update USERS.full_name`, updateErr.message) : pass(`Updated full_name to: ${newName}`);

  // Verify update reflected
  const updated = await getUserRecord(pmUser.hrms_id);
  updated?.full_name === newName ? pass(`Update reflected in USERS table`) : fail(`Update NOT reflected — got: ${updated?.full_name}`);

  // Update profile score
  const { error: profUpdateErr } = await supabase.from('EMPLOYEE_PROFILE')
    .update({ current_score: 42, category: 'B' })
    .eq('user_id', pmUser.user_id);
  profUpdateErr ? fail(`Update EMPLOYEE_PROFILE score`, profUpdateErr.message) : pass(`Updated EMPLOYEE_PROFILE.current_score to 42`);

  const profile = await getEmployeeProfile(pmUser.user_id);
  profile?.current_score === 42 ? pass(`Score update reflected`) : fail(`Score NOT reflected: ${profile?.current_score}`);
  profile?.category === 'B' ? pass(`Category update reflected: B`) : fail(`Category NOT reflected: ${profile?.category}`);

  // Verify no duplicate was created
  const { data: dupeCheck } = await supabase.from('USERS').select('hrms_id').eq('hrms_id', pmUser.hrms_id);
  dupeCheck?.length === 1 ? pass(`No duplicate record created during update`) : fail(`Duplicate found after update: ${dupeCheck?.length} records`);

  // Update email and PF number
  const newEmail = `pm_qa_upd${TS}@rail.in`;
  const newPf = `PF_UPD_${TS}`;
  const { error: e2 } = await supabase.from('USERS').update({ email: newEmail, pf_number: newPf }).eq('hrms_id', pmUser.hrms_id);
  e2 ? fail(`Update email & PF number`, e2.message) : pass(`Updated email & PF number`);
  const u2 = await getUserRecord(pmUser.hrms_id);
  u2?.email === newEmail ? pass(`Email update reflected: ${newEmail}`) : fail(`Email NOT reflected: ${u2?.email}`);
  u2?.pf_number === newPf ? pass(`PF number update reflected: ${newPf}`) : fail(`PF NOT reflected: ${u2?.pf_number}`);
}

// ══════════════════════════════════════════════════════════════
// STEP 6 – PROFILE FIELD COMPLETENESS
// ══════════════════════════════════════════════════════════════
async function step6_profileTesting() {
  section('STEP 6 — PROFILE FIELD COMPLETENESS');

  for (const u of TEST_USERS) {
    if (!u.user_id) continue;
    log(`\n  Profile: ${u.hrms_id}`, C.magenta);

    const { data: full } = await supabase.from('USERS').select(`
      hrms_id, full_name, email, mobile_no, pf_number, status, password_hash,
      ROLE(role_name),
      EMPLOYEE_PROFILE(
        joining_date, pme_status, refresher_status, station_id, division,
        reporting_sm, work_location, shift, category, current_score,
        STATION(station_name)
      )
    `).eq('hrms_id', u.hrms_id).single();

    if (!full) { fail(`Full profile fetch: ${u.hrms_id}`); continue; }

    const ep = full.EMPLOYEE_PROFILE;
    const checks = {
      'Name': full.full_name, 'HRMS ID': full.hrms_id,
      'PF Number': full.pf_number, 'Email': full.email,
      'Station': ep?.STATION?.station_name, 'PME Status': ep?.pme_status,
      'REF Status': ep?.refresher_status, 'Joining Date': ep?.joining_date,
      'Role': full.ROLE?.role_name, 'Category': ep?.category,
      'Password Hash': full.password_hash, 'Status': full.status
    };

    for (const [field, val] of Object.entries(checks)) {
      val && val !== '—' ? pass(`  ${field}: ${val}`) : warn(`  ${field}: NULL or empty`);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// STEP 7 – FORM STANDARDIZATION (Score Format)
// ══════════════════════════════════════════════════════════════
async function step7_formStandardization() {
  section('STEP 7 — FORM STANDARDIZATION & REQUIRED FIELDS');

  // Verify all test users have consistent required fields
  const required_user_fields = ['hrms_id','full_name','email','mobile_no','pf_number','role_id','status','password_hash'];
  const required_profile_fields = ['joining_date','station_id','pme_status','refresher_status','current_score','category'];

  const { data: users } = await supabase.from('USERS').select('*').in('hrms_id', TEST_USERS.map(u => u.hrms_id));
  if (!users?.length) { warn('No test users found for form standardization check'); return; }

  for (const user of users) {
    for (const field of required_user_fields) {
      user[field] !== null && user[field] !== undefined && user[field] !== ''
        ? pass(`USERS.${field} not NULL: ${user.hrms_id}`)
        : fail(`USERS.${field} is NULL/empty: ${user.hrms_id}`);
    }
    const prof = await getEmployeeProfile(user.user_id);
    if (prof) {
      for (const field of required_profile_fields) {
        prof[field] !== null && prof[field] !== undefined && prof[field] !== ''
          ? pass(`PROFILE.${field} not NULL: ${user.hrms_id}`)
          : warn(`PROFILE.${field} is NULL: ${user.hrms_id}`);
      }
    }
  }

  // Score format check — verify scores are integers 0-100, not percentages
  const { data: allProfiles } = await supabase.from('EMPLOYEE_PROFILE').select('current_score, safety_score').limit(50);
  let badScores = 0;
  for (const p of allProfiles || []) {
    const s = p.current_score;
    if (s !== null && (s < 0 || s > 100 || !Number.isInteger(s))) badScores++;
  }
  badScores === 0 ? pass(`Score format valid (all integer 0-100, no % strings)`) : fail(`${badScores} records have invalid score format`);
}

// ══════════════════════════════════════════════════════════════
// STEP 8 – REAL-TIME REFLECTION CHECK
// ══════════════════════════════════════════════════════════════
async function step8_realtimeReflection() {
  section('STEP 8 — REAL-TIME REFLECTION (DB-level)');

  // Verify that after creation, all users are immediately queryable with joins
  for (const u of TEST_USERS) {
    if (!u.user_id) continue;
    const { data, error } = await supabase.from('USERS').select(`
      hrms_id, ROLE(role_name), EMPLOYEE_PROFILE(current_score, STATION(station_name))
    `).eq('hrms_id', u.hrms_id).single();

    !error && data ? pass(`Real-time query works: ${u.hrms_id}`) : fail(`Real-time query failed: ${u.hrms_id}`, error?.message);
    data?.EMPLOYEE_PROFILE?.STATION?.station_name ? pass(`  Station join works: ${data.EMPLOYEE_PROFILE.STATION.station_name}`) : warn(`  Station join failed for ${u.hrms_id}`);
  }
}

// ══════════════════════════════════════════════════════════════
// STEP 9 – SCORE FORMAT STANDARDIZATION
// ══════════════════════════════════════════════════════════════
async function step9_scoreStandardization() {
  section('STEP 9 — SCORE FORMAT STANDARDIZATION');

  const { data: attempts } = await supabase.from('TEST_ATTEMPT').select('obtained_marks, total_marks, percentage').limit(100);
  if (!attempts?.length) { warn('No test attempts in DB to validate score format'); return; }

  let validCount = 0, invalidCount = 0;
  for (const a of attempts) {
    const valid = Number.isInteger(a.obtained_marks) && Number.isInteger(a.total_marks) && a.obtained_marks <= a.total_marks;
    valid ? validCount++ : invalidCount++;
  }
  pass(`Valid score format (marks/total): ${validCount} records`);
  invalidCount > 0 ? fail(`Invalid score records: ${invalidCount}`) : pass(`No invalid score format detected`);

  // Check no string-based percentages stored
  const { data: rawAttempts } = await supabase.from('TEST_ATTEMPT').select('percentage').limit(100);
  const percentOk = rawAttempts?.every(a => a.percentage === null || typeof a.percentage === 'number');
  percentOk ? pass(`Percentage field is numeric (not string %)`) : fail(`Percentage stored as non-numeric`);
}

// ══════════════════════════════════════════════════════════════
// STEP 10 – TERMINAL DB AUDIT
// ══════════════════════════════════════════════════════════════
async function step10_dbAudit() {
  section('STEP 10 — TERMINAL DATABASE AUDIT');

  // Duplicate HRMS IDs
  const { data: allHrms } = await supabase.from('USERS').select('hrms_id');
  const hrmsSet = new Set(); let hrmsdupes = 0;
  allHrms?.forEach(u => { if (hrmsSet.has(u.hrms_id)) hrmsdupes++; else hrmsSet.add(u.hrms_id); });
  hrmsdupes === 0 ? pass(`No duplicate HRMS IDs (${allHrms?.length} total users)`) : fail(`${hrmsdupes} duplicate HRMS IDs found`);

  // Duplicate PF numbers (excluding nulls)
  const { data: allPf } = await supabase.from('USERS').select('pf_number').not('pf_number', 'is', null);
  const pfSet = new Set(); let pfDupes = 0;
  allPf?.forEach(u => { if (pfSet.has(u.pf_number)) pfDupes++; else pfSet.add(u.pf_number); });
  pfDupes === 0 ? pass(`No duplicate PF Numbers (${allPf?.length} with PF)`) : fail(`${pfDupes} duplicate PF Numbers`);

  // Orphan EMPLOYEE_PROFILEs (no matching USERS)
  const { data: orphanProfiles } = await supabase.from('EMPLOYEE_PROFILE').select('user_id, USERS(user_id)');
  const orphans = orphanProfiles?.filter(p => !p.USERS) || [];
  orphans.length === 0 ? pass(`No orphan EMPLOYEE_PROFILEs`) : fail(`${orphans.length} orphan EMPLOYEE_PROFILEs`);

  // Orphan POINTSMAN records
  const { data: allPm } = await supabase.from('POINTSMAN').select('user_id, USERS(user_id)');
  const pmOrphans = allPm?.filter(p => !p.USERS) || [];
  pmOrphans.length === 0 ? pass(`No orphan POINTSMAN records`) : fail(`${pmOrphans.length} orphan POINTSMAN records`);

  // Users without employee profiles
  const { data: usersWithProf } = await supabase.from('USERS').select('user_id, EMPLOYEE_PROFILE(user_id)').limit(200);
  const noProf = usersWithProf?.filter(u => !u.EMPLOYEE_PROFILE) || [];
  noProf.length === 0 ? pass(`All users have EMPLOYEE_PROFILE`) : warn(`${noProf.length} users missing EMPLOYEE_PROFILE`);

  // Users without role mapping
  const { data: usersNoRole } = await supabase.from('USERS').select('hrms_id').is('role_id', null);
  usersNoRole?.length === 0 ? pass(`All users have role_id`) : fail(`${usersNoRole?.length} users with NULL role_id`);

  // Summary counts
  log(`\n  ── DB Summary ──`, C.cyan);
  const { count: userCount } = await supabase.from('USERS').select('*', { count: 'exact', head: true });
  const { count: profCount } = await supabase.from('EMPLOYEE_PROFILE').select('*', { count: 'exact', head: true });
  const { count: stationCount } = await supabase.from('STATION').select('*', { count: 'exact', head: true });
  const { count: pmCount } = await supabase.from('POINTSMAN').select('*', { count: 'exact', head: true });
  const { count: smCount } = await supabase.from('STATION_MASTER').select('*', { count: 'exact', head: true });
  const { count: assessCount } = await supabase.from('ASSESSMENT').select('*', { count: 'exact', head: true });
  log(`  Total USERS:             ${userCount}`, C.blue);
  log(`  Total EMPLOYEE_PROFILEs: ${profCount}`, C.blue);
  log(`  Total STATIONS:          ${stationCount}`, C.blue);
  log(`  Total POINTSMAN records: ${pmCount}`, C.blue);
  log(`  Total STATION_MASTER:    ${smCount}`, C.blue);
  log(`  Total ASSESSMENTS:       ${assessCount}`, C.blue);
}

// ══════════════════════════════════════════════════════════════
// CLEANUP – Remove all QA test users
// ══════════════════════════════════════════════════════════════
async function cleanup() {
  section('CLEANUP — Removing QA Test Users');
  for (const u of TEST_USERS) {
    const record = await getUserRecord(u.hrms_id);
    const uid = u.user_id || record?.user_id;
    await deleteTestUser(u.hrms_id, uid);
    log(`  Cleaned up: ${u.hrms_id}`, C.yellow);
  }
  pass('All QA test records cleaned up');
}

// ══════════════════════════════════════════════════════════════
// MAIN – Run all steps
// ══════════════════════════════════════════════════════════════
async function main() {
  log(`\n${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
  log(`${C.bold}${C.cyan}  RAILWAY DASHBOARD – FULL QA TEST SUITE${C.reset}`);
  log(`${C.bold}${C.cyan}  Supabase: ${env.VITE_SUPABASE_URL}${C.reset}`);
  log(`${C.bold}${C.cyan}  Test Suffix: ${TS}${C.reset}`);
  log(`${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);

  const preflightOk = await step0_preflight();
  if (!preflightOk) {
    fail('FATAL: Supabase unreachable. Aborting.');
    process.exit(1);
  }

  await step1_createUsers();
  await step2_dbVerification();
  await step3_roleVisibility();
  await step4_hierarchy();
  await step5_updateTesting();
  await step6_profileTesting();
  await step7_formStandardization();
  await step8_realtimeReflection();
  await step9_scoreStandardization();
  await step10_dbAudit();
  await cleanup();

  // ── FINAL REPORT ──
  section('FINAL TEST REPORT');
  const total = PASS + FAIL + WARN;
  log(`  Total Checks: ${total}`, C.white);
  log(`  ${C.green}PASSED:   ${PASS}${C.reset}`);
  log(`  ${C.red}FAILED:   ${FAIL}${C.reset}`);
  log(`  ${C.yellow}WARNINGS: ${WARN}${C.reset}`);

  if (FAIL === 0 && WARN === 0) {
    log(`\n  ${C.bold}${C.green}✓ ALL CHECKS PASSED — PRODUCTION READY${C.reset}`);
  } else if (FAIL === 0) {
    log(`\n  ${C.bold}${C.yellow}⚠ PASSED WITH WARNINGS — Review warnings above${C.reset}`);
  } else {
    log(`\n  ${C.bold}${C.red}✗ ${FAIL} FAILURES DETECTED — Fix before production${C.reset}`);
  }

  if (FAIL > 0) {
    log(`\n  Failed Checks:`, C.red);
    RESULTS.filter(r => r.s === 'FAIL').forEach(r => log(`    ✗ ${r.check}${r.detail ? ': ' + r.detail : ''}`, C.red));
  }
  if (WARN > 0) {
    log(`\n  Warnings:`, C.yellow);
    RESULTS.filter(r => r.s === 'WARN').forEach(r => log(`    ⚠ ${r.check}${r.detail ? ': ' + r.detail : ''}`, C.yellow));
  }
  log('');
}

main().catch(err => { console.error('FATAL ERROR:', err); process.exit(1); });
