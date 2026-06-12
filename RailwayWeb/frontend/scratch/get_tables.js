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

async function check() {
  // Let's call supabase.rpc or query some system tables if possible.
  // Wait, since Supabase PostgREST doesn't let us query pg_catalog directly unless exposed,
  // let's try querying standard tables we expect to see.
  const tables = [
    "USERS", "ROLE", "STATION", "DIVISION", "EMPLOYEE_PROFILE", "MONITORING",
    "ASSESSMENT", "TEST_ATTEMPT", "ANSWER_HISTORY", "APPROVAL", "AUDIT_LOG",
    "TRAFFIC_INSPECTOR", "COUNSELLING_RECORD", "RETEST_SCHEDULING", "NOTIFICATION"
  ];
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select("*").limit(1);
      if (error) {
        console.log(`Table ${t}: Error - ${error.message}`);
      } else {
        console.log(`Table ${t}: Success, row count: ${data.length}`, data.length > 0 ? `Keys: ${Object.keys(data[0])}` : '');
        if (data.length > 0) {
          console.log(`Sample row for ${t}:`, data[0]);
        }
      }
    } catch (e) {
      console.log(`Table ${t}: Exception - ${e.message}`);
    }
  }
}
check();
