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

async function listTIs() {
  const { data: users, error } = await supabase
    .from('USERS')
    .select('*, ROLE(*), EMPLOYEE_PROFILE(*)')
    .eq('role_id', (await supabase.from('ROLE').select('role_id').eq('role_name', 'Traffic Inspector').single()).data.role_id);

  console.log("TI count:", users ? users.length : 0);
  console.log("TIs:", users);
}

listTIs();
