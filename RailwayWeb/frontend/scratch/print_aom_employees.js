import { createClient } from '@supabase/supabase-js';
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

// Define saDataService locally for the test
const saDataService = {
  async fetchUsers() {
    const { data: usersData, error } = await supabase
      .from("USERS")
      .select(`
        *,
        ROLE (role_name),
        MONITORING (
          risk_level,
          monitoring_status
        ),
        EMPLOYEE_PROFILE (
          joining_date,
          current_score,
          safety_score,
          monitoring_status,
          station_id,
          division,
          reporting_sm,
          work_location,
          shift,
          jurisdiction,
          category,
          pme_status,
          refresher_status,
          STATION (station_name, location)
        ),
        PME_RECORD (
          pme_due_date,
          pme_done_date,
          pme_status
        ),
        TRAINING_RECORD (
          training_date,
          expiry_date,
          course_name,
          status
        )
      `);
    if (error) throw error;
    
    const dynamicStationTiMap = {};
    usersData.forEach(userObj => {
      const roleName = userObj.ROLE?.role_name || "";
      if (roleName === "Traffic Inspector") {
        const ep = Array.isArray(userObj.EMPLOYEE_PROFILE)
          ? (userObj.EMPLOYEE_PROFILE[0] || {})
          : (userObj.EMPLOYEE_PROFILE || {});
        const jur = ep.jurisdiction || "";
        if (jur && jur !== "—") {
          const stationsList = jur.split(",").map(s => s.trim().toLowerCase());
          stationsList.forEach(stName => {
            if (stName) {
              dynamicStationTiMap[stName] = userObj.full_name;
            }
          });
        }
      }
    });

    return usersData.map((u) => {
      const roleName = u.ROLE?.role_name || "";
      const ep = Array.isArray(u.EMPLOYEE_PROFILE)
        ? (u.EMPLOYEE_PROFILE[0] || {})
        : (u.EMPLOYEE_PROFILE || {});
      const st = Array.isArray(ep.STATION)
        ? (ep.STATION[0] || {})
        : (ep.STATION || {});

      let superAdminRole = "pointsmen";
      if (roleName === "Station Master") superAdminRole = "sm";
      else if (roleName === "Station Superintendent") superAdminRole = "ss";
      else if (roleName === "Train Manager") superAdminRole = "tm";
      else if (roleName === "Traffic Inspector") superAdminRole = "ti";

      const lastScore = ep.current_score != null ? ep.current_score : 0;
      const safetyScore = ep.safety_score != null ? ep.safety_score : 0;

      const cat = ep.category || (lastScore === 0 ? "Untested" : (lastScore >= 80 ? "A" : lastScore >= 50 ? "B" : lastScore >= 26 ? "C" : "D"));
      
      let risk = "Low";
      if (cat === "C") risk = "Medium";
      else if (cat === "D") risk = "High";
      else if (cat === "Untested") risk = "Untested";
      
      const mon = Array.isArray(u.MONITORING) ? (u.MONITORING[0] || {}) : (u.MONITORING || {});
      const monitoringStatus = mon.monitoring_status || ep.monitoring_status || "Active";

      return {
        id: u.hrms_id,
        user_id: u.user_id,
        name: u.full_name,
        role: superAdminRole,
        station: st.station_name || "—",
        ti: st.station_name ? (dynamicStationTiMap[st.station_name.toLowerCase()] || "—") : "—",
        cat,
        risk,
        monitoringStatus,
        score: lastScore,
        contact: u.mobile_no || "—",
        lastDate: ep.joining_date || "—",
        status: u.status === "Suspended" ? "Rejected" : u.status === "Retired" ? "Overdue" : "Approved",
        email: u.email || "—",
        division: ep.division || "—",
        zone: st.zone || "—",
        reportingSm: ep.reporting_sm || "—",
        workLocation: ep.work_location || "—",
        shift: ep.shift || "—",
        jurisdiction: ep.jurisdiction || "—",
        linkedStations: superAdminRole === "ti" ? (ep.jurisdiction || "") : "",
        reportingAom: "—",
        pmeStatus: ep.pme_status || "Fit",
        refStatus: ep.refresher_status || "Cleared"
      };
    });
  }
};

const getPmCat = (score) => {
  if (score >= 80) return "A";
  if (score >= 50) return "B";
  if (score >= 26) return "C";
  return "D";
};

const getPmRisk = (pm) => {
  if (pm.risk === "Untested" || pm.riskLevel === "Untested") return "Untested";
  if (pm.riskLevel) return pm.riskLevel;
  if (pm.risk) return pm.risk;
  if (pm.safetyScore < 60 || pm.lastScore < 50) return "High";
  if (pm.safetyScore < 75 || pm.lastScore < 65) return "Medium";
  return "Low";
};

async function test() {
  const u = await saDataService.fetchUsers();
  
  const mapped = u.map(x => ({
    ...x,
    hrmsId: x.id,
    employeeId: x.id,
    user_id: x.user_id,
    name: x.name,
    lastScore: x.score,
    safetyScore: x.safetyScore || 85,
    doj: x.lastDate,
    stationName: x.station,
    approvalStatus: x.status,
    monitoringStatus: "Active",
    contactNumber: x.contact,
    contact: x.contact,
    emailId: x.email,
    email: x.email,
    role: x.role,
    division: x.division,
    zone: x.zone,
    cat: x.cat,
    risk: x.risk,
    riskLevel: x.risk,
    workLocation: x.workLocation,
    reportingSm: x.reportingSm,
    shift: x.shift
  }));

  const aomPointsmen = mapped.filter(x => x.role === "pointsmen");

  const allEmployees = [
    ...aomPointsmen.map((p) => ({
      hrmsId: p.hrmsId,
      name: p.name,
      designation: "Pointsman",
      role: "pointsmen",
      stationName: p.stationName,
      category: p.cat || getPmCat(p.lastScore),
      riskLevel: p.risk || getPmRisk(p),
      lastScore: p.lastScore,
      pmeStatus: p.pmeStatus,
      refStatus: p.refStatus
    }))
  ];

  console.log("ALL POINTSMEN IN AOM STATE:");
  console.log(JSON.stringify(allEmployees, null, 2));
}

test();
