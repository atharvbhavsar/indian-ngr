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
  // Update assessment status back to AVAILABLE
  const { error: aErr } = await supabase
    .from('ASSESSMENT')
    .update({ status: 'AVAILABLE' })
    .eq('employee_id', '4dfe6b3a-461f-49c9-9df9-679cd6d547c9');
  if (aErr) console.error("Assessment update error:", aErr);

  // Delete answers from ANSWER_HISTORY first (foreign key reference to TEST_ATTEMPT)
  const { data: attempts } = await supabase
    .from('TEST_ATTEMPT')
    .select('attempt_id')
    .eq('employee_id', '4dfe6b3a-461f-49c9-9df9-679cd6d547c9');
  
  if (attempts && attempts.length > 0) {
    const ids = attempts.map(a => a.attempt_id);
    const { error: ansErr } = await supabase
      .from('ANSWER_HISTORY')
      .delete()
      .in('attempt_id', ids);
    if (ansErr) console.error("Answer history delete error:", ansErr);
  }

  // Delete attempts
  const { error: tErr } = await supabase
    .from('TEST_ATTEMPT')
    .delete()
    .eq('employee_id', '4dfe6b3a-461f-49c9-9df9-679cd6d547c9');
  if (tErr) console.error("Test attempt delete error:", tErr);

  console.log("Reset finished successfully!");
}
run();
