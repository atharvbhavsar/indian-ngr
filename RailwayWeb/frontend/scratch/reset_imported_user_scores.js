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

async function resetScores() {
  console.log("--- Initializing Score Reset for Untested Users ---");

  // 1. Fetch all assessments to see who has taken tests
  const { data: assessments, error: assessErr } = await supabase
    .from('ASSESSMENT')
    .select('employee_id');

  if (assessErr) {
    console.error("Error fetching assessments:", assessErr);
    return;
  }

  const userIdsWithTests = new Set(assessments.map(a => a.employee_id));
  console.log(`Found ${userIdsWithTests.size} users with active assessments.`);

  // 2. Fetch all employee profiles
  const { data: profiles, error: profErr } = await supabase
    .from('EMPLOYEE_PROFILE')
    .select(`
      user_id,
      current_score,
      safety_score,
      USERS (
        hrms_id,
        full_name
      )
    `);

  if (profErr) {
    console.error("Error fetching profiles:", profErr);
    return;
  }

  // 3. Filter profiles that have no assessments but non-zero scores
  const toReset = profiles.filter(p => {
    const hasTests = userIdsWithTests.has(p.user_id);
    const score = p.current_score || 0;
    const safetyScore = p.safety_score || 0;
    return !hasTests && (score > 0 || safetyScore > 0);
  });

  console.log(`Identified ${toReset.length} users to reset.`);

  // 4. Update the identified users
  let successCount = 0;
  for (const p of toReset) {
    const { error: updateErr } = await supabase
      .from('EMPLOYEE_PROFILE')
      .update({
        current_score: 0,
        safety_score: 0
      })
      .eq('user_id', p.user_id);

    if (updateErr) {
      console.error(`Failed to reset user ${p.USERS?.hrms_id}:`, updateErr.message);
    } else {
      console.log(`Successfully reset scores for: ${p.USERS?.hrms_id} (${p.USERS?.full_name})`);
      successCount++;
    }
  }

  console.log(`--- Finished! Reset ${successCount}/${toReset.length} users successfully ---`);
}

resetScores();
