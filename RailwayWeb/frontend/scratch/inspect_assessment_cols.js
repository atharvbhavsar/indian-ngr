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

async function inspectCols() {
  const { data: assess, error: err1 } = await supabase.from('ASSESSMENT').select('*').limit(1);
  console.log("ASSESSMENT columns:", assess);

  const { data: test, error: err2 } = await supabase.from('TEST_ATTEMPT').select('*').limit(1);
  console.log("TEST_ATTEMPT columns:", test);
}

inspectCols();
