const { createClient } = require('@supabase/supabase-client');
const fs = require('fs');

const supabaseUrl = "https://hygexyzhvvygkgvksxmx.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || ""; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error: uErr } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name, role_id, ROLE(role_name)')
    .eq('hrms_id', 'ss_13234');
  console.log("USERS:", users, uErr);

  if (users && users.length > 0) {
    const userId = users[0].user_id;
    const { data: assess, error: aErr } = await supabase
      .from('ASSESSMENT')
      .select('*, TEST_ATTEMPT(*)')
      .eq('employee_id', userId);
    console.log("ASSESSMENTS:", JSON.stringify(assess, null, 2), aErr);
  }
}

run();
