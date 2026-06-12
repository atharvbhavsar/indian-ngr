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

async function findTI() {
  const { data: user, error } = await supabase
    .from('USERS')
    .select('*, ROLE(*), EMPLOYEE_PROFILE(*)')
    .eq('hrms_id', 'WDMFKP')
    .maybeSingle();

  console.log("User:", user);
  console.log("Error:", error);
}

findTI();
