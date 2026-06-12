import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually
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
  const { data: stations, error } = await supabase
    .from('STATION')
    .select('station_id, station_name, station_code');

  if (error) {
    console.error("Error fetching stations:", error);
  } else {
    console.log("Stations in DB:");
    stations.forEach(s => {
      console.log(`- ID: ${s.station_id} | Name: ${s.station_name} | Code: ${s.station_code}`);
    });
  }
}

run();
