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

async function run() {
  console.log("Fetching all test attempts to identify evaluated users...");
  const { data: attempts, error: attemptErr } = await supabase
    .from('TEST_ATTEMPT')
    .select('employee_id');

  if (attemptErr) {
    console.error("Error fetching attempts:", attemptErr);
    return;
  }

  const evaluatedUserIds = new Set((attempts || []).map(a => a.employee_id));
  console.log(`Found ${evaluatedUserIds.size} evaluated users in database.`);

  console.log("Fetching all employee profiles...");
  const { data: profiles, error: profileErr } = await supabase
    .from('EMPLOYEE_PROFILE')
    .select('profile_id, user_id, category, current_score, safety_score');

  if (profileErr) {
    console.error("Error fetching profiles:", profileErr);
    return;
  }

  console.log(`Found ${profiles.length} total profiles.`);

  let resetCount = 0;
  for (const p of profiles) {
    if (!evaluatedUserIds.has(p.user_id)) {
      // Reset this profile to null category, score, safety score since no assessment exists
      const { error: updateErr } = await supabase
        .from('EMPLOYEE_PROFILE')
        .update({
          category: null,
          current_score: null,
          safety_score: null
        })
        .eq('profile_id', p.profile_id);

      if (updateErr) {
        console.error(`Error resetting profile ${p.profile_id}:`, updateErr.message);
      } else {
        resetCount++;
      }
    }
  }

  console.log(`Successfully reset ${resetCount} unassessed employee profiles in database!`);
}

run();
