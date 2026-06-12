import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync("d:/RailwayWeb/RailwayWeb/frontend/.env", "utf8");
const vars = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) vars[match[1].trim()] = match[2].trim();
});
const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY);

async function probe() {
  const { data: users } = await supabase.from("USERS").select("user_id").eq("hrms_id","pm_1").single();
  const uid = users.user_id;

  // Try all remaining status values
  const statuses = ["Pending", "Scheduled", "In Progress", "Expired", "Cancelled", "Pass", "Fail", "Active", "Due"];
  const allowed = [];
  for (const status of statuses) {
    const { data: inserted, error } = await supabase.from("TRAINING_RECORD").insert([{
      user_id: uid, course_name: "TEST", training_date: "2026-06-07", expiry_date: "2027-06-07", status
    }]).select();
    if (inserted?.length > 0) {
      allowed.push(status);
      await supabase.from("TRAINING_RECORD").delete().eq("training_id", inserted[0].training_id);
    }
  }
  console.log("Allowed statuses:", allowed);

  // Also check if we can add extra columns via insert (e.g. remarks, conducted_by)
  const { data: extra, error: extraErr } = await supabase.from("TRAINING_RECORD").insert([{
    user_id: uid, course_name: "TEST", training_date: "2026-06-07", expiry_date: "2027-06-07", status: "Cleared",
    remarks: "test", conducted_by: "sm_1"
  }]).select();
  console.log("Extra columns test:", extra, extraErr?.message);
  if (extra?.length > 0) await supabase.from("TRAINING_RECORD").delete().eq("training_id", extra[0].training_id);
}
probe();
