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

async function check() {
  const { data: attempts } = await supabase.from('TEST_ATTEMPT').select('*');
  console.log("Total attempts:", attempts.length);
  const invalid = attempts.filter(a => !(Number.isInteger(a.obtained_marks) && Number.isInteger(a.total_marks) && a.obtained_marks <= a.total_marks));
  console.log("Invalid records:", JSON.stringify(invalid, null, 2));
}

check();
