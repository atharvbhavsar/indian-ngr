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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: stations, error: stErr } = await supabase
    .from('STATION')
    .select('station_id, station_name, station_code, location');
  console.log("=== STATIONS ===");
  console.log(stations);

  const { data: tiProfiles, error: tiErr } = await supabase
    .from('USERS')
    .select(`
      user_id,
      hrms_id,
      full_name,
      ROLE(role_name),
      EMPLOYEE_PROFILE(jurisdiction)
    `)
    .eq('ROLE.role_name', 'Traffic Inspector');
  console.log("=== TRAFFIC INSPECTORS ===");
  console.log(JSON.stringify(tiProfiles, null, 2));
}

run();
