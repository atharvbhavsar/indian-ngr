import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load environment variables
const envContent = fs.readFileSync("d:/RailwayWeb/RailwayWeb/frontend/.env", "utf8");
const vars = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    vars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY);

async function runTest() {
  console.log("=== Testing PME Integration Backend workflow ===");

  const employeeHrmsId = "pm_1";
  console.log(`Step 1: Finding user_id for Pointsman ${employeeHrmsId}...`);
  const { data: uData, error: uErr } = await supabase
    .from('USERS')
    .select('user_id, full_name')
    .eq('hrms_id', employeeHrmsId)
    .single();

  if (uErr || !uData) {
    console.error("Error finding user:", uErr);
    process.exit(1);
  }

  const userId = uData.user_id;
  const userName = uData.full_name;
  console.log(`Found user: ${userName} (user_id: ${userId})`);

  console.log("\nStep 2: Checking initial PME info in EMPLOYEE_PROFILE and PME_RECORD...");
  const { data: initialProfile, error: pErr } = await supabase
    .from("EMPLOYEE_PROFILE")
    .select("pme_status")
    .eq("user_id", userId)
    .single();
  
  const { data: initialPmeRecord, error: rErr } = await supabase
    .from("PME_RECORD")
    .select("*")
    .eq("user_id", userId);

  console.log("Initial profile status:", initialProfile ? initialProfile.pme_status : "N/A", pErr || "");
  console.log("Initial PME_RECORD count:", initialPmeRecord ? initialPmeRecord.length : 0);

  // Set new PME data
  const testPmeStatus = "Overdue";
  const testDueDate = "2026-06-01";
  const testDoneDate = "2026-05-15";

  console.log(`\nStep 3: Logging PME Record (Status: ${testPmeStatus}, Due: ${testDueDate}, Done: ${testDoneDate})...`);
  const payload = {
    user_id: userId,
    pme_due_date: testDueDate,
    pme_done_date: testDoneDate,
    pme_status: testPmeStatus
  };

  const { data: insertData, error: insertErr } = await supabase
    .from("PME_RECORD")
    .insert([payload])
    .select();

  if (insertErr) {
    console.error("Error inserting PME record:", insertErr);
    process.exit(1);
  }
  console.log("Successfully inserted to PME_RECORD:", insertData[0]);

  console.log("\nStep 4: Updating EMPLOYEE_PROFILE.pme_status...");
  const { data: updateData, error: updateErr } = await supabase
    .from("EMPLOYEE_PROFILE")
    .update({ pme_status: testPmeStatus })
    .eq("user_id", userId)
    .select();

  if (updateErr) {
    console.error("Error updating EMPLOYEE_PROFILE:", updateErr);
    process.exit(1);
  }
  console.log("Successfully updated EMPLOYEE_PROFILE:", updateData[0]);

  console.log("\nStep 5: Verifying final joined query (mimicking saDataService mapping)...");
  // Query joined data
  const { data: joinedUsers, error: fetchErr } = await supabase
    .from("USERS")
    .select(`
      user_id,
      hrms_id,
      full_name,
      ROLE ( role_name ),
      EMPLOYEE_PROFILE ( pme_status, refresher_status ),
      PME_RECORD ( pme_due_date, pme_done_date, pme_status )
    `)
    .eq("user_id", userId)
    .single();

  if (fetchErr) {
    console.error("Error re-fetching user details:", fetchErr);
    process.exit(1);
  }

  const ep = joinedUsers.EMPLOYEE_PROFILE || {};
  const pmeRecs = joinedUsers.PME_RECORD || [];
  const sortedPme = [...pmeRecs].sort((a, b) => new Date(b.pme_due_date || 0) - new Date(a.pme_due_date || 0));
  const latestPme = sortedPme[0] || {};

  const mappedUser = {
    name: joinedUsers.full_name,
    hrmsId: joinedUsers.hrms_id,
    pmeStatus: ep.pme_status || latestPme.pme_status || "Fit",
    pmeDueDate: latestPme.pme_due_date || null,
    pmeDoneDate: latestPme.pme_done_date || null
  };

  console.log("Mapped User PME results:");
  console.log("Name:", mappedUser.name);
  console.log("HRMS ID:", mappedUser.hrmsId);
  console.log("PME Status:", mappedUser.pmeStatus);
  console.log("PME Due Date:", mappedUser.pmeDueDate);
  console.log("PME Done Date:", mappedUser.pmeDoneDate);

  if (mappedUser.pmeStatus === testPmeStatus && mappedUser.pmeDueDate === testDueDate) {
    console.log("\n>>> SUCCESS: PME Record logged, profile synced, and joined details fetched correctly! <<<");
  } else {
    console.error("\n>>> FAILURE: Mapped fields do not match expected test inputs. <<<");
  }
}

runTest();
