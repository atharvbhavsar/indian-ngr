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

async function inspect() {
  console.log("--- Fetching recent users and their scores ---");
  
  // Get all employee profiles joined with users and assessment counts
  const { data: profiles, error } = await supabase
    .from('EMPLOYEE_PROFILE')
    .select(`
      user_id,
      category,
      current_score,
      safety_score,
      USERS (
        hrms_id,
        full_name,
        created_at
      )
    `)
    .order('created_at', { foreignTable: 'USERS', ascending: false })
    .limit(150);

  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  console.log(`Fetched ${profiles.length} profiles.`);

  // Let's filter profiles created recently (e.g. today or yesterday) or users with score > 0 but no assessment history
  const { data: assessments, error: assessErr } = await supabase
    .from('ASSESSMENT')
    .select('employee_id, assessment_id, status');

  if (assessErr) {
    console.error("Error fetching assessments:", assessErr);
    return;
  }

  const userIdsWithTests = new Set(assessments.map(a => a.employee_id));
  console.log(`Found ${userIdsWithTests.size} users who have taken tests/assessments.`);

  let noTestNonZero = 0;
  const toReset = [];

  for (const p of profiles) {
    if (!p.USERS) continue;
    const hasTests = userIdsWithTests.has(p.user_id);
    const score = p.current_score;
    const safetyScore = p.safety_score;
    
    if (!hasTests && (score > 0 || safetyScore > 0)) {
      noTestNonZero++;
      console.log(`User without tests: ${p.USERS.hrms_id} | Name: ${p.USERS.full_name} | Score: ${score} | Safety Score: ${safetyScore} | Category: ${p.category}`);
      toReset.push(p.user_id);
    }
  }

  console.log(`Total users without tests having non-zero scores: ${noTestNonZero}`);
  fs.writeFileSync('scratch/to_reset_users.json', JSON.stringify(toReset, null, 2));
}

inspect();
