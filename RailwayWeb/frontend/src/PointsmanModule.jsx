import { useMemo, useState, useEffect } from "react";
import { useLanguage } from "./contexts/LanguageContext";
import { LanguageSelector } from "./components/LanguageSelector";
import {
  Award,
  BarChart2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileBarChart2,
  Gauge,
  LogOut,
  PlayCircle,
  Search,
  Target,
  TrendingUp,
  UserCircle2,
  ArrowUpDown,
  ShieldCheck,
  Bell,
  ShieldAlert,
  Clock,
  Activity,
  FileText,
  AlertTriangle,
  Lock,
  RefreshCw,
  Paperclip,
  Trash2,
  Volume2,
  VolumeX,
  Plus,
  BookOpen
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import "./sdom.css";
import { dbService, isSupabaseConfigured, supabase } from "./supabaseClient";
import { monitoringService } from "./services/monitoringService";
import { assessmentService } from "./services/assessmentService";
import { getCategory, getCategoryColor, getCategoryBg } from "./constants";


/* ─── Navigation ─── */
const navItems = [
  { key: "dashboard",    label: "Dashboard",     icon: Gauge },
  { key: "myAssessment", label: "My Assessment",  icon: FileBarChart2 },
  { key: "refCourse",    label: "REF Course",     icon: BookOpen },
  { key: "counselling",  label: "Counselling",    icon: ShieldAlert },
  { key: "profile",      label: "Profile",        icon: UserCircle2 }
];

import { pointsmanProfile, rawQuestions, testQuestions, generateMockResponses, initialHistory } from "./data/mockPointsmanData";
import { PointsmanDashboard } from "./pages/modules/pointsman/PointsmanDashboard";
import { PointsmanProfile } from "./pages/modules/pointsman/PointsmanProfile";
import { PointsmanAssessments } from "./pages/modules/pointsman/PointsmanAssessments";
import { PointsmanMCQTest } from "./pages/modules/pointsman/PointsmanMCQTest";
import { PointsmanSafetyPage } from "./pages/modules/pointsman/PointsmanSafetyPage";
import { PointsmanHistoryPage } from "./pages/modules/pointsman/PointsmanHistoryPage";
import { PointsmanScorecardPage } from "./pages/modules/pointsman/PointsmanScorecardPage";
import { PointsmanCurrentTestsPage } from "./pages/modules/pointsman/PointsmanCurrentTestsPage";


/* ─── Single active test for the current month ─── */
const TEST_NAME = "Pointsman Periodic Assessment";
const currentTestSeed = {
  id: "CT-APR-2026",
  name: TEST_NAME,
  period: "April 2026"
};

/* ─── Pie chart custom label ─── */
const PIE_COLORS = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, payload: inner } = payload[0];
    return (
      <div className="pm-pie-tooltip" style={{ background: '#fff', border: '1px solid #dbe5f0', padding: '8px', borderRadius: '8px' }}>
        <strong>Category {name}</strong>
        <div>{value}% &nbsp;({inner.count} attempt{inner.count !== 1 ? "s" : ""})</div>
      </div>
    );
  }
  return null;
};

const formatQuarterPeriod = (periodStr) => {
  if (!periodStr) return "—";
  const match = periodStr.match(/Q([1-4])\s+(\d{4})/i);
  if (!match) return periodStr;
  const quarter = parseInt(match[1], 10);
  const year = match[2];
  switch (quarter) {
    case 1: return `01 Jan ${year} – 31 Mar ${year}`;
    case 2: return `01 Apr ${year} – 30 Jun ${year}`;
    case 3: return `01 Jul ${year} – 30 Sep ${year}`;
    case 4: return `01 Oct ${year} – 31 Dec ${year}`;
    default: return periodStr;
  }
};

// Global Web Audio synth for Emergency sound
let audioCtx = null;
let alarmOsc = null;
let alarmGain = null;
let alarmInterval = null;

function startAlarmSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
    
    alarmOsc = audioCtx.createOscillator();
    alarmGain = audioCtx.createGain();
    
    alarmOsc.connect(alarmGain);
    alarmGain.connect(audioCtx.destination);
    
    alarmOsc.type = "sine";
    alarmOsc.frequency.setValueAtTime(500, audioCtx.currentTime);
    alarmGain.gain.setValueAtTime(0, audioCtx.currentTime);
    
    alarmOsc.start();
    
    let state = true;
    alarmInterval = setInterval(() => {
      if (!audioCtx) return;
      // sweep frequency between 500Hz and 850Hz to sound like a warning klaxon
      alarmOsc.frequency.setValueAtTime(state ? 850 : 500, audioCtx.currentTime);
      alarmGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      state = !state;
    }, 450);
  } catch (err) {
    console.error("Audio Context initiation failed:", err);
  }
}

function stopAlarmSound() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (alarmOsc) {
    try { alarmOsc.stop(); } catch(e) {}
    alarmOsc = null;
  }
  if (audioCtx) {
    try { audioCtx.close(); } catch(e) {}
    audioCtx = null;
  }
}

