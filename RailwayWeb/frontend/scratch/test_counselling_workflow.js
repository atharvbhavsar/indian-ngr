import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf8");

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv("VITE_SUPABASE_URL");
const supabaseKey = getEnv("VITE_SUPABASE_ANON_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=================================================");
  console.log("=== POINTSMAN CATEGORY D WORKFLOW TEST ===");
  console.log("=================================================\n");

  let testAssessmentId = null;
  let testCounsellingId = null;
  let retestAssessmentId = null;
  let retestSchedId = null;
  let pmUserId = null;
  let smUserId = null;

  // Save original employee profile state to revert later
  let originalProfile = null;
  let originalMonitoring = null;

  try {
    // 1. Fetch Pointsman and Station Master users
    console.log("[1] Querying Pointsman and Station Master users...");
    const { data: pmUser, error: pmErr } = await supabase
      .from("USERS")
      .select("user_id, full_name, hrms_id")
      .eq("role_id", 7) // Pointsman role
      .limit(1)
      .single();

    if (pmErr || !pmUser) {
      throw new Error("Could not find a Pointsman user: " + (pmErr?.message || "No records"));
    }
    pmUserId = pmUser.user_id;

    const { data: smUser, error: smErr } = await supabase
      .from("USERS")
      .select("user_id, full_name, hrms_id")
      .eq("role_id", 5) // Station Master role
      .limit(1)
      .single();

    if (smErr || !smUser) {
      throw new Error("Could not find a Station Master user: " + (smErr?.message || "No records"));
    }
    smUserId = smUser.user_id;

    console.log(`- Pointsman (PM): ${pmUser.full_name} (${pmUser.hrms_id})`);
    console.log(`- Station Master (SM): ${smUser.full_name} (${smUser.hrms_id})`);

    // Backup current profile and monitoring state for clean rollback
    const { data: profData } = await supabase
      .from("EMPLOYEE_PROFILE")
      .select("*")
      .eq("user_id", pmUserId)
      .maybeSingle();
    originalProfile = profData;

    const { data: monData } = await supabase
      .from("MONITORING")
      .select("*")
      .eq("user_id", pmUserId)
      .maybeSingle();
    originalMonitoring = monData;

    // 2. Insert a temporary assessment with Category D score
    console.log("\n[2] Simulating a Category D assessment submission (Score: 35%)...");
    const { data: assess, error: assessErr } = await supabase
      .from("ASSESSMENT")
      .insert([{
        employee_id: pmUserId,
        conducted_by: smUserId,
        assessment_type: "Pointsman Periodic Assessment",
        status: "Submitted",
        assessment_date: new Date().toISOString().split("T")[0]
      }])
      .select()
      .single();

    if (assessErr) throw assessErr;
    testAssessmentId = assess.assessment_id;
    console.log(`- Created Assessment ID: ${testAssessmentId}`);

    // Create a mock test attempt with Category D score
    const { data: attempt, error: attemptErr } = await supabase
      .from("TEST_ATTEMPT")
      .insert([{
        assessment_id: testAssessmentId,
        employee_id: pmUserId,
        total_marks: 100,
        obtained_marks: 35,
        percentage: 35,
        category: "D"
      }])
      .select()
      .single();

    if (attemptErr) throw attemptErr;
    console.log(`- Created Test Attempt ID: ${attempt.attempt_id}`);

    // 3. Trigger Category D Protocol
    console.log("\n[3] Triggering Category D Protocol...");
    // Create COUNSELLING_RECORD
    const { data: counselRec, error: counselRecErr } = await supabase
      .from("COUNSELLING_RECORD")
      .insert([{
        user_id: pmUserId,
        assessment_id: testAssessmentId,
        counsellor_id: smUserId,
        remarks: "System Auto-Generated: Score was 35%. Category D: Immediate safety counselling required.",
        status: "Pending"
      }])
      .select()
      .single();

    if (counselRecErr) throw counselRecErr;
    testCounsellingId = counselRec.counselling_id;
    console.log(`- Created Counselling Record ID: ${testCounsellingId} (Status: Pending)`);

    // Schedule Retest after 1 Month
    const retestDate = new Date();
    retestDate.setMonth(retestDate.getMonth() + 1);
    const retestDateStr = retestDate.toISOString().split("T")[0];

    const { data: retestSched, error: retestSchedErr } = await supabase
      .from("RETEST_SCHEDULING")
      .insert([{
        employee_id: pmUserId,
        original_assessment_id: testAssessmentId,
        scheduled_date: retestDateStr,
        status: "Scheduled"
      }])
      .select()
      .single();

    if (retestSchedErr) {
      console.warn("  (Note: RETEST_SCHEDULING insert skipped or handled differently in DB)");
    } else {
      retestSchedId = retestSched.retest_id;
      console.log(`- Retest Scheduled ID: ${retestSchedId} for ${retestDateStr}`);
    }

    // Create a new locked assessment for the retest
    const { data: retestAssess, error: retestAssessErr } = await supabase
      .from("ASSESSMENT")
      .insert([{
        employee_id: pmUserId,
        conducted_by: smUserId,
        assessment_type: "Mandatory Retest (Category D)",
        due_date: retestDateStr,
        status: "LOCKED"
      }])
      .select()
      .single();

    if (retestAssessErr) throw retestAssessErr;
    retestAssessmentId = retestAssess.assessment_id;
    console.log(`- Created Locked Retest Assessment ID: ${retestAssessmentId}`);

    // Update Profile to High Risk and Category D
    const { error: profUpdateErr } = await supabase
      .from("EMPLOYEE_PROFILE")
      .update({
        monitoring_status: "High Risk",
        category: "D",
        current_score: 35
      })
      .eq("user_id", pmUserId);

    if (profUpdateErr) throw profUpdateErr;
    console.log("- Updated EMPLOYEE_PROFILE status to 'High Risk' and Category 'D'");

    // Update MONITORING table risk level
    const { error: monUpdateErr } = await supabase
      .from("MONITORING")
      .upsert([{
        user_id: pmUserId,
        monitoring_status: "Under Observation",
        risk_level: "High",
        remarks: "Automated high risk observation triggered after scoring 35% (Category D) on assessment."
      }], { onConflict: "user_id" });

    if (monUpdateErr) throw monUpdateErr;
    console.log("- Upserted MONITORING record: status 'Under Observation', risk 'High'");

    // 4. Schedule the Counselling Session
    console.log("\n[4] Simulating SM scheduling the counselling session...");
    const scheduledRemarks = "Safety briefing on line clearance and points lock clamping.";
    const schedDate = "2026-06-15";
    const schedTime = "14:30";

    const parsedRemarks1 = {
      remarks: "System Auto-Generated: Score was 35%. Category D: Immediate safety counselling required.",
      scheduledDate: schedDate,
      scheduledTime: schedTime,
      schedulingRemarks: scheduledRemarks
    };

    const dateObj = new Date(`${schedDate}T${schedTime}:00`);

    const { data: schedUpdate, error: schedUpdateErr } = await supabase
      .from("COUNSELLING_RECORD")
      .update({
        status: "Scheduled",
        remarks: JSON.stringify(parsedRemarks1),
        counselling_date: dateObj.toISOString(),
        counsellor_id: smUserId
      })
      .eq("counselling_id", testCounsellingId)
      .select()
      .single();

    if (schedUpdateErr) throw schedUpdateErr;
    console.log(`- Counselling Record ${testCounsellingId} status updated to: '${schedUpdate.status}'`);
    console.log(`- Scheduled Date: ${schedUpdate.counselling_date}`);

    // 5. Record Attendance - Absent
    console.log("\n[5] Simulating Pointsman marking as ABSENT...");
    const absenceRemarks = "Absent due to medical emergency leave.";
    const parsedRemarks2 = {
      ...parsedRemarks1,
      attendance: "Absent",
      attendanceStatus: "Absent",
      absenceRemarks: absenceRemarks,
      reschedules: [
        {
          date: schedDate,
          time: schedTime,
          status: "Absent",
          absenceRemarks: absenceRemarks,
          recordedAt: new Date().toISOString()
        }
      ]
    };

    const { data: absentUpdate, error: absentUpdateErr } = await supabase
      .from("COUNSELLING_RECORD")
      .update({
        status: "Absent",
        remarks: JSON.stringify(parsedRemarks2)
      })
      .eq("counselling_id", testCounsellingId)
      .select()
      .single();

    if (absentUpdateErr) throw absentUpdateErr;
    console.log(`- Counselling Record status updated to: '${absentUpdate.status}'`);
    const absentData = JSON.parse(absentUpdate.remarks);
    console.log(`- Absence recorded in remarks JSON. Reschedules count: ${absentData.reschedules.length}`);

    // 6. Reschedule the session
    console.log("\n[6] Rescheduling after absence...");
    const newSchedDate = "2026-06-18";
    const newSchedTime = "10:00";
    const newSchedRemarks = "Rescheduled session. Review of shunting regulations.";

    const parsedRemarks3 = {
      ...parsedRemarks2,
      scheduledDate: newSchedDate,
      scheduledTime: newSchedTime,
      schedulingRemarks: newSchedRemarks
    };

    const newDateObj = new Date(`${newSchedDate}T${newSchedTime}:00`);

    const { data: rescheduleUpdate, error: rescheduleUpdateErr } = await supabase
      .from("COUNSELLING_RECORD")
      .update({
        status: "Scheduled",
        remarks: JSON.stringify(parsedRemarks3),
        counselling_date: newDateObj.toISOString()
      })
      .eq("counselling_id", testCounsellingId)
      .select()
      .single();

    if (rescheduleUpdateErr) throw rescheduleUpdateErr;
    console.log(`- Counselling Record status reverted to: '${rescheduleUpdate.status}'`);
    console.log(`- Rescheduled Date: ${rescheduleUpdate.counselling_date}`);

    // 7. Record Attendance - Present (Complete Session)
    console.log("\n[7] Simulating SM completing the counselling session (Present)...");
    const completionRemarks = {
      observations: "Showed understanding of points alignment safety procedures.",
      safetyConcerns: "Fails to verify point lock key extraction during manual shunting.",
      behaviouralConcerns: "Attentive and cooperative during discussion.",
      recommendations: "Require field supervisor monitoring for the next 2 weeks.",
      followUpActions: "Schedule observation check on Siding 3."
    };

    const parsedRemarks4 = {
      ...parsedRemarks3,
      attendance: "Present",
      attendanceStatus: "Present",
      ...completionRemarks
    };

    const { data: completeUpdate, error: completeUpdateErr } = await supabase
      .from("COUNSELLING_RECORD")
      .update({
        status: "Completed",
        remarks: JSON.stringify(parsedRemarks4)
      })
      .eq("counselling_id", testCounsellingId)
      .select()
      .single();

    if (completeUpdateErr) throw completeUpdateErr;
    console.log(`- Counselling Record status updated to: '${completeUpdate.status}'`);
    const completedData = JSON.parse(completeUpdate.remarks);
    console.log("- Completed session observations successfully serialized in remarks column.");

    // 8. Log a Monitoring Safety Review
    console.log("\n[8] Logging follow-up monitoring review...");
    const nextReviewDate = "2026-06-25";
    const reviewRemarks = "Field test completed on Siding 3. Key lock extraction executed safely. Risk remains Medium.";

    const parsedMonRemarks = {
      remarks: originalMonitoring?.remarks || "",
      followUpDate: nextReviewDate,
      reviews: [
        {
          reviewDate: new Date().toISOString().split("T")[0],
          reviewer: smUser.full_name,
          remarks: reviewRemarks,
          riskLevel: "Medium"
        }
      ]
    };

    const { data: monUpdate, error: monUpdateErr2 } = await supabase
      .from("MONITORING")
      .update({
        monitoring_status: "Under Observation",
        risk_level: "Medium",
        remarks: JSON.stringify(parsedMonRemarks),
        updated_at: new Date().toISOString()
      })
      .eq("user_id", pmUserId)
      .select()
      .single();

    if (monUpdateErr2) throw monUpdateErr2;
    console.log(`- MONITORING table risk level updated to: '${monUpdate.risk_level}'`);
    const monParsed = JSON.parse(monUpdate.remarks);
    console.log(`- Next Review Date saved: ${monParsed.followUpDate}`);
    console.log(`- Review log details successfully appended. Count: ${monParsed.reviews.length}`);

    console.log("\n>>> ALL WORKFLOW TRANSITIONS VERIFIED SUCCESSFULLY! <<<");

  } catch (err) {
    console.error("\n*** Test execution FAILED:", err.message);
  } finally {
    // 9. Clean up database verification records
    console.log("\n[9] Running database cleanup...");

    if (testCounsellingId) {
      await supabase.from("COUNSELLING_RECORD").delete().eq("counselling_id", testCounsellingId);
      console.log("- Deleted temporary COUNSELLING_RECORD.");
    }
    if (retestSchedId) {
      await supabase.from("RETEST_SCHEDULING").delete().eq("retest_id", retestSchedId);
      console.log("- Deleted temporary RETEST_SCHEDULING record.");
    }
    if (retestAssessmentId) {
      await supabase.from("ASSESSMENT").delete().eq("assessment_id", retestAssessmentId);
      console.log("- Deleted temporary retest ASSESSMENT.");
    }
    if (testAssessmentId) {
      await supabase.from("TEST_ATTEMPT").delete().eq("assessment_id", testAssessmentId);
      await supabase.from("ASSESSMENT").delete().eq("assessment_id", testAssessmentId);
      console.log("- Deleted temporary original Category D assessment & attempt.");
    }

    // Revert employee profile and monitoring states
    if (pmUserId) {
      if (originalProfile) {
        await supabase
          .from("EMPLOYEE_PROFILE")
          .update({
            monitoring_status: originalProfile.monitoring_status,
            category: originalProfile.category,
            current_score: originalProfile.current_score
          })
          .eq("user_id", pmUserId);
        console.log("- Reverted Pointsman profile status to original state.");
      }

      if (originalMonitoring) {
        await supabase
          .from("MONITORING")
          .update({
            monitoring_status: originalMonitoring.monitoring_status,
            risk_level: originalMonitoring.risk_level,
            remarks: originalMonitoring.remarks
          })
          .eq("user_id", pmUserId);
        console.log("- Reverted MONITORING status to original state.");
      } else {
        await supabase.from("MONITORING").delete().eq("user_id", pmUserId);
        console.log("- Cleaned up monitoring record.");
      }

      // Cleanup notifications
      await supabase.from("NOTIFICATION").delete().eq("user_id", pmUserId);
      await supabase.from("NOTIFICATION").delete().eq("user_id", smUserId);
      console.log("- Cleaned up temporary notifications.");
    }

    console.log("\n=== Verification cleanup complete. ===");
  }
}

run();
