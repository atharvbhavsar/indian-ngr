import { createClient } from '@supabase/supabase-js';

const url = 'https://egsaiocikpvqzfquhbts.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc2Fpb2Npa3B2cXpmcXVoYnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDkzMDQsImV4cCI6MjA5NTcyNTMwNH0.YYFRC7zTuYp80v_JanNk24rawHGlqJk2t5zqz6mGdpM';

const supabase = createClient(url, key);

async function run() {
  console.log("Querying USERS...");
  const { data: users, error: uErr } = await supabase.from('USERS').select('user_id, hrms_id, full_name');
  if (uErr) console.error(uErr);
  else console.log("USERS:", users);

  console.log("Querying ASSESSMENT...");
  const { data: assessments, error: aErr } = await supabase.from('ASSESSMENT').select('*');
  if (aErr) console.error(aErr);
  else console.log("ASSESSMENTS:", assessments);
}

run();
