import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://egsaiocikpvqzfquhbts.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc2Fpb2Npa3B2cXpmcXVoYnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDkzMDQsImV4cCI6MjA5NTcyNTMwNH0.YYFRC7zTuYp80v_JanNk24rawHGlqJk2t5zqz6mGdpM');
async function run() {
  const { data, error } = await supabase.from('ASSESSMENT').delete().eq('assessment_type', 'Safety Exam');
  console.log('Deleted Safety Exams:', error || data || 'Success');
}
run();
