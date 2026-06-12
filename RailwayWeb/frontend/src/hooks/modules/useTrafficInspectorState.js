/**
 * 🚂 RSES TRAFFIC INSPECTOR STATE HOOK
 * Centrally manages all state machines, reactive filters, dialog toggles, MCQ quizzes,
 * and local cache synchs for the Traffic Inspector safety console.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import {
  getCat, getUserRisk, computeSMScore, computeTMScore, computeSSScore
} from "../../utils/trafficInspectorUtils";
import {
  INIT_STATIONS, INIT_USERS, DEFAULT_SS_TM_USERS, MONTHLY, INIT_PM_ASSESSMENTS,
  TI_SM_CRITERIA, TI_TM_CRITERIA, TI_SS_CRITERIA, INIT_INSPECTIONS, INIT_COUNSELLING,
  TI_QUIZ, INIT_TI_ASSESS_HISTORY, defaultSMForm, defaultTMForm, defaultSSForm
} from "../../constants/trafficInspectorConstants";
import { saDataService } from "../../services/saDataService";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";
import { assessmentService } from "../../services/assessmentService";

export function useTrafficInspectorState(user, onLogout) {
  // Navigation & Sub-views
  const [activePage, setActivePage] = useState("dashboard");
  const [statusMsg, setStatusMsg] = useState("");
  const [view, setView] = useState(null);

  // Layout modals
  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const defaultStationForm = {
    stationName: "",
    stationCode: "",
    division: "Nagpur",
    category: "A",
    status: "Active",
    platforms: "3",
    runningLines: "5",
    address: "",
    district: "Nagpur",
    state: "Maharashtra",
    stationType: "Junction"
  };
  const [newStationData, setNewStationData] = useState(defaultStationForm);
  const [stationFormErrors, setStationFormErrors] = useState({});
  const [editingStationId, setEditingStationId] = useState(null);
  const [stationModalMode, setStationModalMode] = useState("add"); // "add" | "edit"
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    id: "", name: "", role: "Station Master", designation: "Station Master",
    station: "", contact: "", joiningDate: "", pmeStatus: "Fit", refStatus: "Cleared",
    reportingSm: "", shift: "", workLocation: ""
  });

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);

  const [stations, setStations] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentAssessments, setRecentAssessments] = useState([]);

  const constructSections = (score, max = 100, role = "PM") => {
    const total = score || 80;
    if (role === "PM") {
      return [
        { title: "Knowledge of Rules", score: Math.round(total * 0.25), max: 25 },
        { title: "Alertness & Observation", score: Math.round(total * 0.25), max: 25 },
        { title: "Safety Record", score: Math.round(total * 0.15), max: 15 },
        { title: "Leadership & Management", score: Math.round(total * 0.15), max: 15 },
        { title: "Discipline", score: Math.round(total * 0.10), max: 10 },
        { title: "Appearance & Neatness", score: Math.round(total * 0.10), max: 10 },
      ];
    } else if (role === "SM") {
      return [
        { title: "Knowledge of Rules (MCQ)", score: Math.round(total * 0.25), max: 25 },
        { title: "Alertness and Observation of Rules", score: Math.round(total * 0.25), max: 25 },
        { title: "Safety Record", score: Math.round(total * 0.15), max: 15 },
        { title: "Leadership and Management", score: Math.round(total * 0.15), max: 15 },
        { title: "Discipline", score: Math.round(total * 0.10), max: 10 },
        { title: "Appearance and Neatness", score: Math.round(total * 0.10), max: 10 },
      ];
    } else if (role === "TM") {
      return [
        { title: "Train Safety & Brake Inspection", score: Math.round(total * 0.25), max: 25 },
        { title: "Signaling & Whistle Compliance", score: Math.round(total * 0.20), max: 20 },
        { title: "Shunting & Coupling Ops", score: Math.round(total * 0.15), max: 15 },
        { title: "Train Log & Guard Certificates", score: Math.round(total * 0.15), max: 15 },
        { title: "Emergency Train Protection", score: Math.round(total * 0.25), max: 25 },
        { title: "Written Exam (Knowledge)", score: Math.round(total * 0.20), max: 25 }
      ];
    } else { // SS
      return [
        { title: "Station Safety", score: Math.round(total * 0.30), max: 30 },
        { title: "Rule Compliance", score: Math.round(total * 0.25), max: 25 },
        { title: "Incident Management", score: Math.round(total * 0.20), max: 20 },
        { title: "Communication Standards", score: Math.round(total * 0.15), max: 15 },
        { title: "Documentation Audit", score: Math.round(total * 0.10), max: 10 }
      ];
    }
  };

  const fetchLiveDatabaseData = async () => {
    try {
      const u = await saDataService.fetchUsers();
      const st = await saDataService.fetchStations(u);

      const currentUserDb = u.find(x => x.id?.toLowerCase() === user?.hrmsId?.toLowerCase() || x.user_id === user?.userId);
      const currentTiUserId = currentUserDb?.user_id || user?.userId;
      if (currentTiUserId && currentTiUserId !== resolvedUserId) {
        setResolvedUserId(currentTiUserId);
      }
      const effectiveUserId = currentTiUserId || resolvedUserId || user?.userId;


      const rawStations = user?.linkedStations || user?.jurisdiction || "";
      const tiStations = rawStations && rawStations !== "—" ? rawStations.split(",").map(s => s.trim().toLowerCase()) : [];

      const filteredStations = tiStations.length > 0
        ? st.filter(s => tiStations.includes(s.name.toLowerCase()))
        : [];
      setStations(filteredStations);

      const mapped = u.map(x => {
        let fullRole = "Pointsman";
        if (x.role === "sm") fullRole = "Station Master";
        else if (x.role === "ss") fullRole = "Station Superintendent";
        else if (x.role === "tm") fullRole = "Train Manager";
        else if (x.role === "ti") fullRole = "Traffic Inspector";

        const isUntested = x.cat === "Untested";
        return {
          ...x,
          role: fullRole,
          hrmsId: x.id,
          cat: x.cat || "Untested",
          risk: x.risk || "Untested",
          score: isUntested ? null : (x.score !== undefined && x.score !== null ? parseInt(x.score) : null),
          safetyScore: isUntested ? null : (x.safetyScore !== undefined && x.safetyScore !== null ? parseInt(x.safetyScore) : null),
          totalAssessments: isUntested ? 0 : (x.totalAssessments || 0),
          approvalStatus: isUntested ? "Pending" : (x.status || "Approved"),
          stationName: x.station,
          doj: x.lastDate || "2026-01-01"
        };
      });

      const filteredMapped = mapped.filter(u => {
        if (tiStations.length === 0) return false;
        return tiStations.includes((u.stationName || u.station || "").toLowerCase());
      });

      setUsers(filteredMapped);

      // Now query assessments from database
      const { data: assessList, error: assessError } = await supabase
        .from("ASSESSMENT")
        .select(`
          *,
          employee:USERS!employee_id (
            user_id,
            hrms_id,
            full_name,
            email,
            mobile_no,
            ROLE (role_name),
            EMPLOYEE_PROFILE (
              joining_date,
              current_score,
              safety_score,
              category,
              monitoring_status,
              shift,
              work_location,
              STATION (station_name, station_code)
            )
          ),
          conducted_by_user:USERS!conducted_by (
            full_name
          ),
          TEST_ATTEMPT (*),
          APPROVAL (*, USERS!approved_by(full_name))
        `)
        .order("created_at", { ascending: false });

      if (!assessError && assessList) {
        setAllDbAssessments(assessList);

        const updatedUsers = filteredMapped.map(userObj => {
          const userAssessments = assessList.filter(a => a.employee?.hrms_id === userObj.hrmsId);
          const approvedAssessments = userAssessments.filter(a => a.status === 'Approved');
          const totalApproved = approvedAssessments.length;

          if (totalApproved > 0) {
            const latestApproved = [...approvedAssessments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            const score = latestApproved?.TEST_ATTEMPT?.[0]?.obtained_marks;
            const cat = latestApproved?.TEST_ATTEMPT?.[0]?.category || userObj.cat || "A";
            return {
              ...userObj,
              totalAssessments: userAssessments.length,
              approvalStatus: "Approved",
              status: "Approved",
              cat: cat,
              category: cat,
              risk: cat === "D" ? "High" : (score >= 80 ? "Low" : score >= 60 ? "Medium" : "High"),
              score: score,
              lastScore: score
            };
          } else {
            const cat = userObj.cat || userObj.category || "A";
            return {
              ...userObj,
              totalAssessments: userAssessments.length,
              approvalStatus: "Pending First Assessment",
              status: "Pending First Assessment",
              cat: cat,
              category: cat,
              risk: cat === "D" ? "High" : cat === "C" ? "Medium" : "Low",
              score: null,
              lastScore: null
            };
          }
        });
        setUsers(updatedUsers);
        // 1. Pointsmen Assessments (pmList)
        const pms = assessList.filter(a => a.assessment_type === "Pointsman Checklist" || a.assessment_type === "Pointsman Evaluation" || a.assessment_type === "Checklist Evaluation");
        const pmMapped = pms
          .filter(a => {
            if (tiStations.length === 0) return false;
            const sName = a.employee?.EMPLOYEE_PROFILE?.STATION?.station_name || "";
            return tiStations.includes(sName.toLowerCase());
          })
          .map(a => {
            const score = a.TEST_ATTEMPT?.[0]?.obtained_marks || 0;
            const subDate = a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : "";
            return {
              id: a.assessment_id,
              pointsmanName: a.employee?.full_name || "",
              hrmsId: a.employee?.hrms_id || "",
              station: a.employee?.EMPLOYEE_PROFILE?.STATION?.station_name || "—",
              assessingSM: a.conducted_by_user?.full_name || "SM",
              submissionDate: subDate,
              status: a.status === 'Pending' ? 'Pending' : a.status,
              originalSections: constructSections(score, 100, "PM"),
              finalSections: a.status === "Approved" ? constructSections(score, 100, "PM") : undefined,
              finalScore: score,
              category: a.TEST_ATTEMPT?.[0]?.category || getCat(score),
              tiRemarks: a.APPROVAL?.remarks || "",
              tiModified: false,
              approvalDate: a.APPROVAL?.approval_date ? new Date(a.APPROVAL.approval_date).toISOString().slice(0, 10) : "",
              auditTrail: a.APPROVAL ? [{ action: "Approved", by: a.APPROVAL.USERS?.full_name || "TI", date: new Date(a.APPROVAL.approval_date).toISOString().slice(0, 10), remark: a.APPROVAL.remarks }] : []
            };
          });
        setPmList(pmMapped);

        // 2. Station Master Checklist List (smList)
        const sms = filteredMapped.filter(u => u.role === "Station Master");
        const smMapped = sms.map(u => {
          const latest = assessList.find(a => a.employee_id === u.user_id && (a.assessment_type === "Station Master Assessment" || a.assessment_type === "SM Assessment"));
          const score = (latest?.TEST_ATTEMPT?.[0]?.obtained_marks !== undefined && latest?.TEST_ATTEMPT?.[0]?.obtained_marks !== null) ? latest.TEST_ATTEMPT[0].obtained_marks : null;

          const isLocalActive = localStorage.getItem(`sm_test_activated_${u.hrmsId}`) === "true";
          let statusVal = 'Pending';
          if (latest) {
            if (latest.status === 'Approved') statusVal = 'Approved';
            else if (latest.status === 'Rejected') statusVal = 'Rejected';
            else if (latest.status === 'AVAILABLE' || latest.status === 'IN_PROGRESS') statusVal = 'Exam Sent';
            else statusVal = 'Submitted';
          }
          if (isLocalActive && (statusVal === 'Pending' || latest?.status === 'LOCKED')) {
            statusVal = 'Exam Sent';
          }

          return {
            id: u.user_id,
            name: u.name,
            hrmsId: u.hrmsId,
            station: u.stationName,
            contact: u.contact,
            score: score,
            cat: latest?.TEST_ATTEMPT?.[0]?.category || u.cat || "A",
            status: statusVal,
            examScore: latest?.TEST_ATTEMPT?.[0]?.obtained_marks,
            examTotalMarks: latest?.TEST_ATTEMPT?.[0]?.total_marks,
            submissionDate: latest?.assessment_date ? new Date(latest.assessment_date).toISOString().slice(0, 10) : undefined,
            pmeStatus: u.pmeStatus || 'Fit',
            refStatus: u.refStatus || 'Cleared'
          };
        });
        setSmList(smMapped);

        // 3. Train Manager Checklist List (tmList)
        const tms = filteredMapped.filter(u => u.role === "Train Manager");
        const tmMapped = tms.map(u => {
          const latest = assessList.find(a => a.employee_id === u.user_id && (a.assessment_type === "Train Manager Assessment" || a.assessment_type === "TM Assessment"));
          const score = (latest?.TEST_ATTEMPT?.[0]?.obtained_marks !== undefined && latest?.TEST_ATTEMPT?.[0]?.obtained_marks !== null) ? latest.TEST_ATTEMPT[0].obtained_marks : null;

          const isLocalActive = localStorage.getItem(`tm_test_activated_${u.hrmsId}`) === "true";
          let statusVal = 'Pending';
          if (latest) {
            if (latest.status === 'Approved') statusVal = 'Approved';
            else if (latest.status === 'Rejected') statusVal = 'Rejected';
            else if (latest.status === 'AVAILABLE' || latest.status === 'IN_PROGRESS') statusVal = 'Exam Sent';
            else statusVal = 'Submitted';
          }
          if (isLocalActive && (statusVal === 'Pending' || latest?.status === 'LOCKED')) {
            statusVal = 'Exam Sent';
          }

          return {
            id: u.user_id,
            name: u.name,
            hrmsId: u.hrmsId,
            station: u.stationName,
            contact: u.contact,
            score: score,
            cat: latest?.TEST_ATTEMPT?.[0]?.category || u.cat || "A",
            status: statusVal,
            examScore: latest?.TEST_ATTEMPT?.[0]?.obtained_marks,
            examTotalMarks: latest?.TEST_ATTEMPT?.[0]?.total_marks,
            submissionDate: latest?.assessment_date ? new Date(latest.assessment_date).toISOString().slice(0, 10) : undefined,
            pmeStatus: u.pmeStatus || 'Fit',
            refStatus: u.refStatus || 'Cleared'
          };
        });
        setTmList(tmMapped);

        // 4. Station Superintendent Checklist List (ssList)
        const sss = filteredMapped.filter(u => u.role === "Station Superintendent");
        const ssMapped = sss.map(u => {
          const latest = assessList.find(a => a.employee_id === u.user_id && (a.assessment_type === "Station Superintendent Assessment" || a.assessment_type === "SS Assessment"));
          const score = (latest?.TEST_ATTEMPT?.[0]?.obtained_marks !== undefined && latest?.TEST_ATTEMPT?.[0]?.obtained_marks !== null) ? latest.TEST_ATTEMPT[0].obtained_marks : null;

          const isLocalActive = localStorage.getItem(`ss_test_activated_${u.hrmsId}`) === "true";
          let statusVal = 'Pending';
          if (latest) {
            if (latest.status === 'Approved') statusVal = 'Approved';
            else if (latest.status === 'Rejected') statusVal = 'Rejected';
            else if (latest.status === 'AVAILABLE' || latest.status === 'IN_PROGRESS') statusVal = 'Exam Sent';
            else statusVal = 'Submitted';
          }
          if (isLocalActive && (statusVal === 'Pending' || latest?.status === 'LOCKED')) {
            statusVal = 'Exam Sent';
          }

          return {
            id: u.user_id,
            name: u.name,
            hrmsId: u.hrmsId,
            station: u.stationName,
            contact: u.contact,
            score: score,
            cat: latest?.TEST_ATTEMPT?.[0]?.category || u.cat || "A",
            status: statusVal,
            examScore: latest?.TEST_ATTEMPT?.[0]?.obtained_marks,
            examTotalMarks: latest?.TEST_ATTEMPT?.[0]?.total_marks,
            submissionDate: latest?.assessment_date ? new Date(latest.assessment_date).toISOString().slice(0, 10) : undefined,
            pmeStatus: u.pmeStatus || 'Fit',
            refStatus: u.refStatus || 'Cleared'
          };
        });
        setSsList(ssMapped);

        // 5. TI Self-Assessments (tiAssessments) — show all assessments for the current TI
        const tiAssess = assessList.filter(a => a.employee_id === effectiveUserId && (a.status === 'Submitted' || a.status === 'Approved' || (a.TEST_ATTEMPT && a.TEST_ATTEMPT.length > 0)));
        const tiAssessMapped = tiAssess.map(a => {
          const score = a.TEST_ATTEMPT?.[0]?.obtained_marks || 0;
          const cat = a.TEST_ATTEMPT?.[0]?.category || "Pending";
          const approval = Array.isArray(a.APPROVAL) ? a.APPROVAL[0] : a.APPROVAL;
          return {
            id: a.assessment_id,
            date: a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : "",
            period: a.assessment_type,
            assessedBy: a.conducted_by_user?.full_name || "AOM/G",
            totalScore: score,
            category: cat,
            approvalStatus: a.status,
            aomRemarks: approval?.remarks || (a.status === "Approved" ? "Approved by AOM." : "Submitted safety compliance assessment."),
            approvalDate: approval?.approval_date ? new Date(approval.approval_date).toISOString().slice(0, 10) : "",
            approvedBy: approval?.USERS?.full_name || "",
            sections: [
              { title: "Knowledge of Rules (MCQ)", marks: Math.round(score * 0.25), outOf: 25 },
              { title: "Alertness and Observation of Rules", marks: Math.round(score * 0.25), outOf: 25 },
              { title: "Safety Record", marks: Math.round(score * 0.15), outOf: 15 },
              { title: "Leadership and Management", marks: Math.round(score * 0.15), outOf: 15 },
              { title: "Discipline", marks: Math.round(score * 0.10), outOf: 10 },
              { title: "Appearance and Neatness", marks: Math.round(score * 0.10), outOf: 10 }
            ],
            userAnswers: []
          };
        });
        setTiAssessments(tiAssessMapped);

        // 6. Recent Assessments (for Dashboard)
        const recentAssessmentsMapped = assessList
          .filter(a => {
            const sName = a.employee?.EMPLOYEE_PROFILE?.STATION?.station_name || "";
            return tiStations.includes(sName.toLowerCase());
          })
          .slice(0, 5)
          .map(a => ({
            id: a.assessment_id,
            employeeId: a.employee_id,
            name: a.employee?.full_name || "Unknown",
            role: a.employee?.EMPLOYEE_PROFILE?.designation || a.assessment_type.replace(" Assessment", "").replace(" Checklist", ""),
            type: a.assessment_type,
            status: a.status === 'Approved' ? 'Completed' : (a.status === 'Submitted' ? 'Pending' : a.status),
            by: a.conducted_by_user?.full_name || "TI",
            date: a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : ""
          }));
        setRecentAssessments(recentAssessmentsMapped);

        // Check if TI exam is assigned (Pending status with NO test attempt yet)
        const pendingTIExam = assessList.find(a => a.employee_id === effectiveUserId && a.status === 'Pending' && (!a.TEST_ATTEMPT || a.TEST_ATTEMPT.length === 0));
        const wasExamAssigned = isExamAssignedRef.current;
        isExamAssignedRef.current = !!pendingTIExam;
        setIsExamAssigned(!!pendingTIExam);
        if (pendingTIExam && !wasExamAssigned) {
          triggerNotification("info", "Assessment access has been granted. Please complete your safety examination.");
        }
      }

      // 6. Inspections & Counselling from SAFETY_RECORD
      const { data: safetyRecords, error: safetyError } = await supabase
        .from("SAFETY_RECORD")
        .select(`
          *,
          employee:USERS!user_id (
            full_name,
            hrms_id,
            EMPLOYEE_PROFILE (STATION (station_name, station_code))
          )
        `);
      if (!safetyError && safetyRecords) {
        const inspects = safetyRecords
          .filter(r => {
            if (r.incident_type !== 'Inspection') return false;
            return r.user_id === effectiveUserId;
          })
          .map(r => {
            let stationName = tiStations[0] || "Nagpur Junction";
            let obs = r.description || "";
            if (obs.startsWith("Station: ")) {
              const parts = obs.split(" | Observations: ");
              if (parts.length >= 2) {
                stationName = parts[0].replace("Station: ", "");
                obs = parts[1];
              }
            }
            return {
              id: r.safety_id,
              date: r.incident_date,
              station: stationName,
              officer: "TI " + (user?.name || "R. Khan"),
              observations: obs,
              risk: r.action_taken || "Low",
              status: "Active"
            };
          })
          .filter(ins => {
            return tiStations.includes(ins.station.toLowerCase());
          });
        setInspections(inspects);

        const couns = safetyRecords
          .filter(r => {
            if (r.incident_type !== 'Counseling') return false;
            const sName = r.employee?.EMPLOYEE_PROFILE?.STATION?.station_name || "";
            return tiStations.includes(sName.toLowerCase());
          })
          .map(r => ({
            id: r.safety_id,
            date: r.incident_date,
            staffName: r.employee?.full_name || "Pointsman",
            designation: r.employee?.EMPLOYEE_PROFILE?.designation || "Pointsman Grade I",
            station: r.employee?.EMPLOYEE_PROFILE?.STATION?.station_name || "Nagpur Junction",
            topics: r.description,
            duration: "30 mins",
            progress: r.action_taken || "Under Monitor"
          }));
        setCounsellings(couns);
      }
    } catch (err) {
      console.error("Error fetching live db data:", err);
    }
  };

  const isExamAssignedRef = useRef(false);

  useEffect(() => {
    fetchLiveDatabaseData();
    const interval = setInterval(() => {
      fetchLiveDatabaseData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const [pmList, setPmList] = useState([]);
  const [ssList, setSsList] = useState([]);
  const [smList, setSmList] = useState([]);
  const [tmList, setTmList] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [counsellings, setCounsellings] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [tiAssessments, setTiAssessments] = useState([]);
  const [resolvedUserId, setResolvedUserId] = useState(user?.userId || null);
  const [isExamAssigned, setIsExamAssigned] = useState(false);

  // Search/Sort/Filter inputs
  const [selectedReportUserId, setSelectedReportUserId] = useState(null);
  const [selectedSM, setSelectedSM] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stSearch, setStSearch] = useState("");
  const [stCatFilter, setStCatFilter] = useState("All");

  const [userSearch, setUserSearch] = useState("");
  const [userStationFilter, setUserStationFilter] = useState("All");
  const [userDesignationFilter, setUserDesignationFilter] = useState("All");
  const [userCategoryFilter, setUserCategoryFilter] = useState("All");
  const [userRiskFilter, setUserRiskFilter] = useState("All");

  const [editingUser, setEditingUser] = useState(null);
  const [transferringUser, setTransferringUser] = useState(null);

  const [reviewTab, setReviewTab] = useState("Pending");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewStation, setReviewStation] = useState("All");
  const [selectedPmId, setSelectedPmId] = useState(null);
  const [editSections, setEditSections] = useState({});
  const [tiRemarks, setTiRemarks] = useState({});
  const [showAudit, setShowAudit] = useState({});
  const [rejectMode, setRejectMode] = useState({});

  // Assessment Forms
  const [smForms, setSmForms] = useState({});
  const [smLocked, setSmLocked] = useState({});
  const [activeSmId, setActiveSmId] = useState(null);

  const [tmForms, setTmForms] = useState({});
  const [tmLocked, setTmLocked] = useState({});
  const [activeTmId, setActiveTmId] = useState(null);

  const [ssForms, setSsForms] = useState({});
  const [ssLocked, setSsLocked] = useState({});
  const [activeSsId, setActiveSsId] = useState(null);

  const [assessRole, setAssessRole] = useState(null);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterStation, setRosterStation] = useState("All");
  const [rosterStatus, setRosterStatus] = useState("All");
  const [rosterDate, setRosterDate] = useState("");
  const [allDbAssessments, setAllDbAssessments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedHrmsIds, setSelectedHrmsIds] = useState([]);
  const [viewUpcomingOnly, setViewUpcomingOnly] = useState(false);

  const [repApplied, setRepApplied] = useState(false);

  // Report filters
  const [rpStation, setRpStation] = useState("All");
  const [rpCat, setRpCat] = useState("All");
  const [rpRisk, setRpRisk] = useState("All");
  const [rpSearch, setRpSearch] = useState("");
  const [rpSort, setRpSort] = useState("date-desc");

  // Inspections / Counselling forms
  const [showInspForm, setShowInspForm] = useState(false);
  const [newInsp, setNewInsp] = useState({ station: "Parbhani Junction", officer: "TI R. Khan", observations: "", risk: "Low" });
  const [showCounForm, setShowCounForm] = useState(false);
  const [newCoun, setNewCoun] = useState({ staffName: "", designation: "Pointsman Grade I", station: "Parbhani Junction", topics: "", duration: "30 mins", progress: "Under Monitor" });

  const [dbStationFilter, setDbStationFilter] = useState("All");
  const [dbSearchQuery, setDbSearchQuery] = useState("");

  const [fsSearch, setFsSearch] = useState("");
  const [fsCatFilter, setFsCatFilter] = useState("All");
  const [fsRiskFilter, setFsRiskFilter] = useState("All");

  // Role roster filter (used in Personnel pages)
  const [roleF, setRoleF] = useState({ name: "", station: "All", ti: "All", cat: "All", risk: "All" });

  // Reports page filter object
  const [repF, setRepF] = useState({ search: "", role: "All", station: "All", cat: "All", risk: "All", sort: "score-desc" });

  // Fullscreen Analytics chart state
  const [fullscreenChart, setFullscreenChart] = useState(null);

  // MCQ Quiz Attempts
  const [quizState, setQuizState] = useState("idle");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState(Array(25).fill(null));
  const [latestQuizScore, setLatestQuizScore] = useState(null);

  // High Fidelity Zoom Modals
  const [isChartZoomModalOpen, setIsChartZoomModalOpen] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState("progress");
  const [zoomPopupSearch, setZoomPopupSearch] = useState("");
  const [zoomPopupZone, setZoomPopupZone] = useState("All");
  const [zoomPopupDivision, setZoomPopupDivision] = useState("All");
  const [zoomPopupStationName, setZoomPopupStationName] = useState("All");
  const [zoomPopupStationCode, setZoomPopupStationCode] = useState("All");
  const [zoomPopupCategory, setZoomPopupCategory] = useState("All");
  const [zoomPopupRisk, setZoomPopupRisk] = useState("All");
  const [zoomPopupStatus, setZoomPopupStatus] = useState("All");
  const [zoomPopupStartDate, setZoomPopupStartDate] = useState("");
  const [zoomPopupEndDate, setZoomPopupEndDate] = useState("");
  const [zoomPopupPage, setZoomPopupPage] = useState(1);

  // Sync exam assigned status removed (handled purely by Supabase data now)

  const tiName = user?.name || "R. Khan";
  const tiId = user?.hrmsId || "TI_1001";

  // Reactive memo filters
  const myStations = useMemo(() => {
    return stations;
  }, [stations]);

  const myUsers = useMemo(() => {
    return users.filter(u => myStations.some(st => st.name === u.station));
  }, [users, myStations]);

  const myPmList = useMemo(() => {
    return pmList.filter(p => myStations.some(st => st.name === p.station));
  }, [pmList, myStations]);

  const mySmList = useMemo(() => {
    return smList.filter(s => myStations.some(st => st.name === s.station));
  }, [smList, myStations]);

  const myTmList = useMemo(() => {
    return tmList.filter(t => myStations.some(st => st.name === t.station));
  }, [tmList, myStations]);

  const totalPM = myUsers.filter(u => u.role === "Pointsman").length;
  const totalSMs = myUsers.filter(u => u.role === "Station Master").length;
  const pending = myPmList.filter(p => p.status === "Pending").length;
  const highRiskAll = myUsers.filter(u => u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50).length;
  const avgScoreAll = myUsers.length ? Math.round(myUsers.reduce((sum, u) => sum + (u.score || 0), 0) / myUsers.length) : 0;

  const stationStats = useMemo(() => {
    return myStations.map(st => {
      const stUsers = users.filter(u => u.station === st.name);
      const avg = stUsers.length ? Math.round(stUsers.reduce((s, u) => s + u.score, 0) / stUsers.length) : st.avgScore;
      const riskCount = stUsers.filter(u => u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50).length;
      return {
        ...st,
        avgScore: avg,
        highRisk: riskCount,
        safetyPct: Math.max(50, Math.min(100, 100 - (riskCount * 12)))
      };
    });
  }, [myStations, users]);

  const bestSt = [...stationStats].sort((a, b) => b.avgScore - a.avgScore)[0];
  const worstSt = [...stationStats].sort((a, b) => a.avgScore - b.avgScore)[0];
  const highRiskSt = [...stationStats].sort((a, b) => b.highRisk - a.highRisk)[0];

  const filteredStations = useMemo(() => {
    return stationStats.filter(st => {
      const matchesSearch = st.name.toLowerCase().includes(dbSearchQuery.toLowerCase()) || st.code.toLowerCase().includes(dbSearchQuery.toLowerCase());
      const matchesFilter = dbStationFilter === "All" || st.name === dbStationFilter;
      return matchesSearch && matchesFilter;
    });
  }, [stationStats, dbSearchQuery, dbStationFilter]);

  const stBarData = filteredStations.map(st => ({
    name: st.code, nameFull: st.name, avgScore: st.avgScore, safetyPct: st.safetyPct, highRisk: st.highRisk
  }));

  const pieData = useMemo(() => {
    const c = { A: 0, B: 0, C: 0, D: 0 };
    myUsers.forEach(u => {
      const cat = u.cat || getCat(u.score);
      if (c[cat] !== undefined) c[cat]++;
    });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [myUsers]);

  const myStationsProgress = useMemo(() => {
    return myStations.map(st => {
      const pmCompleted = myPmList.filter(p => p.station === st.name && p.status === "Approved").length;
      const pmPending = myPmList.filter(p => p.station === st.name && p.status === "Pending").length;
      const smCompleted = mySmList.filter(s => s.station === st.name && (s.status === "Submitted" || s.status === "Approved")).length;
      const smPending = mySmList.filter(s => s.station === st.name && s.status === "Pending").length;
      const ssCompleted = ssList.filter(s => s.station === st.name && (s.status === "Submitted" || s.status === "Approved")).length;
      const ssPending = ssList.filter(s => s.station === st.name && s.status === "Pending").length;
      const tmCompleted = myTmList.filter(t => t.station === st.name && (t.status === "Submitted" || t.status === "Approved")).length;
      const tmPending = myTmList.filter(t => t.station === st.name && t.status === "Pending").length;

      return {
        name: st.code,
        completed: pmCompleted + smCompleted + ssCompleted + tmCompleted,
        pending: pmPending + smPending + ssPending + tmPending
      };
    });
  }, [myStations, myPmList, mySmList, ssList, myTmList]);

  const roleBarData = useMemo(() => {
    const pmCount = myUsers.filter(u => u.role === "Pointsman").length;
    const smCount = myUsers.filter(u => u.role === "Station Master").length;
    const ssCount = myUsers.filter(u => u.role === "Station Superintendent").length;
    const tmCount = myUsers.filter(u => u.role === "Train Manager").length;
    return [
      { role: "Pointsmen", count: pmCount },
      { role: "Station Masters", count: smCount },
      { role: "Station Superintendents", count: ssCount },
      { role: "Train Managers", count: tmCount }
    ];
  }, [myUsers]);

  const myCompliance = useMemo(() => {
    const overallSafetyPct = myStations.length ? Math.round(stationStats.reduce((s, st) => s + st.safetyPct, 0) / myStations.length) : 0;
    const pmeFitCount = myUsers.filter(u => u.pmeStatus === "Fit").length;
    const pmeCompletionRate = myUsers.length ? Math.round((pmeFitCount / myUsers.length) * 100) : 0;
    const refClearedCount = myUsers.filter(u => u.refStatus === "Cleared").length;
    const refCompletionRate = myUsers.length ? Math.round((refClearedCount / myUsers.length) * 100) : 0;

    return [
      { label: "Overall Safety Compliance", pct: overallSafetyPct, color: "#16a34a" },
      { label: "PME Completion Rate", pct: pmeCompletionRate, color: "#2563eb" },
      { label: "REF Completion Rate", pct: refCompletionRate, color: "#7c3aed" },
      { label: "Incident Reporting Compliance", pct: 92, color: "#0891b2" },
      { label: "Disciplinary Clean Record", pct: 96, color: "#16a34a" }
    ];
  }, [myStations, stationStats, myUsers]);

  const topStations = useMemo(() => [...stationStats].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5), [stationStats]);
  const bottomStations = useMemo(() => [...stationStats].sort((a, b) => a.avgScore - b.avgScore).slice(0, 5), [stationStats]);

  const myPipeline = useMemo(() => {
    const approvedCount = myUsers.filter(u => u.status === "Approved").length;
    const pendingCount = myUsers.filter(u => u.status === "Pending" || u.status === "Submitted").length;
    const rejectedCount = myUsers.filter(u => u.status === "Rejected").length;
    const overdueCount = myUsers.filter(u => u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.status === "Overdue").length;
    
    const pendingFirstCount = myUsers.filter(u => u.status === "Pending First Assessment" || u.totalAssessments === 0).length;
    const notAttemptedCount = myUsers.filter(u => u.totalAssessments === 0).length;
    const dueCount = myUsers.filter(u => u.status === "Pending" || u.status === "Overdue" || u.pmeStatus === "Due" || u.refStatus === "Due").length;

    return [
      { label: "Approved", count: approvedCount, dot: "#1E3A5F" },
      { label: "Pending", count: pendingCount, dot: "#4A90D9" },
      { label: "Rejected", count: rejectedCount, dot: "#B83A3A" },
      { label: "Overdue", count: overdueCount, dot: "#5A6B7C" },
      { label: "Pending First Assessment", count: pendingFirstCount, dot: "#D69E2E" },
      { label: "Not Attempted", count: notAttemptedCount, dot: "#64748b" },
      { label: "Assessment Due", count: dueCount, dot: "#ca8a04" }
    ];
  }, [myUsers]);

  const myAssessmentMonthly = useMemo(() => {
    return MONTHLY.map(m => {
      const scale = myStations.length / 12.0;
      return {
        month: m.month,
        approved: Math.round(m.assessments * scale * 0.8),
        pending: Math.round(m.assessments * scale * 0.15),
        rejected: Math.round(m.assessments * scale * 0.04),
        overdue: Math.round(m.assessments * scale * 0.01)
      };
    });
  }, [myStations]);

  // Fullscreen view filters
  const filteredFsStations = useMemo(() => {
    return stationStats.filter(st => {
      const q = fsSearch.toLowerCase();
      const matchesSearch = st.name.toLowerCase().includes(q) || st.code.toLowerCase().includes(q);
      const grade = getCat(st.avgScore);
      const matchesCat = fsCatFilter === "All" || grade === fsCatFilter;
      const riskLevel = st.highRisk >= 2 ? "High" : st.highRisk > 0 ? "Medium" : "Low";
      const matchesRisk = fsRiskFilter === "All" || riskLevel === fsRiskFilter;
      return matchesSearch && matchesCat && matchesRisk;
    });
  }, [stationStats, fsSearch, fsCatFilter, fsRiskFilter]);

  const fsStBarData = useMemo(() => {
    return filteredFsStations.map(st => ({
      name: st.code, nameFull: st.name, avgScore: st.avgScore, safetyPct: st.safetyPct, highRisk: st.highRisk
    }));
  }, [filteredFsStations]);

  const filteredFsUsers = useMemo(() => {
    return users.filter(u => {
      if (u.role !== "Pointsman") return false;
      const q = fsSearch.toLowerCase();
      const matchesSearch = u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
      const grade = getCat(u.score);
      const matchesCat = fsCatFilter === "All" || grade === fsCatFilter;
      const risk = u.risk || (grade === "D" ? "High" : grade === "C" ? "Medium" : "Low");
      const matchesRisk = fsRiskFilter === "All" || risk === fsRiskFilter;
      return matchesSearch && matchesCat && matchesRisk;
    });
  }, [users, fsSearch, fsCatFilter, fsRiskFilter]);

  const fsPieData = useMemo(() => {
    const c = { A: 0, B: 0, C: 0, D: 0 };
    filteredFsUsers.forEach(u => { c[getCat(u.score)]++; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [filteredFsUsers]);

  const filteredPM = useMemo(() => {
    return pmList.filter(p => {
      const st = p.status === reviewTab;
      const s = !reviewSearch || p.pointsmanName.toLowerCase().includes(reviewSearch.toLowerCase()) || p.hrmsId.toLowerCase().includes(reviewSearch.toLowerCase());
      const r = reviewStation === "All" || p.station === reviewStation;
      return st && s && r;
    });
  }, [pmList, reviewTab, reviewSearch, reviewStation]);

  const selectedPM = pmList.find(p => p.id === selectedPmId) || null;

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const isRoleMatch =
        activePage === "pointsmen" ? u.role === "Pointsman" :
          activePage === "stationMasters" ? u.role === "Station Master" :
            activePage === "stationSuperintendents" ? u.role === "Station Superintendent" :
              activePage === "trainManagers" ? u.role === "Train Manager" : true;
      if (!isRoleMatch) return false;

      const q = userSearch.toLowerCase();
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
      const matchesStation = userStationFilter === "All" || u.station === userStationFilter;
      const matchesCategory = userCategoryFilter === "All" || (u.cat || getCat(u.score)) === userCategoryFilter;
      const grade = u.cat || getCat(u.score);
      const isHighRisk = u.risk === "High" || grade === "D";
      const matchesRisk = userRiskFilter === "All" || (userRiskFilter === "High" && isHighRisk) || (userRiskFilter === "Non-High" && !isHighRisk);

      return matchesSearch && matchesStation && matchesCategory && matchesRisk;
    });
  }, [users, userSearch, userStationFilter, userCategoryFilter, userRiskFilter, activePage]);

  const filteredReport = useMemo(() => {
    let list = users.map(u => {
      const grade = u.cat || getCat(u.score);
      return {
        name: u.name, hrmsId: u.id, station: u.station, score: u.score,
        cat: grade,
        risk: u.risk || (grade === "D" ? "High" : grade === "C" ? "Medium" : "Low"),
        date: u.lastAssessDate
      };
    });
    list = list.filter(r => {
      const q = rpSearch.toLowerCase();
      const srch = !q || r.name.toLowerCase().includes(q) || r.station.toLowerCase().includes(q);
      const st = rpStation === "All" || r.station === rpStation;
      const cat = rpCat === "All" || r.cat === rpCat;
      const risk = rpRisk === "All" || r.risk === rpRisk;
      return srch && st && cat && risk;
    });
    if (rpSort === "score-desc") list = [...list].sort((a, b) => b.score - a.score);
    if (rpSort === "score-asc") list = [...list].sort((a, b) => a.score - b.score);
    return list;
  }, [users, rpSearch, rpStation, rpCat, rpRisk, rpSort]);

  // Floating helper actions
  const triggerNotification = (type, message) => {
    setNotifications(prev => [{ id: Date.now(), type, message, time: "Just now", read: false }, ...prev]);
  };

  const addAuditLog = (event, details) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setAuditLogs(prev => [{ id: Date.now(), timestamp, event, details }, ...prev]);
  };

  const exportAlert = (format, filename) => {
    alert(`✓ EXPORT COMPLETE: Dataset "${filename}" exported successfully in ${format} format to your local downloads directory.`);
    addAuditLog("Report Exported", `File: ${filename}.${format.toLowerCase()}`);
    triggerNotification("success", `Report "${filename}" exported safely.`);
  };

  // Station level Detail card mapping
  useEffect(() => {
    if (selectedStation) {
      setView(prev => {
        if (prev && prev.type !== "stationDetail") {
          return prev;
        }
        const matched = stationStats.find(s => s.name === selectedStation.name || s.code === selectedStation.code) || selectedStation;
        const smCount = users.filter(u => u.station === matched.name && (u.role === "Station Master" || u.role === "sm")).length;
        const pmCount = users.filter(u => u.station === matched.name && (u.role === "Pointsman" || u.role === "pointsmen")).length;
        const pmPending = myPmList.filter(p => p.station === matched.name && p.status === "Pending").length;
        const smPending = mySmList.filter(s => s.station === matched.name && s.status === "Pending").length;
        const tmPending = myTmList.filter(t => t.station === matched.name && t.status === "Pending").length;
        const pendingCount = pmPending + smPending + tmPending;

        return {
          type: "stationDetail",
          data: {
            ...matched, ti: matched.ti || "Not Assigned", smCount, pmCount,
            score: matched.avgScore || matched.score,
            safety: matched.safetyPct || matched.safety,
            highRisk: matched.highRisk, pending: pendingCount
          }
        };
      });
    } else {
      setView(prev => {
        if (prev && prev.type === "stationDetail") {
          return null;
        }
        return prev;
      });
    }
  }, [selectedStation, stationStats, users, myPmList, mySmList, myTmList, tiName]);

  const handleChartClick = (state, chartType) => {
    let clickedStationName = "";
    if (state && state.activeLabel) {
      const matched = stationStats.find(st => st.code === state.activeLabel);
      if (matched) clickedStationName = matched.name;
    }
    if (clickedStationName) {
      setZoomPopupSearch(clickedStationName);
    } else {
      setZoomPopupSearch("");
    }
    setSelectedChartType(chartType);
    setIsChartZoomModalOpen(true);
    setZoomPopupPage(1);
  };

  const handlePieClick = (data) => {
    if (data && data.name) {
      const catLetter = data.name.replace("Category ", "").trim();
      setZoomPopupCategory(catLetter);
    } else {
      setZoomPopupCategory("All");
    }
    setSelectedChartType("category");
    setIsChartZoomModalOpen(true);
    setZoomPopupPage(1);
  };

  const handleResetPopupFilters = () => {
    setZoomPopupSearch("");
    setZoomPopupZone("All");
    setZoomPopupDivision("All");
    setZoomPopupStationName("All");
    setZoomPopupStationCode("All");
    setZoomPopupCategory("All");
    setZoomPopupRisk("All");
    setZoomPopupStatus("All");
    setZoomPopupStartDate("");
    setZoomPopupEndDate("");
    setZoomPopupPage(1);
  };

  // Nav helper
  const goTo = pg => {
    setActivePage(pg);
    setStatusMsg("");
    setSelectedPmId(null);
    setActiveSmId(null);
    setActiveSsId(null);
    setActiveTmId(null);
    setAssessRole(null);
    setSelectedStation(null);
    setSelectedReportUserId(null);
    setRepApplied(false);
    setBellDropdownOpen(false);
    setView(null);
  };

  const handleOpenEditStation = (station) => {
    setStationModalMode("edit");
    setEditingStationId(station.id);
    setNewStationData({
      stationName: station.name || station.stationName || "",
      stationCode: station.code || station.stationCode || "",
      division: station.division || "Nagpur",
      category: station.category || "A",
      status: station.status || "Active",
      platforms: String(station.platforms || "3"),
      runningLines: String(station.runningLines || "5"),
      address: station.address || "",
      district: station.district || "Nagpur",
      state: station.state || "Maharashtra",
      stationType: station.stationType || "Junction"
    });
    setStationFormErrors({});
    setShowAddStationModal(true);
  };

  const handleOpenAddStation = () => {
    setStationModalMode("add");
    setEditingStationId(null);
    setNewStationData(defaultStationForm);
    setStationFormErrors({});
    setShowAddStationModal(true);
  };

  const handleDeleteStation = async (stationId, stationName) => {
    if (!window.confirm(`Are you sure you want to permanently delete station ${stationName}?`)) {
      return;
    }

    const assignedStaff = users.filter((u) => u.station === stationName);
    if (assignedStaff.length > 0) {
      const staffNames = assignedStaff.map(u => `${u.name} (${u.id})`).join(", ");
      alert(`Cannot delete station. Operational staff are currently assigned to this station: ${staffNames}. Please reassign or delete these staff members first.`);
      return;
    }

    try {
      await saDataService.deleteStation(stationId, stationName);
      await fetchLiveDatabaseData();
      addAuditLog("Deleted Station", `Station: ${stationName}`);
      triggerNotification("danger", `Station ${stationName} deleted.`);
    } catch (err) {
      alert("Error deleting station: " + err.message);
    }
  };

  const handleAddStationSubmit = async (e) => {
    e.preventDefault();

    // Validate fields
    const errors = {};
    const cleanName = newStationData.stationName.trim();
    const cleanCode = newStationData.stationCode.trim().toUpperCase();

    const nameExists = stations.some(
      (st) => (st.name || st.stationName || "").toLowerCase() === cleanName.toLowerCase() && st.id !== editingStationId
    );
    const codeExists = stations.some(
      (st) => (st.code || st.stationCode || "").toUpperCase() === cleanCode && st.id !== editingStationId
    );

    if (!cleanName) {
      errors.stationName = "Station Name is required";
    } else if (nameExists) {
      errors.stationName = "Station Name must be unique";
    }

    if (!cleanCode) {
      errors.stationCode = "Station Code is required";
    } else if (codeExists) {
      errors.stationCode = "Station Code must be unique";
    }

    if (!newStationData.platforms) errors.platforms = "Platforms count is required";
    if (!newStationData.runningLines) errors.runningLines = "Running Lines count is required";
    if (!newStationData.address.trim()) errors.address = "Address is required";
    if (!newStationData.district.trim()) errors.district = "District is required";
    if (!newStationData.state.trim()) errors.state = "State is required";

    if (Object.keys(errors).length > 0) {
      setStationFormErrors(errors);
      return;
    }

    const newSt = {
      id: editingStationId,
      stationName: cleanName,
      stationCode: cleanCode,
      division: "Nagpur",
      zone: "",
      category: newStationData.category || "A",
      platforms: Number(newStationData.platforms),
      runningLines: Number(newStationData.runningLines),
      stationType: newStationData.stationType || "Junction",
      status: newStationData.status || "Active",
      address: newStationData.address.trim(),
      district: newStationData.district.trim(),
      state: newStationData.state.trim(),
      section: "",
      assignedTi: ""
    };

    try {
      await saDataService.saveStation(newSt, stationModalMode === "edit" ? "edit" : "add");
      await fetchLiveDatabaseData();
      if (stationModalMode === "edit") {
        addAuditLog("Updated Station Details", `Station: ${newSt.stationName} (${newSt.stationCode})`);
        triggerNotification("success", `Station ${newSt.stationName} details modified.`);
      } else {
        addAuditLog("Added New Station", `Station: ${newSt.stationName} (${newSt.stationCode})`);
        triggerNotification("success", `Station ${newSt.stationName} added to division.`);
      }
      setNewStationData(defaultStationForm);
      setStationFormErrors({});
      setShowAddStationModal(false);
    } catch (err) {
      alert("Error saving station: " + err.message);
    }
  };

  const openAddUserModal = (defaultRole) => {
    let initialRole = "Pointsman";
    if (defaultRole) {
      initialRole = defaultRole;
    } else if (activePage === "stationMasters") {
      initialRole = "Station Master";
    } else if (activePage === "stationSuperintendents") {
      initialRole = "Station Superintendent";
    } else if (activePage === "trainManagers") {
      initialRole = "Train Manager";
    } else if (activePage === "pointsmen") {
      initialRole = "Pointsman";
    }

    let initialDesignation = initialRole === "Pointsman" ? "Pointsman Grade I" : initialRole;
    const defaultStation = myStations[0]?.name || "";

    setNewUserData({
      id: "",
      name: "",
      role: initialRole,
      designation: initialDesignation,
      station: defaultStation,
      contact: "",
      joiningDate: new Date().toISOString().slice(0, 10),
      pmeStatus: "Fit",
      refStatus: "Cleared",
      reportingSm: initialRole === "Train Manager" ? "NGP-BSL Section" : "",
      shift: initialRole === "Train Manager" ? "Goods Train Beat" : "Morning Shift (06:00 - 14:00)",
      workLocation: initialRole === "Train Manager" ? "Nagpur Depot" : "Platform Area",
      smStation: defaultStation,
      smZone: "Central Railway",
      smDivision: "Nagpur",
      email: "",
      pfNumber: "",
      password: "",
      confirmPassword: ""
    });
    setShowAddUserModal(true);
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.id) {
      alert("Name and HRMS ID are required.");
      return;
    }
    if (!newUserData.pfNumber) {
      alert("PF Number is required.");
      return;
    }
    if (!newUserData.email) {
      alert("Email Address is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.email)) {
      alert("Please enter a valid Email Address.");
      return;
    }
    if (!newUserData.password) {
      alert("Password is required.");
      return;
    }
    if (newUserData.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    const catVal = newUserData.category || "Untested";

    const newUser = {
      ...newUserData,
      id: newUserData.id || `USER_${Date.now().toString().slice(-4)}`,
      score: 0,
      safetyScore: 0,
      cat: catVal,
      lastDate: new Date().toISOString().slice(0, 10)
    };
    try {
      await saDataService.saveUser(newUser, "add");
      await fetchLiveDatabaseData();
      addAuditLog("New User Created", `Staff ID: ${newUser.id}, Name: ${newUser.name}`);
      triggerNotification("success", `Account provisioned for ${newUser.name}.`);
      setShowAddUserModal(false);
    } catch (err) {
      alert("Error adding user: " + err.message);
    }
  };

  const handleEditUser = (userRec) => {
    setEditingUser({
      ...userRec,
      pfNumber: userRec.pfNumber && userRec.pfNumber !== "—" ? userRec.pfNumber : "",
      email: userRec.email && userRec.email !== "—" ? userRec.email : ""
    });
  };

  const saveEditedUser = async (e) => {
    e.preventDefault();
    if (!editingUser.name) {
      alert("Name is required.");
      return;
    }
    if (!editingUser.pfNumber) {
      alert("PF Number is required.");
      return;
    }
    if (!editingUser.email) {
      alert("Email Address is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingUser.email)) {
      alert("Please enter a valid Email Address.");
      return;
    }

    try {
      await saDataService.saveUser(editingUser, "edit");
      await fetchLiveDatabaseData();
      addAuditLog("User Profile Modified", `Staff ID: ${editingUser.id}, Name: ${editingUser.name}`);
      triggerNotification("success", `Profile updated for ${editingUser.name}.`);
      setEditingUser(null);
      setStatusMsg("User profile updated successfully.");
    } catch (err) {
      alert("Error updating user: " + err.message);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you absolutely sure you want to revoke operational access for ${userName} (${userId})?`)) {
      try {
        await saDataService.removeUser(userId);
        await fetchLiveDatabaseData();
        addAuditLog("Revoked User Access", `Staff ID: ${userId}, Name: ${userName}`);
        triggerNotification("danger", `Revoked access: ${userName} (${userId}).`);
        setStatusMsg(`Revoked evaluation and access clearance for ${userName}.`);
      } catch (err) {
        alert("Error removing user: " + err.message);
      }
    }
  };

  const handleTransferClick = (userRec) => {
    setTransferringUser({ ...userRec, targetStation: userRec.station });
  };

  const confirmTransfer = async () => {
    try {
      const updatedUser = { ...transferringUser, station: transferringUser.targetStation };
      await saDataService.saveUser(updatedUser, "edit");
      await fetchLiveDatabaseData();
      addAuditLog("Staff Station Transfer", `Staff: ${transferringUser.name} moved from ${transferringUser.station} to ${transferringUser.targetStation}`);
      triggerNotification("warning", `Transferred ${transferringUser.name} to ${transferringUser.targetStation}.`);
      setStatusMsg(`Operational deployment of ${transferringUser.name} transferred to ${transferringUser.targetStation}.`);
      setTransferringUser(null);
    } catch (err) {
      alert("Error transferring user: " + err.message);
    }
  };

  /* ── PM Review Actions ── */
  const openPmReview = id => {
    const rec = pmList.find(p => p.id === id);
    if (!rec) return;
    setSelectedPmId(id);
    setEditSections(prev => ({ ...prev, [id]: rec.originalSections.map(s => ({ ...s })) }));
    setTiRemarks(prev => ({ ...prev, [id]: rec.tiRemarks || "" }));
    setRejectMode(prev => ({ ...prev, [id]: false }));
  };

  const updateSec = (id, idx, val) => {
    setEditSections(prev => {
      const arr = [...prev[id]]; arr[idx] = { ...arr[idx], score: Math.max(0, Math.min(arr[idx].max, Number(val) || 0)) };
      return { ...prev, [id]: arr };
    });
  };

  const finalizePM = async (id, mode, rejectNote = "") => {
    try {
      const newStatus = mode === "reject" ? "Rejected" : "Approved";

      let approvedByUuid = user.userId;
      if (!approvedByUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(approvedByUuid)) {
        const tiHrms = user.hrmsId || user.hrms_id;
        if (tiHrms) {
          const { data: tiData } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", tiHrms)
            .single();
          if (tiData?.user_id) {
            approvedByUuid = tiData.user_id;
          }
        }
      }

      const { error: updateError } = await supabase
        .from("ASSESSMENT")
        .update({ status: newStatus })
        .eq("assessment_id", id);
      if (updateError) throw updateError;

      const { data: currentApproval } = await supabase
        .from("APPROVAL")
        .select("approval_id")
        .eq("assessment_id", id)
        .maybeSingle();

      if (currentApproval) {
        await supabase
          .from("APPROVAL")
          .update({
            approved_by: approvedByUuid,
            approval_date: new Date().toISOString(),
            remarks: mode === "reject" ? rejectNote : (tiRemarks[id] || "Approved by TI")
          })
          .eq("approval_id", currentApproval.approval_id);
      } else {
        await supabase
          .from("APPROVAL")
          .insert([{
            assessment_id: id,
            approved_by: approvedByUuid,
            approval_level: "Traffic Inspector",
            remarks: mode === "reject" ? rejectNote : (tiRemarks[id] || "Approved by TI")
          }]);
      }

      const targetAssess = pmList.find(p => p.id === id);

      if (mode !== "reject") {
        const secs = editSections[id] || targetAssess.originalSections;
        const total = secs.reduce((s, x) => s + x.score, 0);

        // Fetch existing attempt to check if SM marked as Category D (Alcoholic)
        let finalCat = getCat(total);
        try {
          const { data: existingAttempt } = await supabase
            .from("TEST_ATTEMPT")
            .select("category")
            .eq("assessment_id", id)
            .maybeSingle();
          if (existingAttempt?.category === "D") {
            finalCat = "D";
          }
        } catch (catErr) {
          console.error("Error reading existing attempt category:", catErr);
        }

        await supabase
          .from("TEST_ATTEMPT")
          .update({
            total_marks: 100,
            obtained_marks: total,
            percentage: total,
            category: finalCat
          })
          .eq("assessment_id", id);

        if (targetAssess?.hrmsId) {
          const emp = users.find(u => u.hrmsId === targetAssess.hrmsId);
          if (emp?.user_id) {
            await supabase
              .from("EMPLOYEE_PROFILE")
              .update({
                current_score: total,
                category: finalCat
              })
              .eq("user_id", emp.user_id);
          }
        }

        // Auto schedule next assessment for Category A, B, C
        if (finalCat === "A" || finalCat === "B" || finalCat === "C") {
          try {
            const monthsToAdd = finalCat === "C" ? 3 : 6;
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
            const nextDateStr = nextDate.toISOString().split('T')[0];

            const emp = users.find(u => u.hrmsId === targetAssess.hrmsId);
            if (emp?.user_id) {
              let condBy = user.userId;
              if (!condBy || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(condBy)) {
                const tiHrms = user.hrmsId || user.hrms_id;
                if (tiHrms) {
                  const { data: tiData } = await supabase
                    .from("USERS")
                    .select("user_id")
                    .eq("hrms_id", tiHrms)
                    .single();
                  if (tiData?.user_id) {
                    condBy = tiData.user_id;
                  }
                }
              }

              // Check if there is already an upcoming scheduled/locked/available assessment to avoid duplicates
              const { data: upcomingAssess } = await supabase
                .from("ASSESSMENT")
                .select("assessment_id")
                .eq("employee_id", emp.user_id)
                .in("status", ["LOCKED", "AVAILABLE", "IN_PROGRESS", "Pending", "Scheduled"])
                .order("created_at", { ascending: false })
                .limit(1);

              if (!upcomingAssess || upcomingAssess.length === 0) {
                await supabase.from("ASSESSMENT").insert([{
                  employee_id: emp.user_id,
                  conducted_by: condBy || emp.user_id,
                  assessment_type: "Checklist Evaluation",
                  due_date: nextDateStr,
                  status: "LOCKED"
                }]);
              }
            }
          } catch (schedErr) {
            console.error("Failed to automatically schedule next assessment for Cat A/B/C:", schedErr);
          }
        }

        // Trigger Category D protocol if finalized score is Category D
        if (total < 50 || getCat(total) === 'D') {
          try {
            const { data: aData } = await supabase
              .from("ASSESSMENT")
              .select("conducted_by, employee_id")
              .eq("assessment_id", id)
              .single();
            let condBy = aData?.conducted_by || user.userId;
            if (!condBy || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(condBy)) {
              const tiHrms = user.hrmsId || user.hrms_id;
              if (tiHrms) {
                const { data: tiData } = await supabase
                  .from("USERS")
                  .select("user_id")
                  .eq("hrms_id", tiHrms)
                  .single();
                if (tiData?.user_id) {
                  condBy = tiData.user_id;
                }
              }
            }
            const empId = aData?.employee_id || targetAssess?.hrmsId;
            await assessmentService.triggerCategoryDProtocol(empId, id, total, 'D', condBy);
          } catch (dErr) {
            console.error("Failed to trigger Category D protocol during TI PM finalize:", dErr);
          }
        }
      }

      setSelectedPmId(null);
      setStatusMsg(mode === "reject" ? "Assessment rejected. SM has been notified." : `Assessment approved successfully.`);
      addAuditLog(mode === "reject" ? "Rejected PM Assessment" : "Approved PM Assessment", `Staff ID: ${targetAssess?.hrmsId || ""}, Score: ${mode === "reject" ? "-" : targetAssess?.finalScore}`);
      triggerNotification("success", `Reviewed PM Assessment for ${targetAssess?.pointsmanName || ""}.`);
      setReviewTab(mode === "reject" ? "Rejected" : "Approved");
      await fetchLiveDatabaseData();
    } catch (err) {
      console.error("Error finalizing PM assessment:", err);
      setStatusMsg("Failed to finalize assessment in database.");
    }
  };

  /* ── SM Form ── */
  const openSMForm = (id, forceUnlock = false) => {
    setActiveSmId(id);
    const smAssess = smList.find(s => s.id === id);
    setSmLocked(prev => ({
      ...prev,
      [id]: forceUnlock ? false : (smAssess ? smAssess.status === "Submitted" : false)
    }));
    setSmForms(prev => {
      const existing = prev[id] || defaultSMForm();
      if (smAssess && smAssess.examScore !== undefined && smAssess.examScore !== null) {
        const finalExamScore = smAssess.examScore > 25 ? Math.round(smAssess.examScore / 4) : smAssess.examScore;
        return {
          ...prev,
          [id]: {
            ...existing,
            knowledgeMarks: finalExamScore.toString()
          }
        };
      }
      return {
        ...prev,
        [id]: existing
      };
    });
  };

  const handleSendExamAccess = async (id) => {
    const sm = smList.find(s => s.id === id);
    // Set localStorage flags so SM portal detects activation immediately
    if (sm?.hrmsId) {
      localStorage.setItem(`sm_test_activated_${sm.hrmsId}`, "true");
      localStorage.setItem(`sm_test_activated_time_${sm.hrmsId}`, Date.now().toString());
      localStorage.setItem(`sm_test_assigned_${sm.hrmsId}`, "Assigned");
      localStorage.removeItem(`sm_mcq_test_${sm.hrmsId}`);
      window.dispatchEvent(new Event("storage"));

      // Also update or insert in Supabase
      if (isSupabaseConfigured) {
        try {
          let conductedByUuid = resolvedUserId;
          if (!conductedByUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conductedByUuid)) {
            const tiHrms = user.hrmsId || user.hrms_id;
            if (tiHrms) {
              const { data: tiData } = await supabase
                .from("USERS")
                .select("user_id")
                .eq("hrms_id", tiHrms)
                .single();
              if (tiData?.user_id) {
                conductedByUuid = tiData.user_id;
                setResolvedUserId(conductedByUuid);
              }
            }
          }
          if (!conductedByUuid) conductedByUuid = id;

          const { data: existingAssess } = await supabase
            .from("ASSESSMENT")
            .select("*")
            .eq("employee_id", id)
            .in("status", ["LOCKED", "Draft", "Scheduled", "AVAILABLE", "IN_PROGRESS"])
            .order("created_at", { ascending: false })
            .limit(1);

          if (existingAssess && existingAssess.length > 0) {
            await supabase
              .from("ASSESSMENT")
              .update({ status: "AVAILABLE", conducted_by: conductedByUuid })
              .eq("assessment_id", existingAssess[0].assessment_id);
          } else {
            await supabase
              .from("ASSESSMENT")
              .insert([{
                employee_id: id,
                conducted_by: conductedByUuid,
                assessment_type: "Station Master Assessment",
                status: "AVAILABLE",
                assessment_date: new Date().toISOString().slice(0, 10)
              }]);
          }
        } catch (dbErr) {
          console.error("Failed to update database assessment status to AVAILABLE:", dbErr);
        }
      }
    }
    setSmList(prev => prev.map(s => s.id === id ? { ...s, status: "Exam Sent" } : s));
    window.alert("test is been send");
    setStatusMsg("test is been send");
    addAuditLog("Sent Exam Access", `Exam activated for SM: ${sm?.name} (${sm?.hrmsId})`);
    triggerNotification("success", `Exam unlocked for SM ${sm?.name}. They must complete 25 MCQ questions.`);
  };

  const toggleSMYN = (id, key, idx, val) => {
    if (smLocked[id]) return;
    setSmForms(p => ({
      ...p,
      [id]: {
        ...(p[id] || defaultSMForm()),
        [key]: (p[id]?.[key] || Array(5).fill(null)).map((v, i) => i === idx ? (v === val ? null : val) : v)
      }
    }));
  };

  const setSMField = (id, key, val) => {
    if (smLocked[id]) return;
    setSmForms(p => ({ ...p, [id]: { ...(p[id] || defaultSMForm()), [key]: val } }));
  };

  const submitSMAssessment = async (id, knowledgeMarksOverride) => {
    const f = smForms[id];
    if (!f?.alcoholicStatus) { setStatusMsg("Alcoholic/Non-Alcoholic status is mandatory."); return; }

    // Validate all 6 TI sections are fully answered
    const unanswered = TI_SM_CRITERIA.filter(sec =>
      !(f[sec.key] && f[sec.key].length === sec.count && f[sec.key].every(v => v === "Yes" || v === "No"))
    ).map(sec => sec.label);
    if (unanswered.length > 0) {
      setStatusMsg(`Please answer all questions in: ${unanswered.join(", ")}`);
      return;
    }
    // Use the override if provided (prevents React state batching race condition)
    const fToSubmit = knowledgeMarksOverride !== undefined ? { ...f, knowledgeMarks: knowledgeMarksOverride } : f;
    const { total } = computeSMScore(fToSubmit, TI_SM_CRITERIA);

    const isAlcoholic = fToSubmit.alcoholicStatus === "Alcoholic";
    const cat = isAlcoholic ? "D" : getCat(total);
    let targetUser = users.find(u => u.id === id || u.user_id === id);
    if (!targetUser) {
      const { data: dbUser, error: dbErr } = await supabase
        .from("USERS")
        .select("user_id, hrms_id, full_name")
        .or(`user_id.eq.${id},hrms_id.eq.${id}`)
        .maybeSingle();
      if (!dbErr && dbUser) {
        targetUser = {
          user_id: dbUser.user_id,
          hrmsId: dbUser.hrms_id,
          name: dbUser.full_name
        };
      }
    }
    const resolvedEmployeeId = targetUser?.user_id || id;

    // Build sections breakdown for permanent audit record
    const sectionBreakdown = TI_SM_CRITERIA.map(sec => ({
      title: sec.label,
      marks: fToSubmit[sec.key]?.filter(v => v === "Yes").length * sec.weight || 0,
      outOf: sec.count * sec.weight
    }));

    try {
      // Identity Resolution & Defensive Validation
      let resolvedEmployeeId = targetUser?.user_id || id;
      if (resolvedEmployeeId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedEmployeeId)) {
        const { data: uData } = await supabase
          .from("USERS")
          .select("user_id")
          .eq("hrms_id", resolvedEmployeeId)
          .single();
        if (uData?.user_id) {
          resolvedEmployeeId = uData.user_id;
        } else {
          throw new Error(`Could not resolve UUID for Station Master HRMS ID: ${resolvedEmployeeId}`);
        }
      }

      let conductedByUuid = user.userId;
      if (!conductedByUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conductedByUuid)) {
        const tiHrms = user.hrmsId || user.hrms_id;
        if (tiHrms) {
          const { data: tiData } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", tiHrms)
            .single();
          if (tiData?.user_id) {
            conductedByUuid = tiData.user_id;
          }
        }
        if (!conductedByUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conductedByUuid)) {
          conductedByUuid = resolvedEmployeeId;
        }
      }

      const { data: existingAssess, error: findError } = await supabase
        .from("ASSESSMENT")
        .select("assessment_id")
        .eq("employee_id", resolvedEmployeeId)
        .eq("assessment_type", "Station Master Assessment")
        .neq("status", "Approved")
        .order("created_at", { ascending: false })
        .limit(1);

      let assessmentId;
      if (!findError && existingAssess && existingAssess.length > 0) {
        assessmentId = existingAssess[0].assessment_id;
      } else {
        const { data: newAssess, error: assessError } = await supabase
          .from("ASSESSMENT")
          .insert([{
            employee_id: resolvedEmployeeId,
            conducted_by: conductedByUuid,
            assessment_type: "Station Master Assessment",
            status: "IN_PROGRESS",
            assessment_date: new Date().toISOString()
          }])
          .select()
          .single();

        if (assessError) throw assessError;
        assessmentId = newAssess.assessment_id;
      }

      const { data: existingAttempt } = await supabase
        .from("TEST_ATTEMPT")
        .select("*")
        .eq("assessment_id", assessmentId)
        .maybeSingle();

      const newAnswers = {
        alcoholicStatus: fToSubmit.alcoholicStatus,
        pmeStatus: fToSubmit.pmeStatus,
        refStatus: fToSubmit.refStatus,
        counselling: fToSubmit.counselling,
        automaticTraining: fToSubmit.automaticTraining,
        remarks: fToSubmit.remarks,
        mcqScore: parseInt(fToSubmit.knowledgeMarks) || 0,
        sections: sectionBreakdown,
        knowledgeOfRules: fToSubmit.knowledgeOfRules,
        alertness: fToSubmit.alertness,
        safetyRecord: fToSubmit.safetyRecord,
        leadership: fToSubmit.leadership,
        discipline: fToSubmit.discipline,
        appearance: fToSubmit.appearance,
        knowledgeMarks: fToSubmit.knowledgeMarks
      };

      let res;
      if (existingAttempt) {
        let prevAnswers = existingAttempt.answers || {};
        if (typeof prevAnswers === "string") {
          try { prevAnswers = JSON.parse(prevAnswers); } catch (e) { }
        }
        let mergedAnswers = Array.isArray(prevAnswers)
          ? { questions: prevAnswers, ...newAnswers }
          : { ...prevAnswers, ...newAnswers };

        const { error: updateErr } = await supabase
          .from("TEST_ATTEMPT")
          .update({
            obtained_marks: total,
            total_marks: 100,
            percentage: total,
            category: cat,
            answers: mergedAnswers,
            submitted_at: new Date().toISOString()
          })
          .eq("attempt_id", existingAttempt.attempt_id);

        if (updateErr) throw updateErr;

        const { error: updateAssessErr } = await supabase
          .from("ASSESSMENT")
          .update({
            status: "Submitted",
            conducted_by: conductedByUuid,
            assessment_date: new Date().toISOString().slice(0, 10)
          })
          .eq("assessment_id", assessmentId);

        if (updateAssessErr) throw updateAssessErr;

        if (cat === "D" || total < 50) {
          try {
            await assessmentService.triggerCategoryDProtocol(resolvedEmployeeId, assessmentId, total, cat, conductedByUuid);
          } catch (dErr) {
            console.error("Failed manual trigger of Category D protocol:", dErr);
          }
        }

        res = { success: true };
      } else {
        res = await assessmentService.submitTestAttempt({
          assessment_id: assessmentId,
          employee_id: resolvedEmployeeId,
          conducted_by: conductedByUuid,
          obtained_marks: total,
          total_marks: 100,
          percentage: total,
          category: cat,
          answers: newAnswers
        });
      }

      if (!res.success) {
        throw new Error(res.error);
      }

      // Clear activation flags so SM can't re-attempt
      const smHrmsId = targetUser?.hrmsId || targetUser?.id;
      if (smHrmsId) {
        localStorage.removeItem(`sm_test_activated_${smHrmsId}`);
        localStorage.setItem(`sm_test_assigned_${smHrmsId}`, "Completed");
      }

      setStatusMsg("SM assessment submitted successfully. Pending AOM approval.");
      addAuditLog("Submitted SM Assessment", `SM: ${targetUser?.name || ""}, Grand Score: ${total}/100, Category: ${cat}`);
      triggerNotification("success", `Assessment for SM ${targetUser?.name || ""} submitted. Category: ${cat}. Awaiting AOM approval.`);
      setActiveSmId(null);
      await fetchLiveDatabaseData();
    } catch (err) {
      console.error("Error submitting SM assessment:", err);
      setStatusMsg("Failed to submit assessment to database.");
    }
  };

  /* ── TM Form ── */
  const openTMForm = (id, forceUnlock = false) => {
    setActiveTmId(id);
    const tmAssess = tmList.find(t => t.id === id);
    setTmLocked(prev => ({
      ...prev,
      [id]: forceUnlock ? false : (tmAssess ? tmAssess.status === "Submitted" : false)
    }));
    setTmForms(prev => {
      const existing = prev[id] || defaultTMForm();
      if (tmAssess && tmAssess.examScore !== undefined && tmAssess.examScore !== null) {
        const finalExamScore = tmAssess.examScore > 25 ? Math.round(tmAssess.examScore / 4) : tmAssess.examScore;
        return {
          ...prev,
          [id]: {
            ...existing,
            knowledgeMarks: finalExamScore.toString()
          }
        };
      }
      return {
        ...prev,
        [id]: existing
      };
    });
  };

  const handleSendTMExamAccess = async (id) => {
    const tm = tmList.find(t => t.id === id);
    if (tm?.hrmsId) {
      localStorage.setItem(`tm_test_activated_${tm.hrmsId}`, "true");
      localStorage.setItem(`tm_test_activated_time_${tm.hrmsId}`, Date.now().toString());
      localStorage.setItem(`tm_test_assigned_${tm.hrmsId}`, "Assigned");
      localStorage.removeItem(`tm_mcq_test_${tm.hrmsId}`);
      window.dispatchEvent(new Event("storage"));

      // Also update or insert in Supabase
      if (isSupabaseConfigured) {
        try {
          let conductedByUuid = resolvedUserId;
          if (!conductedByUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conductedByUuid)) {
            const tiHrms = user.hrmsId || user.hrms_id;
            if (tiHrms) {
              const { data: tiData } = await supabase
                .from("USERS")
                .select("user_id")
                .eq("hrms_id", tiHrms)
                .single();
              if (tiData?.user_id) {
                conductedByUuid = tiData.user_id;
                setResolvedUserId(conductedByUuid);
              }
            }
          }
          if (!conductedByUuid) conductedByUuid = id;

          const { data: existingAssess } = await supabase
            .from("ASSESSMENT")
            .select("*")
            .eq("employee_id", id)
            .in("status", ["LOCKED", "Draft", "Scheduled", "AVAILABLE", "IN_PROGRESS"])
            .order("created_at", { ascending: false })
            .limit(1);

          if (existingAssess && existingAssess.length > 0) {
            await supabase
              .from("ASSESSMENT")
              .update({ status: "AVAILABLE", conducted_by: conductedByUuid })
              .eq("assessment_id", existingAssess[0].assessment_id);
          } else {
            await supabase
              .from("ASSESSMENT")
              .insert([{
                employee_id: id,
                conducted_by: conductedByUuid,
                assessment_type: "Train Manager Assessment",
                status: "AVAILABLE",
                assessment_date: new Date().toISOString().slice(0, 10)
              }]);
          }
        } catch (dbErr) {
          console.error("Failed to update database assessment status to AVAILABLE:", dbErr);
        }
      }
    }
    setTmList(prev => prev.map(t => t.id === id ? { ...t, status: "Exam Sent" } : t));
    window.alert("test is been send");
    setStatusMsg("test is been send");
    addAuditLog("Sent Exam Access", `Exam activated for TM: ${tm?.name} (${tm?.hrmsId})`);
    triggerNotification("success", `Exam unlocked for TM ${tm?.name}. They must complete 25 MCQ questions.`);
  };

  const toggleTMYN = (id, key, idx, val) => {
    if (tmLocked[id]) return;
    setTmForms(p => ({
      ...p,
      [id]: {
        ...(p[id] || defaultTMForm()),
        [key]: (p[id]?.[key] || Array(5).fill(null)).map((v, i) => i === idx ? (v === val ? null : val) : v)
      }
    }));
  };

  const setTMField = (id, key, val) => {
    if (tmLocked[id]) return;
    setTmForms(p => ({ ...p, [id]: { ...(p[id] || defaultTMForm()), [key]: val } }));
  };

  const submitTMAssessment = async (id, knowledgeMarksOverride) => {
    const fRaw = tmForms[id];
    if (!fRaw?.alcoholicStatus) {
      setStatusMsg("Alcoholic/Non-Alcoholic status is mandatory.");
      return;
    }

    // Validate all 5 TI sections are fully answered
    const unanswered = TI_TM_CRITERIA.filter(sec =>
      !(fRaw[sec.key] && fRaw[sec.key].length === sec.count && fRaw[sec.key].every(v => v === "Yes" || v === "No"))
    ).map(sec => sec.label);
    if (unanswered.length > 0) {
      setStatusMsg(`Please answer all questions in: ${unanswered.join(", ")}`);
      return;
    }

    const f = knowledgeMarksOverride !== undefined ? { ...fRaw, knowledgeMarks: knowledgeMarksOverride } : fRaw;
    const { total } = computeTMScore(f, TI_TM_CRITERIA);

    const isAlcoholic = f.alcoholicStatus === "Alcoholic";
    const cat = isAlcoholic ? "D" : getCat(total);
    let targetUser = users.find(u => u.id === id || u.user_id === id);
    if (!targetUser) {
      const { data: dbUser, error: dbErr } = await supabase
        .from("USERS")
        .select("user_id, hrms_id, full_name")
        .or(`user_id.eq.${id},hrms_id.eq.${id}`)
        .maybeSingle();
      if (!dbErr && dbUser) {
        targetUser = {
          user_id: dbUser.user_id,
          hrmsId: dbUser.hrms_id,
          name: dbUser.full_name
        };
      }
    }
    const resolvedEmployeeId = targetUser?.user_id || id;

    try {
      // Identity Resolution & Defensive Validation
      let resolvedEmployeeId = targetUser?.user_id || id;
      if (resolvedEmployeeId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedEmployeeId)) {
        const { data: uData } = await supabase
          .from("USERS")
          .select("user_id")
          .eq("hrms_id", resolvedEmployeeId)
          .single();
        if (uData?.user_id) {
          resolvedEmployeeId = uData.user_id;
        } else {
          throw new Error(`Could not resolve UUID for Train Manager HRMS ID: ${resolvedEmployeeId}`);
        }
      }

      let conductedByUuid = user.userId;
      if (!conductedByUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conductedByUuid)) {
        const tiHrms = user.hrmsId || user.hrms_id;
        if (tiHrms) {
          const { data: tiData } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", tiHrms)
            .single();
          if (tiData?.user_id) {
            conductedByUuid = tiData.user_id;
          }
        }
        if (!conductedByUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conductedByUuid)) {
          conductedByUuid = resolvedEmployeeId;
        }
      }

      const { data: existingAssess, error: findError } = await supabase
        .from("ASSESSMENT")
        .select("assessment_id")
        .eq("employee_id", resolvedEmployeeId)
        .eq("assessment_type", "Train Manager Assessment")
        .neq("status", "Approved")
        .order("created_at", { ascending: false })
        .limit(1);

      let assessmentId;
      if (!findError && existingAssess && existingAssess.length > 0) {
        assessmentId = existingAssess[0].assessment_id;
      } else {
        const { data: newAssess, error: assessError } = await supabase
          .from("ASSESSMENT")
          .insert([{
            employee_id: resolvedEmployeeId,
            conducted_by: conductedByUuid,
            assessment_type: "Train Manager Assessment",
            status: "IN_PROGRESS",
            assessment_date: new Date().toISOString()
          }])
          .select()
          .single();

        if (assessError) throw assessError;
        assessmentId = newAssess.assessment_id;
      }

      const countYes = arr => (arr || []).filter(v => v === "Yes").length;
      const sectionBreakdown = [
        { title: "Train Safety & Brake Inspection", score: countYes(f.trainSafety) * 3, max: 15, marks: countYes(f.trainSafety) * 3, outOf: 15 },
        { title: "Signaling & Whistle Compliance", score: countYes(f.signaling) * 3, max: 15, marks: countYes(f.signaling) * 3, outOf: 15 },
        { title: "Shunting & Coupling Ops", score: countYes(f.shunting) * 3, max: 15, marks: countYes(f.shunting) * 3, outOf: 15 },
        { title: "Train Log & Guard Certificates", score: countYes(f.documentation) * 3, max: 15, marks: countYes(f.documentation) * 3, outOf: 15 },
        { title: "Emergency Train Protection", score: countYes(f.emergency) * 3, max: 15, marks: countYes(f.emergency) * 3, outOf: 15 },
        { title: "Written Exam (Knowledge)", score: Math.min(parseInt(f.knowledgeMarks) || 0, 25), max: 25, marks: Math.min(parseInt(f.knowledgeMarks) || 0, 25), outOf: 25 }
      ];

      const { data: existingAttempt } = await supabase
        .from("TEST_ATTEMPT")
        .select("*")
        .eq("assessment_id", assessmentId)
        .maybeSingle();

      const newAnswers = {
        alcoholicStatus: f.alcoholicStatus,
        pmeStatus: f.pmeStatus,
        refStatus: f.refStatus,
        counselling: f.counselling,
        automaticTraining: f.automaticTraining,
        remarks: f.remarks,
        trainSafety: f.trainSafety,
        signaling: f.signaling,
        shunting: f.shunting,
        documentation: f.documentation,
        emergency: f.emergency,
        knowledgeMarks: f.knowledgeMarks,
        sections: sectionBreakdown
      };

      let res;
      if (existingAttempt) {
        let prevAnswers = existingAttempt.answers || {};
        if (typeof prevAnswers === "string") {
          try { prevAnswers = JSON.parse(prevAnswers); } catch (e) { }
        }
        let mergedAnswers = Array.isArray(prevAnswers)
          ? { questions: prevAnswers, ...newAnswers }
          : { ...prevAnswers, ...newAnswers };

        const { error: updateErr } = await supabase
          .from("TEST_ATTEMPT")
          .update({
            obtained_marks: total,
            total_marks: 100,
            percentage: total,
            category: cat,
            answers: mergedAnswers,
            submitted_at: new Date().toISOString()
          })
          .eq("attempt_id", existingAttempt.attempt_id);

        if (updateErr) throw updateErr;

        const { error: updateAssessErr } = await supabase
          .from("ASSESSMENT")
          .update({
            status: "Submitted",
            conducted_by: conductedByUuid,
            assessment_date: new Date().toISOString().slice(0, 10)
          })
          .eq("assessment_id", assessmentId);

        if (updateAssessErr) throw updateAssessErr;

        if (cat === "D" || total < 50) {
          try {
            await assessmentService.triggerCategoryDProtocol(resolvedEmployeeId, assessmentId, total, cat, conductedByUuid);
          } catch (dErr) {
            console.error("Failed manual trigger of Category D protocol:", dErr);
          }
        }

        res = { success: true };
      } else {
        res = await assessmentService.submitTestAttempt({
          assessment_id: assessmentId,
          employee_id: resolvedEmployeeId,
          conducted_by: conductedByUuid,
          obtained_marks: total,
          total_marks: 100,
          percentage: total,
          category: cat,
          answers: newAnswers
        });
      }

      if (!res.success) {
        throw new Error(res.error);
      }

      setStatusMsg("TM assessment submitted successfully. Pending AOM approval.");
      addAuditLog("Submitted TM Assessment", `TM: ${targetUser?.name || ""}, Grand Score: ${total}`);
      triggerNotification("success", `Field evaluation logged for TM ${targetUser?.name || ""}.`);
      setActiveTmId(null);
      await fetchLiveDatabaseData();
    } catch (err) {
      console.error("Error submitting TM assessment:", err);
      setStatusMsg("Failed to submit assessment to database.");
    }
  };

  /* ── SS Helpers ── */
  const openSSForm = (id, forceUnlock = false) => {
    if (forceUnlock) setSsLocked(p => ({ ...p, [id]: false }));
    setActiveSsId(id);
    setAssessRole("SS");
    setActivePage("assessments");

    const ssAssess = ssList.find(s => s.id === id);
    setSsLocked(prev => ({
      ...prev,
      [id]: forceUnlock ? false : (ssAssess ? ssAssess.status === "Submitted" : false)
    }));
    setSsForms(prev => {
      const existing = prev[id] || defaultSSForm();
      if (ssAssess && ssAssess.examScore !== undefined && ssAssess.examScore !== null) {
        const finalExamScore = ssAssess.examScore > 25 ? Math.round(ssAssess.examScore / 4) : ssAssess.examScore;
        return {
          ...prev,
          [id]: {
            ...existing,
            knowledgeMarks: finalExamScore.toString()
          }
        };
      }
      return {
        ...prev,
        [id]: existing
      };
    });
  };

  const handleSendSSExamAccess = async (id) => {
    const ss = ssList.find(s => s.id === id);
    if (ss?.hrmsId) {
      localStorage.setItem(`ss_test_activated_${ss.hrmsId}`, "true");
      localStorage.setItem(`ss_test_activated_time_${ss.hrmsId}`, Date.now().toString());
      localStorage.setItem(`ss_test_assigned_${ss.hrmsId}`, "Assigned");
      localStorage.removeItem(`ss_mcq_test_${ss.hrmsId}`);
      window.dispatchEvent(new Event("storage"));

      // Also update or insert in Supabase
      if (isSupabaseConfigured) {
        try {
          let conductedByUuid = resolvedUserId;
          if (!conductedByUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conductedByUuid)) {
            const tiHrms = user.hrmsId || user.hrms_id;
            if (tiHrms) {
              const { data: tiData } = await supabase
                .from("USERS")
                .select("user_id")
                .eq("hrms_id", tiHrms)
                .single();
              if (tiData?.user_id) {
                conductedByUuid = tiData.user_id;
                setResolvedUserId(conductedByUuid);
              }
            }
          }
          if (!conductedByUuid) conductedByUuid = id;

          const { data: existingAssess } = await supabase
            .from("ASSESSMENT")
            .select("*")
            .eq("employee_id", id)
            .in("status", ["LOCKED", "Draft", "Scheduled", "AVAILABLE", "IN_PROGRESS"])
            .order("created_at", { ascending: false })
            .limit(1);

          if (existingAssess && existingAssess.length > 0) {
            await supabase
              .from("ASSESSMENT")
              .update({ status: "AVAILABLE", conducted_by: conductedByUuid })
              .eq("assessment_id", existingAssess[0].assessment_id);
          } else {
            await supabase
              .from("ASSESSMENT")
              .insert([{
                employee_id: id,
                conducted_by: conductedByUuid,
                assessment_type: "Station Superintendent Assessment",
                status: "AVAILABLE",
                assessment_date: new Date().toISOString().slice(0, 10)
              }]);
          }
        } catch (dbErr) {
          console.error("Failed to update database assessment status to AVAILABLE:", dbErr);
        }
      }
    }
    setSsList(prev => prev.map(s => s.id === id ? { ...s, status: "Exam Sent" } : s));
    window.alert("test is been send");
    setStatusMsg("test is been send");
    triggerNotification("info", "Exam access link sent to Station Superintendent.");
  };

  const toggleSSYN = (id, key, idx, val) => {
    if (ssLocked[id]) return;
    setSsForms(p => ({
      ...p,
      [id]: {
        ...(p[id] || defaultSSForm()),
        [key]: (p[id]?.[key] || Array(5).fill(null)).map((v, i) => i === idx ? (v === val ? null : val) : v)
      }
    }));
  };

  const setSSField = (id, key, val) => { if (ssLocked[id]) return; setSsForms(p => ({ ...p, [id]: { ...(p[id] || defaultSSForm()), [key]: val } })); };

  const submitSSAssessment = async (id, knowledgeMarksOverride) => {
    const fRaw = ssForms[id];
    if (!fRaw?.alcoholicStatus) {
      setStatusMsg("Alcoholic/Non-Alcoholic status is mandatory.");
      return;
    }

    // Validate all 5 TI sections are fully answered
    const unanswered = TI_SS_CRITERIA.filter(sec =>
      !(fRaw[sec.key] && fRaw[sec.key].length === sec.count && fRaw[sec.key].every(v => v === "Yes" || v === "No"))
    ).map(sec => sec.label);
    if (unanswered.length > 0) {
      setStatusMsg(`Please answer all questions in: ${unanswered.join(", ")}`);
      return;
    }

    const f = knowledgeMarksOverride !== undefined ? { ...fRaw, knowledgeMarks: knowledgeMarksOverride } : fRaw;
    const { total } = computeSSScore(f, TI_SS_CRITERIA);
    const isAlcoholic = f.alcoholicStatus === "Alcoholic";
    const cat = isAlcoholic ? "D" : getCat(total);
    let targetUser = users.find(u => u.id === id || u.user_id === id);
    if (!targetUser) {
      const { data: dbUser, error: dbErr } = await supabase
        .from("USERS")
        .select("user_id, hrms_id, full_name")
        .or(`user_id.eq.${id},hrms_id.eq.${id}`)
        .maybeSingle();
      if (!dbErr && dbUser) {
        targetUser = {
          user_id: dbUser.user_id,
          hrmsId: dbUser.hrms_id,
          name: dbUser.full_name
        };
      }
    }
    const resolvedEmployeeId = targetUser?.user_id || id;

    try {
      // Identity Resolution & Defensive Validation
      let resolvedEmployeeId = targetUser?.user_id || id;
      if (resolvedEmployeeId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedEmployeeId)) {
        const { data: uData } = await supabase
          .from("USERS")
          .select("user_id")
          .eq("hrms_id", resolvedEmployeeId)
          .single();
        if (uData?.user_id) {
          resolvedEmployeeId = uData.user_id;
        } else {
          throw new Error(`Could not resolve UUID for Station Superintendent HRMS ID: ${resolvedEmployeeId}`);
        }
      }

      let conductedByUuid = user.userId;
      if (!conductedByUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conductedByUuid)) {
        const tiHrms = user.hrmsId || user.hrms_id;
        if (tiHrms) {
          const { data: tiData } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", tiHrms)
            .single();
          if (tiData?.user_id) {
            conductedByUuid = tiData.user_id;
          }
        }
        if (!conductedByUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conductedByUuid)) {
          conductedByUuid = resolvedEmployeeId;
        }
      }

      const { data: existingAssess, error: findError } = await supabase
        .from("ASSESSMENT")
        .select("assessment_id")
        .eq("employee_id", resolvedEmployeeId)
        .eq("assessment_type", "Station Superintendent Assessment")
        .neq("status", "Approved")
        .order("created_at", { ascending: false })
        .limit(1);

      let assessmentId;
      if (!findError && existingAssess && existingAssess.length > 0) {
        assessmentId = existingAssess[0].assessment_id;
      } else {
        const { data: newAssess, error: assessError } = await supabase
          .from("ASSESSMENT")
          .insert([{
            employee_id: resolvedEmployeeId,
            conducted_by: conductedByUuid,
            assessment_type: "Station Superintendent Assessment",
            status: "IN_PROGRESS",
            assessment_date: new Date().toISOString()
          }])
          .select()
          .single();

        if (assessError) throw assessError;
        assessmentId = newAssess.assessment_id;
      }

      const countYes = arr => (arr || []).filter(v => v === "Yes").length;
      const sectionBreakdown = [
        { title: "Station Operations & Supervision", score: countYes(f.stationOps) * 5, max: 25, marks: countYes(f.stationOps) * 5, outOf: 25 },
        { title: "Staff Management & Discipline", score: countYes(f.staffMgmt) * 4, max: 20, marks: countYes(f.staffMgmt) * 4, outOf: 20 },
        { title: "Records & Documentation", score: countYes(f.records) * 3, max: 15, marks: countYes(f.records) * 3, outOf: 15 },
        { title: "Safety Compliance & Emergency", score: countYes(f.safety) * 5, max: 25, marks: countYes(f.safety) * 5, outOf: 25 },
        { title: "Infrastructure & Asset Maintenance", score: countYes(f.infra) * 3, max: 15, marks: countYes(f.infra) * 3, outOf: 15 },
        { title: "Written Exam (Knowledge)", score: Math.min(parseInt(f.knowledgeMarks) || 0, 25), max: 25, marks: Math.min(parseInt(f.knowledgeMarks) || 0, 25), outOf: 25 }
      ];

      const { data: existingAttempt } = await supabase
        .from("TEST_ATTEMPT")
        .select("*")
        .eq("assessment_id", assessmentId)
        .maybeSingle();

      const newAnswers = {
        alcoholicStatus: f.alcoholicStatus,
        pmeStatus: f.pmeStatus,
        refStatus: f.refStatus,
        counselling: f.counselling,
        automaticTraining: f.automaticTraining,
        remarks: f.remarks,
        stationOps: f.stationOps,
        staffMgmt: f.staffMgmt,
        records: f.records,
        safety: f.safety,
        infra: f.infra,
        knowledgeMarks: f.knowledgeMarks,
        sections: sectionBreakdown
      };

      let res;
      if (existingAttempt) {
        let prevAnswers = existingAttempt.answers || {};
        if (typeof prevAnswers === "string") {
          try { prevAnswers = JSON.parse(prevAnswers); } catch (e) { }
        }
        let mergedAnswers = Array.isArray(prevAnswers)
          ? { questions: prevAnswers, ...newAnswers }
          : { ...prevAnswers, ...newAnswers };

        const { error: updateErr } = await supabase
          .from("TEST_ATTEMPT")
          .update({
            obtained_marks: total,
            total_marks: 100,
            percentage: total,
            category: cat,
            answers: mergedAnswers,
            submitted_at: new Date().toISOString()
          })
          .eq("attempt_id", existingAttempt.attempt_id);

        if (updateErr) throw updateErr;

        const { error: updateAssessErr } = await supabase
          .from("ASSESSMENT")
          .update({
            status: "Submitted",
            conducted_by: conductedByUuid,
            assessment_date: new Date().toISOString().slice(0, 10)
          })
          .eq("assessment_id", assessmentId);

        if (updateAssessErr) throw updateAssessErr;

        if (cat === "D" || total < 50) {
          try {
            await assessmentService.triggerCategoryDProtocol(resolvedEmployeeId, assessmentId, total, cat, conductedByUuid);
          } catch (dErr) {
            console.error("Failed manual trigger of Category D protocol:", dErr);
          }
        }

        res = { success: true };
      } else {
        res = await assessmentService.submitTestAttempt({
          assessment_id: assessmentId,
          employee_id: resolvedEmployeeId,
          conducted_by: conductedByUuid,
          obtained_marks: total,
          total_marks: 100,
          percentage: total,
          category: cat,
          answers: newAnswers
        });
      }

      if (!res.success) {
        throw new Error(res.error);
      }

      setStatusMsg("SS assessment submitted successfully. Pending AOM approval.");
      addAuditLog("Submitted SS Assessment", `SS: ${targetUser?.name || ""}, Grand Score: ${total}`);
      triggerNotification("success", `Field evaluation logged for SS ${targetUser?.name || ""}.`);
      setActiveSsId(null);
      await fetchLiveDatabaseData();
    } catch (err) {
      console.error("Error submitting SS assessment:", err);
      setStatusMsg("Failed to submit assessment to database.");
    }
  };

  /* ── Logging Inspections & Counselling ── */
  const submitInspection = async (e) => {
    e.preventDefault();
    try {
      let tiUuid = user.userId;
      if (!tiUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tiUuid)) {
        const tiHrms = user.hrmsId || user.hrms_id;
        if (tiHrms) {
          const { data: tiData } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", tiHrms)
            .single();
          if (tiData?.user_id) tiUuid = tiData.user_id;
        }
      }
      if (!tiUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tiUuid)) {
        throw new Error("Could not resolve Traffic Inspector UUID.");
      }

      const { error } = await supabase
        .from("SAFETY_RECORD")
        .insert([{
          user_id: tiUuid,
          incident_type: "Inspection",
          incident_date: new Date().toISOString().slice(0, 10),
          description: `Station: ${newInsp.station} | Observations: ${newInsp.observations}`,
          action_taken: newInsp.risk
        }]);

      if (error) throw error;

      addAuditLog("Logged Station Inspection", `Station: ${newInsp.station}, Risk: ${newInsp.risk}`);
      triggerNotification("warning", `NEW INSPECTION REPORT FILED: ${newInsp.station}`);
      setStatusMsg(`Inspection audit log successfully created for ${newInsp.station}.`);
      setNewInsp({ station: "Parbhani Junction", officer: "TI R. Khan", observations: "", risk: "Low" });
      setShowInspForm(false);
      await fetchLiveDatabaseData();
    } catch (err) {
      console.error("Error submitting inspection:", err);
      setStatusMsg("Failed to log inspection to database.");
    }
  };

  const submitCounselling = async (e) => {
    e.preventDefault();
    try {
      const targetUser = users.find(u => u.name === newCoun.staffName);
      let targetUserId = targetUser?.user_id;
      if (!targetUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
        // Find by name in database USERS
        const { data: dbUser } = await supabase
          .from("USERS")
          .select("user_id")
          .eq("full_name", newCoun.staffName)
          .maybeSingle();
        if (dbUser?.user_id) {
          targetUserId = dbUser.user_id;
        } else {
          // Final fallback to user.userId
          targetUserId = user.userId;
        }
      }

      if (targetUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
        const tiHrms = user.hrmsId || user.hrms_id;
        if (tiHrms) {
          const { data: tiData } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", tiHrms)
            .single();
          if (tiData?.user_id) targetUserId = tiData.user_id;
        }
      }

      const { error } = await supabase
        .from("SAFETY_RECORD")
        .insert([{
          user_id: targetUserId,
          incident_type: "Counseling",
          incident_date: new Date().toISOString().slice(0, 10),
          description: newCoun.topics,
          action_taken: newCoun.progress
        }]);

      if (error) throw error;

      addAuditLog("Logged Counselling Session", `Staff: ${newCoun.staffName}, Topics: ${newCoun.topics.slice(0, 25)}...`);
      triggerNotification("success", `Counselling session registered for ${newCoun.staffName}.`);
      setStatusMsg(`Staff safety counseling briefing registered for ${newCoun.staffName}.`);
      setNewCoun({ staffName: "", designation: "Pointsman Grade I", station: "Parbhani Junction", topics: "", duration: "30 mins", progress: "Under Monitor" });
      setShowCounForm(false);
      await fetchLiveDatabaseData();
    } catch (err) {
      console.error("Error submitting counselling:", err);
      setStatusMsg("Failed to log counselling session to database.");
    }
  };

  /* ── Self-Assessment Quiz ── */
  const startQuiz = () => {
    setQuizAnswers(Array(25).fill(null));
    setCurrentQuestion(0);
    setQuizState("quiz");
  };

  const handleSelectQuizOpt = (optIdx) => {
    setQuizAnswers(prev => {
      const next = [...prev];
      next[currentQuestion] = optIdx;
      return next;
    });
  };

  const submitQuiz = async () => {
    let correctCount = 0;
    quizAnswers.forEach((ans, idx) => {
      if (ans === TI_QUIZ[idx].ans) correctCount++;
    });
    const obtainedMarks = correctCount;
    const totalMarks = 25;
    const percentage = Math.round((obtainedMarks / totalMarks) * 100);
    setLatestQuizScore(percentage);

    const today = new Date().toISOString().slice(0, 10);

    try {
      // Step 1: Resolve the TI's UUID robustly
      let effectiveId = resolvedUserId || user?.userId;
      if (!effectiveId && user?.hrmsId) {
        const { data: uData } = await supabase
          .from("USERS")
          .select("user_id")
          .eq("hrms_id", user.hrmsId)
          .single();
        if (uData?.user_id) {
          effectiveId = uData.user_id;
          setResolvedUserId(effectiveId);
        }
      }
      if (!effectiveId) {
        throw new Error("Could not resolve your user ID. Please log in again.");
      }

      // Step 2: Find the pending assessment assigned by AOM
      const { data: pendingList, error: pendingErr } = await supabase
        .from("ASSESSMENT")
        .select("assessment_id")
        .eq("employee_id", effectiveId)
        .eq("status", "Pending");

      if (pendingErr) throw pendingErr;

      const assessId = pendingList?.[0]?.assessment_id;
      if (!assessId) {
        throw new Error("No active pending assessment authorized by AOM.");
      }

      // Step 3: Insert the TEST_ATTEMPT record directly
      const { data: attemptData, error: attemptErr } = await supabase
        .from("TEST_ATTEMPT")
        .insert([{
          assessment_id: assessId,
          employee_id: effectiveId,
          total_marks: totalMarks,
          obtained_marks: obtainedMarks,
          percentage: percentage,
          category: getCat(percentage),
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (attemptErr) throw attemptErr;

      // Step 4: Update assessment status to "Submitted" so it appears in AOM queue
      const { error: updateErr } = await supabase
        .from("ASSESSMENT")
        .update({ status: "Submitted" })
        .eq("assessment_id", assessId);

      if (updateErr) throw updateErr;

      setIsExamAssigned(false);
      addAuditLog("Assigned Assessment Completed", `Score: ${percentage}/100`);
      triggerNotification("success", `Compliance check complete: Scored ${percentage}%`);
      setQuizState("result");
      await fetchLiveDatabaseData();
    } catch (err) {
      console.error("Error submitting TI quiz:", err);
      setStatusMsg(`Failed to submit quiz results: ${err.message || "Unknown error"}`);
    }
  };

  const sendBatchExamAccess = async (role, hrmsIds) => {
    if (!hrmsIds || hrmsIds.length === 0) return;
    setStatusMsg("Activating batch exam access...");
    try {
      const today = new Date().toISOString().slice(0, 10);

      // Resolve TI User UUID
      let tiUserUuid = user?.userId;
      if (isSupabaseConfigured && (!tiUserUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tiUserUuid))) {
        const tiHrms = user.hrmsId || user.hrms_id;
        if (tiHrms) {
          const { data: tiUser } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", tiHrms)
            .single();
          tiUserUuid = tiUser?.user_id || user?.userId;
        }
      }

      for (const hrmsId of hrmsIds) {
        const keyPrefix = role === "SM" ? "sm" : "tm";
        // Set local storage flags
        localStorage.setItem(`${keyPrefix}_test_activated_${hrmsId}`, "true");
        localStorage.setItem(`${keyPrefix}_test_activated_time_${hrmsId}`, Date.now().toString());
        localStorage.setItem(`${keyPrefix}_test_assigned_${hrmsId}`, "Assigned");
        localStorage.removeItem(`${keyPrefix}_mcq_test_${hrmsId}`);

        if (isSupabaseConfigured) {
          // Resolve Employee UUID
          const { data: empUser, error: empErr } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", hrmsId)
            .single();

          if (!empErr && empUser?.user_id) {
            const empUserUuid = empUser.user_id;
            const assessType = role === "SM" ? "Station Master Assessment" : "Train Manager Assessment";

            // Check if there is a LOCKED/pending assessment
            const { data: lockedAssessments } = await supabase
              .from("ASSESSMENT")
              .select("assessment_id")
              .eq("employee_id", empUserUuid)
              .eq("status", "LOCKED")
              .limit(1);

            if (lockedAssessments && lockedAssessments.length > 0) {
              await supabase
                .from("ASSESSMENT")
                .update({
                  status: "AVAILABLE",
                  conducted_by: tiUserUuid,
                  assessment_date: today,
                  assessment_type: assessType
                })
                .eq("assessment_id", lockedAssessments[0].assessment_id);
            } else {
              // Insert a new AVAILABLE assessment record
              await supabase.from("ASSESSMENT").insert([{
                employee_id: empUserUuid,
                conducted_by: tiUserUuid,
                assessment_type: assessType,
                status: "AVAILABLE",
                assessment_date: today
              }]);
            }

            // Create notification for employee
            await supabase.from("NOTIFICATION").insert([{
              user_id: empUserUuid,
              title: "Assessment Access Granted",
              message: `Your periodic safety competency assessment has been activated by Traffic Inspector ${tiName}. You can now attempt the safety exam in your portal.`,
              is_read: false
            }]);
          }
        }
      }

      window.dispatchEvent(new Event("storage"));
      setSelectedHrmsIds([]);
      await fetchLiveDatabaseData();
      setStatusMsg(`Successfully activated assessment access for ${hrmsIds.length} employee(s).`);
    } catch (err) {
      console.error("Error in batch activation:", err);
      alert("Error sending batch assessment access: " + err.message);
      setStatusMsg("Batch assessment access failed.");
    }
  };

  const updateEmployeeScheduleTI = async (role, hrmsId, date, time, reason) => {
    if (!hrmsId || !date) return { success: false, error: "Missing required fields" };
    try {
      const today = new Date().toISOString().slice(0, 10);

      // Resolve TI User UUID
      let tiUserUuid = user?.userId;
      if (isSupabaseConfigured && (!tiUserUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tiUserUuid))) {
        const tiHrms = user.hrmsId || user.hrms_id;
        if (tiHrms) {
          const { data: tiUser } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", tiHrms)
            .single();
          tiUserUuid = tiUser?.user_id || user?.userId;
        }
      }

      if (isSupabaseConfigured) {
        // Resolve Employee UUID
        const { data: empUser, error: empErr } = await supabase
          .from("USERS")
          .select("user_id")
          .eq("hrms_id", hrmsId)
          .single();

        if (empErr || !empUser?.user_id) throw new Error("Could not resolve employee UUID.");
        const empUserUuid = empUser.user_id;

        const baseAssessType = role === "SM" ? "Station Master Assessment" : "Train Manager Assessment";
        const assessmentType = `${baseAssessType} | Time: ${time || "10:00 AM"}`;

        // Check if there is an active assessment
        const { data: activeAssess } = await supabase
          .from("ASSESSMENT")
          .select("assessment_id, due_date, assessment_type")
          .eq("employee_id", empUserUuid)
          .eq("assessment_type", baseAssessType)
          .in("status", ["LOCKED", "AVAILABLE", "IN_PROGRESS", "Pending", "Draft", "Scheduled"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let finalActiveAssess = activeAssess;
        if (!finalActiveAssess) {
          const { data: activeAssessPrefix } = await supabase
            .from("ASSESSMENT")
            .select("assessment_id, due_date, assessment_type")
            .eq("employee_id", empUserUuid)
            .ilike("assessment_type", `${baseAssessType}%`)
            .in("status", ["LOCKED", "AVAILABLE", "IN_PROGRESS", "Pending", "Draft", "Scheduled"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          finalActiveAssess = activeAssessPrefix;
        }

        let prevDate = "None";
        let assessmentId = null;

        if (finalActiveAssess) {
          prevDate = finalActiveAssess.due_date || "None";
          assessmentId = finalActiveAssess.assessment_id;

          // Update active assessment
          await supabase
            .from("ASSESSMENT")
            .update({
              due_date: date,
              assessment_type: assessmentType
            })
            .eq("assessment_id", assessmentId);
        } else {
          // Create a new LOCKED assessment
          const { data: newAssess, error: newAssessErr } = await supabase
            .from("ASSESSMENT")
            .insert([{
              employee_id: empUserUuid,
              conducted_by: tiUserUuid,
              assessment_type: assessmentType,
              status: "LOCKED",
              due_date: date,
              assessment_date: today
            }])
            .select()
            .single();

          if (newAssessErr) throw newAssessErr;
          assessmentId = newAssess.assessment_id;
        }

        // Insert into AUDIT_LOG
        await supabase.from("AUDIT_LOG").insert([{
          user_id: tiUserUuid,
          action: `Prev: ${prevDate} | New: ${date} ${time || "10:00 AM"} | Reason: ${reason} | Emp: ${hrmsId}`,
          table_name: "ASSESSMENT",
          record_id: assessmentId
        }]);

        // Insert Notification for Employee
        await supabase.from("NOTIFICATION").insert([{
          user_id: empUserUuid,
          title: "Assessment Schedule Modified",
          message: `Your safety assessment schedule has been modified by Traffic Inspector ${tiName}. New Due Date: ${date} ${time || "10:00 AM"}.`,
          is_read: false
        }]);
      }

      // Refresh DB data
      await fetchLiveDatabaseData();
      return { success: true };
    } catch (err) {
      console.error("Error updating schedule:", err);
      alert("Error updating schedule: " + err.message);
      return { success: false, error: err.message };
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addAuditLog("Notifications Inbox Read", "Marked all alerts read.");
  };

  return {
    activePage, setActivePage, goTo,
    statusMsg, setStatusMsg,
    view, setView,
    notifications, setNotifications,
    bellDropdownOpen, setBellDropdownOpen,
    auditLogs, setAuditLogs,
    stations, setStations,
    users, setUsers,
    pmList, setPmList,
    smList, setSmList,
    tmList, setTmList,
    ssList, setSsList,
    inspections, setInspections,
    counsellings, setCounsellings,
    selectedRecord, setSelectedRecord,
    tiAssessments, setTiAssessments,
    isExamAssigned, setIsExamAssigned,
    selectedReportUserId, setSelectedReportUserId,
    selectedSM, setSelectedSM,
    selectedStation, setSelectedStation,
    stSearch, setStSearch,
    stCatFilter, setStCatFilter,
    userSearch, setUserSearch,
    userStationFilter, setUserStationFilter,
    userDesignationFilter, setUserDesignationFilter,
    userCategoryFilter, setUserCategoryFilter,
    userRiskFilter, setUserRiskFilter,
    editingUser, setEditingUser,
    transferringUser, setTransferringUser,
    reviewTab, setReviewTab,
    reviewSearch, setReviewSearch,
    reviewStation, setReviewStation,
    selectedPmId, setSelectedPmId,
    editSections, setEditSections,
    tiRemarks, setTiRemarks,
    showAudit, setShowAudit,
    rejectMode, setRejectMode,
    smForms, setSmForms,
    smLocked, setSmLocked,
    activeSmId, setActiveSmId,
    tmForms, setTmForms,
    tmLocked, setTmLocked,
    activeTmId, setActiveTmId,
    ssForms, setSsForms,
    ssLocked, setSsLocked,
    activeSsId, setActiveSsId,
    assessRole, setAssessRole,
    rosterSearch, setRosterSearch,
    rosterStation, setRosterStation,
    rosterStatus, setRosterStatus,
    rosterDate, setRosterDate,
    repApplied, setRepApplied,
    rpStation, setRpStation,
    rpCat, setRpCat,
    rpRisk, setRpRisk,
    rpSearch, setRpSearch,
    rpSort, setRpSort,
    showInspForm, setShowInspForm,
    newInsp, setNewInsp,
    showCounForm, setShowCounForm,
    newCoun, setNewCoun,
    dbStationFilter, setDbStationFilter,
    dbSearchQuery, setDbSearchQuery,
    fsSearch, setFsSearch,
    fsCatFilter, setFsCatFilter,
    fsRiskFilter, setFsRiskFilter,
    quizState, setQuizState,
    currentQuestion, setCurrentQuestion,
    quizAnswers, setQuizAnswers,
    latestQuizScore, setLatestQuizScore,
    isChartZoomModalOpen, setIsChartZoomModalOpen,
    selectedChartType, setSelectedChartType,
    zoomPopupSearch, setZoomPopupSearch,
    zoomPopupZone, setZoomPopupZone,
    zoomPopupDivision, setZoomPopupDivision,
    zoomPopupStationName, setZoomPopupStationName,
    zoomPopupStationCode, setZoomPopupStationCode,
    zoomPopupCategory, setZoomPopupCategory,
    zoomPopupRisk, setZoomPopupRisk,
    zoomPopupStatus, setZoomPopupStatus,
    zoomPopupStartDate, setZoomPopupStartDate,
    zoomPopupEndDate, setZoomPopupEndDate,
    zoomPopupPage, setZoomPopupPage,

    // Memo calculations
    tiName, tiId,
    myStations, myUsers, myPmList, mySmList, myTmList,
    totalPM, totalSMs, pending, highRiskAll, avgScoreAll,
    stationStats, bestSt, worstSt, highRiskSt,
    filteredStations, stBarData, pieData, myStationsProgress,
    roleBarData, myCompliance, topStations, bottomStations, myPipeline, myAssessmentMonthly,
    filteredFsStations, fsStBarData, filteredFsUsers, fsPieData,
    filteredPM, selectedPM, filteredUsers, filteredReport,

    // Extra state vars previously missing from exports
    roleF, setRoleF,
    repF, setRepF,
    fullscreenChart, setFullscreenChart,
    recentAssessments,
    allDbAssessments, setAllDbAssessments,
    selectedCategory, setSelectedCategory,
    selectedHrmsIds, setSelectedHrmsIds,
    viewUpcomingOnly, setViewUpcomingOnly,
    sendBatchExamAccess, updateEmployeeScheduleTI,

    // Helper functions
    triggerNotification, addAuditLog, exportAlert, fetchLiveDatabaseData,
    handleChartClick, handlePieClick, handleResetPopupFilters,

    // Station modal actions
    defaultStationForm, showAddStationModal, setShowAddStationModal, newStationData, setNewStationData, stationFormErrors, setStationFormErrors,
    editingStationId, setEditingStationId, stationModalMode, setStationModalMode,
    handleOpenEditStation, handleOpenAddStation, handleDeleteStation,
    showAddUserModal, setShowAddUserModal, newUserData, setNewUserData,

    // Operations / Admin Actions
    handleAddStationSubmit, openAddUserModal, handleAddUserSubmit, handleEditUser, saveEditedUser, handleDeleteUser, handleTransferClick, confirmTransfer,
    openPmReview, updateSec, finalizePM, openSMForm, handleSendExamAccess, toggleSMYN, setSMField, submitSMAssessment, openTMForm, handleSendTMExamAccess, toggleTMYN, setTMField, submitTMAssessment,
    openSSForm, handleSendSSExamAccess, toggleSSYN, setSSField, submitSSAssessment, submitInspection, submitCounselling, startQuiz, handleSelectQuizOpt, submitQuiz, markAllNotificationsRead
  };
}
export default useTrafficInspectorState;
