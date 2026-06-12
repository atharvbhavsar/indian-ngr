import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync("d:/RailwayWeb/RailwayWeb/frontend/.env", "utf8");
const vars = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) vars[match[1].trim()] = match[2].trim();
});
const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY);

async function inspect() {
  console.log("=== Inspecting TRAINING_RECORD table ===");
  // Check existing rows
  const { data: rows, error: rowErr } = await supabase.from("TRAINING_RECORD").select("*").limit(5);
  console.log("Rows:", rows, "Error:", rowErr);

  // Insert a test row to see columns available
  const { data: users } = await supabase.from("USERS").select("user_id, hrms_id, full_name").limit(3);
  console.log("\nSample USERS:", users?.map(u => ({ hrms_id: u.hrms_id, name: u.full_name })));

  // Check EMPLOYEE_PROFILE for refresher_status
  const { data: profiles } = await supabase.from("EMPLOYEE_PROFILE").select("user_id, pme_status, refresher_status").limit(5);
  console.log("\nSample EMPLOYEE_PROFILE (pme_status, refresher_status):", profiles);
}

inspect();
