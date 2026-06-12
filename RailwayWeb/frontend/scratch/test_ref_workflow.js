import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load environment variables
const envContent = fs.readFileSync("d:/RailwayWeb/RailwayWeb/frontend/.env", "utf8");
const vars = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) vars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY);

async function runTest() {
  console.log("=== Testing Pointsman REF Course Workflow ===");

  // 1. Resolve a pointsman
  console.log("1. Finding a pointsman...");
  const { data: users, error: userErr } = await supabase
    .from("USERS")
    .select(`
      user_id,
      hrms_id,
      full_name,
      ROLE!inner(role_name)
    `)
    .eq("ROLE.role_name", "Pointsman")
    .limit(1);

  if (userErr || !users || users.length === 0) {
    console.error("No Pointsman found in USERS table. Error:", userErr);
    process.exit(1);
  }

  const pm = users[0];
  console.log(`Found pointsman: ${pm.full_name} (${pm.hrms_id}) -> user_id: ${pm.user_id}`);

  // Fetch current profile refresher status
  const { data: originalProfile } = await supabase
    .from("EMPLOYEE_PROFILE")
    .select("refresher_status")
    .eq("user_id", pm.user_id)
    .single();
  const originalStatus = originalProfile?.refresher_status || "None";
  console.log(`Original Refresher Status: ${originalStatus}`);

  // 2. Insert a REF record with JSON-encoded metadata in course_name
  console.log("2. Inserting a test REF training record...");
  // Using the compressed schema to fit under character varying(150) limit
  const testRefData = {
    s: "In Progress",
    r: "Attending active simulation yard drills.",
    c: "SM Test Runner",
    d: "2026-12-31"
  };

  const meta = JSON.stringify(testRefData);
  const payload = {
    user_id: pm.user_id,
    course_name: meta,
    training_date: "2026-06-07",
    expiry_date: "2026-12-31",
    status: "Cleared" // DB constraint only allows "Cleared"
  };

  const { data: insertData, error: insertErr } = await supabase
    .from("TRAINING_RECORD")
    .insert([payload])
    .select();

  if (insertErr || !insertData || insertData.length === 0) {
    console.error("Failed to insert TRAINING_RECORD. Error:", insertErr);
    process.exit(1);
  }

  const insertedRecord = insertData[0];
  console.log("Successfully inserted TRAINING_RECORD. ID:", insertedRecord.training_id);

  // Sync refresher_status in EMPLOYEE_PROFILE
  console.log("3. Syncing refresher_status in EMPLOYEE_PROFILE...");
  const { error: profileErr } = await supabase
    .from("EMPLOYEE_PROFILE")
    .update({ refresher_status: "In Progress" })
    .eq("user_id", pm.user_id);

  if (profileErr) {
    console.error("Failed to update refresher_status. Error:", profileErr);
    // clean up first
    await supabase.from("TRAINING_RECORD").delete().eq("training_id", insertedRecord.training_id);
    process.exit(1);
  }

  // 4. Verify record in TRAINING_RECORD and EMPLOYEE_PROFILE
  console.log("4. Verifying synced state in database...");
  const { data: updatedProfile } = await supabase
    .from("EMPLOYEE_PROFILE")
    .select("refresher_status")
    .eq("user_id", pm.user_id)
    .single();

  console.log(`New Refresher Status in Profile: ${updatedProfile?.refresher_status}`);

  if (updatedProfile?.refresher_status !== "In Progress") {
    console.error("Verification failed: Profile status was not updated to In Progress.");
  } else {
    console.log("SUCCESS: Profile status synced perfectly!");
  }

  // 5. Fetch and parse Refresher Course History
  console.log("5. Fetching and parsing Refresher Course history...");
  const { data: trainingRecords, error: historyErr } = await supabase
    .from("TRAINING_RECORD")
    .select("*")
    .eq("user_id", pm.user_id)
    .order("training_date", { ascending: false });

  if (historyErr) {
    console.error("Failed to fetch refresher history. Error:", historyErr);
  } else {
    console.log(`Fetched ${trainingRecords.length} records. Detailed view of parsed metadata:`);
    trainingRecords.forEach(row => {
      let metaParsed = {};
      let resolvedMeta = {};
      try {
        if (row.course_name && row.course_name.trim().startsWith("{")) {
          metaParsed = JSON.parse(row.course_name);
          resolvedMeta = {
            courseName:  metaParsed.n || metaParsed.courseName || "Refresher Course",
            refStatus:   metaParsed.s || metaParsed.refStatus || "Cleared",
            remarks:     metaParsed.r || metaParsed.remarks || "",
            conductedBy: metaParsed.c || metaParsed.conductedBy || "",
            nextDueDate: metaParsed.d || metaParsed.nextDueDate || row.expiry_date || null
          };
        } else {
          resolvedMeta = {
            courseName:  row.course_name,
            refStatus:   "Cleared",
            remarks:     "",
            conductedBy: "",
            nextDueDate: row.expiry_date || null
          };
        }
      } catch (_) {
        resolvedMeta = {
          courseName:  row.course_name,
          refStatus:   "Cleared",
          remarks:     "",
          conductedBy: "",
          nextDueDate: row.expiry_date || null
        };
      }
      console.log(`- ID: ${row.training_id}, Date: ${row.training_date}, Expiry: ${row.expiry_date}, Status: ${row.status}`);
      console.log(`  Parsed CourseName: ${resolvedMeta.courseName}`);
      console.log(`  Parsed RefStatus: ${resolvedMeta.refStatus}`);
      console.log(`  Parsed Remarks: ${resolvedMeta.remarks}`);
      console.log(`  Parsed ConductedBy: ${resolvedMeta.conductedBy}`);
      console.log(`  Parsed NextDueDate: ${resolvedMeta.nextDueDate}`);
    });
  }

  // 6. Cleanup inserted record and restore original profile status
  console.log("6. Cleaning up test data...");
  const { error: deleteErr } = await supabase
    .from("TRAINING_RECORD")
    .delete()
    .eq("training_id", insertedRecord.training_id);

  if (deleteErr) {
    console.error("Failed to delete training record. Error:", deleteErr);
  } else {
    console.log("Successfully deleted training record.");
  }

  const { error: restoreErr } = await supabase
    .from("EMPLOYEE_PROFILE")
    .update({ refresher_status: originalStatus })
    .eq("user_id", pm.user_id);

  if (restoreErr) {
    console.error("Failed to restore original profile status. Error:", restoreErr);
  } else {
    console.log(`Successfully restored profile status back to '${originalStatus}'.`);
  }

  console.log("=== Test Complete! ===");
}

runTest();
