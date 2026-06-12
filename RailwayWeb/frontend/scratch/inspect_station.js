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

async function inspect() {
  console.log("--- STATION ---");
  const { data: st, error: stErr } = await supabase.from('STATION').select('*').limit(1);
  console.log("station data:", st, "error:", stErr);

  console.log("--- STATION WITH JOIN ---");
  // Let's test different select queries to see which one works and which one fails
  const { data: stJoin1, error: stJoin1Err } = await supabase.from('STATION').select('station_id, division, zone').limit(1);
  console.log("stJoin1:", stJoin1, "error:", stJoin1Err);

  const { data: stJoin2, error: stJoin2Err } = await supabase.from('STATION').select('station_id, division, zone, DIVISION(division_name)').limit(1);
  console.log("stJoin2 (with DIVISION join):", stJoin2, "error:", stJoin2Err);
}

inspect();
