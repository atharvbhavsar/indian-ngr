import fs from "fs";

const envContent = fs.readFileSync("d:/RailwayWeb/RailwayWeb/frontend/.env", "utf8");
const vars = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    vars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = vars.VITE_SUPABASE_URL;
const supabaseAnonKey = vars.VITE_SUPABASE_ANON_KEY;

async function checkColumns() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`
    }
  });
  const openapi = await res.json();
  console.log("Tables found:");
  console.log(Object.keys(openapi.definitions || {}));
  
  console.log("\nRPC Paths found:");
  console.log(Object.keys(openapi.paths || {}).filter(p => p.startsWith("/rpc/")));

  // Let's write the definitions of USERS and EMPLOYEE_PROFILE and POINTSMAN
  fs.writeFileSync("d:/RailwayWeb/RailwayWeb/frontend/scratch/openapi_definitions.json", JSON.stringify(openapi, null, 2));
  console.log("\nSaved openapi to d:/RailwayWeb/RailwayWeb/frontend/scratch/openapi_definitions.json");
}

checkColumns();