/* ─── Main component ─── */
function PointsmanModule({ user, onLogout }) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(() => pointsmanProfile);
  const [dbUserRecordId, setDbUserRecordId] = useState(user?.userId || null);

  const fullName = user?.name && user.name !== "Pointsman User" ? user.name : profile.name;
  const employeeId = user?.hrmsId || profile.hrmsId;

  // Clear any stale cached history (may contain old mock/seed data)
  useEffect(() => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("pm_history_")) keysToRemove.push(k);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch(e) { /* ignore */ }
  }, []);

  const [activeNav, setActiveNav] = useState("dashboard");
  const [screenMode, setScreenMode] = useState("default");
  
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`pm_history_${employeeId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error reading PM history:", e);
    }
    return [];
  });
  
  const [refHistory, setRefHistory] = useState([]);
  const [counsellingHistory, setCounsellingHistory] = useState([]);
  const [activeMonitoring, setActiveMonitoring] = useState(null);
  
  const [historyDateSearch, setHistoryDateSearch] = useState("");
  const [historySortOrder, setHistorySortOrder] = useState("date-desc");
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // My Assessment state (mirrors SM module)
  const [myAssessSelected, setMyAssessSelected] = useState(null);
  const [pmMcqTest, setPmMcqTest] = useState(() => {
    const saved = localStorage.getItem(`pm_mcq_test_${employeeId}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [testAssigned, setTestAssigned] = useState(() => {
    const saved = localStorage.getItem(`pm_test_assigned_${employeeId}`);
    if (saved === null) {
      localStorage.setItem(`pm_test_assigned_${employeeId}`, "Assigned");
      return "Assigned";
    }
    return saved;
  });
  const [pmActiveQIdx, setPmActiveQIdx] = useState(0);
  const [pmTestResponses, setPmTestResponses] = useState(() => Array(25).fill(null));
  
  const [currentTest, setCurrentTest] = useState(() => {
    const saved = localStorage.getItem(`pm_current_test_${employeeId}`);
    if (saved) return JSON.parse(saved);
    const mcqResult = localStorage.getItem(`pm_mcq_test_${employeeId}`);
    if (mcqResult && JSON.parse(mcqResult).completed) {
      return null;
    }
    return currentTestSeed;
  });
  
  const [activeTest, setActiveTest] = useState(null);
  const [responses, setResponses] = useState(Array(25).fill(null));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [statusText, setStatusText] = useState("");

  /* ─── Extra State Additions ─── */
  // 1. MCQ Timer (30 minutes = 1800 seconds)
  const [assessmentTimeLeft, setAssessmentTimeLeft] = useState(1800);
  const [isAssessmentTimerRunning, setIsAssessmentTimerRunning] = useState(false);

  // 2. Secure Login Session Timer (15 minutes = 900 seconds)
  const [sessionTimeLeft, setSessionTimeLeft] = useState(900);

  // 3. Real-Time Notifications
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "danger", message: "CRITICAL: PME Medical examination scheduled on 2026-06-10.", time: "10 mins ago", read: false },
    { id: 2, type: "warning", message: "Safety Directive: New speed restriction (15km/h) active at Siding Points 12B.", time: "2 hours ago", read: false },
    { id: 3, type: "info", message: "Circular Update: SWR (Station Working Rules) Amendment v4.2 published.", time: "1 day ago", read: true },
    { id: 4, type: "success", message: "Training status updated: Periodic Shunting Refresher completed.", time: "3 days ago", read: true }
  ]);

  // 4. Audit Activity Logs
  const [profileSubTab, setProfileSubTab] = useState("details"); // "details" | "audit"
  const [activityLogs, setActivityLogs] = useState([
    { id: 1, timestamp: "2026-05-27 10:00:12", category: "Auth", action: "User session initialized (IP: 10.244.15.68)", user: "Ravi Kumar" },
    { id: 2, timestamp: "2026-05-27 10:01:45", category: "Profile", action: "PME & REF health profile retrieved", user: "Ravi Kumar" },
    { id: 3, timestamp: "2026-05-27 10:03:10", category: "System", action: "Audited dashboard integrity checklist successfully", user: "Ravi Kumar" }
  ]);

  // 5. Emergency Alert & Siren State
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState("Obstruction on Track");
  const [emergencyLocation, setEmergencyLocation] = useState("Nagpur Yard Line 2");
  const [alarmMuted, setAlarmMuted] = useState(false);

  // 6. Safety Reports
  const [safetySubTab, setSafetySubTab] = useState("track"); // "track" | "incident" | "history"
  const [safetyReports, setSafetyReports] = useState([
    { id: 101, type: "Track Defect", defect: "Rail Joint Crack", location: "KM 104/2 Near Gate", severity: "High - Urgent Action", status: "RESOLVED", date: "2026-05-24", desc: "Visible hair crack on joint fishplate." },
    { id: 102, type: "Abnormal Incident", defect: "Hot Axle Exchanged Flag", location: "Line 1 Main", severity: "Medium - Investigating", status: "UNDER REPAIR", date: "2026-05-26", desc: "Detected sparks during all-right hand signal. Notified Station Master." }
  ]);

  // File Upload State Mock
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  // Form Fields: Track Issue
  const [trackLocation, setTrackLocation] = useState("");
  const [trackLine, setTrackLine] = useState("Line 1");
  const [trackDefect, setTrackDefect] = useState("Rail Fracture");
  const [trackSeverity, setTrackSeverity] = useState("High - Urgent Action");
  const [trackDesc, setTrackDesc] = useState("");

  // Form Fields: Abnormal Incident
  const [incidentType, setIncidentType] = useState("Hot Axle");
  const [incidentTrain, setIncidentTrain] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [incidentAction, setIncidentAction] = useState("");

  // Track user notifications unread count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  /* ─── EFFECT: Dynamic Live Database Fetching ─── */
  useEffect(() => {
    if (isSupabaseConfigured) {
      async function loadDbData() {
        try {
          // 1. Fetch user by HRMS ID
          const usersList = await dbService.getAllUsers();
          const dbUser = usersList.find(u => u.hrms_id.trim().toUpperCase() === employeeId.trim().toUpperCase());
          if (dbUser) {
            setDbUserRecordId(dbUser.user_id);
            const profRec = dbUser.EMPLOYEE_PROFILE?.[0] || dbUser.EMPLOYEE_PROFILE || {};
            const stationName = profRec.STATION?.station_name || "Unassigned Yard / Station";
            
            setProfile({
              name: dbUser.full_name,
              hrmsId: dbUser.hrms_id,
              pfNumber: dbUser.pf_number || "—",
              email: dbUser.email || "—",
              stationName: stationName,
              designation: dbUser.ROLE?.role_name || "Pointsman",
              mobileNumber: dbUser.mobile_no || "—",
              pmeStatus: `FIT (Periodic Medical Exam) - Status: ${profRec.pme_status || "Fit"}`,
              refStatus: `COMPLETED (Refresher Course) - Status: ${profRec.refresher_status || "Cleared"}`,
              trainingStatus: `ACTIVE (${profRec.monitoring_status || "Active"} Safety & Shunting Certified)`,
              currentCategory: profRec.category || null,
              department: "Operations",
              reportingOfficer: profRec.reporting_sm || "— (Station Master)",
              joiningDate: profRec.date_of_joining || profRec.joining_date || "2018-06-15"
            });

            // 2. Fetch test history attempts from DB
            const attempts = await dbService.getTestHistory(dbUser.user_id);
            if (attempts && attempts.length > 0) {
              const mappedHistory = attempts.map(att => {
                const dateStr = att.started_at ? att.started_at.split("T")[0] : new Date().toISOString().split("T")[0];
                const periodStr = att.ASSESSMENT?.assessment_date || "April 2026";
                const nameStr = att.ASSESSMENT?.assessment_type || "Pointsman Periodic Assessment";
                const isOnline = att.total_marks === 25 || nameStr.includes("MCQ");
                const totalScore = att.obtained_marks !== null && att.obtained_marks !== undefined 
                  ? att.obtained_marks 
                  : Math.round(((att.percentage || 0) / 100) * (att.total_marks || 100));
                
                let rawStatus = att.ASSESSMENT?.status || "Approved";
                if (["Draft", "Pending", "Submitted", "IN_PROGRESS"].includes(rawStatus)) {
                  rawStatus = "Pending";
                }

                // Segment marks into beautiful segments
                const baseMarks = Math.round((totalScore / (isOnline ? 25 : 100)) * 20);
                const sections = [
                  { title: "Signal Rules", marks: Math.min(20, baseMarks + (Math.random() > 0.5 ? 1 : -1)), outOf: 20 },
                  { title: "Track Handling", marks: Math.min(20, baseMarks + (Math.random() > 0.5 ? 1 : -1)), outOf: 20 },
                  { title: "Communication", marks: Math.min(20, baseMarks + (Math.random() > 0.5 ? 1 : -1)), outOf: 20 },
                  { title: "Safety Response", marks: Math.min(20, baseMarks + (Math.random() > 0.5 ? 1 : -1)), outOf: 20 },
                  { title: "Operational Judgement", marks: Math.min(20, baseMarks), outOf: 20 }
                ];
                sections.forEach(s => {
                  if (s.marks < 0) s.marks = 0;
                  if (s.marks > 20) s.marks = 20;
                });

                return {
                  id: att.attempt_id,
                  date: dateStr,
                  name: nameStr,
                  assessmentPeriod: periodStr,
                  totalScore: totalScore,
                  isOnlineExam: isOnline,
                  approvalStatus: rawStatus,
                  category: att.category,
                  sections: sections,
                  responses: generateMockResponses(totalScore)
                };
              });
              setHistory(mappedHistory);
            } else {
              setHistory([]);
            }

            // 3. Fetch safety incidents
            const incidents = await dbService.getIncidents(dbUser.user_id);
            if (incidents && incidents.length > 0) {
              const mappedIncidents = incidents.map(inc => ({
                id: inc.incident_id,
                type: inc.incident_type,
                defect: inc.incident_type,
                location: inc.remarks?.split(" | ")[1] || "Yard Siding Track",
                severity: inc.severity,
                status: "RESOLVED",
                date: inc.incident_date,
                desc: inc.remarks || "Safety report logged in system."
              }));
              setSafetyReports(mappedIncidents);
            } else {
              setSafetyReports([]);
            }

            // 4. Fetch REF training history
            const refRecs = await monitoringService.getRefresherHistory(dbUser.user_id);
            setRefHistory(refRecs || []);

            // 5. Fetch Counselling & Monitoring records
            try {
              const cAndM = await assessmentService.getUserCounsellingAndMonitoring(dbUser.user_id);
              setCounsellingHistory(cAndM.counsellingHistory || []);
              setActiveMonitoring(cAndM.monitoring || null);
            } catch (cErr) {
              console.error("Error loading user counselling/monitoring data:", cErr);
            }
          }
        } catch (e) {
          console.error("Failed to load user live database profile:", e);
        }
      }
      loadDbData();
      const intervalId = setInterval(loadDbData, 4000);
      return () => clearInterval(intervalId);
    }
  }, [employeeId]);

  /* ─── EFFECT: Sync Test Activation from Supabase Database ─── */
  useEffect(() => {
    async function checkDatabaseAssessment() {
      if (!employeeId || !isSupabaseConfigured) return;
      try {
        let resolvedEmployeeId = employeeId;
        const { data: uData } = await supabase
          .from('USERS')
          .select('user_id')
          .eq('hrms_id', employeeId)
          .single();
        if (uData?.user_id) {
          resolvedEmployeeId = uData.user_id;
        }

        // Fetch active/pending assessments for this user
        const { data: assessments, error } = await supabase
          .from('ASSESSMENT')
          .select('assessment_id, status, assessment_type, due_date')
          .eq('employee_id', resolvedEmployeeId)
          .in('status', ['Pending', 'AVAILABLE', 'LOCKED', 'IN_PROGRESS'])
          .order('created_at', { ascending: false });

        if (!error && assessments) {
          const activatedTime = Number(localStorage.getItem(`pm_test_activated_time_${employeeId}`)) || 0;
          const isRecent = Date.now() - activatedTime < 15000; // 15 seconds guard

          const pmAssessments = assessments.filter(a => {
            const t = (a.assessment_type || "").toLowerCase();
            return t.includes("checklist") || t.includes("pointsman") || t.includes("competency");
          });

          if (pmAssessments.length > 0) {
            const activeAssess = pmAssessments[0];
            
            let isActive = ['Pending', 'AVAILABLE', 'IN_PROGRESS'].includes(activeAssess.status);
            if (!isActive && activeAssess.status === 'LOCKED' && activeAssess.due_date) {
              let timeStr = "12:00 AM";
              const tMatch = (activeAssess.assessment_type || "").match(/Time:\s*([^\n\r|]+)/i);
              if (tMatch) timeStr = tMatch[1].trim();
              
              let hours = 0;
              let minutes = 0;
              const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (timeParts) {
                hours = parseInt(timeParts[1]);
                minutes = parseInt(timeParts[2]);
                const ampm = timeParts[3].toUpperCase();
                if (ampm === "PM" && hours < 12) hours += 12;
                if (ampm === "AM" && hours === 12) hours = 0;
              } else {
                const parts24 = timeStr.match(/(\d+):(\d+)/);
                if (parts24) {
                  hours = parseInt(parts24[1]);
                  minutes = parseInt(parts24[2]);
                }
              }
              
              let year = 2026, month = 5, day = 12;
              if (activeAssess.due_date.includes("-")) {
                const parts = activeAssess.due_date.split("-");
                if (parts[0].length === 4) {
                  year = parseInt(parts[0]);
                  month = parseInt(parts[1]) - 1;
                  day = parseInt(parts[2]);
                } else {
                  day = parseInt(parts[0]);
                  month = parseInt(parts[1]) - 1;
                  year = parseInt(parts[2]);
                }
              }
              const targetDate = new Date(year, month, day, hours, minutes, 0);
              isActive = new Date() >= targetDate;
            }

            if (isActive) {
              const currentActivated = localStorage.getItem(`pm_test_activated_${employeeId}`);
              if (currentActivated !== "true") {
                localStorage.setItem(`pm_test_activated_${employeeId}`, "true");
                window.dispatchEvent(new Event("storage"));
              }
              if (testAssigned !== "Assigned") {
                setTestAssigned("Assigned");
                localStorage.setItem(`pm_test_assigned_${employeeId}`, "Assigned");
              }
            } else {
              if (!isRecent) {
                const currentActivated = localStorage.getItem(`pm_test_activated_${employeeId}`);
                if (currentActivated !== "false") {
                  localStorage.setItem(`pm_test_activated_${employeeId}`, "false");
                  window.dispatchEvent(new Event("storage"));
                }
              }
            }
          } else {
            if (!isRecent) {
              const currentActivated = localStorage.getItem(`pm_test_activated_${employeeId}`);
              if (currentActivated !== "false") {
                localStorage.setItem(`pm_test_activated_${employeeId}`, "false");
                window.dispatchEvent(new Event("storage"));
              }
            }
          }
        }
      } catch (err) {
        console.error("Error checking database assessment for PM:", err);
      }
    }

    checkDatabaseAssessment();
    const dbInterval = setInterval(checkDatabaseAssessment, 4000);
    return () => clearInterval(dbInterval);
  }, [employeeId, testAssigned]);

  /* ─── EFFECT: Secure Session CountDown ─── */
  useEffect(() => {
    const sessionTimer = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(sessionTimer);
          stopAlarmSound();
          alert("Secure Session Timeout (15 mins reached). For safety, you are logged out of the Indian Railways Operations Panel.");
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(sessionTimer);
  }, [onLogout]);

  /* ─── EFFECT: Assessment MCQ Countdown Timer ─── */
  useEffect(() => {
    let timer = null;
    if (isAssessmentTimerRunning && assessmentTimeLeft > 0) {
      timer = setInterval(() => {
        setAssessmentTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsAssessmentTimerRunning(false);
            submitTest(true); // force auto-submit!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAssessmentTimerRunning, assessmentTimeLeft]);
  /* ─── Derived metrics ─── */
  const approvedHistory = useMemo(() => {
    return history.filter(h => ["Approved", "Completed"].includes(h.approvalStatus));
  }, [history]);

  const latestApprovedAttempt = history.find(h => ["Approved", "Completed"].includes(h.approvalStatus));
  const hasUnapproved = history.some(h => ["Submitted", "Pending"].includes(h.approvalStatus));

  const latestScore = latestApprovedAttempt
    ? latestApprovedAttempt.totalScore
    : (hasUnapproved ? "Awaiting Approval" : null);

  const latestCategory = latestApprovedAttempt
    ? (latestApprovedAttempt.category || getCategory(latestApprovedAttempt.isOnlineExam ? (latestApprovedAttempt.totalScore/25)*100 : latestApprovedAttempt.totalScore))
    : (hasUnapproved ? "Awaiting Approval" : "—");

  const averageScore = approvedHistory.length
    ? Math.round(approvedHistory.reduce((s, i) => s + (i.isOnlineExam ? (i.totalScore/25)*100 : i.totalScore), 0) / approvedHistory.length)
    : 0;
  const answeredCount = responses.filter(v => v !== null).length;
  const completionRate = Math.round((answeredCount / 25) * 100);

  /* ─── Dynamic Performance Summary ─── */
  const performanceSummaryText = useMemo(() => {
    const rec = myAssessSelected || selectedRecord;
    if (!rec || !rec.sections || rec.sections.length === 0) return "";
    const { totalScore, sections } = rec;
    const lowestSec = [...sections].sort((a, b) => a.marks - b.marks)[0];
    const highestSec = [...sections].sort((a, b) => b.marks - a.marks)[0];

    let summary = `Assessment score achieved: ${totalScore}/100 (${totalScore >= 80 ? 'Outstanding Competency' : totalScore >= 50 ? 'Satisfactory Operations' : 'Requires Training'}). `;
    summary += `Demonstrated excellent competency in "${highestSec.title}" scoring ${highestSec.marks}/${highestSec.outOf} marks. `;
    if (lowestSec.marks < lowestSec.outOf) {
      summary += `However, low-scoring markers are observed in "${lowestSec.title}" (${lowestSec.marks}/${lowestSec.outOf}). It is highly recommended to study the Station Working Rules (SWR) for points locking/shunting and undergo periodic coaching.`;
    } else {
      summary += `Achieved flawless accuracy in all modules. Recommended to maintain this premium standard in daily track shunting.`;
    }
    return summary;
  }, [myAssessSelected, selectedRecord]);

  /* ─── Chart data ─── */
  const trendData = useMemo(() =>
    [...history].reverse().map(r => ({
      date: r.assessmentPeriod.slice(0, 7),
      score: r.totalScore
    })), [history]);

  const pieData = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    history.forEach(r => { counts[r.category || getCategory(r.totalScore)]++; });
    const total = history.length || 1;
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([cat, count]) => ({
        name: cat,
        value: Math.round((count / total) * 100),
        count
      }));
  }, [history]);

  /* ─── Filtered / sorted history ─── */
  const filteredHistory = useMemo(() => {
    let list = history.filter(item =>
      historyDateSearch.trim() === "" || item.date.includes(historyDateSearch.trim())
    );
    if (historySortOrder === "score-asc") list = [...list].sort((a, b) => a.totalScore - b.totalScore);
    else if (historySortOrder === "score-desc") list = [...list].sort((a, b) => b.totalScore - a.totalScore);
    else if (historySortOrder === "date-asc") list = [...list].sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [history, historyDateSearch, historySortOrder]);

  /* ─── Navigation ─── */
  const goToNavPage = (key) => {
    setActiveNav(key);
    setScreenMode("default");
    setStatusText("");
  };

  const openScorecard = (record) => {
    setSelectedRecord(record);
    setActiveNav("history");
    setScreenMode("scorecard");
  };

  const logActivity = (category, action) => {
    const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      id: Date.now(),
      timestamp: time,
      category,
      action,
      user: fullName
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const triggerNotification = (type, message) => {
    const newAlert = {
      id: Date.now(),
      type,
      message,
      time: "Just now",
      read: false
    };
    setNotifications(prev => [newAlert, ...prev]);
  };

  /* ─── My Assessment Test Actions (mirrors SM) ─── */
  const startTestAttempt = () => {
    setPmActiveQIdx(0);
    setPmTestResponses(Array(25).fill(null));
    setScreenMode("takeTest");
  };

  const handleSubmitTestAttempt = () => {
    const correctCount = pmTestResponses.filter((r, idx) => r === testQuestions[idx].answer).length;
    const percentage = Math.round((correctCount / 25) * 100);
    const passStatus = percentage >= 60 ? "PASSED" : "FAILED";
    const today = new Date().toISOString().slice(0, 10);
    const testResult = {
      completed: true,
      correctCount,
      responses: [...pmTestResponses],
      submittedDate: today,
      percentage,
      passStatus
    };
    localStorage.setItem(`pm_mcq_test_${employeeId}`, JSON.stringify(testResult));
    setPmMcqTest(testResult);
    localStorage.setItem(`pm_test_assigned_${employeeId}`, "Completed");
    setTestAssigned("Completed");
    const record = {
      id: Date.now(),
      date: today,
      assessmentPeriod: "Q2 2026",
      name: TEST_NAME,
      assessedBy: "Online Self-Exam",
      totalScore: correctCount,
      sections: [
        { title: "Signal Rules",          marks: 0, outOf: 20 },
        { title: "Track Handling",         marks: 0, outOf: 20 },
        { title: "Communication",          marks: 0, outOf: 20 },
        { title: "Safety Response",        marks: 0, outOf: 20 },
        { title: "Operational Judgement",  marks: 0, outOf: 20 }
      ],
      responses: [...pmTestResponses],
      approvalStatus: "Pending",
      isOnlineExam: true
    };
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem(`pm_history_${employeeId}`, JSON.stringify(newHistory));

    if (isSupabaseConfigured && dbUserRecordId) {
      dbService.submitTestAttempt({
        employee_id: dbUserRecordId,
        obtained_marks: correctCount,
        percentage: percentage,
        category: percentage >= 80 ? "A" : percentage >= 50 ? "B" : percentage >= 26 ? "C" : "D",
        total_marks: 25
      });
    }

    setScreenMode("default");
    setStatusText(`Assessment submitted! Score: ${percentage}% (${correctCount}/25). Status: Completed.`);
  };

  /* ─── Test Actions ─── */
  const handleReattempt = () => {
    localStorage.removeItem(`pm_mcq_test_${employeeId}`);
    localStorage.setItem(`pm_current_test_${employeeId}`, JSON.stringify(currentTestSeed));
    setCurrentTest(currentTestSeed);
    setActiveTest(currentTestSeed);
    setResponses(Array(25).fill(null));
    setCurrentQuestion(0);
    setStatusText("New CBT shunting safety test session initialized.");
    setActiveNav("current");
    setScreenMode("attempt");
    logActivity("Assessment", "Periodic CBT assessment re-attempt session started.");
    triggerNotification("info", "New shunting safety CBT competency exam session active.");
  };

  const startTest = () => {
    setActiveTest(currentTest || currentTestSeed);
    setResponses(Array(25).fill(null));
    setCurrentQuestion(0);
    setStatusText("");
    setIsAssessmentTimerRunning(false);
    setActiveNav("current");
    setScreenMode("attempt");
    logActivity("Assessment", "Periodic assessment test started.");
  };

  const handleSelectOption = (idx) => {
    setResponses(prev => { const n = [...prev]; n[currentQuestion] = idx; return n; });
  };

  const evaluateTest = () => {
    let correct = 0;
    const sec = [0, 0, 0, 0, 0];
    responses.forEach((r, i) => {
      const si = Math.floor(i / 5);
      if (r === testQuestions[i].answer) { correct++; sec[si] += 1; }
    });
    const sections = [
      "Signal Rules", 
      "Track Handling", 
      "Communication", 
      "Safety Response", 
      "Operational Judgement"
    ].map((title, i) => ({ title, marks: sec[i], outOf: 5 }));
    return { totalScore: correct, sections };
  };

  const submitTest = (isAutoSubmit = false) => {
    setIsAssessmentTimerRunning(false);
    const { totalScore, sections } = evaluateTest();
    const today = new Date().toISOString().slice(0, 10);
    const record = {
      id: Date.now(),
      date: today,
      name: TEST_NAME,
      assessmentPeriod: activeTest ? activeTest.period : "April 2026",
      totalScore,
      sections,
      responses: [...responses],
      approvalStatus: "Pending",
      isOnlineExam: true
    };
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem(`pm_history_${employeeId}`, JSON.stringify(newHistory));
    
    setCurrentTest(null);
    localStorage.setItem(`pm_current_test_${employeeId}`, JSON.stringify(null));

    // Save MCQ result for Station Master
    const correctCount = totalScore;
    const percentage = Math.round((correctCount / 25) * 100);
    const mcqResult = {
      completed: true,
      correctCount: correctCount,
      submittedDate: today,
      percentage: percentage
    };
    localStorage.setItem(`pm_mcq_test_${employeeId}`, JSON.stringify(mcqResult));

    setSelectedRecord(record);
    setActiveTest(null);
    setActiveNav("history");
    setScreenMode("scorecard");

    if (isSupabaseConfigured && dbUserRecordId) {
      dbService.submitTestAttempt({
        employee_id: dbUserRecordId,
        obtained_marks: totalScore,
        percentage: percentage,
        category: getCategory(percentage),
        total_marks: 25
      });
    }
    
    const label = isAutoSubmit ? "Auto-submitted (Time Expired)" : "Submitted Successfully";
    setStatusText(`Assessment evaluation completed! ${label}.`);
    logActivity("Assessment", `Submitted test with score ${totalScore}/25 (Cat. ${getCategory(percentage)})`);
    triggerNotification("success", `Assessment complete! Score: ${totalScore}/25. Grade: Category ${getCategory(percentage)}`);
  };

  /* ─── Secure Session Actions ─── */
  const refreshSession = () => {
    setSessionTimeLeft(900);
    logActivity("Auth", "User secure login session refreshed to 15:00.");
    triggerNotification("success", "Operations login session renewed safely.");
  };

  /* ─── File Attachment Handlers ─── */
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const files = Array.from(e.target.files).map(f => ({
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(2) + " MB"
      }));
      setAttachedFiles(prev => [...prev, ...files]);
      logActivity("Safety", `Attached safety evidence: ${files.map(x=>x.name).join(', ')}`);
    }
  };

  const removeAttachedFile = (idx) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  /* ─── Form Submission: Track Issue ─── */
  const submitTrackIssue = (e) => {
    e.preventDefault();
    if (!trackLocation.trim() || !trackDesc.trim()) {
      alert("Please fill in location and description details.");
      return;
    }
    const newReport = {
      id: Date.now(),
      type: "Track Defect",
      defect: trackDefect,
      location: `${trackLine} - KM ${trackLocation}`,
      severity: trackSeverity,
      status: "PENDING MASTER ACTION",
      date: new Date().toISOString().slice(0, 10),
      desc: trackDesc,
      attachments: [...attachedFiles]
    };
    setSafetyReports(prev => [newReport, ...prev]);
    
    if (isSupabaseConfigured && dbUserRecordId) {
      dbService.logIncident({
        user_id: dbUserRecordId,
        incident_type: trackDefect,
        incident_date: new Date().toISOString().slice(0, 10),
        severity: trackSeverity,
        remarks: `${trackDesc} | Location: ${trackLine} - KM ${trackLocation}`
      });
    }

    logActivity("Safety", `Safety track defect reported: ${trackDefect} at KM ${trackLocation}`);
    triggerNotification("danger", `SAFETY REPORT SUBMITTED: Defect: ${trackDefect} | Loc: KM ${trackLocation}`);
    
    // Reset
    setTrackLocation("");
    setTrackDesc("");
    setAttachedFiles([]);
    setFileInputKey(Date.now());
    setSafetySubTab("history");
    setStatusText("Safety report logged. Forwarded to Station Master & P-Way inspector.");
  };

  /* ─── Form Submission: Incident ─── */
  const submitIncidentReport = (e) => {
    e.preventDefault();
    if (!incidentTrain.trim() || !incidentAction.trim()) {
      alert("Please enter Train Number and Actions taken.");
      return;
    }
    const newReport = {
      id: Date.now(),
      type: "Abnormal Incident",
      defect: incidentType,
      location: `Train ${incidentTrain} (${incidentTime || "Current"})`,
      severity: "High - Immediate Action",
      status: "STATION INVESTIGATION ACTIVE",
      date: new Date().toISOString().slice(0, 10),
      desc: incidentAction,
      attachments: [...attachedFiles]
    };
    setSafetyReports(prev => [newReport, ...prev]);
    
    if (isSupabaseConfigured && dbUserRecordId) {
      dbService.logIncident({
        user_id: dbUserRecordId,
        incident_type: incidentType,
        incident_date: new Date().toISOString().slice(0, 10),
        severity: "High - Immediate Action",
        remarks: `${incidentAction} | Train: ${incidentTrain} (${incidentTime || "Current"})`
      });
    }

    logActivity("Safety", `Abnormal incident logged: ${incidentType} in Train ${incidentTrain}`);
    triggerNotification("warning", `INCIDENT ALERT: ${incidentType} detected on Train ${incidentTrain}.`);
    
    // Reset
    setIncidentTrain("");
    setIncidentAction("");
    setIncidentTime("");
    setAttachedFiles([]);
    setFileInputKey(Date.now());
    setSafetySubTab("history");
    setStatusText("Abnormal incident report logged and dispatched to Division Controller.");
  };

  /* ─── Emergency Broadcast Actions ─── */
  const openEmergencyDialog = () => {
    setEmergencyModalOpen(true);
  };

  const triggerEmergencyBroadcast = () => {
    setEmergencyModalOpen(false);
    setEmergencyActive(true);
    setAlarmMuted(false);
    startAlarmSound();
    
    logActivity("EMERGENCY", `CRITICAL: Pulse emergency alert triggered! Type: ${emergencyType} at ${emergencyLocation}`);
    triggerNotification("danger", `🚨 BROADCAST ACTIVE: ${emergencyType} at ${emergencyLocation}. Dispatching rescue!`);
    setStatusText("EMERGENCY BROADCAST TRANSMITTING SYSTEM-WIDE!");
  };

  const clearEmergencyState = () => {
    setEmergencyActive(false);
    stopAlarmSound();
    logActivity("EMERGENCY", "Emergency alert acknowledged and cleared.");
    triggerNotification("success", "Emergency alert deactivated. Operational line clear reinstated.");
    setStatusText("Emergency broadcast deactivated. Tracks returned to safe normal status.");
  };

  const toggleAlarmMute = () => {
    if (alarmMuted) {
      startAlarmSound();
      setAlarmMuted(false);
    } else {
      stopAlarmSound();
      setAlarmMuted(true);
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    logActivity("System", "Notifications inbox marked read.");
  };

  /* ═══════════════════════════════════════
     RENDER: PROFILE & AUDIT
  ═══════════════════════════════════════ */
  /* ═══════════════════════════════════════
     RENDER: DASHBOARD
  ═══════════════════════════════════════ */
  /* ═══════════════════════════════════════
     RENDER: DASHBOARD (Extracted)
  ═══════════════════════════════════════ */
  const renderDashboardPage = () => (
    <PointsmanDashboard 
      latestScore={latestScore}
      latestOutOf={latestApprovedAttempt ? (latestApprovedAttempt.isOnlineExam ? 25 : 100) : 100}
      averageScore={averageScore}
      latestCategory={latestCategory}
      historyLength={history.length}
      trendData={trendData}
      pieData={pieData}
    />
  );

  /* ═══════════════════════════════════════
     RENDER: PROFILE (Extracted)
  ═══════════════════════════════════════ */
  const renderProfilePage = () => (
    <PointsmanProfile 
      history={history}
      fullName={fullName}
      profile={profile}
      latestCategory={latestCategory}
      latestScore={latestScore}
      latestOutOf={latestApprovedAttempt ? (latestApprovedAttempt.isOnlineExam ? 25 : 100) : 100}
      employeeId={employeeId}
    />
  );

  /* ═══════════════════════════════════════
     RENDER: MY ASSESSMENT (mirrors SM module exactly)
  ═══════════════════════════════════════ */
  /* ═══════════════════════════════════════
     RENDER: MY ASSESSMENT (Extracted)
  ═══════════════════════════════════════ */
  const renderMyAssessment = () => (
    <PointsmanAssessments 
      myAssessSelected={myAssessSelected}
      setMyAssessSelected={setMyAssessSelected}
      performanceSummaryText={performanceSummaryText}
      testAssigned={testAssigned}
      pmMcqTest={pmMcqTest}
      startTestAttempt={startTestAttempt}
      history={history}
      formatQuarterPeriod={formatQuarterPeriod}
      employeeId={employeeId}
    />
  );

  /* ═══════════════════════════════════════
     RENDER: TAKE TEST SCREEN (Extracted)
  ═══════════════════════════════════════ */
  const renderTakeTest = () => (
    <PointsmanMCQTest 
      pmActiveQIdx={pmActiveQIdx}
      pmTestResponses={pmTestResponses}
      setPmTestResponses={setPmTestResponses}
      setPmActiveQIdx={setPmActiveQIdx}
      setScreenMode={setScreenMode}
      fullName={fullName}
      employeeId={employeeId}
      profile={profile}
      handleSubmitTestAttempt={handleSubmitTestAttempt}
    />
  );

  /* ═══════════════════════════════════════
     RENDER: TEST HISTORY (legacy — kept for internal dispatch)
  ═══════════════════════════════════════ */
  const renderHistoryPage = () => (
    <PointsmanHistoryPage
      history={history}
      filteredHistory={filteredHistory}
      historyPage={historyPage} setHistoryPage={setHistoryPage}
      historyDateSearch={historyDateSearch} setHistoryDateSearch={setHistoryDateSearch}
      historySortOrder={historySortOrder} setHistorySortOrder={setHistorySortOrder}
      openScorecard={openScorecard}
    />
  );

  /* ═══════════════════════════════════════
     RENDER: SCORECARD & QUESTION REVIEW
  ═══════════════════════════════════════ */
  const renderScorecardPage = () => (
    <PointsmanScorecardPage 
      selectedRecord={selectedRecord}
      setScreenMode={setScreenMode}
      performanceSummaryText={performanceSummaryText}
    />
  );

  /* ═══════════════════════════════════════
     RENDER: CURRENT TEST (SCHEDULED)
  ═══════════════════════════════════════ */
  const renderCurrentTestsPage = () => (
    <PointsmanCurrentTestsPage 
      employeeId={employeeId}
      currentTest={currentTest}
      handleReattempt={handleReattempt}
      startTest={startTest}
    />
  );

  /* ═══════════════════════════════════════
     RENDER: TEST ATTEMPT (WITH TIMER)
  ═══════════════════════════════════════ */
  const renderAttemptPage = () => {
    if (!activeTest) return renderCurrentTestsPage();

    return (
      <PointsmanMCQTest 
        pmActiveQIdx={currentQuestion}
        pmTestResponses={responses}
        setPmTestResponses={setResponses}
        setPmActiveQIdx={setCurrentQuestion}
        setScreenMode={setScreenMode}
        fullName={fullName}
        employeeId={employeeId}
        profile={profile}
        handleSubmitTestAttempt={() => submitTest(false)}
        handleExitExam={() => {
          setActiveTest(null);
          setScreenMode("default");
          logActivity("Assessment", "Periodic assessment aborted by user.");
        }}
      />
    );
  };

  /* ═══════════════════════════════════════
     RENDER: SAFETY & EMERGENCY MODULE
  ═══════════════════════════════════════ */
  /* ═══════════════════════════════════════
     RENDER: SAFETY (Extracted)
  ═══════════════════════════════════════ */
  const renderSafetyPage = () => (
    <PointsmanSafetyPage
      safetySubTab={safetySubTab}
      setSafetySubTab={setSafetySubTab}
      openEmergencyDialog={openEmergencyDialog}
      safetyReports={safetyReports}
      submitTrackIssue={submitTrackIssue}
      trackLine={trackLine} setTrackLine={setTrackLine}
      trackLocation={trackLocation} setTrackLocation={setTrackLocation}
      trackDefect={trackDefect} setTrackDefect={setTrackDefect}
      trackSeverity={trackSeverity} setTrackSeverity={setTrackSeverity}
      trackDesc={trackDesc} setTrackDesc={setTrackDesc}
      fileInputKey={fileInputKey}
      handleFileChange={handleFileChange}
      attachedFiles={attachedFiles}
      removeAttachedFile={removeAttachedFile}
      submitIncidentReport={submitIncidentReport}
      incidentType={incidentType} setIncidentType={setIncidentType}
      incidentTrain={incidentTrain} setIncidentTrain={setIncidentTrain}
      incidentTime={incidentTime} setIncidentTime={setIncidentTime}
      incidentAction={incidentAction} setIncidentAction={setIncidentAction}
    />
  );

  /* ─── REF COURSE (Read-Only) ─── */
  const renderRefCourse = () => {
    const latestRef = refHistory[0] || {};
    const refStatus = profile.refStatus?.replace("COMPLETED (Refresher Course) - Status: ", "")?.replace("Status: ", "") || latestRef.refStatus || "Cleared";
    
    // Stats
    const totalCompleted = refHistory.filter(h => h.refStatus === "Completed" || h.refStatus === "Cleared").length;
    const totalPending = refHistory.filter(h => h.refStatus === "Pending" || h.refStatus === "Scheduled" || h.refStatus === "In Progress").length;
    const totalExpired = refHistory.filter(h => h.refStatus === "Expired" || h.refStatus === "Cancelled").length;

    const refBadge = (s) => {
      const map = {
        Completed: "sdom-badge-success", Cleared: "sdom-badge-success",
        Scheduled: "sdom-badge-warning", "In Progress": "sdom-badge-warning", Pending: "sdom-badge-warning",
        Expired: "sdom-badge-danger", Cancelled: "sdom-badge-danger"
      };
      return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{t(s) || t("N/A")}</span>;
    };

    return (
      <div className="sdom-fade" style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 className="sdom-page-title" style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>{t("My REF Course Details")}</h1>
          <p className="sdom-page-subtitle" style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>{t("View your Refresher Course (REF) training history and scheduling details.")}</p>
        </div>

        {/* Dashboard stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #16a34a" }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#16a34a" }}>{latestRef.trainingDate || "—"}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: "uppercase" }}>{t("Last REF Date")}</div>
          </div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #dc2626" }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#dc2626" }}>{latestRef.nextDueDate || "—"}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: "uppercase" }}>{t("Next REF Due Date")}</div>
          </div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #7c3aed" }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#7c3aed" }}>{t(refStatus)}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: "uppercase" }}>{t("Current REF Status")}</div>
          </div>
        </div>

        {/* Counters */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#334155" }}>{totalCompleted}</div>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>{t("Total Completed")}</div>
          </div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#334155" }}>{totalPending}</div>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>{t("Pending / Scheduled")}</div>
          </div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#334155" }}>{totalExpired}</div>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>{t("Expired / Cancelled")}</div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                {["Training Date", "REF Status", "Conducted By", "Next Due Date", "Remarks"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {refHistory.map(row => (
                <tr key={row.training_id} style={{ borderBottom: "1px solid #e8edf2" }}>
                  <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{row.trainingDate || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px" }}>{refBadge(row.refStatus)}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>{t(row.conductedBy) || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#dc2626", fontWeight: "700" }}>{row.nextDueDate || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>{t(row.remarks) || "—"}</td>
                </tr>
              ))}
              {refHistory.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>{t("No refresher training history available.")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ─── Counselling & Monitoring (Read-Only) ─── */
  const renderCounselling = () => {
    // Helper to parse JSON remarks safely
    const parseRemarks = (remarksStr) => {
      if (!remarksStr) return {};
      try {
        if (remarksStr.trim().startsWith("{")) {
          return JSON.parse(remarksStr);
        }
      } catch (e) {
        // Not a JSON string
      }
      return { remarks: remarksStr };
    };

    // Find the current active/scheduled/pending session
    const activeSession = counsellingHistory.find(
      s => s.status === "Pending" || s.status === "Scheduled"
    );

    // Monitoring details
    const monitoringStatus = activeMonitoring?.monitoring_status || "No Active Observation";
    const riskLevel = activeMonitoring?.risk_level || "Low";
    
    // Parse monitoring remarks to extract follow-up review date and review history
    const monitoringRemarks = parseRemarks(activeMonitoring?.remarks);
    const nextReviewDate = monitoringRemarks.followUpDate || "—";
    const monitoringReviews = monitoringRemarks.reviews || [];

    // Helper to get status badges
    const statusBadge = (s) => {
      const map = {
        Pending: "sdom-badge-warning",
        Scheduled: "sdom-badge-warning",
        Completed: "sdom-badge-success",
        Absent: "sdom-badge-danger"
      };
      return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{t(s)}</span>;
    };

    // Helper for Risk Level badge
    const riskBadge = (r) => {
      const map = {
        High: "sdom-badge-danger",
        Medium: "sdom-badge-warning",
        Low: "sdom-badge-success"
      };
      return <span className={`sdom-badge ${map[r] || "sdom-badge-neutral"}`}>{t(r + " Risk")}</span>;
    };

    return (
      <div className="sdom-fade" style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 className="sdom-page-title" style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>{t("Counselling & Monitoring Workspace")}</h1>
          <p className="sdom-page-subtitle" style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>{t("View scheduled sessions, assessment feedback, and active monitoring status.")}</p>
        </div>

        {/* Top Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {/* Active Monitoring Status */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #3b82f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>{t("Monitoring Status")}</div>
              {riskBadge(riskLevel)}
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "12px" }}>{t(monitoringStatus)}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>{t("Next Safety Review Due:")} <span style={{ fontWeight: "700", color: "#dc2626" }}>{nextReviewDate}</span></div>
          </div>

          {/* Active Session Card */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: `4px solid ${activeSession ? "#eab308" : "#10b981"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>{t("Active Counselling Session")}</div>
              {activeSession ? statusBadge(activeSession.status) : <span className="sdom-badge sdom-badge-success">{t("Clear")}</span>}
            </div>
            {activeSession ? (
              <>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginTop: "12px" }}>
                  {t("Scheduled:")} {parseRemarks(activeSession.remarks).scheduledDate || "—"} @ {parseRemarks(activeSession.remarks).scheduledTime || "—"}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>
                  {t("Counsellor:")} <span style={{ fontWeight: "600" }}>{activeSession.counsellorName} ({activeSession.counsellorHrmsId})</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "16px" }}>{t("No counselling sessions currently pending or scheduled.")}</div>
            )}
          </div>
        </div>

        {/* Current Active Session Details (if any) */}
        {activeSession && (
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "24px" }}>
            <div style={{ borderBottom: "1.5px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert style={{ color: "#eab308" }} size={20} />
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{t("Upcoming Session details")}</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{t("DATE & TIME")}</div>
                <div style={{ fontSize: "14px", color: "#1e293b", fontWeight: "700", marginTop: "4px" }}>
                  {parseRemarks(activeSession.remarks).scheduledDate} @ {parseRemarks(activeSession.remarks).scheduledTime}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{t("ASSIGNED COUNSELLOR")}</div>
                <div style={{ fontSize: "14px", color: "#1e293b", fontWeight: "700", marginTop: "4px" }}>
                  {activeSession.counsellorName} ({t("HRMS")}: {activeSession.counsellorHrmsId})
                </div>
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{t("INSTRUCTIONS / SCHEDULING REMARKS")}</div>
              <div style={{ fontSize: "14px", color: "#334155", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}>
                {t(parseRemarks(activeSession.remarks).schedulingRemarks) || t("No instructions provided.")}
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Reviews Timeline */}
        {monitoringReviews.length > 0 && (
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "24px" }}>
            <div style={{ borderBottom: "1.5px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{t("Safety Monitoring Review Logs")}</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {monitoringReviews.map((rev, idx) => (
                <div key={idx} style={{ padding: "16px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{t("Review by:")} {rev.reviewer}</span>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{rev.reviewDate}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{t("Risk Level Assigned:")}</span>
                    {riskBadge(rev.riskLevel)}
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>{t(rev.remarks)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Counselling History Table */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ borderBottom: "1.5px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{t("Counselling History Logs")}</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                  {["Date", "Counsellor", "Status", "Remarks & Observations"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>{t(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {counsellingHistory.map(row => {
                  const rem = parseRemarks(row.remarks);
                  return (
                    <tr key={row.counselling_id} style={{ borderBottom: "1px solid #e8edf2" }}>
                      <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                        {rem.scheduledDate || "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>
                        {row.counsellorName} ({t("HRMS")}: {row.counsellorHrmsId})
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                        {statusBadge(row.status)}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>
                        {row.status === "Completed" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div><strong>{t("Safety Concerns:")}</strong> {t(rem.safetyConcerns) || t("None noted.")}</div>
                            <div><strong>{t("Behavioral Observations:")}</strong> {t(rem.observations || rem.behaviouralConcerns) || "—"}</div>
                            <div><strong>{t("Recommendations:")}</strong> {t(rem.recommendations) || "—"}</div>
                            <div><strong>{t("Follow-up Actions:")}</strong> {t(rem.followUpActions) || "—"}</div>
                          </div>
                        )}
                        {row.status === "Absent" && (
                          <div style={{ color: "#dc2626" }}>
                            <strong>{t("Absence Reason:")}</strong> {t(rem.absenceRemarks) || t("Unexcused absence.")}
                          </div>
                        )}
                        {row.status === "Scheduled" && (
                          <div style={{ color: "#64748b", fontStyle: "italic" }}>
                            {t("Session is scheduled. Instructions:")} {t(rem.schedulingRemarks) || "—"}
                          </div>
                        )}
                        {row.status === "Pending" && (
                          <div style={{ color: "#64748b" }}>
                            {t("Pending scheduling by Station Master.")}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {counsellingHistory.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                      {t("No counselling records available.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ─── Content dispatcher ─── */
  const renderBodyContent = () => {
    if (screenMode === "takeTest") return renderTakeTest();
    if (screenMode === "attempt") return renderAttemptPage();
    if (screenMode === "scorecard") return renderScorecardPage();
    if (activeNav === "dashboard") return renderDashboardPage();
    if (activeNav === "profile") return renderProfilePage();
    if (activeNav === "myAssessment") return renderMyAssessment();
    if (activeNav === "current") return renderCurrentTestsPage();
    if (activeNav === "safety") return renderSafetyPage();
    if (activeNav === "refCourse") return renderRefCourse();
    if (activeNav === "counselling") return renderCounselling();
    return renderDashboardPage();
  };

  /* ═══════════════════════════════════════
     SHELL LAYOUT
  ═══════════════════════════════════════ */
  return (
    <div className={`pm-layout ${emergencyActive ? "emergency-glow-active" : ""}`}>
      <input type="checkbox" id="sdom-sidebar-toggle" className="sdom-sidebar-checkbox" style={{ display: "none" }} />
      <label htmlFor="sdom-sidebar-toggle" className="sdom-sidebar-close-backdrop"></label>
      
      {/* ── Flashing Emergency Alert Banner ── */}
      {emergencyActive && (
        <div className="pm-emergency-siren-banner">
          <div className="siren-message">
            <span className="siren-light animate-flash">🚨 {t("Security Alert")}</span>
            <strong>{t("MANDATORY EMERGENCY BROADCAST ACTIVE:")} {t(emergencyType)} {t("detected at")} {emergencyLocation}! {t("All train & siding movements are frozen immediately.")}</strong>
          </div>
          <div className="siren-controls">
            <button className="pm-siren-mute-btn" onClick={toggleAlarmMute}>
              {alarmMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {alarmMuted ? t("Unmute Alarm") : t("Mute Sound")}
            </button>
            <button className="pm-siren-clear-btn" onClick={clearEmergencyState}>
              {t("Clear & Safe Return")}
            </button>
          </div>
        </div>
      )}

      <header className="pm-topbar">
        <label htmlFor="sdom-sidebar-toggle" className="sdom-sidebar-toggle-btn" style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", background: "none", border: "none", color: "#ffffff", marginRight: "12px" }}>
          &#9776;
        </label>
        <div className="pm-topbar-brand">
          <div className="pm-topbar-logo"><img src="/logo.webp" alt="IR Logo" style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }} /></div>
          <div>
            <h1>{t("Indian Railway Evaluation System")}</h1>
            <p><span className="desktop-only-txt">Operations Workspace: </span>{t("Pointsman")}<span className="desktop-only-txt"> Module</span></p>
          </div>
        </div>

        <div className="pm-user-strip" style={{ gap: "12px", alignItems: "center" }}>
          <LanguageSelector />
          
          {/* ── Real-Time Notifications Bell Dropdown ── */}
          <div className="pm-notification-bell-container">
            <button className="pm-bell-btn" onClick={() => setBellDropdownOpen(!bellDropdownOpen)}>
              <Bell size={20} />
              {unreadNotificationsCount > 0 && (
                <span className="pm-bell-badge">{unreadNotificationsCount}</span>
              )}
            </button>

            {bellDropdownOpen && (
              <div className="pm-bell-dropdown">
                <div className="pm-bell-header">
                  <h4>{t("Operations Notifications")}</h4>
                  {unreadNotificationsCount > 0 && (
                    <button onClick={markAllNotificationsRead}>{t("Mark read")}</button>
                  )}
                </div>
                <div className="pm-bell-list">
                  {notifications.map(n => (
                    <div key={n.id} className={`pm-bell-item ${n.read ? 'read' : 'unread'} type-${n.type}`}>
                      <div className="pm-bell-item-dot"></div>
                      <div className="pm-bell-item-content">
                        <p>{t(n.message)}</p>
                        <span>{t(n.time)}</span>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="pm-bell-empty">{t("No alerts received today.")}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pm-user-avatar">{fullName.charAt(0)}</div>
          <div>
            <strong>{fullName}</strong>
            <span>{t("HRMS ID")}: {employeeId}</span>
          </div>
          <button className="pm-logout-btn" onClick={() => { stopAlarmSound(); onLogout(); }}>
            <LogOut size={15} /> {t("Log Out")}
          </button>
        </div>
      </header>

      <div className="pm-content-shell">
        <aside className="pm-sidebar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeNav === item.key && screenMode === "default";
            return (
              <button
                key={item.key}
                className={`pm-nav-item ${isActive ? "active" : ""}`}
                onClick={() => { goToNavPage(item.key); setBellDropdownOpen(false); }}
              >
                <Icon size={18} />
                <span>{t(item.label)}</span>
              </button>
            );
          })}
        </aside>

        <main className="pm-main-panel">
          <div className="pm-main-header-band">
            <div>
              <p className="pm-hero-eyebrow">{t("Nagpur Junction Operations")}</p>
              <h2 className="pm-main-title">
                {screenMode === "scorecard" ? t("Detailed Evaluation Scorecard")
                  : screenMode === "attempt" ? t("Competency Examination Attempt")
                  : t(navItems.find(i => i.key === activeNav)?.label || "Workspace")}
              </h2>
            </div>
            <div className="pm-header-kpis">
              <div className="pm-hkpi">
                <Award size={14} />
                <span>{history.length} {t("Assessments")}</span>
              </div>
              <div className="pm-hkpi">
                <Gauge size={14} />
                <span>{t("Avg")} {Math.round(averageScore)}%</span>
              </div>
              {latestCategory !== "Untested" && latestCategory !== "—" && (
                <div className="pm-hkpi" style={{ color: getCategoryColor(latestCategory) }}>
                  <ShieldCheck size={14} />
                  <span>{t("Cat.")} {latestCategory}</span>
                </div>
              )}
            </div>
          </div>

          {statusText && (
            <div className="pm-status-banner">
              <CheckCircle2 size={15} /> {statusText}
            </div>
          )}

          {renderBodyContent()}
        </main>
      </div>

      {/* ── EMERGENCY BROADCAST SETUP MODAL ── */}
      {emergencyModalOpen && (
        <div className="pm-emergency-modal-overlay">
          <div className="pm-emergency-modal">
            <div className="modal-header">
              <h2>{t("🚨 CONFIRM URGENT DIVISION-WIDE BROADCAST")}</h2>
              <button onClick={() => setEmergencyModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="danger-notice">
                {t("WARNING: Triggering this broadcast sends an audio warning signal and locks shunting/movement panels on all active Station Master & Superintendent terminals! Use for genuine safety emergencies only.")}
              </p>
              <div className="modal-fields">
                <label>{t("Emergency Category")}</label>
                <select value={emergencyType} onChange={e => setEmergencyType(e.target.value)}>
                  <option value="Obstruction on Track">{t("Obstruction on Siding (Fouling Clearance)")}</option>
                  <option value="Derailment Danger">{t("Visible Rail Crack / Splitting Point")}</option>
                  <option value="Signal Failure">{t("Critical Signal Lock Failure")}</option>
                  <option value="Hot Axle Fire Spark">{t("Hot Axle / Spark Smoke in Incoming train")}</option>
                  <option value="Other Danger">{t("Other Major Track Danger")}</option>
                </select>
                
                <label>{t("Vulnerable Location / Track")}</label>
                <input 
                  type="text" 
                  value={emergencyLocation} 
                  onChange={e => setEmergencyLocation(e.target.value)} 
                  placeholder={t("e.g. Line 2 Loop Siding, KM 102/4")} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setEmergencyModalOpen(false)}>{t("Cancel")}</button>
              <button className="confirm-btn" onClick={triggerEmergencyBroadcast}>
                {t("CONFIRM & BROADCAST ALARM")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PointsmanModule;
