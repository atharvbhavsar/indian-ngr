import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync("d:/RailwayWeb/RailwayWeb/frontend/.env", "utf8");
const vars = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    vars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from("PME_RECORD").select("*");
  console.log("PME_RECORD rows:", data, error);
}
check();
