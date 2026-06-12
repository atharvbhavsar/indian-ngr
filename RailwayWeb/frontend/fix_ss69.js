// This script manually inserts the missing TEST_ATTEMPT for ss_69
// and updates the ASSESSMENT status to 'Submitted'
// Run: node fix_ss69.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const assessmentId = "6534003a-ade6-4634-acc8-e0c15dce383c";
  const employeeId   = "ea83f5d5-9d8c-4d32-ab0a-dae43ae69531"; // ss_69 UUID

  // 1. Check if TEST_ATTEMPT already exists
  const { data: existing } = await supabase
    .from('TEST_ATTEMPT')
    .select('attempt_id')
    .eq('assessment_id', assessmentId);
  
  if (existing && existing.length > 0) {
    console.log("TEST_ATTEMPT already exists:", existing);
    return;
  }

  // 2. Insert a TEST_ATTEMPT (marks unknown since session is gone, use 0 as placeholder)
  //    AOM will see this as "Submitted" and can re-evaluate manually
  const { data: attempt, error: aErr } = await supabase
    .from('TEST_ATTEMPT')
    .insert([{
      assessment_id: assessmentId,
      employee_id: employeeId,
      total_marks: 25,
      obtained_marks: 0,   // unknown since session expired — AOM must re-issue
      percentage: 0,
      category: '',
      submitted_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (aErr) {
    console.error("Failed to insert TEST_ATTEMPT:", aErr);
    return;
  }
  console.log("Inserted TEST_ATTEMPT:", attempt);

  // 3. Update ASSESSMENT status → Submitted
  const { error: uErr } = await supabase
    .from('ASSESSMENT')
    .update({ status: 'Submitted' })
    .eq('assessment_id', assessmentId);
  
  if (uErr) {
    console.error("Failed to update ASSESSMENT status:", uErr);
  } else {
    console.log("ASSESSMENT status updated to Submitted ✅");
  }
}

run();
