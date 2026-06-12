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

async function checkColumns() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`
    }
  });
  const openapi = await res.json();
  const keys = Object.keys(openapi.definitions || {});
  console.log("All tables in definitions:", keys);
  if (openapi.definitions?.TEST_ATTEMPT) {
    console.log("TEST_ATTEMPT properties:", openapi.definitions.TEST_ATTEMPT.properties);
  }
}

checkColumns();
