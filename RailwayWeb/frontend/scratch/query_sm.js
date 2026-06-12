import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== Fetching Station Master Users from DB ===");
  const { data: users, error } = await supabase
    .from('USERS')
    .select(`
      user_id, hrms_id, full_name, role_id, status,
      ROLE (role_name),
      EMPLOYEE_PROFILE (joining_date, current_score, safety_score, category)
    `);

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  const smUsers = users.filter(u => u.ROLE?.role_name === 'Station Master');
  console.log(`Found ${smUsers.length} Station Masters:`);
  for (const u of smUsers) {
    const ep = Array.isArray(u.EMPLOYEE_PROFILE) ? u.EMPLOYEE_PROFILE[0] : u.EMPLOYEE_PROFILE;
    console.log(`\n- User: ${u.full_name} (${u.hrms_id})`);
    console.log(`  User ID: ${u.user_id}`);
    console.log(`  Role: ${u.ROLE?.role_name} (role_id: ${u.role_id})`);
    console.log(`  Profile Score: ${ep?.current_score}, Category: ${ep?.category}`);
    
    // Fetch assessments
    const { data: assess } = await supabase
      .from('ASSESSMENT')
      .select('*, TEST_ATTEMPT(*)')
      .eq('employee_id', u.user_id);
    
    console.log(`  Assessments count: ${assess?.length}`);
    if (assess && assess.length > 0) {
      assess.forEach(a => {
        console.log(`    * Assess ID: ${a.assessment_id}, Date: ${a.assessment_date || a.created_at}, Type: ${a.assessment_type}, Status: ${a.status}`);
        a.TEST_ATTEMPT?.forEach(ta => {
          console.log(`      Attempt - Obtained: ${ta.obtained_marks}, Total: ${ta.total_marks}, Cat: ${ta.category}`);
        });
      });
    }
  }
}

run();
