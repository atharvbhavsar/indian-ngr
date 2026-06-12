import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jysctkmtjqqpcfqewlvw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy'; // Actually I should read from .env

import dotenv from 'dotenv';
dotenv.config({ path: 'd:/RailwayWeb/RailwayWeb/frontend/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
  const { data, error } = await supabase.from('ASSESSMENT').insert([{
    employee_id: "0a5d4ec3-dff4-4d82-8bc9-93e18a8d11c7", // Using some UUID
    conducted_by: "0a5d4ec3-dff4-4d82-8bc9-93e18a8d11c7",
    assessment_date: new Date().toISOString().slice(0, 10),
    assessment_type: 'Safety Exam',
    status: 'Pending',
    period: 'Q3 2026'
  }]);
  
  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Success:", data);
  }
}

testInsert();
