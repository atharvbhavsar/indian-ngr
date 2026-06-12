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

async function fix() {
  console.log("Fixing record 1: 046187e2-7e3d-4d0b-b798-a637ed78cdac");
  // Set total_marks = 100 since percentage is 30 and obtained_marks is 30
  const { error: err1 } = await supabase
    .from('TEST_ATTEMPT')
    .update({ total_marks: 100 })
    .eq('attempt_id', '046187e2-7e3d-4d0b-b798-a637ed78cdac');
  console.log("Record 1 update error:", err1);

  console.log("Fixing record 2: b3db1122-bca4-496a-a9b3-757c6c346bf3");
  // Set total_marks = 100 since percentage is 51 and obtained_marks is 51
  const { error: err2 } = await supabase
    .from('TEST_ATTEMPT')
    .update({ total_marks: 100 })
    .eq('attempt_id', 'b3db1122-bca4-496a-a9b3-757c6c346bf3');
  console.log("Record 2 update error:", err2);
}

fix();
