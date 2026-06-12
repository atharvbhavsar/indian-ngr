import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('d:/RailwayWeb/RailwayWeb/frontend/.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  // Query list of tables using Postgres catalog via pg_tables
  // Note: we might not have direct table query access unless we can query a public table or use a query.
  // Let's try to query some standard tables to see if they exist.
  const tables = [
    'USERS', 'ROLE', 'DIVISION', 'STATION', 'EMPLOYEE_PROFILE', 
    'ASSESSMENT', 'TEST_ATTEMPT', 'ANSWER_HISTORY', 'APPROVAL', 
    'REVIEW', 'SAFETY_RECORD', 'NOTIFICATION', 'AUDIT_LOG',
    'COUNSELLING_RECORD', 'RETEST_SCHEDULING', 'MONITORING'
  ];

  console.log("Checking table existence in Supabase...");
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.log(`Table ${table}: NOT FOUND or ERROR (${error.message}, code: ${error.code})`);
    } else {
      console.log(`Table ${table}: EXISTS`);
    }
  }
}

run();
