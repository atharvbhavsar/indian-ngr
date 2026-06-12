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
  console.log("--- POINTSMAN ---");
  const { data: pm, error: pmErr } = await supabase.from('POINTSMAN').select('*').limit(1);
  console.log("pm data:", pm, "error:", pmErr);

  console.log("--- STATION_MASTER ---");
  const { data: sm, error: smErr } = await supabase.from('STATION_MASTER').select('*').limit(1);
  console.log("sm data:", sm, "error:", smErr);

  console.log("--- TRAIN_MANAGER ---");
  const { data: tm, error: tmErr } = await supabase.from('TRAIN_MANAGER').select('*').limit(1);
  console.log("tm data:", tm, "error:", tmErr);

  console.log("--- STATION_SUPERINTENDENT ---");
  const { data: ss, error: ssErr } = await supabase.from('STATION_SUPERINTENDENT').select('*').limit(1);
  console.log("ss data:", ss, "error:", ssErr);

  console.log("--- TRAFFIC_INSPECTOR ---");
  const { data: ti, error: tiErr } = await supabase.from('TRAFFIC_INSPECTOR').select('*').limit(1);
  console.log("ti data:", ti, "error:", tiErr);
}

inspect();
