const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Read environment variables from .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// 2. Read parsed Excel data
const bzuDataPath = path.join(__dirname, 'bzu_data.json');
const bzuData = JSON.parse(fs.readFileSync(bzuDataPath, 'utf-8'));

async function updateCategories() {
  console.log("Starting category assignments based on BZU data...");
  
  // Filter out invalid/empty rows (we need both HRMS ID in E and Category in G)
  const validRows = bzuData.filter(row => row.E && row.G);
  console.log(`Found ${validRows.length} valid employee rows in Excel sheet.`);

  // Fetch all users to map hrms_id to user_id
  const { data: dbUsers, error: usersError } = await supabase
    .from('USERS')
    .select('user_id, hrms_id, full_name');

  if (usersError) {
    console.error("Error fetching users from DB:", usersError);
    return;
  }

  console.log(`Fetched ${dbUsers.length} users from database.`);

  // Create a map of normalized hrms_id -> user_id/name
  const userMap = {};
  dbUsers.forEach(u => {
    const key = u.hrms_id.trim().toUpperCase();
    userMap[key] = {
      userId: u.user_id,
      fullName: u.full_name
    };
  });

  let matchCount = 0;
  let updateCount = 0;
  let failCount = 0;

  for (const row of validRows) {
    const rawHrms = String(row.E).trim();
    const hrmsKey = rawHrms.toUpperCase();
    const excelCat = String(row.G).trim().toUpperCase();
    const excelName = row.B || "Unknown";

    const dbUser = userMap[hrmsKey];
    if (dbUser) {
      matchCount++;
      console.log(`Match found: ${rawHrms} (${excelName} in Excel, ${dbUser.fullName} in DB) -> category: ${excelCat}`);

      // Perform update on EMPLOYEE_PROFILE
      const { data, error } = await supabase
        .from('EMPLOYEE_PROFILE')
        .update({ category: excelCat })
        .eq('user_id', dbUser.userId);

      if (error) {
        console.error(`Error updating category for ${rawHrms}:`, error);
        failCount++;
      } else {
        updateCount++;
      }
    } else {
      // Don't spam warnings for non-matching ones unless necessary
    }
  }

  console.log("\nAssignment execution summary:");
  console.log(`- Total Excel rows with HRMS ID: ${validRows.length}`);
  console.log(`- Matched in DB: ${matchCount}`);
  console.log(`- Successfully updated in DB: ${updateCount}`);
  console.log(`- Failures: ${failCount}`);
}

updateCategories();
