import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf8");
const vars = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    vars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = vars.VITE_SUPABASE_URL;
const supabaseAnonKey = vars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSMProfile() {
  const { data: user, error: userError } = await supabase
    .from("USERS")
    .select(`
      user_id,
      hrms_id,
      full_name,
      ROLE (role_name),
      EMPLOYEE_PROFILE (
        current_score,
        category,
        STATION (station_name)
      )
    `)
    .eq("hrms_id", "SM_QA918797")
    .single();

  if (userError) {
    console.error("User Error:", userError);
    return;
  }

  console.log("=== SM PROFILE FROM DATABASE ===");
  console.log("Name:", user.full_name);
  console.log("HRMS ID:", user.hrms_id);
  console.log("Role:", user.ROLE?.role_name);
  const ep = Array.isArray(user.EMPLOYEE_PROFILE) ? user.EMPLOYEE_PROFILE[0] : user.EMPLOYEE_PROFILE;
  console.log("Station:", ep?.STATION?.station_name);
  console.log("Current Score in DB:", ep?.current_score);
  console.log("Category in DB:", ep?.category);

  // Fetch assessments for this SM
  const { data: assessments, error: assessError } = await supabase
    .from("ASSESSMENT")
    .select(`
      assessment_id,
      assessment_type,
      status,
      assessment_date,
      TEST_ATTEMPT (
        obtained_marks,
        total_marks,
        category
      )
    `)
    .eq("employee_id", user.user_id);

  if (assessError) {
    console.error("Assessments Error:", assessError);
    return;
  }

  console.log("\n=== ASSESSMENTS FOR SM ===");
  if (!assessments || assessments.length === 0) {
    console.log("No assessments found.");
  } else {
    assessments.forEach(a => {
      console.log(`ID: ${a.assessment_id} | Type: ${a.assessment_type} | Status: ${a.status} | Date: ${a.assessment_date}`);
      if (a.TEST_ATTEMPT && a.TEST_ATTEMPT.length > 0) {
        a.TEST_ATTEMPT.forEach(t => {
          console.log(`  -> Test Attempt: Score = ${t.obtained_marks}/${t.total_marks} | Category = ${t.category}`);
        });
      } else {
        console.log(`  -> No Test Attempt found.`);
      }
    });
  }
}

checkSMProfile();
