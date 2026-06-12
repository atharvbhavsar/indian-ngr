import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('d:/RailwayWeb/RailwayWeb/frontend/.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_rpc_definition', {}); // Let's try querying standard postgres pg_proc
  if (error) {
    // Fallback to direct query if get_rpc_definition doesn't exist
    const { data: procData, error: procError } = await supabase
      .from('pg_proc') // wait, pg_proc is in pg_catalog, select might not work directly via supabase if not exposed
      .select('*');
    console.error("RPC Error:", error);
    console.log("pg_proc error:", procError);
  } else {
    console.log("Definition:", data);
  }
}

run();
