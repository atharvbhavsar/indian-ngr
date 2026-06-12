import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jysctkmtjqqpcfqewlvw.supabase.co'; // Replace with real one if needed, but I can't read env directly without dotenv easily in standard ES module.

// Actually I'll just use fs to read .env
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

async function checkSchema() {
  const { data, error } = await supabase.from('ASSESSMENT').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
  
  // Let's also do a dummy insert
  const { error: insertError } = await supabase.from('ASSESSMENT').insert([{
    employee_id: "0a5d4ec3-dff4-4d82-8bc9-93e18a8d11c7", // Using some UUID
    conducted_by: "0a5d4ec3-dff4-4d82-8bc9-93e18a8d11c7",
    assessment_date: new Date().toISOString().slice(0, 10),
    assessment_type: 'Safety Exam',
    status: 'Pending'
  }]);
  console.log("Insert Error:", insertError);
}

checkSchema();
