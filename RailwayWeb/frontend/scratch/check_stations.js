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

const stationsToCheck = ['KRTH', 'KSLA', 'TAKU', 'SALI', 'KQE', 'POX', 'DOH', 'MGRD', 'BBTR', 'GDYA', 'DHQ', 'MJY', 'BZU'];

async function checkStations() {
  const { data: dbStations, error } = await supabase
    .from('STATION')
    .select('*, DIVISION(*)');

  console.log("Stations in DB:");
  dbStations?.forEach(s => {
    console.log(`- ${s.station_name} (${s.station_code}) [ID: ${s.station_id}]`);
  });

  const missing = stationsToCheck.filter(st => !dbStations?.some(s => s.station_name.toUpperCase() === st.toUpperCase() || s.station_code.toUpperCase() === st.toUpperCase()));
  console.log("Missing stations:", missing);
}

checkStations();
