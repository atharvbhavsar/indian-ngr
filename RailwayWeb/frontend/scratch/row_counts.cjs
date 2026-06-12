const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const tables = [
  "ROLE", "DIVISION", "STATION", "USERS", "SUPER_ADMIN", "AOM", "TRAFFIC_INSPECTOR",
  "STATION_SUPERINTENDENT", "STATION_MASTER", "TRAIN_MANAGER", "POINTSMAN",
  "EMPLOYEE_PROFILE", "PME_RECORD", "TRAINING_RECORD", "MONITORING",
  "QUESTION_BANK", "ASSESSMENT", "TEST_ATTEMPT", "ANSWER_HISTORY",
  "APPROVAL", "REVIEW", "SAFETY_RECORD", "REPORT", "NOTIFICATION",
  "AUDIT_LOG", "COUNSELLING_RECORD", "RETEST_SCHEDULING"
];

async function check() {
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select("*", { count: 'exact', head: true });
    if (error) {
      console.log(`Table ${t}: FAILED (${error.message})`);
    } else {
      console.log(`Table ${t}: ${count} rows`);
    }
  }
}
check();
