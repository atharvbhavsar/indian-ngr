import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('d:/RailwayWeb/RailwayWeb/frontend/.env', 'utf-8');
const envLines = envContent.split('\n');
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';
for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) SUPABASE_ANON_KEY = line.split('=')[1].trim();
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQuery() {
  const { data, error } = await supabase
    .from('USERS')
    .select(`
      hrms_id,
      full_name,
      ROLE (role_name),
      MONITORING (
        risk_level,
        monitoring_status
      ),
      EMPLOYEE_PROFILE (
        current_score,
        category,
        pme_status,
        refresher_status
      )
    `);
  
  if (error) {
    console.log("Error:", error);
    return;
  }
  
  const formatted = data.map(u => {
    const ep = Array.isArray(u.EMPLOYEE_PROFILE) ? (u.EMPLOYEE_PROFILE[0] || {}) : (u.EMPLOYEE_PROFILE || {});
    const mon = Array.isArray(u.MONITORING) ? (u.MONITORING[0] || {}) : (u.MONITORING || {});
    return {
      hrms_id: u.hrms_id,
      full_name: u.full_name,
      role: u.ROLE?.role_name,
      score: ep.current_score,
      category: ep.category,
      pme: ep.pme_status,
      ref: ep.refresher_status,
      db_monitoring_risk: mon.risk_level,
      db_monitoring_status: mon.monitoring_status
    };
  });
  
  console.log("USERS DATA FROM DB:");
  console.log(JSON.stringify(formatted, null, 2));
}

testQuery();
