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
  const { data, error } = await supabase.from("TEST_ATTEMPT").select("*").limit(1);
  if (error) {
    console.error("Error fetching TEST_ATTEMPT:", error);
  } else if (data && data.length > 0) {
    console.log("TEST_ATTEMPT columns:", Object.keys(data[0]));
  } else {
    console.log("TEST_ATTEMPT table is empty");
  }
}
check();
