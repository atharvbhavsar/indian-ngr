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
  const { data, error } = await supabase.rpc("submit_test_attempt_rpc", {
    p_employee_id: "0a5d4ec3-dff4-4d82-8bc9-93e18a8d11c7",
    p_assessment_id: "0a5d4ec3-dff4-4d82-8bc9-93e18a8d11c7",
    p_total_marks: 100,
    p_obtained_marks: 80,
    p_percentage: 80,
    p_category: "A",
    p_conducted_by: "0a5d4ec3-dff4-4d82-8bc9-93e18a8d11c7",
    p_answers: []
  });
  console.log("RPC Call attempt:", { data, error });
}

async function checkColumns() {
  // Let's run an arbitrary select to see if we can get the actual columns or if we can run a custom query
  // Wait, let's query the API openapi specification from postgrest to see all columns of TEST_ATTEMPT!
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`
    }
  });
  const openapi = await res.json();
  const testAttempt = openapi.definitions?.TEST_ATTEMPT;
  console.log("TEST_ATTEMPT columns in schema:", Object.keys(testAttempt?.properties || {}));
}

checkColumns();
