import { useMemo, useState, useEffect } from "react";
import { useLanguage } from "./contexts/LanguageContext";
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
  Plus
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
import { dbService, supabase, isSupabaseConfigured } from "./supabaseClient";
import { saDataService } from "./services/saDataService";
import { assessmentService } from "./services/assessmentService";

/* â”€â”€â”€ Navigation â”€â”€â”€ */
const navItems = [
  { key: "dashboard", label: "Dashboard", icon: Gauge },
  { key: "myAssessment", label: "My Assessment", icon: FileBarChart2 },
  { key: "profile", label: "My Profile", icon: UserCircle2 }
];

import {
  getCategory,
  getCategoryColor,
  getCategoryBg,
  formatQuarterPeriod,
  PIE_COLORS,
  CustomPieTooltip
} from "./utils/tmUtils";

import {
  trainManagerProfile,
  TEST_NAME,
  testQuestions,
  initialHistory,
  currentTestSeed
} from "./data/mockTMData";

import { TMDashboard } from "./pages/train-manager/TMDashboard";
import { TMProfile } from "./pages/train-manager/TMProfile";
import { TMSafety } from "./pages/train-manager/TMSafety";
import { TMMyAssessment } from "./pages/train-manager/TMMyAssessment";

import { useEmergencyAlarm } from "./hooks/useEmergencyAlarm";

