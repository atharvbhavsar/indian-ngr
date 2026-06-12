import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf8");
const vars = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    vars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = vars.VITE_SUPABASE_URL;
const supabaseAnonKey = vars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from("TEST_ATTEMPT").select("*").limit(1);
  if (data && data.length > 0) {
    const id = data[0].attempt_id;
    const { data: updateData, error: updateError } = await supabase
      .from("TEST_ATTEMPT")
      .update({ answers: { test: "val" } })
      .eq("attempt_id", id)
      .select();
    if (updateError) {
      console.log("Update failed as expected:", updateError.message);
    } else {
      console.log("Update succeeded! TEST_ATTEMPT has answers column!");
    }
  }
}
check();
