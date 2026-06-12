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
  const { data: funcDef, error: funcErr } = await supabase
    .rpc('get_func_def', { func_name: 'submit_test_attempt_rpc' });

  if (funcErr) {
    // If helper RPC doesn't exist, let's query via standard SQL block if possible, or just print the error
    console.error("Error fetching func def via RPC:", funcErr);
    // Let's try direct select from pg_proc
    const { data: pgData, error: pgErr } = await supabase
      .from('pg_proc')
      .select('prosrc')
      .eq('proname', 'submit_test_attempt_rpc');
    console.log("pg_proc result:", pgData, pgErr);
  } else {
    console.log("Function definition:", funcDef);
  }

  const { data: attempts, error: attErr } = await supabase
    .from('TEST_ATTEMPT')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);
  console.log("Test Attempts in DB:", attempts, attErr);
}

run();