/* â”€â”€â”€ Main component â”€â”€â”€ */
function TrainManagerModule({ user, onLogout }) {
  const { t } = useLanguage();
  const [liveUser, setLiveUser] = useState(user);
  const [activeMonitoring, setActiveMonitoring] = useState(null);
  const [counsellingHistory, setCounsellingHistory] = useState([]);

  const fullName = liveUser?.name || user?.name || "Train Manager";
  const employeeId = liveUser?.hrmsId || user?.hrmsId || "TM_1001";

  const { startAlarmSound, stopAlarmSound } = useEmergencyAlarm();

  // Clear any stale cached history from sessionStorage (may contain old mock/seed data)
  useEffect(() => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith("tm_history_")) keysToRemove.push(k);
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch(e) { /* ignore */ }
  }, []);

  const [activeNav, setActiveNav] = useState("dashboard");
  const [screenMode, setScreenMode] = useState("default");

  const [history, setHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`tm_history_${employeeId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error parsing history from sessionStorage", e);
    }
    return [];
  });

  useEffect(() => {
    async function loadHistory() {
      if (employeeId) {
        try {
          const uData = await saDataService.fetchUsers();
          const found = uData.find(x => x.id?.toLowerCase() === employeeId.toLowerCase());
          if (found) {
            setLiveUser({
              ...found,
              mobile: found.contact,
              hrmsId: found.id
            });
          }

          if (isSupabaseConfigured) {
            const res = await assessmentService.getUserCounsellingAndMonitoring(employeeId);
            if (res) {
              setCounsellingHistory(res.counsellingHistory || []);
              setActiveMonitoring(res.monitoring || null);
            }
          }

          const data = await dbService.getTestHistory(employeeId);
          if (data && data.length > 0) {
            const mapped = data.map(attempt => {
              const isApproved = attempt.ASSESSMENT?.status === "Approved";
              const type = attempt.ASSESSMENT?.assessment_type || "";
              let parsedAnswers = attempt.answers || attempt.ANSWER_HISTORY;
              if (typeof parsedAnswers === "string") {
                try { parsedAnswers = JSON.parse(parsedAnswers); } catch (e) { }
              }
              if (Array.isArray(parsedAnswers)) {
                parsedAnswers = [...parsedAnswers].sort((a, b) => {
                  const qIdA = a.questionId || a.question_id || 0;
                  const qIdB = b.questionId || b.question_id || 0;
                  return qIdA - qIdB;
                });
              }
              const isOnlineExam = Array.isArray(parsedAnswers) || attempt.total_marks === 25 || (parsedAnswers && !parsedAnswers.trainSafety && !parsedAnswers.alcoholicStatus);
              const score = attempt.obtained_marks !== null && attempt.obtained_marks !== undefined ? attempt.obtained_marks : (attempt.percentage || 0);

              let totalScoreVal = score;
              if (isOnlineExam) {
                totalScoreVal = score > 25 ? Math.round(score / 4) : score;
              }

              const responses = (parsedAnswers && Array.isArray(parsedAnswers)) ? parsedAnswers.map(a => a.selectedOption || a.selected_option) : [];

              const ans = parsedAnswers || {};
              const countYes = arr => (arr && Array.isArray(arr)) ? arr.filter(v => v === "Yes").length : 0;

              let s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, mcqScore = 0;
              if (isOnlineExam && Array.isArray(parsedAnswers)) {
                parsedAnswers.forEach((item, idx) => {
                  const secIdx = Math.floor(idx / 5);
                  const itemCorrect = item.isCorrect || item.is_correct || (item.marksObtained > 0) || (item.marks_obtained > 0);
                  if (itemCorrect) {
                    if (secIdx === 0) s1++;
                    else if (secIdx === 1) s2++;
                    else if (secIdx === 2) s3++;
                    else if (secIdx === 3) s4++;
                    else if (secIdx === 4) s5++;
                  }
                });
              } else if (ans && typeof ans === "object" && !Array.isArray(ans) && (ans.trainSafety !== undefined || ans.signaling !== undefined)) {
                s1 = countYes(ans.trainSafety) * 3;
                s2 = countYes(ans.signaling) * 3;
                s3 = countYes(ans.shunting) * 3;
                s4 = countYes(ans.documentation) * 3;
                s5 = countYes(ans.emergency) * 3;
                mcqScore = Math.min(parseInt(ans.knowledgeMarks) || 0, 25);
              } else if (ans && typeof ans === "object" && !Array.isArray(ans) && ans.sections && Array.isArray(ans.sections)) {
                // AOM approved — sections embedded in answers JSON
                ans.sections.forEach((sec, i) => {
                  const m = sec.marks || 0;
                  if (i === 0) s1 = m;
                  else if (i === 1) s2 = m;
                  else if (i === 2) s3 = m;
                  else if (i === 3) s4 = m;
                  else if (i === 4) s5 = m;
                  else if (i === 5) mcqScore = m;
                });
              } else {
                s1 = Math.round(score * 0.15);
                s2 = Math.round(score * 0.15);
                s3 = Math.round(score * 0.15);
                s4 = Math.round(score * 0.15);
                s5 = Math.round(score * 0.15);
                mcqScore = Math.round(score * 0.25);
              }

              const sections = !isOnlineExam ? [
                { title: "Train Safety & Brake Inspection", marks: s1, outOf: 15 },
                { title: "Signaling & Whistle Compliance", marks: s2, outOf: 15 },
                { title: "Shunting & Coupling Ops", marks: s3, outOf: 15 },
                { title: "Train Log & Guard Certificates", marks: s4, outOf: 15 },
                { title: "Emergency Train Protection", marks: s5, outOf: 15 },
                { title: "Written Exam (Knowledge)", marks: mcqScore, outOf: 25 }
              ] : [
                { title: "Signal Rules", marks: Array.isArray(parsedAnswers) ? s1 : Math.round(totalScoreVal * 0.20), outOf: 5 },
                { title: "Track Handling", marks: Array.isArray(parsedAnswers) ? s2 : Math.round(totalScoreVal * 0.20), outOf: 5 },
                { title: "Communication", marks: Array.isArray(parsedAnswers) ? s3 : Math.round(totalScoreVal * 0.20), outOf: 5 },
                { title: "Safety Response", marks: Array.isArray(parsedAnswers) ? s4 : Math.round(totalScoreVal * 0.20), outOf: 5 },
                { title: "Operational Judgement", marks: Array.isArray(parsedAnswers) ? s5 : Math.round(totalScoreVal * 0.20), outOf: 5 }
              ];

              // Use AOM-approved category from DB if approved, else calculate
              const dbCategory = attempt.category || null;
              const approvalStatus = attempt.ASSESSMENT?.status || "Submitted";

              return {
                id: attempt.attempt_id,
                assessmentId: attempt.assessment_id,
                date: attempt.submitted_at ? attempt.submitted_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
                assessmentPeriod: attempt.ASSESSMENT?.assessment_type || "Periodic Exam",
                name: isOnlineExam ? "CBT Exam" : "Field Evaluation",
                assessedBy: isOnlineExam ? "Online Exam" : "Traffic Inspector",
                totalScore: totalScoreVal,
                sections,
                responses,
                approvalStatus,
                isOnlineExam,
                dbCategory,         // AOM-approved category stored in DB
                isApproved          // whether AOM has finalized
              };
            });

            // ── Deduplicate: one entry per assessment_id ──────────────────────
            // If same assessment_id has both a TI field evaluation and a CBT attempt,
            // keep only the field evaluation (non-online). CBT is a sub-exam, not a
            // separate full assessment record.
            const assessMap = new Map();
            for (const rec of mapped) {
              const key = rec.assessmentId || rec.id; // fallback to attempt_id if no assessment_id
              if (!assessMap.has(key)) {
                assessMap.set(key, rec);
              } else {
                const existing = assessMap.get(key);
                // Prefer field-evaluation (non-online) over CBT (online)
                if (existing.isOnlineExam && !rec.isOnlineExam) {
                  assessMap.set(key, rec);
                }
                // If both are the same type, keep the more recent one (already sorted desc)
              }
            }
            const deduped = Array.from(assessMap.values());
            // Sort by date descending
            deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

            // ── Second pass: hide standalone CBT rows when TI field evals exist ──
            // The CBT is a sub-exam. Once the TI has conducted at least one field
            // evaluation, the standalone CBT row (different assessment_id, isOnlineExam=true)
            // must be hidden — its marks are already embedded in the TI evaluation score.
            const hasFieldEval = deduped.some(r => !r.isOnlineExam);
            const finalHistory = hasFieldEval
              ? deduped.filter(r => !r.isOnlineExam)  // only TI evaluations
              : deduped;                               // fallback: show CBT if no TI eval yet

            setHistory(finalHistory);
            sessionStorage.setItem(`tm_history_${employeeId}`, JSON.stringify(finalHistory));
          } else {
            setHistory([]);
          }
        } catch (err) {
          console.error("Error loading test history:", err);
          setHistory([]);
        }
      }
    }
    loadHistory();
    const interval = setInterval(loadHistory, 4000);
    return () => clearInterval(interval);
  }, [employeeId]);

  // Read assessment status from database and update local storage/states to unlock automatically for TM
  useEffect(() => {
    async function checkDatabaseAssessment() {
      if (!employeeId || !isSupabaseConfigured) return;
      try {
        // Resolve the employee's user_id from their HRMS ID
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
          .select('assessment_id, status, assessment_type, conducted_by')
          .eq('employee_id', resolvedEmployeeId)
          .in('assessment_type', ['Train Manager Assessment', 'TM Assessment'])
          .in('status', ['Pending', 'AVAILABLE', 'LOCKED', 'IN_PROGRESS'])
          .order('created_at', { ascending: false })
          .limit(1);

        const activatedTime = Number(localStorage.getItem(`tm_test_activated_time_${employeeId}`)) || 0;
        const isRecent = Date.now() - activatedTime < 15000; // 15 seconds guard

        if (!error && assessments && assessments.length > 0) {
          const activeAssess = assessments[0];
          if (activeAssess.status === 'Pending' || activeAssess.status === 'AVAILABLE' || activeAssess.status === 'IN_PROGRESS') {
            const currentActivated = localStorage.getItem(`tm_test_activated_${employeeId}`);
            if (currentActivated !== "true") {
              localStorage.setItem(`tm_test_activated_${employeeId}`, "true");
              window.dispatchEvent(new Event("storage"));
            }
          } else {
            if (!isRecent) {
              const currentActivated = localStorage.getItem(`tm_test_activated_${employeeId}`);
              if (currentActivated !== "false") {
                localStorage.setItem(`tm_test_activated_${employeeId}`, "false");
                window.dispatchEvent(new Event("storage"));
              }
            }
          }
        } else {
          if (!error && assessments && assessments.length === 0) {
            if (!isRecent) {
              const currentActivated = localStorage.getItem(`tm_test_activated_${employeeId}`);
              if (currentActivated !== "false") {
                localStorage.setItem(`tm_test_activated_${employeeId}`, "false");
                window.dispatchEvent(new Event("storage"));
              }
            }
          }
        }
      } catch (err) {
        console.error("Error checking database assessment for TM:", err);
      }
    }

    checkDatabaseAssessment();
    const dbInterval = setInterval(checkDatabaseAssessment, 4000);
    return () => clearInterval(dbInterval);
  }, [employeeId]);

  const [statusText, setStatusText] = useState("");

  /* ─── Extra State Additions ─── */

  // 2. Secure Login Session Timer (15 minutes = 900 seconds)
  const [sessionTimeLeft, setSessionTimeLeft] = useState(900);

  // 3. Real-Time Notifications
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "danger", message: "CRITICAL: PME Medical examination scheduled on 2026-06-10.", time: "10 mins ago", read: false },
    { id: 2, type: "warning", message: "Safety Directive: New speed restriction (15km/h) active at Siding Points 12B.", time: "2 hours ago", read: false },
    { id: 3, type: "info", message: "Circular Update: SWR (Station Working Rules) Amendment v4.2 published.", time: "1 day ago", read: true },
    { id: 4, type: "success", message: "Training status updated: Periodic Safety Refresher completed.", time: "3 days ago", read: true }
  ]);

  // 4. Audit Activity Logs
  const [profileSubTab, setProfileSubTab] = useState("details"); // "details" | "audit"
  const [activityLogs, setActivityLogs] = useState([
    { id: 1, timestamp: "2026-05-27 10:00:12", category: "Auth", action: "User session initialized (IP: 10.244.15.68)", user: "A. Mehta" },
    { id: 2, timestamp: "2026-05-27 10:01:45", category: "Profile", action: "PME & REF health profile retrieved", user: "A. Mehta" },
    { id: 3, timestamp: "2026-05-27 10:03:10", category: "System", action: "Audited dashboard integrity checklist successfully", user: "A. Mehta" }
  ]);

  // 5. Emergency Alert & Siren State
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState("Obstruction on Track");
  const [emergencyLocation, setEmergencyLocation] = useState("Nagpur Yard Line 2");
  const [alarmMuted, setAlarmMuted] = useState(false);



  // Track user notifications unread count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

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

  /* ——— Derived metrics ——— */
  // Helper: get the effective score for a history record.
  // After AOM approval, obtained_marks in DB is the final authoritative mark.
  // For CBT/online exams, scale up to /100 for comparison purposes.
  const getScaledScore = (r) => {
    if (!r) return 0;
    return r.isOnlineExam ? r.totalScore * 4 : r.totalScore;
  };

  // Helper: get the category for a history record, using AOM-approved category when available.
  const getEffectiveCategory = (r) => {
    if (!r) return "—";
    if (r.isApproved && r.dbCategory) return r.dbCategory;
    return getCategory(getScaledScore(r));
  };

  // Latest attempt is the most recent approved/completed field or online exam
  const latestApprovedAttempt = history.find(h => h.approvalStatus === "Approved" || h.approvalStatus === "Completed");
  const latestAttempt = latestApprovedAttempt || history[0];

  // Latest score: show AOM-finalized mark / total
  const latestScore = latestAttempt
    ? (latestAttempt.isOnlineExam
      ? `${latestAttempt.totalScore}/25`
      : `${latestAttempt.totalScore}/100`)
    : null;

  // Latest category: use AOM-approved dbCategory if available
  const latestCategory = latestApprovedAttempt
    ? getEffectiveCategory(latestApprovedAttempt)
    : "—";

  // Average score: only from non-online (field evaluation) records, using final marks
  const fieldHistory = history.filter(h => !h.isOnlineExam);
  const averageScore = fieldHistory.length
    ? Math.round(fieldHistory.reduce((s, r) => s + r.totalScore, 0) / fieldHistory.length)
    : (history.length
      ? Math.round(history.reduce((s, r) => s + getScaledScore(r), 0) / history.length)
      : 0);

  /* ——— Chart data ——— */
  const trendData = useMemo(() =>
    [...history].reverse().map(r => ({
      date: r.assessmentPeriod ? r.assessmentPeriod.slice(0, 7) : r.date,
      score: r.isOnlineExam ? r.totalScore * 4 : r.totalScore
    })), [history]);

  const pieData = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    history.forEach(r => {
      // Use AOM-approved category if available, else compute locally
      const cat = getEffectiveCategory(r);
      if (counts[cat] !== undefined) counts[cat]++;
    });
    const total = history.length || 1;
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([cat, count]) => ({
        name: cat,
        value: Math.round((count / total) * 100),
        count
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);



  /* â”€â”€â”€ Navigation â”€â”€â”€ */
  const goToNavPage = (key) => {
    setActiveNav(key);
    setScreenMode("default");
    setStatusText("");
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



  /* â”€â”€â”€ Secure Session Actions â”€â”€â”€ */
  const refreshSession = () => {
    setSessionTimeLeft(900);
    logActivity("Auth", "User secure login session refreshed to 15:00.");
    triggerNotification("success", "Operations login session renewed safely.");
  };



  /* â”€â”€â”€ Emergency Broadcast Actions â”€â”€â”€ */
  const openEmergencyDialog = () => {
    setEmergencyModalOpen(true);
  };

  const triggerEmergencyBroadcast = () => {
    setEmergencyModalOpen(false);
    setEmergencyActive(true);
    setAlarmMuted(false);
    startAlarmSound();

    logActivity("EMERGENCY", `CRITICAL: Pulse emergency alert triggered! Type: ${emergencyType} at ${emergencyLocation}`);
    triggerNotification("danger", `ðŸš¨ BROADCAST ACTIVE: ${emergencyType} at ${emergencyLocation}. Dispatching rescue!`);
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

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     RENDER: PROFILE & AUDIT
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     RENDER: DASHBOARD
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  const renderDashboardPage = () => (
    <TMDashboard
      latestScore={latestScore}
      averageScore={averageScore}
      latestCategory={latestCategory}
      history={history}
      trendData={trendData}
      pieData={pieData}
      PIE_COLORS={PIE_COLORS}
      CustomPieTooltip={CustomPieTooltip}
      setActiveNav={setActiveNav}
    />
  );

  const renderProfilePage = () => (
    <TMProfile
      fullName={fullName}
      employeeId={employeeId}
      user={liveUser}
      latestCategory={latestCategory}
      latestScore={latestScore}
      history={history}
      activeMonitoring={activeMonitoring}
      counsellingHistory={counsellingHistory}
    />
  );

  /* â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
   RENDER: MY ASSESSMENT
â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•  */
  const renderMyAssessment = () => (
    <TMMyAssessment
      employeeId={employeeId}
      fullName={fullName}
      user={user}
      history={history}
      setHistory={setHistory}
      logActivity={logActivity}
      triggerNotification={triggerNotification}
      setStatusText={setStatusText}
    />
  );

  /* â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
     RENDER: SAFETY & EMERGENCY MODULE
  â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•  */

  /* ——— Content dispatcher ——— */
  const renderBodyContent = () => {
    if (activeNav === "dashboard") return renderDashboardPage();
    if (activeNav === "profile") return renderProfilePage();
    if (activeNav === "myAssessment") return renderMyAssessment();

    return renderDashboardPage();
  };

  /* ——————————————————————————————————————————— 
     SHELL LAYOUT
  ——————————————————————————————————————————— */
  return (
    <div className={`pm-layout ${emergencyActive ? "emergency-glow-active" : ""}`}>
      <input type="checkbox" id="sdom-sidebar-toggle" className="sdom-sidebar-checkbox" style={{ display: "none" }} />
      <label htmlFor="sdom-sidebar-toggle" className="sdom-sidebar-close-backdrop"></label>

      {/* — Flashing Emergency Alert Banner — */}
      {emergencyActive && (
        <div className="pm-emergency-siren-banner">
          <div className="siren-message">
            <span className="siren-light animate-flash">🚨 ALERT</span>
            <strong>MANDATORY EMERGENCY BROADCAST ACTIVE: {emergencyType} detected at {emergencyLocation}! All train & siding movements are frozen immediately.</strong>
          </div>
          <div className="siren-controls">
            <button className="pm-siren-mute-btn" onClick={toggleAlarmMute}>
              {alarmMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {alarmMuted ? "Unmute Alarm" : "Mute Sound"}
            </button>
            <button className="pm-siren-clear-btn" onClick={clearEmergencyState}>
              Clear & Safe Return
            </button>
          </div>
        </div>
      )}

      <header className="pm-topbar">
        <label htmlFor="sdom-sidebar-toggle" className="sdom-sidebar-toggle-btn" style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", background: "none", border: "none", color: "#ffffff", marginRight: "12px" }}>
          &#9776;
        </label>
        <div className="pm-topbar-brand" style={{ flex: 1 }}>
          <div className="pm-topbar-logo"><img src="/logo.webp" alt="IR Logo" style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }} /></div>
          <div>
            <h1>{t("Indian Railway Evaluation System")}</h1>
            <p><span className="desktop-only-txt">Operations Workspace: </span>{t("Train Manager")}<span className="desktop-only-txt"> Module</span></p>
          </div>
        </div>

        <div className="pm-user-strip" style={{ gap: "12px", alignItems: "center" }}>

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
                        <p>{n.message}</p>
                        <span>{n.time}</span>
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
              <p className="pm-hero-eyebrow">Nagpur Junction Operations</p>
              <h2 className="pm-main-title">
                {screenMode === "scorecard" ? "Detailed Evaluation scorecard"
                  : screenMode === "attempt" ? "Competency Examination Attempt"
                    : navItems.find(i => i.key === activeNav)?.label || "Workspace"}
              </h2>
            </div>
            <div className="pm-header-kpis">
              <div className="pm-hkpi">
                <Award size={14} />
                <span>{history.length} Assessments</span>
              </div>
              <div className="pm-hkpi">
                <Gauge size={14} />
                <span>Avg {averageScore}</span>
              </div>
              {latestCategory !== "Untested" && latestCategory !== "—" && (
                <div className="pm-hkpi" style={{ color: getCategoryColor(latestCategory) }}>
                  <ShieldCheck size={14} />
                  <span>Cat. {latestCategory}</span>
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

      {/* â”€â”€ EMERGENCY BROADCAST SETUP MODAL â”€â”€ */}
      {emergencyModalOpen && (
        <div className="pm-emergency-modal-overlay">
          <div className="pm-emergency-modal">
            <div className="modal-header">
              <h2>ðŸš¨ CONFIRM URGENT DIVISION-WIDE BROADCAST</h2>
              <button onClick={() => setEmergencyModalOpen(false)}>Ã—</button>
            </div>
            <div className="modal-body">
              <p className="danger-notice">
                WARNING: Triggering this broadcast sends an audio warning signal and locks automatic block operations/movement panels on all active Station Master & Superintendent terminals! Use for genuine safety emergencies only.
              </p>
              <div className="modal-fields">
                <label>Emergency Category</label>
                <select value={emergencyType} onChange={e => setEmergencyType(e.target.value)}>
                  <option value="Obstruction on Track">Obstruction on Siding (Fouling Clearance)</option>
                  <option value="Derailment Danger">Visible Rail Crack / Splitting Point</option>
                  <option value="Signal Failure">Critical Signal Lock Failure</option>
                  <option value="Hot Axle Fire Spark">Hot Axle / Spark Smoke in Incoming train</option>
                  <option value="Other Danger">Other Major Track Danger</option>
                </select>

                <label>Vulnerable Location / Track</label>
                <input
                  type="text"
                  value={emergencyLocation}
                  onChange={e => setEmergencyLocation(e.target.value)}
                  placeholder="e.g. Line 2 Loop Siding, KM 102/4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setEmergencyModalOpen(false)}>Cancel</button>
              <button className="confirm-btn" onClick={triggerEmergencyBroadcast}>
                CONFIRM & BROADCAST ALARM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainManagerModule;



