import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

// Mock browser dependencies or modules if needed, but since we are executing via Node,
// let's just make a direct query that mimics the userService.js STATION select exactly.
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testQuery() {
  console.log("--- Testing fixed STATION select query ---");
  const { data, error } = await supabase
    .from("STATION")
    .select(`
      station_id,
      DIVISION (division_name, zone_name)
    `)
    .eq("station_name", "chandur")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log("Query succeeded! Result data:", JSON.stringify(data, null, 2));
  }
}

testQuery();
