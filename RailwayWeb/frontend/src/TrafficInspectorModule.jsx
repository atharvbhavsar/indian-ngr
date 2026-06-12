import { useMemo, useState, useEffect } from "react";
import {
  Activity, AlertTriangle, ArrowUpDown, Award, BarChart3, Building2,
  CheckCircle2, CheckCircle, ChevronRight, ClipboardCheck,
  FileBarChart2, FileCheck, Filter, LogOut, Search, ShieldCheck,
  TrendingUp, TrendingDown, UserCircle2, Users, XCircle, Eye,
  Calendar, BookOpen, Clock, HeartHandshake, HelpCircle, Download,
  FileSpreadsheet, FileText, Bell, Plus, RefreshCw, Edit, Trash2, Lock, Maximize2,
  ArrowLeft, UserCheck, BusFront, ClipboardList, UserPlus, Send, Train, ExternalLink,
  Gauge
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList
} from "recharts";
import "./sdom.css";
import { useLanguage } from "./contexts/LanguageContext";
import { useAuth } from "./contexts/AuthContext";

// ── Refactored State Hook & Modular Components ──────────────────────────────
import { useTrafficInspectorState } from "./hooks/modules/useTrafficInspectorState";
import PersonnelTable from "./components/personnel/PersonnelTable";
import ZoomChartModal from "./components/charts/ZoomChartModal";
import EditUserModal from "./components/modals/EditUserModal";
import TransferUserModal from "./components/modals/TransferUserModal";
import AddUserModal from "./components/modals/AddUserModal";
import { SAStationDetail } from "./components/super-admin/views/SAStationDetail";
import { SAStationDirectory } from "./components/super-admin/views/SAStationDirectory";
import { saDataService } from "./services/saDataService";


/* ═══════════════════════════════════════════
   NAV CONFIG
   (Full 12 Sidebar Menu Items)
═══════════════════════════════════════════ */
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: Gauge },
  { key: "pointsmen", label: "Pointsmen", icon: Users },
  { key: "stationMasters", label: "Station Masters", icon: Building2 },
  { key: "stationSuperintendents", label: "Station Superintendents", icon: UserCheck },
  { key: "trainManagers", label: "Train Managers", icon: BusFront },
  { key: "stations", label: "Stations", icon: Building2 },
  { key: "approvals", label: "Approvals", icon: CheckCircle },
  { key: "assessments", label: "Assessments", icon: FileCheck },
  { key: "pmePosition", label: "PME Position", icon: Activity },
  { key: "refPosition", label: "REF Position", icon: Award },
  { key: "inspections", label: "Inspections", icon: Eye },
  { key: "counselling", label: "Counselling", icon: HeartHandshake },
  { key: "myAssessment", label: "My Assessment", icon: FileBarChart2 },
  { key: "reports", label: "Reports and Analytics", icon: BarChart3 },
  { key: "profile", label: "My Profile", icon: UserCircle2 },
];

const TI_PROFILE = {};

const stationTiMap = {};


/* ═══════════════════════════════════════════
   HELPERS & CATEGORIES
═══════════════════════════════════════════ */
const getCat = s => (s === 0 || s === undefined || s === null || isNaN(s)) ? "Untested" : (s >= 80 ? "A" : s >= 50 ? "B" : s >= 26 ? "C" : "D");

const getUserRisk = (u) => {
  if (u.score === undefined || u.score === null || isNaN(u.score)) return "Untested";
  return u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50 ? "High" : u.score >= 80 ? "Low" : "Medium";
};

const riskBadge = (r) => {
  const map = { Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" };
  return <span className={`sdom-badge ${map[r] || "sdom-badge-neutral"}`}>{r}</span>;
};

const catBadge = (c) => {
  const map = { A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger" };
  return <span className={`sdom-badge ${map[c] || "sdom-badge-neutral"}`}>{c}</span>;
};

const statusBadge = (s) => {
  const map = { Approved: "sdom-badge-success", Pending: "sdom-badge-warning", Rejected: "sdom-badge-danger", Overdue: "sdom-badge-danger", Active: "sdom-badge-success" };
  return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{s}</span>;
};

const CAT_C = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
const CAT_B = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
const PIE_C = ["#16a34a", "#2563eb", "#d97706", "#dc2626"];
const RISK_C = { High: "#dc2626", Medium: "#d97706", Low: "#16a34a" };
const RISK_B = { High: "#fee2e2", Medium: "#fef3c7", Low: "#dcfce7" };

const ROLE_MAP = {
  pointsmen: "Pointsman",
  Pointsman: "Pointsman",
  sm: "Station Master",
  "Station Master": "Station Master",
  ss: "Station Superintendent",
  "Station Superintendent": "Station Superintendent",
  tm: "Train Manager",
  "Train Manager": "Train Manager",
  ti: "Traffic Inspector",
  "Traffic Inspector": "Traffic Inspector"
};

const MONTHLY_TREND = [];


/* ═══════════════════════════════════════════
   STATIC MOCK DATA — 12 STATIONS
═══════════════════════════════════════════ */
const INIT_STATIONS = [];

const INIT_USERS = [];

const DEFAULT_SS_TM_USERS = [];

const MONTHLY = [];

const INIT_PM_ASSESSMENTS = [];

import {
  TI_SM_CRITERIA, defaultSMForm, computeSMScore,
  TI_TM_CRITERIA, defaultTMForm, computeTMScore,
  TI_SS_CRITERIA, defaultSSForm, computeSSScore,
  TI_QUIZ
} from "./constants/trafficInspectorConstants";

const INIT_TM_LIST = [];
const INIT_SS_LIST = [];
const INIT_SM_LIST = [];
const INIT_INSPECTIONS = [];
const INIT_COUNSELLING = [];

function generateTiMockResponses(score) {
  const correctCount = Math.round((score / 100) * 25);
  const arr = Array(25).fill(null);
  const indices = Array.from({ length: 25 }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const correctIndices = new Set(indices.slice(0, correctCount));
  for (let i = 0; i < 25; i++) {
    const q = TI_QUIZ[i];
    if (correctIndices.has(i)) {
      arr[i] = q.ans;
    } else {
      arr[i] = (q.ans + 1) % q.opts.length;
    }
  }
  return arr;
}

const getPerformanceSummaryText = (score, sections) => {
  if (!sections || sections.length === 0) return "Self-compliance check completed successfully.";
  const lowestSec = [...sections].sort((a, b) => a.marks - b.marks)[0];
  const highestSec = [...sections].sort((a, b) => b.marks - a.marks)[0];

  let summary = `Assessment score achieved: ${score}/100 (${score >= 80 ? 'Outstanding Competency' : score >= 50 ? 'Satisfactory Operations' : 'Requires Training'}). `;
  summary += `Demonstrated excellent compliance in "${highestSec.title}" scoring ${highestSec.marks}/${highestSec.outOf} marks. `;
  if (lowestSec.marks < lowestSec.outOf) {
    summary += `However, some area of improvement is observed in "${lowestSec.title}" (${lowestSec.marks}/${lowestSec.outOf}). It is recommended to review the standard operating manuals and safety bulletins for this section.`;
  } else {
    summary += `Achieved perfect scores across all compliance parameters.`;
  }
  return summary;
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

const INIT_TI_ASSESS_HISTORY = [];


/* ═══════════════════════════════════════════
   CUSTOM TOOLTIP
═══════════════════════════════════════════ */
const TiTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ti2-tooltip">
      <strong>{label}</strong>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN MODULE COMPONENT
═══════════════════════════════════════════ */

export default function TrafficInspectorModule({ user, onLogout }) {
  const { language, changeLanguage, t } = useLanguage();
  const { updateCurrentUser } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");

  useEffect(() => {
    setEditMobile(user?.mobile || user?.contact || "");
    setEditEmail(user?.email || "");
  }, [user]);

  const handleSaveProfile = async () => {
    if (!editMobile.trim()) {
      alert(t("Mobile Number is required."));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editEmail && !emailRegex.test(editEmail)) {
      alert(t("Please enter a valid Email Address."));
      return;
    }

    try {
      const updatePayload = {
        id: user?.hrmsId || tiId,
        name: user?.name || tiName,
        contact: editMobile,
        email: editEmail,
        role: "Traffic Inspector",
        station: user?.station || "—",
        division: user?.division || "Nagpur Division",
        joiningDate: user?.joiningDate || user?.lastDate || "—",
        score: user?.score || 0,
        cat: user?.cat || "Untested",
        pmeStatus: user?.pmeStatus || "Fit",
        refStatus: user?.refStatus || "Cleared"
      };

      await saDataService.saveUser(updatePayload, "edit");

      updateCurrentUser({
        mobile: editMobile,
        email: editEmail
      });

      setIsEditingProfile(false);
      alert(t("Profile updated successfully."));
    } catch (err) {
      alert(t("Failed to update profile: ") + err.message);
    }
  };

  const {
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

    tiName, tiId,
    myStations, myUsers, myPmList, mySmList, myTmList,
    totalPM, totalSMs, pending, highRiskAll, avgScoreAll,
    stationStats, bestSt, worstSt, highRiskSt,
    filteredStations, stBarData, pieData, myStationsProgress,
    roleBarData, myCompliance, topStations, bottomStations, myPipeline, myAssessmentMonthly,
    filteredFsStations, fsStBarData, filteredFsUsers, fsPieData,
    filteredPM, selectedPM, filteredUsers, filteredReport,

    roleF, setRoleF,
    repF, setRepF,
    fullscreenChart, setFullscreenChart,
    recentAssessments,

    triggerNotification, addAuditLog, exportAlert, fetchLiveDatabaseData,
    handleChartClick, handlePieClick, handleResetPopupFilters,

    defaultStationForm, showAddStationModal, setShowAddStationModal, newStationData, setNewStationData, stationFormErrors, setStationFormErrors,
    editingStationId, setEditingStationId, stationModalMode, setStationModalMode,
    handleOpenEditStation, handleOpenAddStation, handleDeleteStation,
    showAddUserModal, setShowAddUserModal, newUserData, setNewUserData,

    handleAddStationSubmit, openAddUserModal, handleAddUserSubmit, handleEditUser, saveEditedUser, handleDeleteUser, handleTransferClick, confirmTransfer,
    openPmReview, updateSec, finalizePM, openSMForm, handleSendExamAccess, handleRevokeExamAccess, toggleSMYN, setSMField, submitSMAssessment, openTMForm, handleSendTMExamAccess, handleRevokeTMExamAccess, toggleTMYN, setTMField, submitTMAssessment,
    openSSForm, handleSendSSExamAccess, handleRevokeSSExamAccess, toggleSSYN, setSSField, submitSSAssessment, submitInspection, submitCounselling, startQuiz, handleSelectQuizOpt, submitQuiz, markAllNotificationsRead,
    allDbAssessments, selectedCategory, setSelectedCategory, selectedHrmsIds, setSelectedHrmsIds, viewUpcomingOnly, setViewUpcomingOnly,
    sendBatchExamAccess, updateEmployeeScheduleTI
  } = useTrafficInspectorState(user, onLogout);

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showCategoriesPanel, setShowCategoriesPanel] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [scheduleReason, setScheduleReason] = useState("");

  const convertTo24Hour = (time12) => {
    if (!time12) return "10:00";
    const match = time12.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return "10:00";
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  };

  const convertTo12Hour = (time24) => {
    if (!time24) return "10:00 AM";
    const [hoursStr, minutesStr] = time24.split(":");
    let hours = parseInt(hoursStr);
    const minutes = minutesStr;
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const getEmployeeScheduleDetails = (p, role) => {
    const cat = p.cat || getCat(p.score || 0);
    const frequency = cat === "A" || cat === "B" ? "6 Months" : (cat === "C" ? "3 Months" : "1 Month");

    // Find all assessments for this employee from allDbAssessments
    const empAssessments = allDbAssessments ? allDbAssessments.filter(a => a.employee?.hrms_id === p.hrmsId) : [];

    const baseAssessType = role === "SM" ? "Station Master Assessment" : role === "SS" ? "Station Superintendent Assessment" : "Train Manager Assessment";

    // 1. Last Assessment Date
    const pastApproved = empAssessments.filter(a => ["Approved", "Completed", "EVALUATED"].includes(a.status));
    pastApproved.sort((a, b) => new Date(b.assessment_date || b.created_at) - new Date(a.assessment_date || a.created_at));
    const lastAssess = pastApproved[0];
    const lastAssessDate = lastAssess ? (lastAssess.assessment_date || lastAssess.created_at?.slice(0, 10)) : (p.submissionDate || p.lastDate || "None");

    // 2. Next Due Date & Time
    const upcomingAssess = empAssessments.find(a => ["LOCKED", "AVAILABLE", "IN_PROGRESS", "Pending", "Draft", "Scheduled"].includes(a.status) && a.due_date && (a.assessment_type?.startsWith(baseAssessType) || a.assessment_type === baseAssessType));

    let nextDueDate = null;
    let nextDueTime = "10:00 AM";
    let isCustomScheduled = false;

    if (upcomingAssess) {
      nextDueDate = upcomingAssess.due_date;
      isCustomScheduled = true;
      if (upcomingAssess.assessment_type) {
        const timeMatch = upcomingAssess.assessment_type.match(/Time:\s*(.+)$/i);
        if (timeMatch) {
          nextDueTime = timeMatch[1].trim();
        }
      }
    } else if (lastAssessDate && lastAssessDate !== "None") {
      const lastDateObj = new Date(lastAssessDate);
      if (!isNaN(lastDateObj.getTime())) {
        const monthsToAdd = cat === "A" || cat === "B" ? 6 : (cat === "C" ? 3 : 1);
        lastDateObj.setMonth(lastDateObj.getMonth() + monthsToAdd);
        nextDueDate = lastDateObj.toISOString().slice(0, 10);
      }
    }

    if (!nextDueDate) {
      nextDueDate = "Not Scheduled";
    }

    // 3. Days Remaining
    let daysRemaining = null;
    if (nextDueDate && nextDueDate !== "Not Scheduled") {
      const diffTime = new Date(nextDueDate).getTime() - new Date().setHours(0, 0, 0, 0);
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 4. Status Indicator
    let statusText = "Not Scheduled";
    let statusType = "neutral";

    if (nextDueDate !== "Not Scheduled" && daysRemaining !== null) {
      if (daysRemaining < 0) {
        statusText = "Overdue";
        statusType = "danger";
      } else if (daysRemaining === 0) {
        statusText = "Due Today";
        statusType = "danger";
      } else if (daysRemaining <= 7) {
        statusText = "Due Soon";
        statusType = "warning";
      } else {
        statusText = "Upcoming";
        statusType = "success";
      }
    }

    return {
      frequency,
      lastAssessDate,
      nextDueDate,
      nextDueTime,
      daysRemaining,
      statusText,
      statusType,
      isCustomScheduled,
      upcomingAssessId: upcomingAssess?.assessment_id || null
    };
  };

  const renderChartZoomModal = () => {
    if (!isChartZoomModalOpen) return null;

    const filtered = stationStats.map(st => {
      const pmDone = myPmList.filter(p => p.station === st.name && p.status === "Approved").length;
      const smDone = mySmList.filter(s => s.station === st.name && (s.status === "Approved" || s.status === "Submitted")).length;
      const tmDone = myTmList.filter(t => t.station === st.name && (t.status === "Approved" || t.status === "Submitted")).length;
      const completed = pmDone + smDone + tmDone;

      const pmPending = myPmList.filter(p => p.station === st.name && p.status === "Pending").length;
      const smPending = mySmList.filter(s => s.station === st.name && s.status === "Pending").length;
      const tmPending = myTmList.filter(t => t.station === st.name && t.status === "Pending").length;
      const pending = pmPending + smPending + tmPending;

      const riskLevel = st.highRisk >= 2 ? "High" : st.highRisk > 0 ? "Medium" : "Low";
      const category = getCat(st.avgScore);

      return {
        ...st,
        stationName: st.name,
        stationCode: st.code,
        completed,
        pending,
        avgScore: st.avgScore,
        category,
        riskLevel,
        assessmentStatus: pending > 0 ? "Pending" : "Approved",
        lastUpdatedDate: st.lastUpdatedDate || "2026-05-28",
        zone: st.zone || "Central Railway",
        division: st.division || "Parbhani-Amla Section"
      };
    }).filter(st => {
      const q = zoomPopupSearch.trim().toLowerCase();
      const matchesSearch = !q || st.stationName.toLowerCase().includes(q) || st.stationCode.toLowerCase().includes(q);

      const matchesZone = zoomPopupZone === "All" || st.zone === zoomPopupZone;
      const matchesDivision = zoomPopupDivision === "All" || st.division === zoomPopupDivision;

      const matchesName = zoomPopupStationName === "All" || !zoomPopupStationName.trim() || st.stationName.toLowerCase().includes(zoomPopupStationName.toLowerCase());
      const matchesCode = zoomPopupStationCode === "All" || !zoomPopupStationCode.trim() || st.stationCode.toLowerCase().includes(zoomPopupStationCode.toLowerCase());

      const matchesCategory = zoomPopupCategory === "All" || st.category === zoomPopupCategory;
      const matchesRisk = zoomPopupRisk === "All" || st.riskLevel === zoomPopupRisk;
      const matchesStatus = zoomPopupStatus === "All" || st.assessmentStatus === zoomPopupStatus;

      let matchesDate = true;
      if (zoomPopupStartDate) {
        matchesDate = matchesDate && st.lastUpdatedDate >= zoomPopupStartDate;
      }
      if (zoomPopupEndDate) {
        matchesDate = matchesDate && st.lastUpdatedDate <= zoomPopupEndDate;
      }

      return matchesSearch && matchesZone && matchesDivision && matchesName && matchesCode && matchesCategory && matchesRisk && matchesStatus && matchesDate;
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const currentPage = Math.min(zoomPopupPage, totalPages);

    const paginated = filtered.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    const modalChartData = paginated.map(st => ({
      station: st.stationCode,
      name: st.stationName,
      completed: st.completed,
      pending: st.pending,
      avgScore: st.avgScore
    }));

    const catA = paginated.filter(s => s.category === "A").length;
    const catB = paginated.filter(s => s.category === "B").length;
    const catC = paginated.filter(s => s.category === "C").length;
    const catD = paginated.filter(s => s.category === "D").length;
    const totalCount = catA + catB + catC + catD;

    const modalPieData = [
      { name: "Category A", value: catA, color: "#16a34a" },
      { name: "Category B", value: catB, color: "#2563eb" },
      { name: "Category C", value: catC, color: "#d97706" },
      { name: "Category D", value: catD, color: "#dc2626" }
    ].filter(item => item.value > 0);

    return (
      <ZoomChartModal
        isOpen={isChartZoomModalOpen}
        onClose={() => setIsChartZoomModalOpen(false)}
        chartType={selectedChartType}
        modalPieData={modalPieData}
        modalChartData={modalChartData}
        totalCount={stationStats.length}
        filteredCount={filtered.length}
        paginatedData={paginated}
        currentPage={currentPage}
        totalPages={totalPages}
        zoomPopupSearch={zoomPopupSearch}
        setZoomPopupSearch={setZoomPopupSearch}
        zoomPopupZone={zoomPopupZone}
        setZoomPopupZone={setZoomPopupZone}
        zoomPopupDivision={zoomPopupDivision}
        setZoomPopupDivision={setZoomPopupDivision}
        zoomPopupStationName={zoomPopupStationName}
        setZoomPopupStationName={setZoomPopupStationName}
        zoomPopupStationCode={zoomPopupStationCode}
        setZoomPopupStationCode={setZoomPopupStationCode}
        zoomPopupCategory={zoomPopupCategory}
        setZoomPopupCategory={setZoomPopupCategory}
        zoomPopupRisk={zoomPopupRisk}
        setZoomPopupRisk={setZoomPopupRisk}
        zoomPopupStatus={zoomPopupStatus}
        setZoomPopupStatus={setZoomPopupStatus}
        zoomPopupStartDate={zoomPopupStartDate}
        setZoomPopupStartDate={setZoomPopupStartDate}
        zoomPopupEndDate={zoomPopupEndDate}
        setZoomPopupEndDate={setZoomPopupEndDate}
        setZoomPopupPage={setZoomPopupPage}
        handleResetPopupFilters={handleResetPopupFilters}
      />
    );
  };

  const renderDashboard = () => (
    <div className="sdom-fade">
      {/* Page header */}
      <h1 className="sdom-page-title">{user?.jurisdiction || "Jurisdiction"} Section Command Center</h1>
      <p className="sdom-page-subtitle">Complete strategic overview of your section — staff, performance, safety and assessment pipeline.</p>

      {/* ── Summary Cards ── */}
      <div className="sdom-summary-cards">
        {[
          { key: "stations", label: "Stations", count: myStations.length, sub: "Assigned in your section", icon: <Building2 size={18} />, color: "#1E3A5F", onClick: () => goTo("stations") },
          { key: "pointsmen", label: "Pointsmen", count: totalPM, sub: "Across assigned stations", icon: <Users size={18} />, color: "#1E3A5F", onClick: () => { goTo("pointsmen"); setUserStationFilter("All"); setUserCategoryFilter("All"); setUserRiskFilter("All"); setUserSearch(""); } },
          { key: "sm", label: "Station Masters", count: totalSMs, sub: "Across assigned stations", icon: <Building2 size={18} />, color: "#1E3A5F", onClick: () => { goTo("stationMasters"); setUserStationFilter("All"); setUserCategoryFilter("All"); setUserRiskFilter("All"); setUserSearch(""); } },
          { key: "pending", label: "Pending Approvals", count: pending, sub: "Assessments awaiting review", icon: <ClipboardCheck size={18} />, color: "#1E3A5F", onClick: () => { goTo("reviewPM"); setReviewTab("Pending"); } },
          { key: "avg", label: "Average Score", count: `${avgScoreAll}/100`, sub: "Section-wide average", icon: <Activity size={18} />, color: "#1E3A5F", onClick: () => goTo("reports") },
          { key: "risk", label: "High-Risk Staff", count: highRiskAll, sub: "Requires immediate attention", icon: <AlertTriangle size={18} />, color: "#1E3A5F", onClick: () => { goTo("pointsmen"); setUserRiskFilter("High"); setUserStationFilter("All"); setUserCategoryFilter("All"); setUserSearch(""); } },
        ].map((c) => (
          <div
            className="sdom-stat-card"
            key={c.key}
            style={{ cursor: "pointer" }}
            onClick={c.onClick}
          >
            <div className="sdom-stat-icon">
              <span style={{ color: "#1E3A5F" }}>{c.icon}</span>
            </div>
            <div className="sdom-stat-label">{c.label}</div>
            <div className="sdom-stat-value">{c.count}</div>
            <div className="sdom-stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Station-wise Progress & Average Score Row ── */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card">
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Station-wise Evaluation Progress</div>
              <div className="sdom-chart-subtitle">Completed and pending assessments in your section</div>
            </div>
            <button
              type="button"
              onClick={() => handleChartClick(null, "progress")}
              style={{
                background: "var(--brand-primary, #0B1F3A)",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              View Full Screen
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={myStationsProgress}
                margin={{ top: 8, right: 12, left: -20, bottom: 5 }}
                barGap={6}
                onClick={(state) => handleChartClick(state, "progress")}
                style={{ cursor: "pointer" }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#627D98" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar
                  dataKey="completed"
                  fill="var(--brand-secondary, #1E3A5F)"
                  radius={[4, 4, 0, 0]}
                  name="Completed"
                  barSize={12}
                />
                <Bar
                  dataKey="pending"
                  fill="#D69E2E"
                  radius={[4, 4, 0, 0]}
                  name="Pending"
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Station-wise Average Score</div>
              <div className="sdom-chart-subtitle">Average performance scores for your stations</div>
            </div>
            <button
              type="button"
              onClick={() => handleChartClick(null, "score")}
              style={{
                background: "#1f7a5c",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              View Full Screen
            </button>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stationStats.map(st => ({ station: st.code, avgScore: st.avgScore }))}
                margin={{ top: 8, right: 12, left: -20, bottom: 5 }}
                onClick={(state) => handleChartClick(state, "score")}
                style={{ cursor: "pointer" }}
                barSize={18}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis
                  dataKey="station"
                  tick={{ fontSize: 10, fill: "#627D98" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} formatter={(value) => [`${value}/100`, "Average Score"]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar
                  dataKey="avgScore"
                  fill="#1f7a5c"
                  radius={[4, 4, 0, 0]}
                  name="Average Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Role-wise Staff Distribution Row ── */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Role-wise Staff Distribution</div>
          <div className="sdom-chart-subtitle">Staff count per role in your section</div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleBarData} margin={{ top: 16, right: 40, left: 0, bottom: 8 }} barSize={52}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="role" fontSize={12} tick={{ fill: "#102A43", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Bar dataKey="count" fill="#1E3A5F" radius={[5, 5, 0, 0]}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#102A43" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Grade & Safety Row ── */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card">
          <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="sdom-chart-title">Grade/Category Distribution</div>
              <div className="sdom-chart-subtitle">Staff grades in your section</div>
            </div>
            <button
              type="button"
              onClick={() => handlePieClick(null)}
              style={{
                background: "var(--brand-primary, #0B1F3A)",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              View Full Screen
            </button>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart style={{ cursor: "pointer" }}>
                <Pie
                  data={pieData.map(d => ({ name: `Grade ${d.name}`, value: d.value, fill: d.name === "A" ? "#1E3A5F" : d.name === "B" ? "#2B6CB0" : d.name === "C" ? "#D69E2E" : "#C53030" }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  onClick={(data) => handlePieClick(data)}
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.name === "A" ? "#1E3A5F" : d.name === "B" ? "#2B6CB0" : d.name === "C" ? "#D69E2E" : "#C53030"} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Safety Compliance Analytics</div>
          <div className="sdom-chart-subtitle">Section compliance rates across categories</div>
          <div style={{ marginTop: 16 }}>
            {myCompliance.map((c) => (
              <div className="sdom-compliance-item" key={c.label}>
                <div className="sdom-compliance-header">
                  <span>{c.label}</span>
                  <span className="sdom-compliance-pct">{c.pct}%</span>
                </div>
                <div className="sdom-compliance-track">
                  <div className="sdom-compliance-fill" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Monthly Score & Safety Trend Row ── */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Section-wide Performance &amp; Safety Trend (Last 6 Months)</div>
          <div className="sdom-chart-subtitle">Average assessment scores and safety compliance percentage in your section</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis domain={[60, 100]} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                <Line type="monotone" dataKey="avgScore" name="Avg Score" stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4, fill: "#1E3A5F" }} />
                <Line type="monotone" dataKey="safetyAvg" name="Safety Compliance%" stroke="#2F855A" strokeWidth={2.5} dot={{ r: 4, fill: "#2F855A" }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Top/Bottom Performing Stations Row ── */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 4 }}>Top Performing Stations</div>
          <div className="sdom-chart-subtitle">Highest average assessment score in your section</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>#</th><th>Station</th><th>Avg Score</th><th>Safety Score</th><th>High Risk</th></tr>
              </thead>
              <tbody>
                {topStations.map((st, i) => (
                  <tr key={st.id}>
                    <td style={{ color: "#9FB3C8", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{st.name}</td>
                    <td><span style={{ color: "#2F855A", fontWeight: 700 }}>{st.avgScore}/100</span></td>
                    <td>{st.safetyPct}/100</td>
                    <td>{st.highRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 4 }}>Stations Needing Attention</div>
          <div className="sdom-chart-subtitle">Lowest average assessment score in your section</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr><th>#</th><th>Station</th><th>Avg Score</th><th>Safety Score</th><th>High Risk</th></tr>
              </thead>
              <tbody>
                {bottomStations.map((st, i) => (
                  <tr key={st.id}>
                    <td style={{ color: "#9FB3C8", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{st.name}</td>
                    <td><span style={{ color: st.avgScore < 75 ? "#C53030" : "#D69E2E", fontWeight: 700 }}>{st.avgScore}/100</span></td>
                    <td>{st.safetyPct}/100</td>
                    <td>{st.highRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Assessment Pipeline Row ── */}
      <div className="sdom-row-1">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Assessment Pipeline</div>
          <div className="sdom-chart-subtitle">Section-wide pipeline status and trend</div>
          <div className="sdom-pipeline-row" style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            {myPipeline.map((p) => (
              <div className="sdom-pipeline-card" key={p.label} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "10px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", flex: 1 }}>
                <div className="sdom-pipeline-dot" style={{ background: p.dot, width: "10px", height: "10px", borderRadius: "50%" }} />
                <div>
                  <div className="sdom-pipeline-lbl" style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>{p.label}</div>
                  <div className="sdom-pipeline-val" style={{ fontSize: "18px", fontWeight: "800" }}>{p.count}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 280, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={myAssessmentMonthly} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} />
                <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                <Bar dataKey="approved" name="Approved" fill="#1E3A5F" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#4A90D9" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#B83A3A" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue" fill="#5A6B7C" barSize={12} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER: PROFILE
  ═══════════════════════════════════════════ */
  const renderProfile = () => {
    const sectionPerformanceData = [
      { month: "Dec'25", score: 76 },
      { month: "Jan'26", score: 78 },
      { month: "Feb'26", score: 81 },
      { month: "Mar'26", score: 84 },
      { month: "Apr'26", score: 86 },
      { month: "May'26", score: 88 }
    ];

    const latestApproved = (tiAssessments || []).find(h => ["Approved", "Completed"].includes(h.approvalStatus));
    const scoreVal = latestApproved?.totalScore !== undefined && latestApproved?.totalScore !== null
      ? latestApproved.totalScore
      : (user?.score || avgScoreAll || 0);
    const categoryVal = latestApproved?.category && latestApproved?.category !== "Untested"
      ? latestApproved.category
      : (user?.category && user?.category !== "Untested" ? user?.category : (user?.cat && user?.cat !== "Untested" ? user?.cat : "Untested"));

    // Derive risk from category: A/B → Low, C → Medium, D → High
    const riskVal = categoryVal === "Untested" ? "Untested" : categoryVal === "D" ? "High" : categoryVal === "C" ? "Medium" : "Low";

    return (
      <div className="sdom-fade">
        {/* Hero header */}
        <div className="sdom-station-header" style={{ marginBottom: 24 }}>
          <div className="sdom-station-header-meta">
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("Staff Profile")}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{user?.name || tiName}</div>
            <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{t(user?.role || "Traffic Inspector")} &bull; {t(user?.division || "Nagpur")} {t("Division")} &bull; {t(user?.zone || "Central Railway")}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              {categoryVal === "Untested" ? (
                <span className="sdom-badge sdom-badge-warning">{t("Untested")}</span>
              ) : (
                <span className={`sdom-badge ${categoryVal === "D" ? "sdom-badge-danger" : categoryVal === "C" ? "sdom-badge-warning" : "sdom-badge-success"}`}>
                  {t("Category")} {categoryVal}
                </span>
              )}
              {riskVal === "Untested" ? (
                <span className="sdom-badge" style={{ background: "#f3f4f6", color: "#4b5563" }}>{t("Untested")}</span>
              ) : (
                <span className={`sdom-badge ${riskVal === "High" ? "sdom-badge-danger" : riskVal === "Medium" ? "sdom-badge-warning" : "sdom-badge-success"}`}>
                  {t(riskVal)} {t("Risk")}
                </span>
              )}
              <span className="sdom-badge sdom-badge-success">{t("Inspector")}</span>
              <span className="sdom-badge sdom-badge-success">{t("Active")}</span>
            </div>
          </div>
          <div className="sdom-station-header-stats">
            <div className="sdom-station-header-stat">
              <span className="val">{scoreVal || "N/A"}{scoreVal ? "/100" : ""}</span>
              <span className="lbl">{t("Section Avg")}</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{user?.mobile || user?.contact || "N/A"}</span>
              <span className="lbl">{t("Contact")}</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{user?.lastAssessDate || latestApproved?.date || "N/A"}</span>
              <span className="lbl">{t("Last Audit")}</span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="sdom-row-2" style={{ marginBottom: "24px" }}>
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>{t("Personal & Professional Details")}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', paddingBottom: '20px' }}>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("Employee ID / HRMS ID")}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{user?.hrmsId || tiId}</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("Designation")}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{t(user?.role || "Traffic Inspector")}</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("Mobile Number")}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{user?.mobile || user?.contact || "—"}</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("Email ID")}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{user?.email || "—"}</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("PF Number")}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{user?.pfNumber || "—"}</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("Account Status")}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{t("Active")}</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("Current Zone")}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{t("Central Railway")}</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("Current Division")}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{t("Nagpur Division")}</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("Current Placement")}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{t(user?.jurisdiction || "Various")}</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("Reporting Officer")}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{t("P. K. Verma (Sr. DOM)")}</div>
              </div>
            </div>

            {/* Operational & Safety Dates Card */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                {t("Operational & Safety Dates")}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', fontSize: '13px' }}>
                <div><strong>{t("Last Section Audit Done")}:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>2026-05-24</div></div>
                <div><strong>{t("Next Audit Due")}:</strong><div style={{ fontWeight: 700, color: "#991b1b", marginTop: 4 }}>2026-06-24</div></div>
                <div><strong>{t("Inspector Safety Training")}:</strong><div style={{ fontWeight: 700, color: "#0d2c4d", marginTop: 4 }}>2025-11-05</div></div>
                <div><strong>{t("Safety Seminar Attended")}:</strong><div style={{ fontWeight: 700, color: "#0d2c4d", marginTop: 4 }}>2026-04-02</div></div>

                <div><strong>{t("PME Done Date")}:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{user?.pmeDoneDate || "N/A"}</div></div>
                <div><strong>{t("PME Due Date")}:</strong><div style={{ fontWeight: 700, color: "#991b1b", marginTop: 4 }}>{user?.pmeDueDate || "N/A"}</div></div>
                <div><strong>{t("Isolator Certificate issued")}:</strong><div style={{ fontWeight: 700, color: "#0d2c4d", marginTop: 4 }}>{user?.isolatorCertDate || "N/A"}</div></div>
                <div><strong>{t("Automatic Training Date")}:</strong><div style={{ fontWeight: 700, color: "#0d2c4d", marginTop: 4 }}>{user?.autoTrainingDate || "N/A"}</div></div>
                <div style={{ gridColumn: "span 2" }}><strong>{t("Counselling Done Date")}:</strong><div style={{ fontWeight: 700, color: "#d97706", marginTop: 4 }}>{user?.counsellingDate || "N/A"}</div></div>

                <div style={{ gridColumn: "span 2", marginTop: 8 }}>
                  <strong>{t("Assigned Stations Under Jurisdiction")} ({myStations.length})</strong>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                    {myStations.map(st => <span key={st.id} className="sdom-badge sdom-badge-blue" style={{ fontSize: "11px", fontWeight: "700" }}>{st.code} - {st.name}</span>)}
                  </div>
                </div>
              </div>
            </div>


          </div>

          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Section Performance Trend</div>
            <div className="sdom-chart-subtitle">Section Average Performance progression</div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sectionPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis domain={[40, 100]} fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Sub-view: Staff Detail (drill-down) - Declared at parent scope
  const renderStaffDetail = (s) => {
    const computedRisk = getUserRisk(s);

    // Real-time calculation of assessment history for this staff member
    const myAssessments = (allDbAssessments || []).filter(a => a.employee?.hrms_id === s.id);
    const approvedAssessments = myAssessments.filter(a => ["Approved", "Completed", "EVALUATED"].includes(a.status));
    const latestApproved = approvedAssessments.length > 0
      ? [...approvedAssessments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : null;

    const latestScoreVal = latestApproved?.TEST_ATTEMPT?.[0]?.obtained_marks;
    const lastAssessDateVal = latestApproved 
      ? (latestApproved.assessment_date ? new Date(latestApproved.assessment_date).toISOString().slice(0, 10) : new Date(latestApproved.created_at).toISOString().slice(0, 10))
      : null;

    const displayScore = (latestScoreVal !== undefined && latestScoreVal !== null)
      ? `${latestScoreVal}/100`
      : (s.score ? `${s.score}/100` : "—");

    const displayDate = lastAssessDateVal 
      ? lastAssessDateVal 
      : (s.lastAssessDate || s.lastDate || "No Assessment Taken");

    const formatMonthYear = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    };

    const pmAssessments = myAssessments
      .filter(a => a.TEST_ATTEMPT?.[0]?.obtained_marks != null)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    let scoreData = [];
    if (pmAssessments.length > 0) {
      scoreData = pmAssessments.map(a => ({
        month: formatMonthYear(a.assessment_date || a.created_at),
        score: a.TEST_ATTEMPT[0].obtained_marks,
        date: (a.assessment_date || a.created_at ? new Date(a.assessment_date || a.created_at).toISOString().slice(0, 10) : "")
      }));
    } else {
      const baseScore = s.score;
      if (baseScore) {
        scoreData = MONTHLY_TREND.map((m, i) => ({ month: m.month, score: Math.max(50, baseScore - 10 + i * 2) }));
      }
    }

    return (
      <div className="sdom-fade">
        <div style={{ marginBottom: 24 }}>
          <button className="sdom-back-btn" onClick={() => {
            if (view?.returnTo === "stationDetail") {
              setView({ type: "stationDetail", data: view.stationData });
            } else if (view?.returnTo === "pointsmen" || view?.returnTo === "stationMasters" || view?.returnTo === "stationSuperintendents" || view?.returnTo === "trainManagers") {
              setView(null);
            } else {
              setView(null);
              setSelectedStation(null);
            }
          }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 700 }}>
            <ArrowLeft size={16} /> Back to List
          </button>
        </div>

        <div className="sdom-station-header" style={{ marginBottom: 24 }}>
          <div className="sdom-station-header-meta">
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Profile</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
            <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{ROLE_MAP[s.role] || s.role} &bull; {s.station} &bull; {s.zone || "Central Railway"}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              {catBadge(s.cat || getCat(s.score))}
              {riskBadge(computedRisk)}
              {statusBadge(s.status || "Active")}
            </div>
          </div>
          <div className="sdom-station-header-stats">
            <div className="sdom-station-header-stat">
              <span className="val">{displayScore}</span>
              <span className="lbl">Latest Score</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{s.contact || "—"}</span>
              <span className="lbl">Contact</span>
            </div>
            <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
            <div className="sdom-station-header-stat">
              <span className="val">{displayDate}</span>
              <span className="lbl">Last Assessment</span>
            </div>
          </div>
        </div>

        <div className="sdom-row-2">
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>Personal &amp; Professional Details</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', paddingBottom: '20px' }}>
              {[
                ["Employee ID / HRMS ID", s.id],
                ["Designation", ROLE_MAP[s.role] || s.role],
                ["Mobile Number", s.contact || "N/A"],
                ["Email ID", s.email || `${s.id?.toLowerCase()}@rail.in`],
                ["PF Number", s.pfNumber || "N/A"],
                ["Account Status", s.status || "Active"],
                ["Current Zone", s.zone || "Central Railway"],
                ["Current Division", s.division || "Nagpur Division"],
                ["Current Station Placement", s.station],
                ["Reporting Officer", s.reportingAom || "TI R. Khan (Safety)"]
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* AOM Parity: Operational Specifications */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                Operational Profile Specifications
              </h4>

              {(s.role === "Pointsman" || s.role === "pointsmen") && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Reporting Station Master:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.reportingSm || "S. Deshmukh (SM)"}</div></div>
                  <div><strong>Assigned Shift:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.shift || "Morning Shift (06:00 - 14:00)"}</div></div>
                  <div><strong>Work Location Setup:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.workLocation || "Yard Area"}</div></div>
                </div>
              )}

              {(s.role === "Station Master" || s.role === "sm" || s.role === "Station Superintendent" || s.role === "ss") && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Operational Station:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.station || "N/A"}</div></div>
                  <div><strong>Operational Division:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.division || "Nagpur Division"}</div></div>
                  <div><strong>Operational Zone:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.zone || "Central Railway"}</div></div>
                </div>
              )}

              {(s.role === "Train Manager" || s.role === "tm") && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Crew Depot:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.workLocation || "Nagpur Depot"}</div></div>
                  <div><strong>Assigned Shift:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.shift || "Goods Train Beat"}</div></div>
                  <div><strong>Assigned Section Beats:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.reportingSm || "NGP-BSL Section"}</div></div>
                </div>
              )}

              {(s.role === "Traffic Inspector" || s.role === "ti") && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Jurisdiction Division:</strong><div style={{ fontWeight: 700, color: "#92400e", marginTop: 4 }}>{s.division || "Nagpur Division"}</div></div>
                  <div><strong>Reporting AOM Officer:</strong><div style={{ fontWeight: 700, color: "#92400e", marginTop: 4 }}>{s.reportingAom || "P. K. Verma (Sr. DOM)"}</div></div>
                  <div style={{ gridColumn: 'span 3', marginTop: '6px' }}><strong>Linked Stations under supervision:</strong><div style={{ fontWeight: 700, color: "#92400e", marginTop: 4 }}>{s.jurisdiction || "None"}</div></div>
                </div>
              )}
            </div>
          </div>

          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Score Trend</div>
            <div className="sdom-chart-subtitle">Monthly performance tracking for this employee</div>
            <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
              {scoreData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis domain={[40, 100]} fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: "#64748b", fontSize: "0.95rem", fontWeight: 600 }}>
                  No Assessment Records Found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════
     RENDER: STATIONS
     (Card grid layout + detailed clickable sub-view)
  ═══════════════════════════════════════════ */
  const renderStations = () => {
    const RISK_COLORS = {
      Low: "#16a34a",
      Medium: "#f59e0b",
      High: "#ef4444"
    };

    const CAT_COLORS = {
      A: "#16a34a",
      B: "#2563eb",
      C: "#d97706",
      D: "#dc2626"
    };

    const renderCategoryBadge = (category) => {
      const value = String(category || "").trim().toUpperCase();
      const isRank = ["A", "B", "C", "D"].includes(value);

      if (isRank) {
        return <span className={`category-circle category-${value.toLowerCase()}`}>{value}</span>;
      }

      return <span className="category-text-chip">{value || "-"}</span>;
    };

    // Sub-view: Station Detail Dashboard (drill-down)
    const renderStationDetail = (st) => {
      return (
        <SAStationDetail
          st={st}
          staff={users}
          closeView={() => {
            setView(null);
            setSelectedStation(null);
          }}
          setView={setView}
        />
      );
    };

    if (view?.type === "staffDetail") return renderStaffDetail(view.data);
    if (view?.type === "stationDetail") return renderStationDetail(view.data);

    const mappedStations = stationStats.map(st => {
      const smCount = users.filter(u => u.station === st.name && (u.role === "Station Master" || u.role === "sm")).length;
      const pmCount = users.filter(u => u.station === st.name && (u.role === "Pointsman" || u.role === "pointsmen")).length;
      const pmPending = myPmList.filter(p => p.station === st.name && p.status === "Pending").length;
      const smPending = mySmList.filter(s => s.station === st.name && s.status === "Pending").length;
      const tmPending = myTmList.filter(t => t.station === st.name && t.status === "Pending").length;
      const pending = pmPending + smPending + tmPending;

      return {
        ...st,
        ti: st.ti || "—",
        smCount,
        pmCount,
        score: st.avgScore || st.score || 0,
        safety: st.safetyPct || st.safety || 0,
        highRisk: st.highRisk || 0,
        pending
      };
    });

    return (
      <SAStationDirectory
        stations={mappedStations}
        staff={users}
        addStation={async (station) => {
          try {
            await saDataService.addStation(station);
            await fetchLiveDatabaseData();
          } catch (err) {
            alert("Error adding station: " + err.message);
          }
        }}
        updateStation={async (station) => {
          try {
            await saDataService.saveStation(station, "edit");
            await fetchLiveDatabaseData();
          } catch (err) {
            alert("Error updating station: " + err.message);
          }
        }}
        deleteStation={async (id, name) => {
          try {
            await saDataService.deleteStation(id, name);
            await fetchLiveDatabaseData();
          } catch (err) {
            alert("Error deleting station: " + err.message);
          }
        }}
        openView={(type, data) => {
          if (type === "stationDetail") {
            setSelectedStation(data);
          } else {
            setView({ type, data });
          }
        }}
      />
    );
  };

  /* ═══════════════════════════════════════════
     RENDER: ROLE VIEW (Parity with AOM Pointsmen & Station Masters Directories)
     (Allows search, filter, edit, shift, and delete actions for scoped roles)
     (Provides full AOM design alignment using sdom.css tokens)
  ═══════════════════════════════════════════ */
  const renderRoleView = (roleKey, title) => {
    // If a profile detail is being viewed
    if (view?.type === "staffDetail") return renderStaffDetail(view.data);

    return (
      <div className="sdom-container animate-fadeIn">
        <PersonnelTable
          title={title}
          roleKey={roleKey}
          users={users}
          stations={stations}
          stationTiMap={stationTiMap}
          roleF={roleF}
          setRoleF={setRoleF}
          onView={(s) => setView({ type: "staffDetail", data: s, returnTo: activePage })}
          onEdit={handleEditUser}
          onTransfer={handleTransferClick}
          onDelete={(id, name) => handleDeleteUser(id, name)}
          onAdd={openAddUserModal}
        />

        {/* Modals rendered using imported React components */}
        <EditUserModal
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          saveEditedUser={saveEditedUser}
          myStations={myStations}
          stationMasters={mySmList}
        />
        <TransferUserModal
          transferringUser={transferringUser}
          setTransferringUser={setTransferringUser}
          confirmTransfer={confirmTransfer}
          myStations={myStations}
        />
        <AddUserModal
          showAddUserModal={showAddUserModal}
          setShowAddUserModal={setShowAddUserModal}
          newUserData={newUserData}
          setNewUserData={setNewUserData}
          handleAddUserSubmit={handleAddUserSubmit}
          myStations={myStations}
          stationMasters={mySmList}
        />
      </div>
    );
  };

  const renderMyAssessment = () => {
    if (quizState === "quiz") {
      const question = TI_QUIZ[currentQuestion];
      const answeredCount = quizAnswers.filter(r => r !== null && r !== undefined).length;
      const completionRate = Math.round((answeredCount / 25) * 100);
      const unansweredCount = 25 - answeredCount;

      return (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          background: "#f1f5f9",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100vw",
          overflow: "hidden"
        }}>
          {/* Header Bar: TCS iON Style */}
          <header style={{
            background: "#1e293b",
            color: "#ffffff",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            height: "70px",
            flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <ShieldCheck size={28} color="#f97316" />
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "0.5px" }}>
                  TRAFFIC INSPECTOR CBT COMPETENCY EVALUATION
                </h1>
                <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                  Official Online Railway Rules &amp; Operational Safety Examination (2026 Cycle)
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                background: "#334155",
                padding: "6px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#cbd5e1",
                border: "1px solid #475569"
              }}>
                â³ TIME ELAPSED: <span style={{ color: "#3b82f6" }}>Active Session</span>
              </div>

              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to exit the exam? Your progress will not be saved.")) {
                    setQuizState("idle");
                  }
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  fontSize: 13,
                  background: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
                  transition: "all 0.2s ease"
                }}
              >
                Exit Exam
              </button>
            </div>
          </header>

          {/* Candidate & Progress Strip */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#ffffff",
            borderBottom: "1.5px solid #e2e8f0",
            padding: "12px 24px",
            height: "50px",
            flexShrink: 0,
            fontSize: 13.5,
            color: "#334155"
          }}>
            <div>
              Candidate Name: <strong style={{ color: "#2563eb" }}>{tiName}</strong> &nbsp;|&nbsp; HRMS ID: <strong style={{ color: "#2563eb" }}>{tiId}</strong> &nbsp;|&nbsp; Section Scope: <strong>Parbhani-Amla Section</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontWeight: 600 }}>Progress: <strong style={{ color: "#2563eb" }}>{answeredCount} / 25 Answered</strong> ({completionRate}%)</span>
              <div style={{ width: 140, height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${completionRate}%`, height: "100%", background: "#2563eb", borderRadius: 4 }} />
              </div>
            </div>
          </div>

          {/* Main Split Body */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            flex: 1,
            overflow: "hidden"
          }}>

            {/* Left Column: Spacious Question Pane */}
            <div style={{
              padding: "32px 40px",
              display: "flex",
              flexDirection: "column",
              background: "#f8fafc",
              overflowY: "auto",
              height: "100%"
            }}>

              {/* Immersive Question Card */}
              <div style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 36,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                marginBottom: 24
              }}>
                <div>
                  <span style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: "#2563eb",
                    background: "#dbeafe",
                    padding: "6px 14px",
                    borderRadius: 20,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px"
                  }}>
                    Question {currentQuestion + 1} of 25
                  </span>

                  <h2 style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginTop: 24,
                    marginBottom: 28,
                    lineHeight: 1.5
                  }}>
                    {question.q}
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {question.opts.map((opt, oi) => {
                      const isSelected = quizAnswers[currentQuestion] === oi;
                      return (
                        <label key={oi} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          padding: "18px 24px",
                          border: isSelected ? "2.5px solid #2563eb" : "1.5px solid #e2e8f0",
                          borderRadius: 12,
                          background: isSelected ? "#eff6ff" : "#ffffff",
                          cursor: "pointer",
                          boxShadow: isSelected ? "0 4px 6px rgba(37, 99, 235, 0.08)" : "none",
                          transition: "all 0.15s ease"
                        }} className="sm-option-hover">
                          <input
                            type="radio"
                            name={`ti-q-${currentQuestion}`}
                            checked={isSelected}
                            onChange={() => {
                              handleSelectQuizOpt(oi);
                            }}
                            style={{ width: 20, height: 20, accentColor: "#2563eb" }}
                          />
                          <span style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: isSelected ? "#1e40af" : "#64748b",
                            width: 24
                          }}>{["A", "B", "C", "D"][oi]}</span>
                          <span style={{
                            fontSize: 15,
                            color: "#1e293b",
                            fontWeight: isSelected ? 700 : 500
                          }}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Immersive Control Footer Bar */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "16px 24px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
              }}>
                <button
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion(p => Math.max(0, p - 1))}
                  style={{
                    padding: "12px 28px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    background: currentQuestion === 0 ? "#f1f5f9" : "#ffffff",
                    color: currentQuestion === 0 ? "#94a3b8" : "#334155",
                    border: "1.5px solid #cbd5e1",
                    cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  â† Previous Question
                </button>

                <div style={{ fontSize: 14, color: "#64748b" }}>
                  {unansweredCount > 0 ? (
                    <span style={{ color: "#d97706", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                      âš ï¸ {unansweredCount} question{unansweredCount > 1 ? "s" : ""} remaining to unlock submission
                    </span>
                  ) : (
                    <span style={{ color: "#16a34a", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                      ✓ All 25 questions attempted! You can now submit.
                    </span>
                  )}
                </div>

                <button
                  disabled={currentQuestion === 24}
                  onClick={() => setCurrentQuestion(p => Math.min(24, p + 1))}
                  style={{
                    padding: "12px 28px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    background: currentQuestion === 24 ? "#f1f5f9" : "#ffffff",
                    color: currentQuestion === 24 ? "#94a3b8" : "#334155",
                    border: "1.5px solid #cbd5e1",
                    cursor: currentQuestion === 24 ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  Next Question →
                </button>
              </div>
            </div>

            {/* Right Column: Navigator Sidebar */}
            <div style={{
              background: "#ffffff",
              borderLeft: "1.5px solid #e2e8f0",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              overflowY: "auto",
              height: "100%"
            }}>
              <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "1.5px solid #f1f5f9" }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "#dbeafe",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  margin: "0 auto 10px"
                }}>
                  {tiName.charAt(0)}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>{tiName}</h3>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>HRMS ID: {tiId}</span>
              </div>

              <h4 style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                margin: 0
              }}>
                Question Palette
              </h4>

              {/* Grid of questions */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 8,
                maxHeight: 220,
                overflowY: "auto",
                paddingRight: 4
              }}>
                {TI_QUIZ.map((q, idx) => {
                  const isCurrent = idx === currentQuestion;
                  const isAnswered = quizAnswers[idx] !== null && quizAnswers[idx] !== undefined;

                  let btnBg = "#ffffff";
                  let btnBorder = "1.5px solid #cbd5e1";
                  let btnColor = "#475569";
                  let fontWeight = "600";

                  if (isCurrent) {
                    btnBg = "#dbeafe";
                    btnBorder = "2px solid #2563eb";
                    btnColor = "#1e40af";
                    fontWeight = "800";
                  } else if (isAnswered) {
                    btnBg = "#dcfce7";
                    btnBorder = "1.5px solid #86efac";
                    btnColor = "#15803d";
                  } else {
                    btnBg = "#fef3c7";
                    btnBorder = "1.5px solid #fde047";
                    btnColor = "#a16207";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      style={{
                        height: 40,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: fontWeight,
                        background: btnBg,
                        border: btnBorder,
                        color: btnColor,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.1s ease"
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend section */}
              <div style={{
                borderTop: "1.5px solid #f1f5f9",
                paddingTop: 16,
                fontSize: 12,
                color: "#64748b",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 16, height: 16, background: "#dcfce7", border: "1.5px solid #86efac", borderRadius: 4 }} />
                  <span style={{ fontWeight: 500 }}>Attempted</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 16, height: 16, background: "#fef3c7", border: "1.5px solid #fde047", borderRadius: 4 }} />
                  <span style={{ fontWeight: 600, color: "#a16207" }}>Unattempted</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 16, height: 16, background: "#dbeafe", border: "2px solid #2563eb", borderRadius: 4 }} />
                  <span style={{ fontWeight: 500 }}>Current Focus</span>
                </div>
              </div>

              {/* Submission Section at Bottom */}
              <div style={{
                marginTop: "auto",
                paddingTop: 20,
                borderTop: "1.5px solid #f1f5f9"
              }}>
                <button
                  disabled={unansweredCount > 0}
                  onClick={submitQuiz}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 10,
                    fontSize: 14.5,
                    fontWeight: 800,
                    background: unansweredCount > 0 ? "#cbd5e1" : "#16a34a",
                    color: unansweredCount > 0 ? "#94a3b8" : "#ffffff",
                    border: "none",
                    cursor: unansweredCount > 0 ? "not-allowed" : "pointer",
                    boxShadow: unansweredCount > 0 ? "none" : "0 4px 12px rgba(22, 163, 74, 0.3)",
                    transition: "all 0.2s ease"
                  }}
                >
                  Submit Examination
                </button>
                {unansweredCount > 0 && (
                  <p style={{
                    fontSize: 11,
                    color: "#b45309",
                    margin: "8px 0 0",
                    textAlign: "center",
                    fontWeight: 600,
                    lineHeight: 1.4
                  }}>
                    * All 25 questions must be answered first ({unansweredCount} remaining)
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      );
    }

    if (selectedRecord) {
      const sc = selectedRecord;
      const cat = sc.category || "A";
      const liveTotal = sc.totalScore || 0;
      const performanceSummary = getPerformanceSummaryText(liveTotal, sc.sections);

      return (
        <div className="ti2-card animate-fade-in" style={{ padding: "24px", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
          <div className="ti2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}><ShieldCheck size={22} color="#16a34a" /> Detailed Evaluation Scorecard</h2>
            <button className="ti2-primary-btn" onClick={() => { setSelectedRecord(null); setQuizState("idle"); }}>← Return to History</button>
          </div>

          <div className="pm-scorecard-hero" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
            <div className="pm-sc-score-circle" style={{ width: "90px", height: "90px", borderRadius: "50%", border: `6px solid ${sc.approvalStatus === "Approved" ? (CAT_C[cat] || "#2563eb") : "#ea580c"}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexShrink: 0, background: "#fff" }}>
              <strong style={{ fontSize: "24px", color: sc.approvalStatus === "Approved" ? (CAT_C[cat] || "#2563eb") : "#ea580c", fontWeight: "800" }}>{liveTotal}</strong>
              <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", marginTop: "-2px" }}>/{sc.approvalStatus === "Approved" ? "100" : "25"}</span>
            </div>
            <div>
              {sc.approvalStatus === "Approved" ? (
                <span className="pm-cat-badge-lg" style={{ background: CAT_B[cat], color: CAT_C[cat], display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                  Final Category: {cat === "Untested" ? "Untested" : `Category ${cat}`}
                </span>
              ) : (
                <span className="pm-cat-badge-lg" style={{ background: "#fff7ed", color: "#ea580c", display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                  Awaiting AOM Grading & Approval
                </span>
              )}
              <p className="pm-sc-period" style={{ margin: "2px 0", fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>{sc.period} - Self-Compliance Audit</p>
              <p className="pm-sc-date" style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Attempt Completed: {sc.date} &nbsp;·&nbsp; Assessed By: {sc.assessedBy || "Area Operation Manager"}</p>
            </div>
          </div>

          {/* Dynamic Performance Summary */}
          <div className="pm-performance-summary-box" style={{ background: "#eff6ff", borderLeft: "4px solid #2563eb", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>📊 Official Performance Evaluation Summary</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#1e3a8a", lineHeight: "1.5" }}>{performanceSummary}</p>
          </div>

          {/* Competency Domain Breakdown */}
          <div className="pm-sc-sections" style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "15px", color: "#0f172a", marginBottom: "16px", fontWeight: "700" }}>Safety Domain Competency Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {sc.sections.map(s => {
                const spc = Math.round((s.marks / s.outOf) * 100);
                const barColor = spc >= 80 ? "#16a34a" : spc >= 50 ? "#2563eb" : spc >= 26 ? "#d97706" : "#dc2626";
                return (
                  <div key={s.title} className="pm-sc-section-row" style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "13px" }}>
                    <span className="pm-sc-section-name" style={{ width: "260px", fontWeight: "600", color: "#334155" }}>{s.title}</span>
                    <div className="pm-sc-bar-wrap" style={{ flexGrow: 1, height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                      <div className="pm-sc-bar-fill" style={{ width: `${spc}%`, height: "100%", background: barColor, borderRadius: "999px" }} />
                    </div>
                    <span className="pm-sc-section-marks" style={{ width: "60px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>{s.marks}/{s.outOf}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Complete MCQ Question Review */}
          <div className="pm-mcq-review-panel" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
            <div className="pm-chart-header" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={16} color="#475569" />
              <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "700" }}>Complete Assessment Question Review</h3>
            </div>
            <p className="pm-subtitle" style={{ fontSize: "12px", color: "#64748b", marginTop: "-10px", marginBottom: "20px" }}>
              Below is the detailed response evaluation for all 25 compulsory questions. Correct responses are highlighted in green; incorrect choices are highlighted in red.
            </p>

            <div className="pm-review-questions-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {TI_QUIZ.map((q, qIndex) => {
                const selectedOpt = sc.userAnswers ? sc.userAnswers[qIndex] : null;
                const isCorrect = selectedOpt === q.ans;

                return (
                  <div key={qIndex} className={`pm-review-question-card ${isCorrect ? "correct-card" : "wrong-card"}`}>
                    <div className="pm-rq-header">
                      <span className="pm-rq-number">Question {qIndex + 1}</span>
                      {isCorrect ? (
                        <span className="pm-rq-badge success">Correct (+1 Marks)</span>
                      ) : (
                        <span className="pm-rq-badge danger">Incorrect (0 Marks)</span>
                      )}
                    </div>
                    <h4 className="pm-rq-text">{q.q}</h4>

                    <div className="pm-rq-options-grid">
                      {q.opts.map((opt, oIdx) => {
                        const wasSelected = selectedOpt === oIdx;
                        const isOptCorrect = q.ans === oIdx;

                        let optClass = "";
                        if (wasSelected) {
                          optClass = isCorrect ? "opt-selected-correct" : "opt-selected-wrong";
                        } else if (isOptCorrect) {
                          optClass = "opt-correct-unselected";
                        }

                        return (
                          <div key={oIdx} className={`pm-rq-option-item ${optClass}`}>
                            <span className="font-mono opt-prefix">{["A", "B", "C", "D"][oIdx]}</span>
                            <span className="opt-label-text">{opt}</span>
                            {wasSelected && (
                              <span className="opt-user-tag">{isCorrect ? "✓ Selected" : "✗ Selected"}</span>
                            )}
                            {!wasSelected && isOptCorrect && (
                              <span className="opt-correct-tag">✓ Correct Key</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div style={{ marginTop: "16px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", borderLeft: "4px solid #f97316", fontSize: "12.5px", color: "#334155" }}>
                        <strong style={{ color: "#c2410c" }}>💡 Operational Safety Explanation: </strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const testActive = isExamAssigned;
    const approvedTiAssess = (tiAssessments || []).filter(a => ["Approved", "Completed"].includes(a.approvalStatus));
    const latestApprovedAssess = approvedTiAssess[0] || null;
    const avgScore = approvedTiAssess.length
      ? Math.round(approvedTiAssess.reduce((s, a) => s + a.totalScore, 0) / approvedTiAssess.length)
      : 0;

    return (
      <section className="sm2-card">
        {/* MCQ Assessment Assignment Banner */}
        {testActive ? (
          <div style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
            border: "1.5px solid #fed7aa",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", gap: 16, alignItems: "start" }}>
              <div style={{
                background: "#ffedd5",
                borderRadius: 50,
                width: 42,
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <ShieldCheck size={22} color="#ea580c" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#c2410c" }}>
                  ⚠️ Pending Competency Assessment
                </h3>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#9a3412", lineHeight: 1.4 }}>
                  Your supervisor (Area Operation Manager) has scheduled a periodic safety &amp; competency assessment for you. You must complete the 25-question MCQ exam.
                </p>
                <button
                  onClick={startQuiz}
                  style={{
                    background: "#ea580c",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 6px rgba(234, 88, 12, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  Start 25 MCQ Online Assessment
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: "#fef2f2",
            border: "1.5px solid #fecaca",
            borderRadius: 12,
            padding: 18,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 14
          }}>
            <Lock size={24} color="#dc2626" />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 2px", fontSize: 14.5, fontWeight: 700, color: "#991b1b" }}>
                Assessment Locked
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#b91c1c" }}>
                Your Traffic Inspector assessment is currently locked. It will be enabled once authorized by the Area Operation Manager.
              </p>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, textAlign: "right" }}>
              <div>
                <span style={{ color: "#b91c1c", display: "block" }}>Last Exam Score</span>
                <strong style={{ color: "#7f1d1d", fontSize: 13 }}>{latestApprovedAssess ? `${latestApprovedAssess.totalScore}%` : "N/A"}</strong>
              </div>
              <div style={{ borderLeft: "1px solid #fca5a5", paddingLeft: 16 }}>
                <span style={{ color: "#b91c1c", display: "block" }}>Next Due Date</span>
                <strong style={{ color: "#7f1d1d", fontSize: 13 }}>Pending Authorization</strong>
              </div>
            </div>
          </div>
        )}

        <div className="sm2-card-hdr"><h2>My Assessment History (by AOM)</h2></div>
        <p className="sm2-subtitle">All assessments conducted by the Area Operation Manager for your section. Click any row to view the detailed scorecard.</p>

        {/* Summary strip */}
        {(() => {
          const latestApprovedAssess = (tiAssessments || []).find(h => ["Approved", "Completed"].includes(h.approvalStatus));
          const hasSubmitted = (tiAssessments || []).some(h => h.approvalStatus === "Submitted");
          return (
            <div className="sm2-myassess-summary">
              <div className="sm2-report-mini">
                <label>Total Assessments</label>
                <strong>{tiAssessments.length}</strong>
              </div>
              <div className="sm2-report-mini">
                <label>Latest Score</label>
                <strong>{latestApprovedAssess ? `${latestApprovedAssess.totalScore}/${latestApprovedAssess.totalMarks || (latestApprovedAssess.totalScore > 25 ? "100" : "25")}` : (hasSubmitted ? "Awaiting Approval" : "—")}</strong>
              </div>
              <div className="sm2-report-mini">
                <label>Average AOM Score</label>
                <strong>{avgScore ? `${avgScore}/100` : "—"}</strong>
              </div>
              <div className="sm2-report-mini">
                <label>Latest Assessment</label>
                <strong style={{ color: (latestApprovedAssess?.category && latestApprovedAssess.category !== "Untested") ? (CAT_C[latestApprovedAssess.category] || "#2563eb") : "#ea580c" }}>
                  {latestApprovedAssess ? `Category ${latestApprovedAssess.category || getCat(latestApprovedAssess.totalScore)}` : (hasSubmitted ? "Awaiting Approval" : "—")}
                </strong>
              </div>
            </div>
          );
        })()}

        {/* List */}
        <div className="sm2-myassess-list">
          <div className="sm2-myassess-head">
            {["Period", "Date", "Score Scale", "Category", "Assessed By", "Status", ""].map(h =>
              <span key={h}>{h}</span>)}
          </div>
          {tiAssessments.map(sc => {
            const isApproved = ["Approved", "Completed"].includes(sc.approvalStatus);
            const cat = isApproved ? sc.category : null;
            const scoreDisplay = isApproved ? `${sc.totalScore}/${sc.totalMarks || (sc.totalScore > 25 ? "100" : "25")}` : "—";
            return (
              <button key={sc.id} className="sm2-myassess-row" onClick={() => setSelectedRecord(sc)}>
                <span title={`Cycle: ${sc.period}\nDuration: ${formatQuarterPeriod(sc.period)}`}>
                  <strong>{formatQuarterPeriod(sc.period)}</strong>
                </span>
                <span>{sc.date}</span>
                <span><strong>{scoreDisplay}</strong></span>
                <span>
                  {cat && cat !== "Untested" ? (
                    <span className="sm2-badge" style={{ background: CAT_B[cat] || "#fee2e2", color: CAT_C[cat] || "#b91c1c" }}>
                      Cat. {cat}
                    </span>
                  ) : (
                    <span style={{ color: "#ea580c", fontSize: "12px", fontWeight: "600" }}>—</span>
                  )}
                </span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{sc.assessedBy}</span>
                <span>
                  <span className={`sm2-status-pill sm2-status-${sc.approvalStatus.toLowerCase()}`}>{sc.approvalStatus}</span>
                </span>
                <span style={{ color: "#2563eb", fontSize: 12, fontWeight: 600 }}>View Form</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  };

  /* ═══════════════════════════════════════════
     RENDER: PME POSITION PAGE
  ═══════════════════════════════════════════ */
  const renderPmePosition = () => {
    const due = users.filter(u => u.pmeStatus === "Due" || u.pmeStatus === "Pending");
    const fit = users.filter(u => u.pmeStatus === "Fit");
    const overdue = users.filter(u => u.pmeStatus === "Overdue" || u.pmeStatus === "Unfit");

    return (
      <div className="ti2-page-body animate-fade-in">
        <div className="ti2-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2>Periodic Medical Examination (PME) Position</h2>
              <p className="ti2-subtitle" style={{ margin: "2px 0 0" }}>Track periodic medical exam clearances, overdue alerts, and compliance targets.</p>
            </div>
            <button className="ti2-view-profile-btn" onClick={() => exportAlert("PDF", "Section_PME_Compliance_Report")}>
              <Download size={13} /> PME Report
            </button>
          </div>

          <div className="ti2-myassess-summary" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #16a34a" }}><label>PME FIT Clearance</label><strong style={{ color: "#16a34a" }}>{fit.length} staff</strong></div>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #d97706" }}><label>PME Due / Pending</label><strong style={{ color: "#d97706" }}>{due.length} staff</strong></div>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #dc2626" }}><label>PME Overdue (High Risk)</label><strong style={{ color: "#dc2626" }}>{overdue.length} alerts</strong></div>
          </div>

          <div className="ti2-profile-sec-title" style={{ color: "#dc2626" }}>CRITICAL PME OVERDUE ALERTS ({overdue.length})</div>
          <div className="ti2-table-wrap">
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.5fr 1fr 1.2fr", padding: "10px 14px", background: "#fee2e2", color: "#991b1b", fontWeight: "700", fontSize: "11px" }}>
              <span>Staff Name</span>
              <span>HRMS ID</span>
              <span>Designation</span>
              <span>Assigned Station</span>
              <span>PME Status</span>
              <span>Action Taken</span>
            </div>
            {overdue.map(u => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.5fr 1fr 1.2fr", padding: "12px 14px", borderBottom: "1px solid #fecdd3", fontSize: "13px", alignItems: "center" }}>
                <strong>{u.name}</strong>
                <span style={{ fontFamily: "monospace" }}>{u.id}</span>
                <span>{u.designation}</span>
                <strong>{u.station}</strong>
                <span style={{ color: "#dc2626", fontWeight: "800" }}>{u.pmeStatus}</span>
                <span><button className="ti2-danger-btn" style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => { triggerNotification("warning", `Counselling scheduled for ${u.name}`); setGoToCounselling(u.name); }}>Schedule Counselling</button></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const setGoToCounselling = (name) => {
    setNewCoun(prev => ({ ...prev, staffName: name, topics: "PME evaluation preparation and rest compliance briefings." }));
    goTo("counselling");
    setShowCounForm(true);
  };

  /* ═══════════════════════════════════════════
     RENDER: REF POSITION PAGE
  ═══════════════════════════════════════════ */
  const renderRefPosition = () => {
    const completed = users.filter(u => u.refStatus === "Cleared");
    const pending = users.filter(u => u.refStatus === "Pending");
    const expired = users.filter(u => u.refStatus === "Expired" || u.refStatus === "Failed");

    return (
      <div className="ti2-page-body animate-fade-in">
        <div className="ti2-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2>Refresher Course (REF) training position</h2>
              <p className="ti2-subtitle" style={{ margin: "2px 0 0" }}>Monitor pointsmen safety refresher training compliance ledger.</p>
            </div>
            <button className="ti2-view-profile-btn" onClick={() => exportAlert("PDF", "REF_Refresher_Training_Position")}>
              <Download size={13} /> REF Report
            </button>
          </div>

          <div className="ti2-myassess-summary" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #16a34a" }}><label>REF Cleared / Completed</label><strong style={{ color: "#16a34a" }}>{completed.length} staff</strong></div>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #d97706" }}><label>REF Pending Class</label><strong style={{ color: "#d97706" }}>{pending.length} staff</strong></div>
            <div className="ti2-report-mini" style={{ borderLeft: "4px solid #dc2626" }}><label>REF Expired alerts</label><strong style={{ color: "#dc2626" }}>{expired.length} personnel</strong></div>
          </div>

          <div className="ti2-profile-sec-title">REF Training Alert List</div>
          <div className="ti2-table-wrap">
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.5fr 1fr 1.2fr", padding: "10px 14px", background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", fontWeight: "700", fontSize: "11px" }}>
              <span>Staff Name</span>
              <span>HRMS ID</span>
              <span>Designation</span>
              <span>Station Section</span>
              <span>REF Status</span>
              <span>Action Clearance</span>
            </div>
            {users.filter(u => u.refStatus !== "Cleared").map(u => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.5fr 1fr 1.2fr", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: "13px", alignItems: "center" }}>
                <strong>{u.name}</strong>
                <span style={{ fontFamily: "monospace" }}>{u.id}</span>
                <span>{u.designation}</span>
                <strong>{u.station}</strong>
                <span style={{ color: u.refStatus === "Expired" ? "#dc2626" : "#d97706", fontWeight: "800" }}>{u.refStatus}</span>
                <span><button className="ti2-primary-btn-sm" style={{ fontSize: "11px", padding: "5px 12px" }} onClick={() => { alert(`✓ Clear REF action submitted: ${u.name} scheduled for refresher training batches.`); setUsers(prev => prev.map(x => x.id === u.id ? { ...x, refStatus: "Cleared" } : x)); addAuditLog("Clear REF training", `Scheduled refresher course for ${u.name}`); }}>Clear REF</button></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════
     RENDER: INSPECTIONS PAGE
  ═══════════════════════════════════════════ */
  const renderInspections = () => (
    <div className="ti2-page-body animate-fade-in">
      <div className="ti2-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2>Field Inspection Reports &amp; Schedules</h2>
            <p className="ti2-subtitle" style={{ margin: "2px 0 0" }}>Schedule field audits, document safety observations, and log track point compliance.</p>
          </div>
          <button className="ti2-primary-btn" onClick={() => setShowInspForm(!showInspForm)}>
            <Plus size={13} /> {showInspForm ? "Close Form" : "Log New Inspection"}
          </button>
        </div>

        {showInspForm && (
          <form onSubmit={submitInspection} className="ti2-assess-form" style={{ padding: "18px", border: "1px dashed #cbd5e1", borderRadius: "12px", background: "#f8fafc", marginBottom: "18px" }}>
            <div className="ti2-form-field">
              <label>Audited Station</label>
              <select value={newInsp.station} onChange={e => setNewInsp({ ...newInsp, station: e.target.value })} required>
                {myStations.map(st => <option key={st.id} value={st.name}>{st.name}</option>)}
              </select>
            </div>

            <div className="ti2-form-field">
              <label>Risk Level Class</label>
              <select value={newInsp.risk} onChange={e => setNewInsp({ ...newInsp, risk: e.target.value })} required>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div className="ti2-form-field" style={{ gridColumn: "1/-1" }}>
              <label>Safety Observations &amp; Point Audit Remarks</label>
              <textarea rows={3} value={newInsp.observations} onChange={e => setNewInsp({ ...newInsp, observations: e.target.value })} placeholder="Describe joint clearance, signal relays, shunting speed compliance observations..." required />
            </div>

            <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button type="button" className="ti2-ghost-btn" onClick={() => setShowInspForm(false)}>Cancel</button>
              <button type="submit" className="ti2-primary-btn">Submit Inspection Log</button>
            </div>
          </form>
        )}

        {/* Inspections ledger list */}
        <div className="ti2-table-wrap">
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 3fr 1.2fr 1fr", padding: "10px 14px", background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", fontWeight: "700", fontSize: "11px" }}>
            <span>Inspection Date</span>
            <span>Station audited</span>
            <span>Safety Observations</span>
            <span>Risk Severity</span>
            <span>Status</span>
          </div>

          {inspections.map(i => (
            <div key={i.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 3fr 1.2fr 1fr", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: "13px", alignItems: "center" }}>
              <strong>{i.date}</strong>
              <strong>{i.station}</strong>
              <span>{i.observations}</span>
              <span><span className="ti2-badge" style={{ background: RISK_B[i.risk], color: RISK_C[i.risk] }}>{i.risk} Risk</span></span>
              <span><span className="ti2-pill-grey">{i.status}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER: COUNSELLING PAGE
  ═══════════════════════════════════════════ */
  const renderCounselling = () => (
    <div className="ti2-page-body animate-fade-in">
      <div className="ti2-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2>Staff Counselling &amp; Behaviour Records</h2>
            <p className="ti2-subtitle" style={{ margin: "2px 0 0" }}>Brief high-risk pointsmen, log safety awareness counseling sessions, and track behaviour logs.</p>
          </div>
          <button className="ti2-primary-btn" onClick={() => setShowCounForm(!showCounForm)}>
            <Plus size={13} /> {showCounForm ? "Close Form" : "Log Counselling Briefing"}
          </button>
        </div>

        {showCounForm && (
          <form onSubmit={submitCounselling} className="ti2-assess-form" style={{ padding: "18px", border: "1px dashed #cbd5e1", borderRadius: "12px", background: "#f8fafc", marginBottom: "18px" }}>
            <div className="ti2-form-field">
              <label>Staff Roster Personnel</label>
              <select value={newCoun.staffName} onChange={e => {
                const targetUser = users.find(u => u.name === e.target.value);
                setNewCoun({ ...newCoun, staffName: e.target.value, designation: targetUser?.designation || "Pointsman", station: targetUser?.station || "Parbhani Junction" });
              }} required>
                <option value="">Select staff member…</option>
                {users.map(u => <option key={u.id} value={u.name}>{u.name} ({u.designation} - {u.station})</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="ti2-form-field">
                <label>Session Duration</label>
                <input type="text" value={newCoun.duration} onChange={e => setNewCoun({ ...newCoun, duration: e.target.value })} placeholder="e.g. 45 mins" required />
              </div>
              <div className="ti2-form-field">
                <label>Progress Status</label>
                <select value={newCoun.progress} onChange={e => setNewCoun({ ...newCoun, progress: e.target.value })} required>
                  <option>Under Monitor</option>
                  <option>Completed</option>
                  <option>Recommended for REF</option>
                </select>
              </div>
            </div>

            <div className="ti2-form-field" style={{ gridColumn: "1/-1" }}>
              <label>Briefing Topics &amp; Counselling Notes</label>
              <textarea rows={3} value={newCoun.topics} onChange={e => setNewCoun({ ...newCoun, topics: e.target.value })} placeholder="Focus topics: Alcoholic rehabilitation, safe shunting speeds, whistle codes compliance, alertness..." required />
            </div>

            <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button type="button" className="ti2-ghost-btn" onClick={() => setShowCounForm(false)}>Cancel</button>
              <button type="submit" className="ti2-primary-btn">Submit Counselling Brief</button>
            </div>
          </form>
        )}

        {/* Counselling list */}
        <div className="ti2-table-wrap">
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1.2fr 2.5fr 1fr 1.2fr", padding: "10px 14px", background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", fontWeight: "700", fontSize: "11px" }}>
            <span>Counselling Date</span>
            <span>Staff Name</span>
            <span>Designation</span>
            <span>Focus Briefing Topics</span>
            <span>Duration</span>
            <span>Progress Status</span>
          </div>

          {counsellings.map(c => (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1.2fr 2.5fr 1fr 1.2fr", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: "13px", alignItems: "center" }}>
              <strong>{c.date}</strong>
              <strong>{c.staffName}</strong>
              <span><span className="ti2-pill-grey" style={{ fontSize: "10px", fontWeight: "700" }}>{c.designation}</span></span>
              <span>{c.topics}</span>
              <span>{c.duration}</span>
              <span><span className="ti2-badge" style={{ background: c.progress === "Completed" ? "#d1fae5" : "#fef3c7", color: c.progress === "Completed" ? "#065f46" : "#92400e" }}>{c.progress}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── APPROVALS (AOM PARITY REPLICATION) ── */
  const renderApprovals = () => {
    const tabs = ["Pending", "Approved", "Rejected"];

    /* ─── DETAIL VIEW ─── */
    if (selectedPM) {
      const secs = editSections[selectedPM.id] || selectedPM.originalSections;
      const liveTotal = secs.reduce((s, x) => s + x.score, 0);
      const liveCat = selectedPM.category === "D" ? "D" : getCat(liveTotal);
      const locked = selectedPM.status !== "Pending";
      const reject = rejectMode[selectedPM.id] || false;

      const pme = selectedPM.meta?.pmeStatus || "Fit";
      const ref = selectedPM.meta?.refStatus || "Cleared";
      const alc = selectedPM.category === "D" ? "Alcoholic" : (selectedPM.meta?.alcoholicStatus || "Non-Alcoholic");

      return (
        <div className="ti2-card animate-fade-in">
          <div className="ti2-card-hdr">
            <div>
              <h2>Review — {selectedPM.pointsmanName} ({selectedPM.hrmsId})</h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                {selectedPM.station} · Pointsman · Submitted by {selectedPM.assessingSM} on {selectedPM.submissionDate}
              </p>
            </div>
            <button className="ti2-link-btn" onClick={() => setSelectedPmId(null)}>â† Back</button>
          </div>

          {/* Info meta — same ti2-review-meta grid as AOM */}
          <div className="ti2-review-meta">
            <div><label>Pointsman</label><strong>{selectedPM.pointsmanName}</strong></div>
            <div><label>HRMS ID</label><strong>{selectedPM.hrmsId}</strong></div>
            <div><label>Station</label><strong>{selectedPM.station}</strong></div>
            <div><label>PME Status</label><strong className={pme === "Fit" ? "ti2-green" : "ti2-red"}>{pme}</strong></div>
            <div><label>REF Status</label><strong className={ref === "Cleared" ? "ti2-green" : "ti2-amber"}>{ref}</strong></div>
            <div><label>Alcoholic Status</label><strong>{alc}</strong></div>
          </div>

          {/* Section-wise marks — same ti2-review-sections as AOM */}
          <h4 className="ti2-sec-title">Section-wise Assessment Marks</h4>
          <div className="ti2-review-sections">
            {secs.map((sec, idx) => {
              const pct = Math.round((sec.score / sec.max) * 100);
              return (
                <div key={sec.title} className="ti2-review-sec-row">
                  <span className="ti2-review-sec-name">{sec.title}</span>
                  <div className="ti2-review-bar-wrap">
                    <div className="ti2-review-bar" style={{ width: `${pct}%`, background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#dc2626" }} />
                  </div>
                  {locked ? (
                    <span className="ti2-review-score-static">{sec.score}/{sec.max}</span>
                  ) : (
                    <div className="ti2-review-score-input">
                      <input type="number" min={0} max={sec.max} value={sec.score}
                        onChange={e => updateSec(selectedPM.id, idx, e.target.value)} />
                      <span className="ti2-sec-max">/ {sec.max}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live score — same ti2-live-score as AOM */}
          <div className="ti2-live-score">
            <div><label>Grand Total</label><strong style={{ color: CAT_C[liveCat], fontSize: 22 }}>{liveTotal}/100</strong></div>
            <div><label>Category</label><span className="ti2-badge" style={{ background: CAT_B[liveCat], color: CAT_C[liveCat], fontSize: 13, padding: "4px 14px" }}>Category {liveCat}</span></div>
          </div>

          {/* TI remarks — mirrors AOM Remarks */}
          {!locked && (
            <div className="ti2-form-field">
              <label>TI Remarks</label>
              <textarea rows={3} value={tiRemarks[selectedPM.id] || ""} onChange={e => setTiRemarks(p => ({ ...p, [selectedPM.id]: e.target.value }))} placeholder="Add remarks…" />
            </div>
          )}

          {/* Reject reason input */}
          {reject && !locked && (
            <div className="ti2-form-field" style={{ marginTop: 10 }}>
              <label style={{ color: "#dc2626" }}>Rejection Reason (mandatory)</label>
              <textarea rows={2} placeholder="Enter rejection reason…" id={`reject-${selectedPM.id}`} />
            </div>
          )}

          {/* Audit trail */}
          {selectedPM.auditTrail?.length > 0 && (
            <div>
              <button className="ti2-link-btn-sm" style={{ marginTop: 12 }} onClick={() => setShowAudit(p => ({ ...p, [selectedPM.id]: !p[selectedPM.id] }))}>
                {showAudit[selectedPM.id] ? "Hide" : "View"} Audit Trail
              </button>
              {showAudit[selectedPM.id] && (
                <div className="ti2-audit-trail">
                  {selectedPM.auditTrail.map((a, i) => (
                    <div key={i} className="ti2-audit-row">
                      <strong>{a.action}</strong> · {a.by} · {a.date}
                      {a.remark && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>"{a.remark}"</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Locked banner */}
          {locked && (
            <div className="ti2-locked-banner">
              {selectedPM.status === "Approved" ? "✓ Assessment Approved and Locked" : "✗ Assessment Rejected"}
              {selectedPM.tiRemarks && <div style={{ marginTop: 4, fontSize: 12 }}>Remarks: {selectedPM.tiRemarks}</div>}
            </div>
          )}

          {/* Action buttons — exact same as AOM: Reject / Approve as Submitted / Modify & Approve */}
          {!locked && !reject && (
            <div className="ti2-review-actions">
              <button className="ti2-danger-btn" onClick={() => setRejectMode(p => ({ ...p, [selectedPM.id]: true }))}>
                <XCircle size={14} /> Reject
              </button>
              <button className="ti2-ghost-btn" onClick={() => finalizePM(selectedPM.id, "approve")}>
                <CheckCircle2 size={14} /> Approve as Submitted
              </button>
              <button className="ti2-primary-btn" onClick={() => finalizePM(selectedPM.id, "modify")}>
                <CheckCircle2 size={14} /> Modify &amp; Approve
              </button>
            </div>
          )}
          {reject && !locked && (
            <div className="ti2-review-actions">
              <button className="ti2-ghost-btn" onClick={() => setRejectMode(p => ({ ...p, [selectedPM.id]: false }))}>Cancel</button>
              <button className="ti2-danger-btn" onClick={() => {
                const note = document.getElementById(`reject-${selectedPM.id}`)?.value || "No reason provided";
                finalizePM(selectedPM.id, "reject", note);
              }}>Confirm Rejection</button>
            </div>
          )}
        </div>
      );
    }

    /* ─── LIST VIEW ─── */
    return (
      <div className="ti2-card animate-fade-in">
        <div className="ti2-card-hdr">
          <h2>Approvals — Pointsmen</h2>
        </div>
        <p className="ti2-subtitle">Review and approve Pointsman assessments submitted by Station Masters.</p>

        {/* Role switch — mirrors AOM's approvals style */}
        <div className="ti2-tabs" style={{ marginBottom: 4 }}>
          <button className="ti2-tab active">
            Pointsmen
            <span className="ti2-tab-count">
              {pmList.filter(p => p.status === "Pending").length}
            </span>
          </button>
        </div>

        {/* Status tabs — same ti2-tabs as AOM */}
        <div className="ti2-tabs">
          {tabs.map(t => (
            <button key={t} className={`ti2-tab ${reviewTab === t ? "active" : ""}`} onClick={() => setReviewTab(t)}>
              {t} <span className="ti2-tab-count">
                {pmList.filter(p => p.status === t).length}
              </span>
            </button>
          ))}
        </div>

        {/* Filters — exact same as AOM */}
        <div className="ti2-filter-row">
          <div className="ti2-search-box">
            <Search size={13} />
            <input placeholder="Search pointsman…"
              value={reviewSearch} onChange={e => setReviewSearch(e.target.value)} />
          </div>
          <select className="ti2-select" value={reviewStation} onChange={e => setReviewStation(e.target.value)}>
            <option value="All">All Stations</option>
            {myStations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        {/* Table — exact same structure as AOM */}
        <div className="ti2-table-wrap">
          <div className="ti2-pm-head ti2-pm-row">
            {["Name", "HRMS ID", "Station", "Submitted By", "Date", "Score", "Status", "Action"].map(h => <span key={h}>{h}</span>)}
          </div>
          {filteredPM.length === 0 && <p className="ti2-empty">No records in this category.</p>}
          {filteredPM.map(p => {
            const total = (p.finalSections || p.originalSections).reduce((s, x) => s + x.score, 0);
            const cat = p.category || getCat(total);
            return (
              <div key={p.id} className="ti2-pm-row ti2-pm-data-row">
                <span><strong>{p.pointsmanName}</strong></span>
                <span>{p.hrmsId}</span>
                <span>{p.station}</span>
                <span>{p.assessingSM}</span>
                <span>{p.submissionDate}</span>
                <span><strong style={{ color: CAT_C[cat] }}>{total}/100</strong></span>
                <span>
                  <span className={`ti2-status-pill ti2-status-${p.status.toLowerCase()}`}>
                    {p.status}
                  </span>
                </span>
                <span>
                  <button className="ti2-link-btn-sm" onClick={() => openPmReview(p.id)}>
                    {p.status === "Pending" ? <><ClipboardCheck size={12} /> Review</> : <><Eye size={12} /> View</>}
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── ASSESSMENTS (unified: SM / SS / TM) ── */
  const renderAssessments = () => {
    const getStatusStyle = (status) => {
      if (status === "Exam Sent") return { background: "#f3e8ff", color: "#6b21a8" };
      if (status === "Exam Taken") return { background: "#dcfce7", color: "#166534" };
      return {};
    };

    // ─── LEVEL 3: Form views (SM, SS, TM) ───
    if (assessRole === "SM" && activeSmId) {
      const sm = smList.find(s => s.id === activeSmId);
      const f = smForms[activeSmId] || defaultSMForm();
      const locked = !!smLocked[activeSmId];

      const mcqDataStr = localStorage.getItem(`sm_mcq_test_${sm?.hrmsId}`);
      const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;
      const dbExamScore = sm?.examScore !== undefined && sm?.examScore !== null
        ? (sm.examScore > 25 ? Math.round(sm.examScore / 4) : sm.examScore)
        : null;
      const isMcqCompleted = !!(mcqData && mcqData.completed) || dbExamScore !== null || ["Submitted", "Approved", "Exam Taken", "Completed", "EVALUATED"].includes(sm?.status);
      const isActivated = localStorage.getItem(`sm_test_activated_${sm?.hrmsId}`) === "true";

      const knowledge = dbExamScore !== null
        ? dbExamScore
        : (isMcqCompleted ? (mcqData?.correctCount || 0) : (parseInt(f.knowledgeMarks) || 0));
      const displayScore = dbExamScore !== null ? dbExamScore : (mcqData?.correctCount || 0);
      const displayPercentage = dbExamScore !== null ? Math.round((dbExamScore / 25) * 100) : (mcqData?.percentage || 0);
      const fWithKnowledge = { ...f, knowledgeMarks: knowledge.toString() };
      const { ynScore, total } = computeSMScore(fWithKnowledge, TI_SM_CRITERIA);
      const isAlcoholic = f.alcoholicStatus === "Alcoholic";
      const liveCat = isAlcoholic ? "D" : getCat(total);

      return (
        <section className="sm2-card animate-fade-in" style={{ padding: "24px" }}>
          <div className="sm2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Assessment — {sm?.name}
              </h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                {sm?.hrmsId} · {sm?.lastDate || "20 May 2026"}
              </p>
            </div>
            <button
              className="sm2-ghost-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", color: "#475569" }}
              onClick={() => setActiveSmId(null)}
            >
              ← Back
            </button>
          </div>

          {/* ── Section 1: Knowledge of Rules ── */}
          <div className="sm2-assess-section">
            <div className="sm2-assess-sec-hdr">
              <span className="sm2-assess-sec-num">01</span>
              <div>
                <strong>Knowledge of Rules (MCQ-based)</strong>
                <span className="sm2-assess-sec-meta">Auto-calculated from Station Master MCQ Test</span>
              </div>
              <span className="sm2-assess-live-marks">{knowledge} / 25</span>
            </div>

            <div className="sm2-mcq-card-container" style={{ marginTop: 16 }}>
              {isMcqCompleted ? (
                <div className="sm2-mcq-success-card">
                  <div className="sm2-mcq-card-header">
                    <div className="sm2-mcq-status">
                      <span className="sm2-status-dot green"></span>
                      <span className="sm2-status-text text-green font-semibold">MCQ Test Completed</span>
                    </div>
                    <div className="sm2-mcq-lock-badge">
                      <Lock size={12} />
                      <span>Read-Only (Synced)</span>
                    </div>
                  </div>

                  <div className="sm2-mcq-card-body">
                    <div className="sm2-mcq-score-display">
                      <div className="sm2-mcq-large-score">
                        <strong>{displayScore}</strong>
                        <span>/ 25</span>
                      </div>
                      <div className="sm2-mcq-percentage-badge">
                        {displayPercentage}% Score
                      </div>
                      <button
                        type="button"
                        style={{ marginLeft: "auto", background: "#fee2e2", border: "none", color: "#dc2626", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                        onClick={() => {
                          localStorage.removeItem(`sm_mcq_test_${sm?.hrmsId}`);
                          setSMField(activeSmId, "knowledgeMarks", "0");
                        }}
                      >
                        Reset Mock Exam
                      </button>
                    </div>

                    <div className="sm2-mcq-progress-container">
                      <div className="sm2-mcq-progress-bar">
                        <div
                          className="sm2-mcq-progress-fill"
                          style={{
                            width: `${mcqData?.percentage || 88}%`,
                            background: (mcqData?.percentage || 88) >= 80 ? "#16a34a" : (mcqData?.percentage || 88) >= 50 ? "#2563eb" : "#dc2626"
                          }}
                        />
                      </div>
                    </div>

                    <div className="sm2-mcq-meta-grid">
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Submitted On</span>
                        <strong className="sm2-mcq-meta-val">{mcqData?.submittedDate || "30 May 2026"}</strong>
                      </div>
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Assessed Entity</span>
                        <strong className="sm2-mcq-meta-val">{sm?.name}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="sm2-mcq-pending-card">
                  <div className="sm2-mcq-card-header">
                    <div className="sm2-mcq-status">
                      <span className={`sm2-status-dot ${isActivated ? "amber" : "red"}`}></span>
                      <span className={`sm2-status-text text-${isActivated ? "amber" : "red"} font-semibold`}>
                        {isActivated ? "MCQ Test Active" : "MCQ Test Locked"}
                      </span>
                    </div>
                    <div className="sm2-mcq-lock-badge">
                      <Lock size={12} />
                      <span>Read-Only</span>
                    </div>
                  </div>

                  <div className="sm2-mcq-card-body pending" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="sm2-mcq-pending-message" style={{ display: "flex", gap: "12px", background: isActivated ? "#fffbeb" : "#fef2f2", border: isActivated ? "1px solid #fef3c7" : "1px solid #fee2e2", padding: "16px", borderRadius: "8px" }}>
                      <AlertTriangle size={24} color={isActivated ? "#d97706" : "#dc2626"} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: 14, color: isActivated ? "#b45309" : "#991b1b" }}>{isActivated ? "Awaiting Station Master Attempt" : "Competency Exam Locked"}</h4>
                        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: isActivated ? "#d97706" : "#dc2626" }}>
                          {isActivated ? (
                            <span>The Station Master safety competency trial is active. Request SM (<strong>{sm?.name}</strong>) to log into their portal and attempt the 25 safety questions to automatically sync scores.</span>
                          ) : (
                            <span>The Station Master MCQ exam is currently locked. You must click the <strong>Activate Safety Exam</strong> button below to enable the Station Master to log in and attempt the test.</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                      {/* Activation is now exclusively done via 'Send Access' button on the table list */}
                      <span style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>Activation controlled from Dashboard table.</span>
                    </div>

                    <div className="sm2-mcq-meta-grid">
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Assessment Status</span>
                        <strong className={`sm2-mcq-meta-val text-${isActivated ? "amber" : "red"}`}>{isActivated ? "Active & Awaiting Attempt" : "Locked (Awaiting Activation)"}</strong>
                      </div>
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Assessed Entity</span>
                        <strong className="sm2-mcq-meta-val">{sm?.name}</strong>
                      </div>
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Total Questions</span>
                        <strong className="sm2-mcq-meta-val">25 Questions (1 mark each)</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Sections 02-06: Yes/No blocks ── */}
          {TI_SM_CRITERIA.map((sec, si) => (
            <div id={'section-' + sec.key} key={sec.key} className="sm2-assess-section" style={{ opacity: 1 }}>
              <div className="sm2-assess-sec-hdr">
                <span className="sm2-assess-sec-num">{String(si + 2).padStart(2, "0")}</span>
                <div>
                  <strong>{sec.label} <span style={{ color: "#dc2626" }}>*</span></strong>
                  {!(f[sec.key] && f[sec.key].length === sec.count && f[sec.key].every(v => v === "Yes" || v === "No")) && (
                    <span style={{ color: "#dc2626", fontSize: "11px", fontWeight: "700", marginLeft: "8px", background: "#fee2e2", padding: "2px 6px", borderRadius: "4px" }}>Incomplete</span>
                  )}
                  <span className="sm2-assess-sec-meta">{sec.count} criteria · {sec.weight} marks each · Total {sec.count * sec.weight}</span>
                </div>
                <span className="sm2-assess-live-marks">{(f[sec.key] || []).filter(v => v === "Yes").length * sec.weight} / {sec.count * sec.weight}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "6px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginRight: "auto" }}>{t("Quick Fill:")}</span>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setSmForms(prev => ({
                      ...prev,
                      [activeSmId]: {
                        ...(prev[activeSmId] || defaultSMForm()),
                        [sec.key]: Array(sec.count).fill("Yes")
                      }
                    }));
                  }}
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "700",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    background: "#f0fdf4",
                    color: "#166534",
                    cursor: locked ? "not-allowed" : "pointer"
                  }}
                >
                  ✓ {t("All Yes")}
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setSmForms(prev => ({
                      ...prev,
                      [activeSmId]: {
                        ...(prev[activeSmId] || defaultSMForm()),
                        [sec.key]: Array(sec.count).fill("No")
                      }
                    }));
                  }}
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "700",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    background: "#fef2f2",
                    color: "#991b1b",
                    cursor: locked ? "not-allowed" : "pointer"
                  }}
                >
                  ✗ {t("All No")}
                </button>
              </div>
              <div className="sm2-yn-grid">
                {sec.criteria.map((cr, idx) => (
                  <div key={idx} className="sm2-yn-row">
                    <span className="sm2-yn-label">{idx + 1}. {cr}</span>
                    <div className="sm2-yn-btns">
                      <button
                        type="button" disabled={locked}
                        className={f[sec.key]?.[idx] === "Yes" ? "sm2-yn-btn sm2-yn-yes active" : "sm2-yn-btn sm2-yn-yes"}
                        style={{ cursor: locked ? "not-allowed" : "pointer" }}
                        onClick={() => toggleSMYN(activeSmId, sec.key, idx, "Yes")}>
                        Yes
                      </button>
                      <button
                        type="button" disabled={locked}
                        className={f[sec.key]?.[idx] === "No" ? "sm2-yn-btn sm2-yn-no active" : "sm2-yn-btn sm2-yn-no"}
                        style={{ cursor: locked ? "not-allowed" : "pointer" }}
                        onClick={() => toggleSMYN(activeSmId, sec.key, idx, "No")}>
                        No
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ── Section 07: Additional Details ── */}
          <div id="section-additional" className="sm2-assess-section" style={{ opacity: 1 }}>
            <div className="sm2-assess-sec-hdr">
              <span className="sm2-assess-sec-num">07</span>
              <div><strong>Additional Details</strong><span className="sm2-assess-sec-meta">Mandatory fields</span></div>
            </div>
            <div className="sm2-assess-form" style={{ marginTop: 12 }}>
              <div className="sm2-form-field">
                <label>Knowledge Marks (MCQ Test)</label>
                <input type="number" min={0} max={25} disabled={locked} value={knowledge} onChange={e => {
                  const val = e.target.value;
                  setSMField(activeSmId, "knowledgeMarks", val);
                }} placeholder="Synced MCQ marks" style={{ background: "#f1f5f9" }} readOnly />
              </div>
              <div className="sm2-form-field">
                <label>Alcoholic Status <span style={{ color: "#dc2626" }}>*</span></label>
                <select disabled={locked} value={f.alcoholicStatus} onChange={e => setSMField(activeSmId, "alcoholicStatus", e.target.value)}>
                  <option value="">Select…</option>
                  <option>Non-Alcoholic</option>
                  <option>Alcoholic</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>PME Status</label>
                <select disabled={locked} value={f.pmeStatus} onChange={e => setSMField(activeSmId, "pmeStatus", e.target.value)}>
                  <option>Fit</option><option>Unfit</option><option>Pending</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>REF Status</label>
                <select disabled={locked} value={f.refStatus} onChange={e => setSMField(activeSmId, "refStatus", e.target.value)}>
                  <option>Cleared</option><option>Pending</option><option>Failed</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>Counselling</label>
                <select disabled={locked} value={f.counselling} onChange={e => setSMField(activeSmId, "counselling", e.target.value)}>
                  <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>Automatic Training</label>
                <select disabled={locked} value={f.automaticTraining} onChange={e => setSMField(activeSmId, "automaticTraining", e.target.value)}>
                  <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
                </select>
              </div>
              <div className="sm2-form-field sm2-form-full" style={{ gridColumn: "1/-1" }}>
                <label>Remarks for AOM</label>
                <textarea rows={3} disabled={locked} value={f.remarks} onChange={e => setSMField(activeSmId, "remarks", e.target.value)} placeholder="Enter observations, recommendations…" />
              </div>
            </div>
          </div>

          {/* ── Live Score Bar ── */}
          <div className="sm2-live-score" style={{ opacity: 1 }}>
            <div><label>Knowledge (MCQ)</label><strong>{knowledge}/25</strong></div>
            <div><label>Yes/No Score</label><strong>{ynScore}/75</strong></div>
            <div><label>Grand Total</label><strong style={{ color: CAT_C[liveCat], fontSize: 22 }}>{total}/100</strong></div>
            <div><label>Category</label><span className="sm2-badge" style={{ background: CAT_B[liveCat], color: CAT_C[liveCat], fontSize: 13, padding: "4px 14px" }}>Category {liveCat}</span></div>
          </div>

          {locked && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
              <div style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", textAlign: "center" }}>
                ✓ Assessment submitted. Pending AOM Approval.
              </div>
              <button type="button" className="sm2-ghost-btn" style={{ border: "1px solid #7c3aed", color: "#7c3aed", padding: "10px", borderRadius: "8px", fontWeight: "700", background: "none", cursor: "pointer" }} onClick={() => setSmLocked(p => ({ ...p, [activeSmId]: false }))}>
                <Edit size={14} style={{ marginRight: 6 }} /> Unlock & Edit Assessment
              </button>
            </div>
          )}
          {!locked && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button className="sm2-ghost-btn" style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }} onClick={() => {
                  setSmForms(prev => ({
                    ...prev,
                    [activeSmId]: {
                      ...f,
                      knowledgeMarks: String(knowledge)
                    }
                  }));
                  alert("Assessment saved as draft successfully!");
                }}>Save as Draft</button>
                <button className="sm2-primary-btn" style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "none", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }} onClick={() => {
                  const isFormValid = f.alcoholicStatus && TI_SM_CRITERIA.every(sec => f[sec.key] && f[sec.key].length === sec.count && f[sec.key].every(v => v === "Yes" || v === "No"));
                  if (!isFormValid) {
                    const missingSec = TI_SM_CRITERIA.find(sec => !(f[sec.key] && f[sec.key].length === sec.count && f[sec.key].every(v => v === "Yes" || v === "No")));
                    if (missingSec) {
                      alert(`Validation Error: Please complete all questions in the "${missingSec.label}" section.`);
                      document.getElementById('section-' + missingSec.key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else if (!f.alcoholicStatus) {
                      alert(`Validation Error: Please select Alcoholic/Non-Alcoholic status.`);
                      document.getElementById('section-additional')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                  }
                  setSMField(activeSmId, "knowledgeMarks", String(knowledge));
                  submitSMAssessment(activeSmId, String(knowledge));
                }}>
                  <CheckCircle2 size={14} /> Submit for AOM Approval
                </button>
              </div>
            </div>
          )}
        </section>
      );
    }

    if (assessRole === "SS" && activeSsId) {
      const ss = ssList.find(s => s.id === activeSsId);
      const f = ssForms[activeSsId] || defaultSSForm();
      const locked = !!ssLocked[activeSsId];

      const mcqDataStr = localStorage.getItem(`ss_mcq_test_${ss?.hrmsId}`);
      const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;
      const dbExamScore = ss?.examScore !== undefined && ss?.examScore !== null
        ? (ss.examScore > 25 ? Math.round(ss.examScore / 4) : ss.examScore)
        : null;
      const isMcqCompleted = !!(mcqData && mcqData.completed) || dbExamScore !== null || ["Submitted", "Approved", "Exam Taken", "Completed", "EVALUATED"].includes(ss?.status);
      const isActivated = localStorage.getItem(`ss_test_activated_${ss?.hrmsId}`) === "true";

      const knowledge = dbExamScore !== null
        ? dbExamScore
        : (isMcqCompleted ? (mcqData?.correctCount || 0) : (parseInt(f.knowledgeMarks) || 0));
      const displayScore = dbExamScore !== null ? dbExamScore : (mcqData?.correctCount || 0);
      const displayPercentage = dbExamScore !== null ? Math.round((dbExamScore / 25) * 100) : (mcqData?.percentage || 0);
      const fWithKnowledge = { ...f, knowledgeMarks: knowledge.toString() };
      const { ynScore, total } = computeSSScore(fWithKnowledge, TI_SS_CRITERIA);
      const isAlcoholic = f.alcoholicStatus === "Alcoholic";
      const liveCat = isAlcoholic ? "D" : getCat(total);

      return (
        <section className="sm2-card animate-fade-in" style={{ padding: "24px" }}>
          <div className="sm2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Assessment — {ss?.name}
              </h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                {ss?.hrmsId} · {ss?.station}
              </p>
            </div>
            <button
              className="sm2-ghost-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", color: "#475569" }}
              onClick={() => setActiveSsId(null)}
            >
              ← Back
            </button>
          </div>

          {/* ── Section 1: Knowledge of Rules ── */}
          <div className="sm2-assess-section">
            <div className="sm2-assess-sec-hdr">
              <span className="sm2-assess-sec-num">01</span>
              <div>
                <strong>Knowledge of Rules (MCQ-based)</strong>
                <span className="sm2-assess-sec-meta">Auto-calculated from Station Superintendent MCQ Test</span>
              </div>
              <span className="sm2-assess-live-marks">{knowledge} / 25</span>
            </div>

            <div className="sm2-mcq-card-container" style={{ marginTop: 16 }}>
              {isMcqCompleted ? (
                <div className="sm2-mcq-success-card">
                  <div className="sm2-mcq-card-header">
                    <div className="sm2-mcq-status">
                      <span className="sm2-status-dot green"></span>
                      <span className="sm2-status-text text-green font-semibold">MCQ Test Completed</span>
                    </div>
                    <div className="sm2-mcq-lock-badge">
                      <Lock size={12} />
                      <span>Read-Only (Synced)</span>
                    </div>
                  </div>

                  <div className="sm2-mcq-card-body">
                    <div className="sm2-mcq-score-display">
                      <div className="sm2-mcq-large-score">
                        <strong>{displayScore}</strong>
                        <span>/ 25</span>
                      </div>
                      <div className="sm2-mcq-percentage-badge">
                        {displayPercentage}% Score
                      </div>
                      <button
                        type="button"
                        style={{ marginLeft: "auto", background: "#fee2e2", border: "none", color: "#dc2626", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                        onClick={() => {
                          localStorage.removeItem(`ss_mcq_test_${ss?.hrmsId}`);
                          setSSField(activeSsId, "knowledgeMarks", "0");
                        }}
                      >
                        Reset Mock Exam
                      </button>
                    </div>

                    <div className="sm2-mcq-progress-container">
                      <div className="sm2-mcq-progress-bar">
                        <div
                          className="sm2-mcq-progress-fill"
                          style={{
                            width: `${mcqData?.percentage || 84}%`,
                            background: (mcqData?.percentage || 84) >= 80 ? "#16a34a" : (mcqData?.percentage || 84) >= 50 ? "#2563eb" : "#dc2626"
                          }}
                        />
                      </div>
                    </div>

                    <div className="sm2-mcq-meta-grid">
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Submitted On</span>
                        <strong className="sm2-mcq-meta-val">{mcqData?.submittedDate || "30 May 2026"}</strong>
                      </div>
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Assessed Entity</span>
                        <strong className="sm2-mcq-meta-val">{ss?.name}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="sm2-mcq-pending-card">
                  <div className="sm2-mcq-card-header">
                    <div className="sm2-mcq-status">
                      <span className={`sm2-status-dot ${isActivated ? "amber" : "red"}`}></span>
                      <span className={`sm2-status-text text-${isActivated ? "amber" : "red"} font-semibold`}>
                        {isActivated ? "MCQ Test Active" : "MCQ Test Locked"}
                      </span>
                    </div>
                    <div className="sm2-mcq-lock-badge">
                      <Lock size={12} />
                      <span>Read-Only</span>
                    </div>
                  </div>

                  <div className="sm2-mcq-card-body pending" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="sm2-mcq-pending-message" style={{ display: "flex", gap: "12px", background: isActivated ? "#fffbeb" : "#fef2f2", border: isActivated ? "1px solid #fef3c7" : "1px solid #fee2e2", padding: "16px", borderRadius: "8px" }}>
                      <AlertTriangle size={24} color={isActivated ? "#d97706" : "#dc2626"} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: 14, color: isActivated ? "#b45309" : "#991b1b" }}>{isActivated ? "Awaiting Station Superintendent Attempt" : "Competency Exam Locked"}</h4>
                        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: isActivated ? "#d97706" : "#dc2626" }}>
                          {isActivated ? (
                            <span>The Station Superintendent safety competency trial is active. Request SS (<strong>{ss?.name}</strong>) to log into their portal and attempt the 25 safety questions to automatically sync scores.</span>
                          ) : (
                            <span>The Station Superintendent MCQ exam is currently locked. The Area Operations Manager (AOM) must activate the safety exam to enable the Station Superintendent to log in and attempt the test.</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="sm2-mcq-meta-grid">
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Assessment Status</span>
                        <strong className={`sm2-mcq-meta-val text-${isActivated ? "amber" : "red"}`}>{isActivated ? "Active & Awaiting Attempt" : "Locked (Awaiting Activation)"}</strong>
                      </div>
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Assessed Entity</span>
                        <strong className="sm2-mcq-meta-val">{ss?.name}</strong>
                      </div>
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Total Questions</span>
                        <strong className="sm2-mcq-meta-val">25 Questions (1 mark each)</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Sections 02-06: Yes/No blocks ── */}
          {TI_SS_CRITERIA.map((sec, si) => (
            <div id={'section-' + sec.key} key={sec.key} className="sm2-assess-section" style={{ opacity: 1 }}>
              <div className="sm2-assess-sec-hdr">
                <span className="sm2-assess-sec-num">{String(si + 2).padStart(2, "0")}</span>
                <div>
                  <strong>{sec.label} <span style={{ color: "#dc2626" }}>*</span></strong>
                  {!(f[sec.key] && f[sec.key].length === sec.count && f[sec.key].every(v => v === "Yes" || v === "No")) && (
                    <span style={{ color: "#dc2626", fontSize: "11px", fontWeight: "700", marginLeft: "8px", background: "#fee2e2", padding: "2px 6px", borderRadius: "4px" }}>Incomplete</span>
                  )}
                  <span className="sm2-assess-sec-meta">{sec.count} criteria · {sec.weight} marks each · Total {sec.count * sec.weight}</span>
                </div>
                <span className="sm2-assess-live-marks">{(f[sec.key] || []).filter(v => v === "Yes").length * sec.weight} / {sec.count * sec.weight}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "6px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginRight: "auto" }}>{t("Quick Fill:")}</span>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setSsForms(prev => ({
                      ...prev,
                      [activeSsId]: {
                        ...(prev[activeSsId] || defaultSSForm()),
                        [sec.key]: Array(sec.count).fill("Yes")
                      }
                    }));
                  }}
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "700",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    background: "#f0fdf4",
                    color: "#166534",
                    cursor: locked ? "not-allowed" : "pointer"
                  }}
                >
                  ✓ {t("All Yes")}
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setSsForms(prev => ({
                      ...prev,
                      [activeSsId]: {
                        ...(prev[activeSsId] || defaultSSForm()),
                        [sec.key]: Array(sec.count).fill("No")
                      }
                    }));
                  }}
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "700",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    background: "#fef2f2",
                    color: "#991b1b",
                    cursor: locked ? "not-allowed" : "pointer"
                  }}
                >
                  ✗ {t("All No")}
                </button>
              </div>
              <div className="sm2-yn-grid">
                {sec.criteria.map((cr, idx) => (
                  <div key={idx} className="sm2-yn-row">
                    <span className="sm2-yn-label">{idx + 1}. {cr}</span>
                    <div className="sm2-yn-btns">
                      <button
                        type="button" disabled={locked}
                        className={f[sec.key]?.[idx] === "Yes" ? "sm2-yn-btn sm2-yn-yes active" : "sm2-yn-btn sm2-yn-yes"}
                        style={{ cursor: locked ? "not-allowed" : "pointer" }}
                        onClick={() => toggleSSYN(activeSsId, sec.key, idx, "Yes")}>
                        Yes
                      </button>
                      <button
                        type="button" disabled={locked}
                        className={f[sec.key]?.[idx] === "No" ? "sm2-yn-btn sm2-yn-no active" : "sm2-yn-btn sm2-yn-no"}
                        style={{ cursor: locked ? "not-allowed" : "pointer" }}
                        onClick={() => toggleSSYN(activeSsId, sec.key, idx, "No")}>
                        No
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ── Section 07: Additional Details ── */}
          <div id="section-additional" className="sm2-assess-section" style={{ opacity: 1 }}>
            <div className="sm2-assess-sec-hdr">
              <span className="sm2-assess-sec-num">07</span>
              <div><strong>Additional Details</strong><span className="sm2-assess-sec-meta">Mandatory fields</span></div>
            </div>
            <div className="sm2-assess-form" style={{ marginTop: 12 }}>
              <div className="sm2-form-field">
                <label>Knowledge Marks (MCQ Test)</label>
                <input type="number" min={0} max={25} disabled={locked} value={knowledge} onChange={e => {
                  const val = e.target.value;
                  setSSField(activeSsId, "knowledgeMarks", val);
                }} placeholder="Synced MCQ marks" style={{ background: "#f1f5f9" }} readOnly />
              </div>
              <div className="sm2-form-field">
                <label>Alcoholic Status <span style={{ color: "#dc2626" }}>*</span></label>
                <select disabled={locked} value={f.alcoholicStatus} onChange={e => setSSField(activeSsId, "alcoholicStatus", e.target.value)}>
                  <option value="">Select…</option>
                  <option>Non-Alcoholic</option>
                  <option>Alcoholic</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>PME Status</label>
                <select disabled={locked} value={f.pmeStatus} onChange={e => setSSField(activeSsId, "pmeStatus", e.target.value)}>
                  <option>Fit</option><option>Unfit</option><option>Pending</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>REF Status</label>
                <select disabled={locked} value={f.refStatus} onChange={e => setSSField(activeSsId, "refStatus", e.target.value)}>
                  <option>Cleared</option><option>Pending</option><option>Failed</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>Counselling</label>
                <select disabled={locked} value={f.counselling} onChange={e => setSSField(activeSsId, "counselling", e.target.value)}>
                  <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>Automatic Training</label>
                <select disabled={locked} value={f.automaticTraining} onChange={e => setSSField(activeSsId, "automaticTraining", e.target.value)}>
                  <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
                </select>
              </div>
              <div className="sm2-form-field sm2-form-full" style={{ gridColumn: "1/-1" }}>
                <label>Remarks for AOM</label>
                <textarea rows={3} disabled={locked} value={f.remarks} onChange={e => setSSField(activeSsId, "remarks", e.target.value)} placeholder="Enter observations, recommendations…" />
              </div>
            </div>
          </div>

          {/* ── Live Score Bar ── */}
          <div className="sm2-live-score" style={{ opacity: 1 }}>
            <div><label>Knowledge (MCQ)</label><strong>{knowledge}/25</strong></div>
            <div><label>Yes/No Score</label><strong>{ynScore}/75</strong></div>
            <div><label>Grand Total</label><strong style={{ color: CAT_C[liveCat], fontSize: 22 }}>{total}/100</strong></div>
            <div><label>Category</label><span className="sm2-badge" style={{ background: CAT_B[liveCat], color: CAT_C[liveCat], fontSize: 13, padding: "4px 14px" }}>Category {liveCat}</span></div>
          </div>

          {locked && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
              <div style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", textAlign: "center" }}>
                ✓ Assessment submitted. Pending AOM Approval.
              </div>
              <button type="button" className="sm2-ghost-btn" style={{ border: "1px solid #7c3aed", color: "#7c3aed", padding: "10px", borderRadius: "8px", fontWeight: "700", background: "none", cursor: "pointer" }} onClick={() => setSsLocked(p => ({ ...p, [activeSsId]: false }))}>
                <Edit size={14} style={{ marginRight: 6 }} /> Unlock & Edit Assessment
              </button>
            </div>
          )}
          {!locked && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button className="sm2-ghost-btn" style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }} onClick={() => {
                  setSsForms(prev => ({
                    ...prev,
                    [activeSsId]: {
                      ...f,
                      knowledgeMarks: String(knowledge)
                    }
                  }));
                  alert("Assessment saved as draft successfully!");
                }}>Save as Draft</button>
                <button className="sm2-primary-btn" style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "none", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }} onClick={() => {
                  const isFormValid = f.alcoholicStatus && TI_SS_CRITERIA.every(sec => f[sec.key] && f[sec.key].length === sec.count && f[sec.key].every(v => v === "Yes" || v === "No"));
                  if (!isFormValid) {
                    const missingSec = TI_SS_CRITERIA.find(sec => !(f[sec.key] && f[sec.key].length === sec.count && f[sec.key].every(v => v === "Yes" || v === "No")));
                    if (missingSec) {
                      alert(`Validation Error: Please complete all questions in the "${missingSec.label}" section.`);
                      document.getElementById('section-' + missingSec.key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else if (!f.alcoholicStatus) {
                      alert(`Validation Error: Please select Alcoholic/Non-Alcoholic status.`);
                      document.getElementById('section-additional')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                  }
                  setSSField(activeSsId, "knowledgeMarks", String(knowledge));
                  submitSSAssessment(activeSsId, String(knowledge));
                }}>
                  <CheckCircle2 size={14} /> Submit for AOM Approval
                </button>
              </div>
            </div>
          )}
        </section>
      );
    }

    if (assessRole === "TM" && activeTmId) {
      const tm = tmList.find(t => t.id === activeTmId);
      const f = tmForms[activeTmId] || defaultTMForm();
      const locked = !!tmLocked[activeTmId];

      const mcqDataStr = localStorage.getItem(`tm_mcq_test_${tm?.hrmsId}`);
      const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;
      const dbExamScore = tm?.examScore !== undefined && tm?.examScore !== null
        ? (tm.examScore > 25 ? Math.round(tm.examScore / 4) : tm.examScore)
        : null;
      const isMcqCompleted = !!(mcqData && mcqData.completed) || dbExamScore !== null || ["Submitted", "Approved", "Exam Taken", "Completed", "EVALUATED"].includes(tm?.status);
      const isActivated = localStorage.getItem(`tm_test_activated_${tm?.hrmsId}`) === "true";

      const knowledge = dbExamScore !== null
        ? dbExamScore
        : (isMcqCompleted ? (mcqData?.correctCount || 0) : (parseInt(f.knowledgeMarks) || 0));
      const displayScore = dbExamScore !== null ? dbExamScore : (mcqData?.correctCount || 0);
      const displayPercentage = dbExamScore !== null ? Math.round((dbExamScore / 25) * 100) : (mcqData?.percentage || 0);
      const fWithKnowledge = { ...f, knowledgeMarks: knowledge.toString() };
      const { ynScore, total } = computeTMScore(fWithKnowledge, TI_TM_CRITERIA);
      const isAlcoholic = f.alcoholicStatus === "Alcoholic";
      const liveCat = isAlcoholic ? "D" : getCat(total);

      return (
        <section className="sm2-card animate-fade-in" style={{ padding: "24px" }}>
          <div className="sm2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Assessment — {tm?.name}
              </h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                {tm?.hrmsId} · Home Station: {tm?.station}
              </p>
            </div>
            <button
              className="sm2-ghost-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", color: "#475569" }}
              onClick={() => setActiveTmId(null)}
            >
              ← Back
            </button>
          </div>

          {/* ── Section 1: Knowledge of Rules ── */}
          <div className="sm2-assess-section">
            <div className="sm2-assess-sec-hdr">
              <span className="sm2-assess-sec-num">01</span>
              <div>
                <strong>Knowledge of Rules (MCQ-based)</strong>
                <span className="sm2-assess-sec-meta">Auto-calculated from Train Manager MCQ Test</span>
              </div>
              <span className="sm2-assess-live-marks">{knowledge} / 25</span>
            </div>

            <div className="sm2-mcq-card-container" style={{ marginTop: 16 }}>
              {isMcqCompleted ? (
                <div className="sm2-mcq-success-card">
                  <div className="sm2-mcq-card-header">
                    <div className="sm2-mcq-status">
                      <span className="sm2-status-dot green"></span>
                      <span className="sm2-status-text text-green font-semibold">MCQ Test Completed</span>
                    </div>
                    <div className="sm2-mcq-lock-badge">
                      <Lock size={12} />
                      <span>Read-Only (Synced)</span>
                    </div>
                  </div>

                  <div className="sm2-mcq-card-body">
                    <div className="sm2-mcq-score-display">
                      <div className="sm2-mcq-large-score">
                        <strong>{displayScore}</strong>
                        <span>/ 25</span>
                      </div>
                      <div className="sm2-mcq-percentage-badge">
                        {displayPercentage}% Score
                      </div>
                      <button
                        type="button"
                        style={{ marginLeft: "auto", background: "#fee2e2", border: "none", color: "#dc2626", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                        onClick={() => {
                          localStorage.removeItem(`tm_mcq_test_${tm?.hrmsId}`);
                          setTMField(activeTmId, "knowledgeMarks", "0");
                        }}
                      >
                        Reset Mock Exam
                      </button>
                    </div>

                    <div className="sm2-mcq-progress-container">
                      <div className="sm2-mcq-progress-bar">
                        <div
                          className="sm2-mcq-progress-fill"
                          style={{
                            width: `${displayPercentage}%`,
                            background: displayPercentage >= 80 ? "#16a34a" : displayPercentage >= 50 ? "#2563eb" : "#dc2626"
                          }}
                        />
                      </div>
                    </div>

                    <div className="sm2-mcq-meta-grid">
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Submitted On</span>
                        <strong className="sm2-mcq-meta-val">{tm?.submissionDate || mcqData?.submittedDate || "30 May 2026"}</strong>
                      </div>
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Assessed Entity</span>
                        <strong className="sm2-mcq-meta-val">{tm?.name}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="sm2-mcq-pending-card">
                  <div className="sm2-mcq-card-header">
                    <div className="sm2-mcq-status">
                      <span className={`sm2-status-dot ${isActivated ? "amber" : "red"}`}></span>
                      <span className={`sm2-status-text text-${isActivated ? "amber" : "red"} font-semibold`}>
                        {isActivated ? "MCQ Test Active" : "MCQ Test Locked"}
                      </span>
                    </div>
                    <div className="sm2-mcq-lock-badge">
                      <Lock size={12} />
                      <span>Read-Only</span>
                    </div>
                  </div>

                  <div className="sm2-mcq-card-body pending" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="sm2-mcq-pending-message" style={{ display: "flex", gap: "12px", background: isActivated ? "#fffbeb" : "#fef2f2", border: isActivated ? "1px solid #fef3c7" : "1px solid #fee2e2", padding: "16px", borderRadius: "8px" }}>
                      <AlertTriangle size={24} color={isActivated ? "#d97706" : "#dc2626"} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: 14, color: isActivated ? "#b45309" : "#991b1b" }}>{isActivated ? "Awaiting Train Manager Attempt" : "Competency Exam Locked"}</h4>
                        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: isActivated ? "#d97706" : "#dc2626" }}>
                          {isActivated ? (
                            <span>The Train Manager safety competency trial is active. Request TM (<strong>{tm?.name}</strong>) to log into their portal and attempt the 25 safety questions to automatically sync scores.</span>
                          ) : (
                            <span>The Train Manager MCQ exam is currently locked. You must click the <strong>Activate Safety Exam</strong> button below to enable the Train Manager to log in and attempt the test.</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="button"
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "700",
                          cursor: "pointer",
                          border: "none",
                          background: isActivated ? "#fef2f2" : "#2563eb",
                          color: isActivated ? "#dc2626" : "#ffffff",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                        }}
                        onClick={async () => {
                          if (isActivated) {
                            await handleRevokeTMExamAccess(tm?.id);
                          } else {
                            await handleSendTMExamAccess(tm?.id);
                          }
                          setTMField(activeTmId, "automaticTraining", f.automaticTraining);
                        }}
                      >
                        {isActivated ? "Deactivate Safety Competency Exam" : "Activate Safety Competency Exam"}
                      </button>
                    </div>

                    <div className="sm2-mcq-meta-grid">
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Assessment Status</span>
                        <strong className={`sm2-mcq-meta-val text-${isActivated ? "amber" : "red"}`}>{isActivated ? "Active & Awaiting Attempt" : "Locked (Awaiting Activation)"}</strong>
                      </div>
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Assessed Entity</span>
                        <strong className="sm2-mcq-meta-val">{tm?.name}</strong>
                      </div>
                      <div className="sm2-mcq-meta-item">
                        <span className="sm2-mcq-meta-label">Total Questions</span>
                        <strong className="sm2-mcq-meta-val">25 Questions (1 mark each)</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Sections 02-06: Yes/No blocks ── */}
          {TI_TM_CRITERIA.map((sec, si) => (
            <div id={'section-' + sec.key} key={sec.key} className="sm2-assess-section" style={{ opacity: 1 }}>
              <div className="sm2-assess-sec-hdr">
                <span className="sm2-assess-sec-num">{String(si + 2).padStart(2, "0")}</span>
                <div>
                  <strong>{sec.label} <span style={{ color: "#dc2626" }}>*</span></strong>
                  {!(f[sec.key] && f[sec.key].length === sec.count && f[sec.key].every(v => v === "Yes" || v === "No")) && (
                    <span style={{ color: "#dc2626", fontSize: "11px", fontWeight: "700", marginLeft: "8px", background: "#fee2e2", padding: "2px 6px", borderRadius: "4px" }}>Incomplete</span>
                  )}
                  <span className="sm2-assess-sec-meta">{sec.count} criteria · {sec.weight} marks each · Total {sec.count * sec.weight}</span>
                </div>
                <span className="sm2-assess-live-marks">{(f[sec.key] || []).filter(v => v === "Yes").length * sec.weight} / {sec.count * sec.weight}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "6px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginRight: "auto" }}>{t("Quick Fill:")}</span>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setTmForms(prev => ({
                      ...prev,
                      [activeTmId]: {
                        ...(prev[activeTmId] || defaultTMForm()),
                        [sec.key]: Array(sec.count).fill("Yes")
                      }
                    }));
                  }}
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "700",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    background: "#f0fdf4",
                    color: "#166534",
                    cursor: locked ? "not-allowed" : "pointer"
                  }}
                >
                  ✓ {t("All Yes")}
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setTmForms(prev => ({
                      ...prev,
                      [activeTmId]: {
                        ...(prev[activeTmId] || defaultTMForm()),
                        [sec.key]: Array(sec.count).fill("No")
                      }
                    }));
                  }}
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "700",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    background: "#fef2f2",
                    color: "#991b1b",
                    cursor: locked ? "not-allowed" : "pointer"
                  }}
                >
                  ✗ {t("All No")}
                </button>
              </div>
              <div className="sm2-yn-grid">
                {sec.criteria.map((cr, idx) => (
                  <div key={idx} className="sm2-yn-row">
                    <span className="sm2-yn-label">{idx + 1}. {cr}</span>
                    <div className="sm2-yn-btns">
                      <button
                        type="button" disabled={locked}
                        className={f[sec.key]?.[idx] === "Yes" ? "sm2-yn-btn sm2-yn-yes active" : "sm2-yn-btn sm2-yn-yes"}
                        style={{ cursor: locked ? "not-allowed" : "pointer" }}
                        onClick={() => toggleTMYN(activeTmId, sec.key, idx, "Yes")}>
                        Yes
                      </button>
                      <button
                        type="button" disabled={locked}
                        className={f[sec.key]?.[idx] === "No" ? "sm2-yn-btn sm2-yn-no active" : "sm2-yn-btn sm2-yn-no"}
                        style={{ cursor: locked ? "not-allowed" : "pointer" }}
                        onClick={() => toggleTMYN(activeTmId, sec.key, idx, "No")}>
                        No
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ── Section 07: Additional Details ── */}
          <div id="section-additional" className="sm2-assess-section" style={{ opacity: 1 }}>
            <div className="sm2-assess-sec-hdr">
              <span className="sm2-assess-sec-num">07</span>
              <div><strong>Additional Details</strong><span className="sm2-assess-sec-meta">Mandatory fields</span></div>
            </div>
            <div className="sm2-assess-form" style={{ marginTop: 12 }}>
              <div className="sm2-form-field">
                <label>Knowledge Marks (MCQ Test)</label>
                <input type="number" min={0} max={25} disabled={locked} value={knowledge} onChange={e => {
                  const val = e.target.value;
                  setTMField(activeTmId, "knowledgeMarks", val);
                }} placeholder="Synced MCQ marks" style={{ background: "#f1f5f9" }} readOnly />
              </div>
              <div className="sm2-form-field">
                <label>Alcoholic Status <span style={{ color: "#dc2626" }}>*</span></label>
                <select disabled={locked} value={f.alcoholicStatus} onChange={e => setTMField(activeTmId, "alcoholicStatus", e.target.value)}>
                  <option value="">Select…</option>
                  <option>Non-Alcoholic</option>
                  <option>Alcoholic</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>PME Status</label>
                <select disabled={locked} value={f.pmeStatus} onChange={e => setTMField(activeTmId, "pmeStatus", e.target.value)}>
                  <option>Fit</option><option>Unfit</option><option>Pending</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>REF Status</label>
                <select disabled={locked} value={f.refStatus} onChange={e => setTMField(activeTmId, "refStatus", e.target.value)}>
                  <option>Cleared</option><option>Pending</option><option>Failed</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>Counselling</label>
                <select disabled={locked} value={f.counselling} onChange={e => setTMField(activeTmId, "counselling", e.target.value)}>
                  <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
                </select>
              </div>
              <div className="sm2-form-field">
                <label>Automatic Training</label>
                <select disabled={locked} value={f.automaticTraining} onChange={e => setTMField(activeTmId, "automaticTraining", e.target.value)}>
                  <option>Not Required</option><option>Recommended</option><option>Mandatory</option>
                </select>
              </div>
              <div className="sm2-form-field sm2-form-full" style={{ gridColumn: "1/-1" }}>
                <label>Remarks for AOM</label>
                <textarea rows={3} disabled={locked} value={f.remarks} onChange={e => setTMField(activeTmId, "remarks", e.target.value)} placeholder="Enter observations, recommendations…" />
              </div>
            </div>
          </div>

          {/* ── Live Score Bar ── */}
          <div className="sm2-live-score" style={{ opacity: 1 }}>
            <div><label>Knowledge (MCQ)</label><strong>{knowledge}/25</strong></div>
            <div><label>Yes/No Score</label><strong>{ynScore}/75</strong></div>
            <div><label>Grand Total</label><strong style={{ color: CAT_C[liveCat], fontSize: 22 }}>{total}/100</strong></div>
            <div><label>Category</label><span className="sm2-badge" style={{ background: CAT_B[liveCat], color: CAT_C[liveCat], fontSize: 13, padding: "4px 14px" }}>Category {liveCat}</span></div>
          </div>

          {locked && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
              <div style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", textAlign: "center" }}>
                ✓ Assessment submitted. Pending AOM Approval.
              </div>
              <button type="button" className="sm2-ghost-btn" style={{ border: "1px solid #7c3aed", color: "#7c3aed", padding: "10px", borderRadius: "8px", fontWeight: "700", background: "none", cursor: "pointer" }} onClick={() => setTmLocked(p => ({ ...p, [activeTmId]: false }))}>
                <Edit size={14} style={{ marginRight: 6 }} /> Unlock & Edit Assessment
              </button>
            </div>
          )}
          {!locked && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button className="sm2-ghost-btn" style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }} onClick={() => {
                  setTmForms(prev => ({
                    ...prev,
                    [activeTmId]: {
                      ...f,
                      knowledgeMarks: String(knowledge)
                    }
                  }));
                  alert("Assessment saved as draft successfully!");
                }}>Save as Draft</button>
                <button className="sm2-primary-btn" style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "none", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }} onClick={() => {
                  const isFormValid = f.alcoholicStatus && TI_TM_CRITERIA.every(sec => f[sec.key] && f[sec.key].length === sec.count && f[sec.key].every(v => v === "Yes" || v === "No"));
                  if (!isFormValid) {
                    const missingSec = TI_TM_CRITERIA.find(sec => !(f[sec.key] && f[sec.key].length === sec.count && f[sec.key].every(v => v === "Yes" || v === "No")));
                    if (missingSec) {
                      alert(`Validation Error: Please complete all questions in the "${missingSec.label}" section.`);
                      document.getElementById('section-' + missingSec.key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else if (!f.alcoholicStatus) {
                      alert(`Validation Error: Please select Alcoholic/Non-Alcoholic status.`);
                      document.getElementById('section-additional')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                  }
                  setTMField(activeTmId, "knowledgeMarks", String(knowledge));
                  submitTMAssessment(activeTmId, String(knowledge));
                }}>
                  <CheckCircle2 size={14} /> Submit for AOM Approval
                </button>
              </div>
            </div>
          )}
        </section>
      );
    }

    const renderScheduleModal = (roleKey) => {
      if (!editingEmployee) return null;

      const isBulk = editingEmployee === "bulk";
      const title = isBulk
        ? `Bulk Schedule Assessments (${selectedHrmsIds.length} employees)`
        : `Schedule Assessment — ${editingEmployee.name} (${editingEmployee.hrmsId})`;

      const handleSaveSchedule = async () => {
        if (!scheduleDate) {
          alert("Please select a date.");
          return;
        }
        if (!scheduleReason.trim()) {
          alert("Please enter a reason for scheduling.");
          return;
        }

        try {
          const formattedTime = convertTo12Hour(scheduleTime);
          let successCount = 0;

          if (isBulk) {
            for (const hrmsId of selectedHrmsIds) {
              const res = await updateEmployeeScheduleTI(roleKey, hrmsId, scheduleDate, formattedTime, scheduleReason);
              if (res && res.success) {
                successCount++;
              }
            }
            setSelectedHrmsIds([]);
            alert(`Successfully scheduled assessment for ${successCount} employee(s).`);
          } else {
            const res = await updateEmployeeScheduleTI(roleKey, editingEmployee.hrmsId, scheduleDate, formattedTime, scheduleReason);
            if (res && res.success) {
              alert(`Successfully scheduled assessment for ${editingEmployee.name}.`);
            }
          }
        } catch (err) {
          console.error("Error scheduling:", err);
          alert("An error occurred during scheduling: " + err.message);
        } finally {
          setEditingEmployee(null);
          setScheduleDate("");
          setScheduleTime("10:00");
          setScheduleReason("");
          await fetchLiveDatabaseData();
        }
      };

      return (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "480px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            padding: "24px",
            border: "1px solid #e2e8f0"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{title}</h3>
              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setScheduleDate("");
                  setScheduleTime("10:00");
                  setScheduleReason("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                    Assessment Date *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      boxSizing: "border-box",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ width: "130px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                    Time *
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      boxSizing: "border-box",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                  Reason / Remarks for Scheduling *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter reason (e.g. Periodic assessment, Counselling completed, Retest schedule)..."
                  value={scheduleReason}
                  onChange={e => setScheduleReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    fontWeight: "600",
                    boxSizing: "border-box",
                    outline: "none",
                    resize: "none"
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  onClick={() => {
                    setEditingEmployee(null);
                    setScheduleDate("");
                    setScheduleTime("10:00");
                    setScheduleReason("");
                  }}
                  className="sm2-ghost-btn"
                  style={{
                    height: "38px",
                    padding: "0 16px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveSchedule}
                  className="sm2-primary-btn"
                  style={{
                    height: "38px",
                    padding: "0 16px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    cursor: "pointer"
                  }}
                >
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // ─── LEVEL 2: Roster/List View Generic Render ───
    const renderRoleRoster = (roleKey) => {
      const config = {
        SM: {
          title: "Station Masters",
          searchLabel: "Search Station Master",
          colHeader: "STATION MASTER",
          list: smList,
          openForm: openSMForm,
          sendAccess: handleSendExamAccess,
          avatarBg: "#1e3a8a",
          roleName: "Station Master",
          rolePillBg: "#eff6ff",
          rolePillColor: "#2563eb",
          roleCode: "sm"
        },
        SS: {
          title: "Station Superintendents",
          searchLabel: "Search Station Superintendent",
          colHeader: "STATION SUPERINTENDENT",
          list: ssList,
          openForm: openSSForm,
          avatarBg: "#1e3a8a",
          roleName: "Station Superintendent",
          rolePillBg: "#f5f3ff",
          rolePillColor: "#7c3aed",
          roleCode: "ss"
        },
        TM: {
          title: "Train Managers",
          searchLabel: "Search Train Manager",
          colHeader: "TRAIN MANAGER",
          list: tmList,
          openForm: openTMForm,
          sendAccess: handleSendTMExamAccess,
          avatarBg: "#1e3a8a",
          roleName: "Train Manager",
          rolePillBg: "#f0fdf4",
          rolePillColor: "#16a34a",
          roleCode: "tm"
        }
      }[roleKey];

      // If it's SS or categories view is not active, render the standard roster (non-category based)
      if (roleKey === "SS" || !showCategoriesPanel) {
        const totalStaff = config.list.length;
        const pendingCount = config.list.filter(x => x.status === "Pending" || x.status === "Exam Sent").length;
        const completedCount = config.list.filter(x => x.status === "Submitted" || x.status === "Exam Taken").length;
        const rejectedCount = config.list.filter(x => x.status === "Rejected").length;
        const lastUpdatedDate = "20 May 2026";

        const stations = ["All", ...new Set(config.list.map(x => x.station))];

        const filteredList = config.list.filter(item => {
          const matchesSearch = rosterSearch === "" ||
            item.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
            item.hrmsId.toLowerCase().includes(rosterSearch.toLowerCase());

          const matchesStation = rosterStation === "All" || item.station === rosterStation;
          const matchesStatus = rosterStatus === "All" || item.status === rosterStatus;
          const matchesDate = rosterDate === "" || item.lastDate === rosterDate;

          return matchesSearch && matchesStation && matchesStatus && matchesDate;
        });

        const stationCodeMap = {
          "Parbhani Junction": "PBN",
          "Amla Junction": "AMLA",
          "Badnera Junction": "BDN",
          "Akola Junction": "AK",
          "Nagpur Junction": "NGP",
          "Wardha Junction": "WR",
          "Betul Station": "BYT",
          "Itarsi Junction": "ET",
          "Chandrapur Station": "CD",
          "Gondia Junction": "G",
          "Dhamangaon Station": "DMN",
          "Pulgaon Junction": "PLO"
        };

        return (
          <div className="ti2-page-body animate-fade-in" style={{ padding: "24px", background: "#f8fafc", minHeight: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>
                  Assessments — {config.title}
                </h1>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
                  {config.title} pending assessment are listed below. Open the form to conduct a structured evaluation.
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {roleKey !== "SS" && (
                  <button
                    onClick={() => {
                      setShowCategoriesPanel(true);
                      setSelectedCategory(null);
                      setSelectedHrmsIds([]);
                      setRosterSearch("");
                      setRosterStation("All");
                      setRosterStatus("All");
                      setRosterDate("");
                      setViewUpcomingOnly(false);
                    }}
                    style={{
                      background: "#2563eb",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#ffffff",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center"
                    }}
                  >
                    Categories View
                  </button>
                )}
                <button
                  onClick={() => { setAssessRole(null); setRosterSearch(""); setRosterStation("All"); setRosterStatus("All"); setRosterDate(""); setShowCategoriesPanel(false); }}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#334155",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer"
                  }}
                >
                  ← Back to Roles
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: `Total ${config.title}`, value: totalStaff, subtitle: "In your jurisdiction", icon: Users, bg: "#f8fafc", color: "#475569", valColor: "#0f172a" },
                { label: "Pending Assessments", value: pendingCount, subtitle: "Awaiting completion", icon: ClipboardList, bg: "#f8fafc", color: "#d97706", valColor: "#d97706" },
                { label: "Completed This Month", value: completedCount, subtitle: "Assessments done", icon: Send, bg: "#f8fafc", color: "#16a34a", valColor: "#16a34a" },
                { label: "Rejected", value: rejectedCount, subtitle: "Needs review", icon: AlertTriangle, bg: "#f8fafc", color: "#dc2626", valColor: "#dc2626" },
                { label: "Last Updated", value: lastUpdatedDate, subtitle: "Recent activity", icon: Calendar, bg: "#f8fafc", color: "#64748b", valColor: "#0f172a" }
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                  }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: stat.color, flexShrink: 0 }}>
                    <stat.icon size={20} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <span style={{ fontSize: "22px", fontWeight: "800", color: stat.valColor }}>{stat.value}</span>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#334155", marginTop: "2px" }}>{stat.label}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "1px" }}>{stat.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto", gap: "16px", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    {config.searchLabel}
                  </label>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                    <input
                      type="text"
                      placeholder="Name or HRMS ID..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 36px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#0f172a",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Station</label>
                  <select
                    value={rosterStation}
                    onChange={(e) => setRosterStation(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#0f172a",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="All">All Stations</option>
                    {stations.filter(x => x !== "All").map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Exam Status</label>
                  <select
                    value={rosterStatus}
                    onChange={(e) => setRosterStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#0f172a",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Exam Sent">Exam Sent</option>
                    <option value="Exam Taken">Exam Taken</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Last Assessed</label>
                  <div style={{ position: "relative" }}>
                    <Calendar size={14} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                    <input
                      type="date"
                      value={rosterDate}
                      onChange={(e) => setRosterDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 36px 10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#0f172a",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => { setRosterSearch(""); setRosterStation("All"); setRosterStatus("All"); setRosterDate(""); }}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#475569",
                      cursor: "pointer"
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {config.colHeader}
                      </th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>HRMS ID</th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>STATION</th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>LAST ASSESSED</th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>SCORE</th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>EXAM STATUS</th>
                      <th style={{ padding: "12px 16px", fontSize: "11px", color: "#475569", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((item) => {
                      const scale = "Senior Scale";
                      const stationCode = stationCodeMap[item.station] || "STN";

                      const examStatusBadgeStyle = (status) => {
                        if (status === "Exam Sent") return { bg: "#f3e8ff", color: "#6b21a8" };
                        if (status === "Exam Taken") return { bg: "#dcfce7", color: "#166534" };
                        if (status === "Submitted") return { bg: "#dbeafe", color: "#2563eb" };
                        if (status === "Rejected") return { bg: "#fee2e2", color: "#dc2626" };
                        if (status === "Pending First Assessment") return { bg: "#dbeafe", color: "#2563eb" };
                        return { bg: "#f1f5f9", color: "#475569" };
                      };

                      const statusColors = examStatusBadgeStyle(item.status);

                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: config.avatarBg, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                                {item.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{item.name}</div>
                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "2px" }}>{scale}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#475569", fontWeight: "600", fontSize: "13px", fontFamily: "monospace" }}>
                            {item.hrmsId}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ color: "#334155", fontSize: "13px", fontWeight: "500" }}>{item.station}</span>
                              <span style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                                {stationCode}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px", fontWeight: "500" }}>
                            {item.lastDate || "—"}
                          </td>
                          <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: "800", fontSize: "14px" }}>
                            {item.score !== undefined && item.score !== null ? `${item.score}/100` : "—"}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ background: statusColors.bg, color: statusColors.color, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                                {item.status}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
                              {config.sendAccess && (item.status === "Pending" || item.status === "Exam Locked" || item.status === "Pending First Assessment") && (
                                <button
                                  onClick={() => config.sendAccess(item.id)}
                                  style={{
                                    background: "#7c3aed",
                                    border: "none",
                                    color: "#ffffff",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                  }}
                                >
                                  Send Access
                                </button>
                              )}

                              {(item.status === "Submitted" || item.status === "Exam Taken") ? (
                                <>
                                  <button
                                    onClick={() => config.openForm(item.id)}
                                    style={{
                                      background: "#2563eb",
                                      border: "none",
                                      color: "#ffffff",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      fontWeight: "700",
                                      fontSize: "12px"
                                    }}
                                  >
                                    View Form
                                  </button>
                                  <button
                                    onClick={() => config.openForm(item.id, true)}
                                    style={{
                                      background: "#ea580c",
                                      border: "none",
                                      color: "#ffffff",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      fontWeight: "700",
                                      fontSize: "12px"
                                    }}
                                  >
                                    Edit
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => config.openForm(item.id)}
                                  style={{
                                    background: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    padding: "5px 12px",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: "#475569",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    cursor: "pointer"
                                  }}
                                >
                                  Open Form <ExternalLink size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      // OTHERWISE (SM and TM roles): Render full Category-wise panel
      const getEmpCategory = (p) => p.cat || getCat(p.score || 0);

      // Filtering list by Traffic Inspector station jurisdiction
      const rosterList = config.list;

      const countA = rosterList.filter(p => getEmpCategory(p) === "A").length;
      const countB = rosterList.filter(p => getEmpCategory(p) === "B").length;
      const countC = rosterList.filter(p => getEmpCategory(p) === "C").length;
      const countD = rosterList.filter(p => getEmpCategory(p) === "D").length;

      const categoriesList = [
        { id: "A", name: "Category A", count: countA, color: "#16a34a", bg: "#dcfce7" },
        { id: "B", name: "Category B", count: countB, color: "#2563eb", bg: "#dbeafe" },
        { id: "C", name: "Category C", count: countC, color: "#d97706", bg: "#fef3c7" },
        { id: "D", name: "Category D", count: countD, color: "#dc2626", bg: "#fef2f2" }
      ];

      // Due stats dashboard logic
      const statsSummary = {
        overdue: 0,
        dueToday: 0,
        dueWeek: 0,
        dueMonth: 0,
        totalScheduled: 0
      };

      rosterList.forEach(p => {
        const s = getEmployeeScheduleDetails(p, roleKey);
        if (s.nextDueDate !== "Not Scheduled" && s.daysRemaining !== null) {
          statsSummary.totalScheduled++;
          if (s.daysRemaining < 0) {
            statsSummary.overdue++;
          } else if (s.daysRemaining === 0) {
            statsSummary.dueToday++;
          } else if (s.daysRemaining > 0 && s.daysRemaining <= 7) {
            statsSummary.dueWeek++;
          } else if (s.daysRemaining > 0 && s.daysRemaining <= 30) {
            statsSummary.dueMonth++;
          }
        }
      });

      const categoryPms = selectedCategory
        ? rosterList.filter(p => getEmpCategory(p) === selectedCategory)
        : [];

      // Filter category roster by search query
      const searchedCategoryPms = categoryPms.filter(p => {
        const matchesSearch = !rosterSearch ||
          p.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
          p.hrmsId.toLowerCase().includes(rosterSearch.toLowerCase());
        const matchesStation = rosterStation === "All" || p.station === rosterStation;
        return matchesSearch && matchesStation;
      });

      // Add scheduling details to roster objects
      const searchedCategoryPmsWithSched = searchedCategoryPms.map(p => ({
        ...p,
        sched: getEmployeeScheduleDetails(p, roleKey)
      }));

      // Filter by upcoming tests toggle
      const filteredByUpcoming = viewUpcomingOnly
        ? searchedCategoryPmsWithSched.filter(p => p.sched.nextDueDate !== "Not Scheduled")
        : searchedCategoryPmsWithSched;

      // Status text evaluator
      const getEmpStatusText = (p) => {
        const keyPrefix = roleKey === "SM" ? "sm" : roleKey === "SS" ? "ss" : "tm";
        const mcqDataStr = localStorage.getItem(`${keyPrefix}_mcq_test_${p.hrmsId}`);
        const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;

        const isApproved = p.status === 'Approved';
        const isPending = p.status === 'Submitted'; // Submitted is Pending approval for TI -> AOM
        const isCompleted = (mcqData && mcqData.completed) || p.status === 'Exam Taken';
        const isActivated = localStorage.getItem(`${keyPrefix}_test_activated_${p.hrmsId}`) === "true" || p.status === 'Exam Sent';

        if (isApproved) return { text: "Approved", type: "success" };
        if (isPending) return { text: "Pending Approval", type: "info" };
        if (isCompleted) return { text: "MCQ Completed", type: "success" };
        if (isActivated) return { text: "Exam Active", type: "warning" };
        return { text: "Exam Locked", type: "neutral" };
      };

      const isEligibleForActivation = (p) => {
        const status = getEmpStatusText(p);
        return status.text !== "Approved" && status.text !== "Pending Approval" && status.text !== "MCQ Completed";
      };

      const eligiblePms = searchedCategoryPms.filter(isEligibleForActivation);
      const isAllSelected = eligiblePms.length > 0 && eligiblePms.every(p => selectedHrmsIds.includes(p.hrmsId));

      const handleSelectAll = (e) => {
        if (e.target.checked) {
          const ids = eligiblePms.map(p => p.hrmsId);
          setSelectedHrmsIds(ids);
        } else {
          setSelectedHrmsIds([]);
        }
      };

      const handleSelectOne = (hrmsId, checked) => {
        if (checked) {
          setSelectedHrmsIds(prev => [...prev, hrmsId]);
        } else {
          setSelectedHrmsIds(prev => prev.filter(id => id !== hrmsId));
        }
      };

      const stationOptions = ["All", ...new Set(rosterList.map(x => x.station))];

      return (
        <div className="ti2-page-body animate-fade-in" style={{ padding: "24px", background: "#f8fafc", minHeight: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>
                Assessments — {config.title}
              </h1>
              <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
                Select a category to view employees, search by HRMS ID, schedule tests, and activate assessment access in bulk.
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={() => {
                  setShowCategoriesPanel(false);
                  setSelectedCategory(null);
                  setSelectedHrmsIds([]);
                  setRosterSearch("");
                  setRosterStation("All");
                  setRosterStatus("All");
                  setRosterDate("");
                  setViewUpcomingOnly(false);
                }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#334155",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer"
                }}
              >
                ← Back to List
              </button>
              <button
                onClick={() => {
                  setAssessRole(null);
                  setSelectedCategory(null);
                  setSelectedHrmsIds([]);
                  setRosterSearch("");
                  setRosterStation("All");
                  setRosterStatus("All");
                  setRosterDate("");
                  setViewUpcomingOnly(false);
                  setShowCategoriesPanel(false);
                }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#334155",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer"
                }}
              >
                ← Back to Roles
              </button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "20px" }}>
            <div style={{ background: "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)", border: "1px solid #fca5a5", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Overdue</span>
              <span style={{ fontSize: "22px", fontWeight: "900", color: "#dc2626" }}>{statsSummary.overdue}</span>
            </div>
            <div style={{ background: "linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%)", border: "1px solid #fdbb2d", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#9a3412", textTransform: "uppercase", letterSpacing: "0.5px" }}>Due Today</span>
              <span style={{ fontSize: "22px", fontWeight: "900", color: "#ea580c" }}>{statsSummary.dueToday}</span>
            </div>
            <div style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fffdf5 100%)", border: "1px solid #fde047", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#854d0e", textTransform: "uppercase", letterSpacing: "0.5px" }}>Due in 7 Days</span>
              <span style={{ fontSize: "22px", fontWeight: "900", color: "#ca8a04" }}>{statsSummary.dueWeek}</span>
            </div>
            <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)", border: "1px solid #93c5fd", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Due in 30 Days</span>
              <span style={{ fontSize: "22px", fontWeight: "900", color: "#2563eb" }}>{statsSummary.dueMonth}</span>
            </div>
            <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)", border: "1px solid #86efac", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Scheduled</span>
              <span style={{ fontSize: "22px", fontWeight: "900", color: "#16a34a" }}>{statsSummary.totalScheduled}</span>
            </div>
          </div>

          {/* Categories Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {categoriesList.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedHrmsIds([]);
                    setRosterSearch("");
                  }}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border: isSelected ? `2.5px solid ${cat.color}` : "1.5px solid #e2e8f0",
                    background: isSelected ? cat.bg : "#ffffff",
                    color: "#0f172a",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: isSelected ? `0 4px 12px ${cat.color}20` : "0 2px 4px rgba(0,0,0,0.02)",
                    transition: "all 0.2s ease-in-out",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "800", color: isSelected ? cat.color : "#475569" }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: "20px", fontWeight: "900", color: cat.color }}>
                    ({cat.count})
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
                    {cat.id === "A" || cat.id === "B" ? "Retest: 6M" : cat.id === "C" ? "Retest: 3M" : "Retest: 1M"}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedCategory && (
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              {/* Filter Bar */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, minWidth: "300px" }}>
                  <div style={{ position: "relative", flex: 1, maxWidth: "260px" }}>
                    <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                    <input
                      type="text"
                      placeholder="Name or HRMS ID..."
                      value={rosterSearch}
                      onChange={e => setRosterSearch(e.target.value)}
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px 0 36px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        fontWeight: "600",
                        boxSizing: "border-box",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div>
                    <select
                      value={rosterStation}
                      onChange={(e) => setRosterStation(e.target.value)}
                      style={{
                        height: "40px",
                        padding: "0 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        fontWeight: "650",
                        color: "#334155",
                        boxSizing: "border-box"
                      }}
                    >
                      <option value="All">All Stations</option>
                      {stationOptions.filter(x => x !== "All").map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* View Upcoming Tests Toggle */}
                  <button
                    type="button"
                    onClick={() => setViewUpcomingOnly(!viewUpcomingOnly)}
                    style={{
                      height: "40px",
                      padding: "0 14px",
                      borderRadius: "8px",
                      border: viewUpcomingOnly ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
                      background: viewUpcomingOnly ? "#eff6ff" : "#ffffff",
                      color: viewUpcomingOnly ? "#2563eb" : "#475569",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                  >
                    <Filter size={14} />
                    {viewUpcomingOnly ? "Showing Scheduled Only" : "Show Scheduled Only"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  {selectedHrmsIds.length > 0 && (
                    <>
                      {/* Bulk Schedule Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmployee("bulk");
                          setScheduleDate("");
                          setScheduleTime("10:00");
                          setScheduleReason("");
                        }}
                        style={{
                          height: "40px",
                          padding: "0 16px",
                          borderRadius: "8px",
                          fontWeight: "700",
                          border: "1.5px solid #2563eb",
                          background: "#ffffff",
                          color: "#2563eb",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 4px rgba(37,99,235,0.08)"
                        }}
                      >
                        <Calendar size={14} />
                        Schedule Selected ({selectedHrmsIds.length})
                      </button>

                      <button
                        onClick={() => sendBatchExamAccess(roleKey, selectedHrmsIds)}
                        style={{
                          height: "40px",
                          padding: "0 16px",
                          borderRadius: "8px",
                          fontWeight: "700",
                          border: "none",
                          background: "#2563eb",
                          color: "#ffffff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <ShieldCheck size={14} />
                        Activate Access ({selectedHrmsIds.length})
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Category-wise Table */}
              <div className="sdom-table-wrap">
                <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                      <th style={{ width: "40px", padding: "12px 16px" }}>
                        <input
                          type="checkbox"
                          disabled={eligiblePms.length === 0}
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          style={{ cursor: eligiblePms.length > 0 ? "pointer" : "not-allowed" }}
                        />
                      </th>
                      <th style={{ padding: "12px 16px" }}>{config.colHeader}</th>
                      <th style={{ padding: "12px 16px" }}>HRMS ID</th>
                      <th style={{ padding: "12px 16px" }}>STATION</th>
                      <th style={{ padding: "12px 16px" }}>FREQUENCY</th>
                      <th style={{ padding: "12px 16px" }}>LAST ASSESSMENT</th>
                      <th style={{ padding: "12px 16px" }}>NEXT DUE DATE</th>
                      <th style={{ padding: "12px 16px" }}>DAYS REMAINING</th>
                      <th style={{ padding: "12px 16px" }}>DUE STATUS</th>
                      <th style={{ padding: "12px 16px" }}>EXAM STATUS</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredByUpcoming.map(p => {
                      const status = getEmpStatusText(p);
                      const isChecked = selectedHrmsIds.includes(p.hrmsId);
                      const isEligible = isEligibleForActivation(p);
                      const { frequency, lastAssessDate, nextDueDate, nextDueTime, daysRemaining, statusText, statusType } = p.sched;

                      let badgeColor = "#475569";
                      let badgeBg = "#f1f5f9";
                      let badgeBorder = "1px solid #cbd5e1";
                      if (status.type === "success") { badgeColor = "var(--success)"; badgeBg = "var(--success-bg)"; badgeBorder = "1px solid var(--success-border)"; }
                      else if (status.type === "info") { badgeColor = "var(--info)"; badgeBg = "var(--info-bg)"; badgeBorder = "1px solid var(--info-border)"; }
                      else if (status.type === "warning") { badgeColor = "var(--warning)"; badgeBg = "var(--warning-bg)"; badgeBorder = "1px solid var(--warning-border)"; }

                      let daysColor = "var(--text-primary)";
                      let statusClass = "sdom-badge-neutral";
                      if (statusType === "danger") { daysColor = "var(--danger)"; statusClass = "sdom-badge-danger"; }
                      else if (statusType === "warning") { daysColor = "var(--warning)"; statusClass = "sdom-badge-warning"; }
                      else if (statusType === "success") { daysColor = "var(--success)"; statusClass = "sdom-badge-success"; }

                      const isExamTaken = status.text === "MCQ Completed";
                      const isExamSent = status.text === "Exam Active";
                      const isExamApproved = status.text === "Approved";
                      const isExamSubmitted = status.text === "Pending Approval";

                      return (
                        <tr key={p.hrmsId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 16px" }}>
                            <input
                              type="checkbox"
                              disabled={!isEligible}
                              checked={isChecked}
                              onChange={(e) => handleSelectOne(p.hrmsId, e.target.checked)}
                              style={{ cursor: isEligible ? "pointer" : "not-allowed" }}
                            />
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: config.avatarBg, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                                {p.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{p.name}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#475569", fontWeight: "600", fontSize: "13px", fontFamily: "monospace" }}>{p.hrmsId}</td>
                          <td style={{ padding: "14px 16px", color: "#475569", fontWeight: "600", fontSize: "13px" }}>{p.station}</td>
                          <td style={{ padding: "14px 16px", color: "#475569", fontSize: "13px" }}>{frequency}</td>
                          <td style={{ padding: "14px 16px", color: "#475569", fontSize: "13px" }}>{lastAssessDate}</td>
                          <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontWeight: "600" }}>{nextDueDate}</span>
                              {nextDueDate !== "Not Scheduled" && (
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  🕒 {nextDueTime}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: "600", color: daysColor, fontSize: "13px" }}>
                            {daysRemaining !== null ? (
                              daysRemaining === 0 ? "Today" : daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                            {nextDueDate !== "Not Scheduled" ? (
                              <span className={`sdom-badge ${statusClass}`}>
                                {statusText}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                            <span className={`sdom-badge`} style={{ background: badgeBg, color: badgeColor, border: badgeBorder }}>
                              {status.text}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEmployee(p);
                                  if (nextDueDate && nextDueDate !== "Not Scheduled") {
                                    setScheduleDate(nextDueDate);
                                    setScheduleTime(convertTo24Hour(nextDueTime));
                                  } else {
                                    setScheduleDate("");
                                    setScheduleTime("10:00");
                                  }
                                  setScheduleReason("");
                                }}
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid #cbd5e1",
                                  padding: "5px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  color: "#475569",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  cursor: "pointer"
                                }}
                              >
                                <Calendar size={12} />
                                {nextDueDate !== "Not Scheduled" ? "Reschedule" : "Schedule"}
                              </button>

                              {isExamApproved && (
                                <button
                                  onClick={() => config.openForm(p.id)}
                                  style={{
                                    background: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: "#475569",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    cursor: "pointer"
                                  }}
                                >
                                  View Form
                                </button>
                              )}

                              {isExamSubmitted && (
                                <>
                                  <button
                                    onClick={() => config.openForm(p.id)}
                                    style={{
                                      background: "#2563eb",
                                      border: "none",
                                      color: "#ffffff",
                                      padding: "6px 12px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontWeight: "700",
                                      fontSize: "12px"
                                    }}
                                  >
                                    View Form
                                  </button>
                                  <button
                                    onClick={() => config.openForm(p.id, true)}
                                    style={{
                                      background: "#ea580c",
                                      border: "none",
                                      color: "#ffffff",
                                      padding: "6px 12px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontWeight: "700",
                                      fontSize: "12px"
                                    }}
                                  >
                                    Edit
                                  </button>
                                </>
                              )}

                              {isExamTaken && (
                                <button
                                  onClick={() => config.openForm(p.id)}
                                  style={{
                                    background: "#16a34a",
                                    border: "none",
                                    color: "#ffffff",
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "700",
                                    fontSize: "12px"
                                  }}
                                >
                                  Start Assessment
                                </button>
                              )}

                              {isExamSent && (
                                <button
                                  onClick={() => config.openForm(p.id)}
                                  style={{
                                    background: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: "#475569",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    cursor: "pointer"
                                  }}
                                >
                                  Open Form <ExternalLink size={12} />
                                </button>
                              )}

                              {!isExamApproved && !isExamSubmitted && !isExamTaken && !isExamSent && (
                                <button
                                  onClick={() => config.openForm(p.id)}
                                  style={{
                                    background: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: "#475569",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    cursor: "pointer"
                                  }}
                                >
                                  Open Form <ExternalLink size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredByUpcoming.length === 0 && (
                      <tr>
                        <td colSpan={11} style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                          No {config.title.toLowerCase()} found in this category matching search filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {renderScheduleModal(roleKey)}
        </div>
      );
    };

    if (assessRole === "SM") return renderRoleRoster("SM");
    if (assessRole === "SS") return renderRoleRoster("SS");
    if (assessRole === "TM") return renderRoleRoster("TM");

    const smPending = smList.filter(s => s.status === "Pending" || s.status === "Exam Sent").length;
    const tmPending = tmList.filter(t => t.status === "Pending" || t.status === "Exam Sent").length;

    const smCompleted = smList.filter(s => ["Submitted", "Exam Taken", "Approved", "Completed"].includes(s.status)).length;
    const tmCompleted = tmList.filter(t => ["Submitted", "Exam Taken", "Approved", "Completed"].includes(t.status)).length;

    const roles = [
      {
        key: "SM",
        label: "Station Masters",
        icon: Building2,
        pending: smPending,
        completed: smCompleted,
        total: smList.length,
        desc: "Conduct structured field evaluations for Station Masters on safety compliance, rule knowledge, administrative duties, and operational practices."
      },
      {
        key: "TM",
        label: "Train Managers",
        icon: Train,
        pending: tmPending,
        completed: tmCompleted,
        total: tmList.length,
        desc: "Assess Train Managers on train safety, signaling compliance, shunting operations, documentation, and emergency protocols."
      }
    ];

    return (
      <div className="ti2-page-body animate-fade-in" style={{ padding: "24px", background: "#f8fafc", minHeight: "100%" }}>

        {/* Title and Subtitle */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>Assessments</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Select a staff category to conduct structured competency assessments.</p>
        </div>

        {/* Grid Cards */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${roles.length}, 1fr)`, gap: "24px", marginBottom: "24px" }}>
          {roles.map(role => (
            <div
              key={role.key}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
                    <role.icon size={22} style={{ margin: "auto" }} />
                  </div>
                  {role.pending > 0 && (
                    <span style={{ background: "#fee2e2", color: "#dc2626", borderRadius: "999px", fontSize: "11px", fontWeight: "800", padding: "4px 12px" }}>
                      {role.pending} Pending
                    </span>
                  )}
                </div>

                <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{role.label}</h3>
                <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "#475569", lineHeight: "1.5", minHeight: "60px" }}>{role.desc}</p>
              </div>

              <div>
                {/* Stats grid inside card */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid #f1f5f9", paddingTop: "16px", marginBottom: "16px", textAlign: "center" }}>
                  <div style={{ borderRight: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{role.total}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>Total Staff</div>
                  </div>
                  <div style={{ borderRight: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{role.completed}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>Completed</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{role.pending}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>Pending</div>
                  </div>
                </div>

                {/* Open button */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setAssessRole(role.key)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px"
                    }}
                  >
                    Open <span style={{ transition: "transform 0.2s" }} className="open-arrow">→</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Quick Stats Strip (5 Columns) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
            background: "#ffffff",
            padding: "20px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          {[
            { label: "Total Personnel", value: smList.length + tmList.length, icon: Users, bg: "#f1f5f9", iconColor: "#475569", valColor: "#0f172a" },
            { label: "Pending Assessments", value: smPending + tmPending, icon: ClipboardList, bg: "#fee2e2", iconColor: "#dc2626", valColor: "#dc2626" },
            { label: "Completed Assessments", value: smCompleted + tmCompleted, icon: CheckCircle2, bg: "#dcfce7", iconColor: "#16a34a", valColor: "#16a34a" },
            { label: "Submitted This Month", value: 2, icon: Send, bg: "#dbeafe", iconColor: "#2563eb", valColor: "#2563eb" },
            { label: "Current Assessment Cycle", value: "May 2026", icon: Calendar, bg: "#f1f5f9", iconColor: "#475569", valColor: "#0f172a" }
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                borderRight: idx < 4 ? "1px solid #e2e8f0" : "none",
                paddingRight: "16px"
              }}
            >
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: stat.iconColor, flexShrink: 0 }}>
                <stat.icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: stat.valColor, lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.2px", lineHeight: "1.2" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Assessments Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0" }}>Recent Assessments</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Latest assessment activities across all categories</p>
            </div>
            <button
              type="button"
              onClick={() => alert("Redirecting to full assessment ledger...")}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                color: "#334155",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer"
              }}
            >
              <ClipboardList size={14} /> View All Assessments
            </button>
          </div>

          {/* Table */}
          <div className="sdom-table-wrap" style={{ overflowX: "auto" }}>
            <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Staff Name</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Category</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Assessment Type</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Assessed By</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Date</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentAssessments.map((row, idx) => {
                  const roleColors = {
                    "Station Master": { bg: "#eff6ff", color: "#2563eb" },
                    "Station Superintendent": { bg: "#f5f3ff", color: "#7c3aed" },
                    "Train Manager": { bg: "#f0fdf4", color: "#16a34a" }
                  }[row.role] || { bg: "#f1f5f9", color: "#475569" };

                  const statusColors = {
                    "Completed": { bg: "#dcfce7", color: "#16a34a" },
                    "Pending": { bg: "#fee2e2", color: "#dc2626" }
                  }[row.status] || { bg: "#f1f5f9", color: "#475569" };

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", fontWeight: "700", color: "#0f172a" }}>{row.name}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: roleColors.bg, color: roleColors.color, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                          {row.role}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#334155", fontSize: "13px", fontWeight: "500" }}>{row.type}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: statusColors.bg, color: statusColors.color, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>{row.by}</td>
                      <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>{row.date}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (row.type?.includes("Pointsman")) {
                              goTo("reviewPM");
                              if (row.id) openPmReview(row.id);
                            } else if (row.type?.includes("Station Master")) {
                              goTo("stationMasters");
                              if (row.employeeId) openSMForm(row.employeeId);
                            } else if (row.type?.includes("Train Manager")) {
                              goTo("trainManagers");
                              if (row.employeeId) openTMForm(row.employeeId);
                            } else if (row.type?.includes("Superintendent")) {
                              goTo("stationSuper");
                              if (row.employeeId) openSSForm(row.employeeId);
                            } else {
                              goTo("assessments");
                            }
                          }}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            padding: "5px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#475569",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "pointer"
                          }}
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  };


  /* ── REPORTS ── */
  const renderReports = () => {
    const ROLE_MAP = { pointsmen: "Pointsman", sm: "Station Master", ss: "Station Superintendent", tm: "Train Manager", ti: "Traffic Inspector", Pointsman: "Pointsman", "Station Master": "Station Master", "Station Superintendent": "Station Superintendent", "Train Manager": "Train Manager", "Traffic Inspector": "Traffic Inspector" };

    if (selectedReportUserId) {
      const u = users.find(x => x.id === selectedReportUserId);
      if (!u) return null;

      const getCat = s => (s === 0 || s === undefined || s === null || isNaN(s)) ? "Untested" : (s >= 80 ? "A" : s >= 50 ? "B" : s >= 26 ? "C" : "D");
      const cat = u.cat || getCat(u.score || 0);

      const CAT_C = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
      const CAT_B = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
      const RISK_C = { High: "#dc2626", Medium: "#d97706", Low: "#16a34a" };

      const isHighRisk = u.pmeStatus === "Overdue" || u.refStatus === "Expired" || (u.score !== undefined && u.score !== null && u.score < 50);
      const risk = (u.score === undefined || u.score === null) ? "Untested" : isHighRisk ? "High" : (u.score >= 80 ? "Low" : "Medium");
      const pmeVal = u.pmeStatus === "Fit" ? "FIT" : u.pmeStatus === "Pending" ? "PENDING" : u.pmeStatus === "Overdue" ? "OVERDUE" : "UNFIT";
      const refVal = u.refStatus === "Cleared" ? "CLEARED" : "EXPIRED";

      const pmAssess = pmList.find(p => p.hrmsId === u.id);
      const smAssess = smList.find(s => s.hrmsId === u.id);
      const smForm = smForms[smAssess?.id];

      return (
        <div className="ti2-card animate-fade-in" style={{ padding: "24px", background: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
          {/* Header section with back button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #e2edf8", paddingBottom: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div className="ti2-pm-avatar" style={{ width: 48, height: 48, fontSize: 18, background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "700" }}>{u.name.charAt(0)}</div>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: 0 }}>{u.name}</h2>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b", fontWeight: "700" }}>{ROLE_MAP[u.role] || u.designation || u.role} Dossier · {u.station}</p>
              </div>
            </div>
            <button className="ti2-link-btn" onClick={() => setSelectedReportUserId(null)} style={{ fontSize: "13px", fontWeight: "800", color: "#2563eb", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              â† Back to Reports
            </button>
          </div>

          {/* Quick Info Summary metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2edf8", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Grand Total Score</span>
              <strong style={{ display: "block", fontSize: "24px", color: CAT_C[cat] || "#2563eb", marginTop: "4px", fontWeight: "900" }}>{(u.score !== undefined && u.score !== null) ? `${u.score}/100` : "N/A"}</strong>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2edf8", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Safety Grade</span>
              <div>
                <span className="ti2-badge" style={{ display: "inline-block", background: CAT_B[cat] || "#dbeafe", color: CAT_C[cat] || "#2563eb", fontSize: "13px", fontWeight: "800", padding: "4px 14px", borderRadius: "8px", marginTop: "8px" }}>
                  {cat === "Untested" ? "Untested" : `Category ${cat}`}
                </span>
              </div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2edf8", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>PME Clearance</span>
              <div>
                <span className="ti2-badge" style={{ display: "inline-block", background: pmeVal === "FIT" ? "#dcfce7" : "#fee2e2", color: pmeVal === "FIT" ? "#16a34a" : "#dc2626", fontSize: "13px", fontWeight: "800", padding: "4px 14px", borderRadius: "8px", marginTop: "8px" }}>
                  {pmeVal}
                </span>
              </div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2edf8", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>REF Training</span>
              <div>
                <span className="ti2-badge" style={{ display: "inline-block", background: refVal === "CLEARED" ? "#dcfce7" : "#fee2e2", color: refVal === "CLEARED" ? "#16a34a" : "#dc2626", fontSize: "13px", fontWeight: "800", padding: "4px 14px", borderRadius: "8px", marginTop: "8px" }}>
                  {refVal}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "24px" }}>
            {/* Left side details card */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "14px", padding: "18px" }}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "13px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1.5px solid #e2edf8", paddingBottom: "8px" }}>Personnel Roster Details</h3>
                <dl style={{ display: "flex", flexDirection: "column", gap: "12px", margin: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Employee HRMS ID</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{u.id}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Designation</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{ROLE_MAP[u.role] || u.designation}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Jurisdiction Station</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{u.station}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Contact Number</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{u.contact || "+91 98765 11001"}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Date of Appointment</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>{u.joiningDate || "2018-02-12"}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Alcoholic Status</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: u.alcoholicStatus === "Alcoholic" ? "#dc2626" : "#16a34a" }}>{u.alcoholicStatus || "Non-Alcoholic"}</dd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Assigned Division Risk</dt><dd style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: RISK_C[risk] }}>{risk} Risk</dd></div>
                </dl>
              </div>

              {/* Action button */}
              <button className="ti2-primary-btn" onClick={() => alert("Exporting Dossier PDF...")} style={{ width: "100%", height: "42px", justifyContent: "center", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "8px", fontWeight: "700", cursor: "pointer", border: "none", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={16} /> Export Assessment Dossier (PDF)
              </button>
            </div>

            {/* Right side Performance Breakdown */}
            <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "14px", padding: "18px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "13px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1.5px solid #e2edf8", paddingBottom: "8px" }}>Sectional Competency Breakdown</h3>

              {u.role === "Pointsman" || u.role === "pointsmen" ? (
                /* Pointsman sections competency progress bars */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {(() => {
                    const secs = pmAssess?.finalSections || pmAssess?.originalSections || [
                      { title: "Knowledge of Rules (MCQ)", score: Math.round(u.score * 0.25), max: 25 },
                      { title: "Alertness and Observation of Rules", score: Math.round(u.score * 0.25), max: 25 },
                      { title: "Safety Record", score: Math.round(u.score * 0.15), max: 15 },
                      { title: "Leadership and Management", score: Math.round(u.score * 0.15), max: 15 },
                      { title: "Discipline", score: Math.round(u.score * 0.10), max: 10 },
                      { title: "Appearance and Neatness", score: Math.round(u.score * 0.10), max: 10 },
                    ];
                    return secs.map(s => {
                      const pct = Math.round((s.score / s.max) * 100);
                      return (
                        <div key={s.title}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            <span>{s.title}</span>
                            <strong>{s.score} / {s.max} ({pct}%)</strong>
                          </div>
                          <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#dc2626", borderRadius: "999px" }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* Station Master sections competency progress bars */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {(() => {
                    let totalYes = smForm ? (
                      (smForm.alertness || []).filter(v => v === "Yes").length +
                      (smForm.safetyRecord || []).filter(v => v === "Yes").length +
                      (smForm.leadership || []).filter(v => v === "Yes").length +
                      (smForm.discipline || []).filter(v => v === "Yes").length +
                      (smForm.appearance || []).filter(v => v === "Yes").length
                    ) : 12;
                    let knowledgeMarks = smForm ? Math.min(parseInt(smForm.knowledgeMarks) || 0, 25) : Math.max(0, u.score - 65);

                    const secs = [
                      { title: "Knowledge of Rules (MCQ)", score: knowledgeMarks, max: 25 },
                      { title: "Alertness and Observation of Rules", score: smForm ? (smForm.alertness || []).filter(v => v === "Yes").length * 5 : Math.round(totalYes * 5 * 0.25), max: 25 },
                      { title: "Safety Record", score: smForm ? (smForm.safetyRecord || []).filter(v => v === "Yes").length * 3 : Math.round(totalYes * 3 * 0.20), max: 15 },
                      { title: "Leadership and Management", score: smForm ? (smForm.leadership || []).filter(v => v === "Yes").length * 3 : Math.round(totalYes * 3 * 0.20), max: 15 },
                      { title: "Discipline", score: smForm ? (smForm.discipline || []).filter(v => v === "Yes").length * 2 : Math.round(totalYes * 2 * 0.15), max: 10 },
                      { title: "Appearance and Neatness", score: smForm ? (smForm.appearance || []).filter(v => v === "Yes").length * 2 : Math.round(totalYes * 2 * 0.15), max: 10 }
                    ];

                    return secs.map(s => {
                      const pct = Math.round((s.score / s.max) * 100);
                      return (
                        <div key={s.title}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            <span>{s.title}</span>
                            <strong>{s.score} / {s.max} ({pct}%)</strong>
                          </div>
                          <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#dc2626", borderRadius: "999px" }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const divSummary = [
      { label: "Average Division Score", val: 87 },
      { label: "Safety Compliance %", val: "91%" },
      { label: "High-Risk Staff", val: 18 },
      { label: "Pending Approvals", val: 246 },
      { label: "Total Reports Generated", val: 6245 },
    ];

    const STATION_OPTS = ["All", ...stations.map(s => s.name)];
    const TI_OPTS = ["All", user?.name || "TI Area"];
    const ROLE_OPTS = ["All", "Pointsman", "Station Master", "Station Superintendent", "Train Manager"];

    const getTiArea = (st) => user?.name || "TI Area";

    const getCat = s => (s === 0 || s === undefined || s === null || isNaN(s)) ? "Untested" : (s >= 80 ? "A" : s >= 50 ? "B" : s >= 26 ? "C" : "D");

    const repFiltered = users.filter(s => {
      const matchesSearch = !repF.search ||
        (s.name || "").toLowerCase().includes(repF.search.toLowerCase()) ||
        (s.id || "").toLowerCase().includes(repF.search.toLowerCase());
      const matchesRole = repF.role === "All" || (s.role || "").toLowerCase() === repF.role.toLowerCase() || (s.designation || "").toLowerCase().includes(repF.role.toLowerCase());
      const matchesStation = repF.station === "All" || s.station === repF.station;
      const matchesCat = repF.cat === "All" || (s.cat || getCat(s.score)) === repF.cat;
      const isHighRisk = s.pmeStatus === "Overdue" || s.refStatus === "Expired" || s.score < 50;
      const sRisk = isHighRisk ? "High" : s.score >= 80 ? "Low" : "Medium";
      const matchesRisk = repF.risk === "All" || sRisk === repF.risk;
      return matchesSearch && matchesRole && matchesStation && matchesCat && matchesRisk;
    });

    const catBadge = c => <span className="sdom-badge" style={{ background: { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" }[c] || "#f3f4f6", color: { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" }[c] || "#6b7280" }}>{c ? `Cat. ${c}` : "—"}</span>;
    const riskBadge = r => <span className="sdom-badge" style={{ background: { Low: "#dcfce7", Medium: "#fef3c7", High: "#fee2e2" }[r] || "#f3f4f6", color: { Low: "#16a34a", Medium: "#d97706", High: "#dc2626" }[r] || "#6b7280" }}>{r}</span>;
    const statusBadge = s => <span className="sdom-badge" style={{ background: { Approved: "#dcfce7", Pending: "#fef3c7", Rejected: "#fee2e2", Completed: "#dcfce7", Fit: "#dcfce7" }[s] || "#f3f4f6", color: { Approved: "#16a34a", Pending: "#d97706", Rejected: "#dc2626", Completed: "#16a34a", Fit: "#16a34a" }[s] || "#6b7280" }}>{s}</span>;

    return (
      <div className="sdom-fade" style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px" }}>
        <h1 className="sdom-page-title" style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>Reports &amp; Analytics</h1>
        <p className="sdom-page-subtitle" style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px" }}>Division-level reporting hub. Use filters below to generate specific staff reports.</p>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "16px", marginBottom: "24px" }}>
          {divSummary.map(c => (
            <div key={c.label} className="sdom-stat-card" style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="sdom-stat-value" style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{c.val}</div>
              <div className="sdom-stat-label" style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: "uppercase" }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="sdom-filter-bar" style={{ display: "flex", gap: "16px", background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="sdom-filter-field" style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 2, minWidth: "200px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Search by Name/HRMS ID</label>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Type name or HRMS ID..."
                value={repF.search || ""}
                onChange={e => setRepF(p => ({ ...p, search: e.target.value }))}
                style={{ width: "100%", height: "42px", padding: "0 12px 0 36px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600", outline: "none" }}
              />
            </div>
          </div>
          <div className="sdom-filter-field" style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "120px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Role</label>
            <select value={repF.role} onChange={e => setRepF(p => ({ ...p, role: e.target.value }))} style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}>
              {ROLE_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field" style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "140px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Station</label>
            <select value={repF.station} onChange={e => setRepF(p => ({ ...p, station: e.target.value }))} style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}>
              {STATION_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field" style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "100px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Category</label>
            <select value={repF.cat} onChange={e => setRepF(p => ({ ...p, cat: e.target.value }))} style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}>
              <option>All</option><option>A</option><option>B</option><option>C</option><option>D</option>
            </select>
          </div>
          <div className="sdom-filter-field" style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "110px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Risk Level</label>
            <select value={repF.risk} onChange={e => setRepF(p => ({ ...p, risk: e.target.value }))} style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}>
              <option>All</option><option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
          <div>
            <button className="sdom-btn-primary" style={{ height: "42px", display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "white", padding: "0 20px", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}>
              <Search size={16} /> Search
            </button>
          </div>
        </div>

        <div className="sdom-chart-card" style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ marginBottom: 14, fontWeight: 700, color: "#1e293b" }}>{repFiltered.length} staff in report</div>
          <div className="sdom-table-wrap" style={{ overflowX: "auto" }}>
            <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Name</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Role</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Station</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>TI Area</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Score</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Category</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Risk</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {repFiltered.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No staff match the selected filters</td></tr>}
                {repFiltered.map(s => {
                  const sCat = s.cat || getCat(s.score);
                  const isHighRisk = s.pmeStatus === "Overdue" || s.refStatus === "Expired" || s.score < 50;
                  const sRisk = isHighRisk ? "High" : s.score >= 80 ? "Low" : "Medium";
                  return (
                    <tr key={s.id} style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9" }} onClick={() => setSelectedReportUserId(s.id)}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#2563eb" }}>{s.name}</td>
                      <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "500" }}>{ROLE_MAP[s.role] || s.role}</td>
                      <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "500" }}>{s.station}</td>
                      <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "500" }}>{getTiArea(s.station)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>{s.score}</td>
                      <td style={{ padding: "12px 16px" }}>{catBadge(sCat)}</td>
                      <td style={{ padding: "12px 16px" }}>{riskBadge(sRisk)}</td>
                      <td style={{ padding: "12px 16px" }}>{statusBadge(s.pmeStatus === "Unfit" ? "Rejected" : s.refStatus === "Expired" ? "Pending" : "Approved")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
     RENDER: CONTENT ROUTER
  ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
  const renderContent = () => {
    switch (activePage) {
      case "dashboard": return renderDashboard();
      case "profile": return renderProfile();
      case "stations": return renderStations();
      case "pointsmen": return renderRoleView("Pointsman", "Pointsman");
      case "stationMasters": return renderRoleView("Station Master", "Station Master");
      case "stationSuperintendents": return renderRoleView("Station Superintendent", "Station Superintendent");
      case "trainManagers": return renderRoleView("Train Manager", "Train Manager");
      case "approvals": return renderApprovals();
      case "assessments": return renderAssessments();
      case "myAssessment": return renderMyAssessment();
      case "pmePosition": return renderPmePosition();
      case "refPosition": return renderRefPosition();
      case "inspections": return renderInspections();
      case "counselling": return renderCounselling();
      case "reports": return renderReports();
      default: return renderDashboard();
    }
  };

  /* ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
     SHELL LAYOUT
  ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  */
  return (
    <div className="ti2-layout">
      <input type="checkbox" id="sdom-sidebar-toggle" className="sdom-sidebar-checkbox" style={{ display: "none" }} />
      <label htmlFor="sdom-sidebar-toggle" className="sdom-sidebar-close-backdrop"></label>
      {/* Top Navigation Header */}
      <header className="ti2-topbar">
        <label htmlFor="sdom-sidebar-toggle" className="sdom-sidebar-toggle-btn" style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", background: "none", border: "none", color: "#ffffff", marginRight: "12px" }}>
          &#9776;
        </label>
        <div className="ti2-topbar-brand" style={{ marginRight: "auto", marginLeft: "16px" }}>
          <div className="ti2-topbar-logo"><img src="/logo.webp" alt="IR Logo" style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }} /></div>
          <div>
            <h1>{t("Indian Railway Evaluation System")}</h1>
            <p><span className="desktop-only-txt">Operations Workspace: </span>{t("Traffic Inspector")}<span className="desktop-only-txt"> Module</span></p>
          </div>
        </div>

        <div className="ti2-user-strip" style={{ gap: "12px", alignItems: "center" }}>

          {/* Dynamic Real-Time Notifications Bell Dropdown */}
          <div style={{ position: "relative", marginRight: "6px" }}>
            <button
              onClick={() => setBellDropdownOpen(!bellDropdownOpen)}
              style={{ background: "none", border: "none", color: "#e2edf8", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", padding: "6px", borderRadius: "50%" }}
            >
              <Bell size={20} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "16px", height: "16px", borderRadius: "50%", background: "#dc2626", color: "#ffffff", fontSize: "9px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {bellDropdownOpen && (
              <div style={{ position: "absolute", top: "36px", right: 0, width: "320px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "14px", boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)", zIndex: 1000, overflow: "hidden", color: "#0f172a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2edf8" }}>
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800" }}>Operations Alerts</h4>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <button onClick={markAllNotificationsRead} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>Mark all read</button>
                  )}
                </div>
                <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: n.read ? "#fff" : "#f0f6ff" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: n.type === "danger" ? "#dc2626" : n.type === "warning" ? "#ea580c" : "#16a34a", marginTop: "4px", flexShrink: 0 }}></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 4px 0", fontSize: "12px", lineHeight: "1.4", fontWeight: n.read ? "500" : "800", color: "#1e293b" }}>{n.message}</p>
                        <span style={{ fontSize: "10px", color: "#64748b" }}>{n.time}</span>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && <p className="ti2-empty">No alerts in your inbox.</p>}
                </div>
              </div>
            )}
          </div>

          <div className="ti2-user-avatar">{tiName.charAt(0)}</div>
          <div>
            <strong>{tiName}</strong>
            <span>HRMS ID: {tiId}</span>
          </div>
          <button className="ti2-logout-btn" onClick={onLogout}>
            <LogOut size={14} /> {t("Logout")}
          </button>
        </div>
      </header>

      {/* Main layout shell */}
      <div className="ti2-shell">
        <aside className="ti2-sidebar">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = activePage === item.key;
            return (
              <button key={item.key} className={`ti2-nav-item${active ? " active" : ""}`}
                onClick={() => goTo(item.key)}>
                <Icon size={16} /><span>{t(item.label)}</span>
              </button>
            );
          })}


        </aside>

        <main className="ti2-main">
          {statusMsg && (
            <div className="ti2-status-banner">
              <CheckCircle2 size={13} /> {statusMsg}
              <button className="ti2-dismiss" onClick={() => setStatusMsg("")}>×</button>
            </div>
          )}
          <div className="ti2-page-wrap">{renderContent()}</div>
        </main>
      </div>

      {/* ── Fullscreen Analytics Modal ── */}
      {fullscreenChart && (
        <div className="sm2-fullscreen-modal">
          {/* Header */}
          <div className="sm2-fullscreen-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="sm2-fullscreen-icon-wrap">
                {fullscreenChart === "station" && <Building2 size={18} color="#93c5fd" />}
                {fullscreenChart === "trend" && <TrendingUp size={18} color="#a78bfa" />}
                {fullscreenChart === "grade" && <BarChart3 size={18} color="#34d399" />}
              </div>
              <div>
                <h2>
                  {fullscreenChart === "station" && "Station-wise Safety & Performance — Deep Dive"}
                  {fullscreenChart === "trend" && "Compliance & Assessment Trends — Deep Dive"}
                  {fullscreenChart === "grade" && "Staff Grade Distribution (Pointsmen) — Deep Dive"}
                </h2>
                <p>Indian Railway Evaluation Command · Operations Workspace</p>
              </div>
            </div>
            <button className="sm2-fullscreen-close-btn" onClick={() => setFullscreenChart(null)}>
              ✕ Close
            </button>
          </div>

          {/* Filter Bar */}
          <div className="sm2-fullscreen-filter-bar">
            <span className="sm2-fs-filter-tag">FILTERS</span>
            <input
              type="text"
              placeholder={fullscreenChart === "station" ? "Search station name / code..." : "Search staff name / ID..."}
              value={fsSearch}
              onChange={e => setFsSearch(e.target.value)}
              className="sm2-fs-input"
            />
            {fullscreenChart !== "trend" && (
              <>
                <select value={fsCatFilter} onChange={e => setFsCatFilter(e.target.value)} className="sm2-fs-select">
                  <option value="All">All Grades (A-D)</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="D">Grade D</option>
                </select>
                <select value={fsRiskFilter} onChange={e => setFsRiskFilter(e.target.value)} className="sm2-fs-select">
                  <option value="All">All Risk Levels</option>
                  <option value="High">High Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="Low">Low Risk</option>
                </select>
              </>
            )}
            <button onClick={() => { setFsSearch(""); setFsCatFilter("All"); setFsRiskFilter("All"); }} className="sm2-fs-reset-btn">
              Reset
            </button>
            <div className="sm2-fs-counter">
              {fullscreenChart === "station" && (
                <>Showing <strong>{filteredFsStations.length}</strong> of {stationStats.length} stations</>
              )}
              {fullscreenChart === "grade" && (
                <>Showing <strong>{filteredFsUsers.length}</strong> of {users.filter(u => u.role === "Pointsman").length} Pointsmen</>
              )}
              {fullscreenChart === "trend" && (
                <>Displaying all <strong>{MONTHLY.length}</strong> monthly cycles</>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="sm2-fullscreen-content">

            {/* KPI Cards Row */}
            <div className="sm2-fs-kpi-row">
              {fullscreenChart === "station" && (
                <>
                  {[
                    { label: "Avg Performance Score", value: filteredFsStations.length ? Math.round(filteredFsStations.reduce((s, x) => s + x.avgScore, 0) / filteredFsStations.length) + "/100" : "—", color: "#2563eb", glowColor: "rgba(37,99,235,0.15)" },
                    { label: "Avg Safety Compliance", value: filteredFsStations.length ? Math.round(filteredFsStations.reduce((s, x) => s + x.safetyPct, 0) / filteredFsStations.length) + "/100" : "—", color: "#7c3aed", glowColor: "rgba(124,58,237,0.15)" },
                    { label: "High-Risk Stations", value: filteredFsStations.filter(st => st.highRisk >= 2).length, color: "#dc2626", glowColor: "rgba(220,38,38,0.15)" },
                    { label: "Grade A Stations", value: filteredFsStations.filter(st => getCat(st.avgScore) === "A").length, color: "#16a34a", glowColor: "rgba(22,163,74,0.15)" },
                    { label: "Total Filtered Stations", value: filteredFsStations.length, color: "#0891b2", glowColor: "rgba(8,145,178,0.15)" },
                  ].map(k => (
                    <div key={k.label} className="sm2-fs-kpi-card" style={{ "--glow": k.glowColor }}>
                      <div className="sm2-fs-kpi-value" style={{ color: k.color }}>{k.value}</div>
                      <div className="sm2-fs-kpi-label">{k.label}</div>
                    </div>
                  ))}
                </>
              )}

              {fullscreenChart === "trend" && (
                <>
                  {[
                    { label: "Total Tests Taken", value: MONTHLY.reduce((s, x) => s + x.assessments, 0), color: "#2563eb", glowColor: "rgba(37,99,235,0.15)" },
                    { label: "Overall Score Average", value: (MONTHLY.length > 0 ? Math.round(MONTHLY.reduce((s, x) => s + x.avgScore, 0) / MONTHLY.length) : 0) + "/100", color: "#0891b2", glowColor: "rgba(8,145,178,0.15)" },
                    { label: "Overall Safety Average", value: (MONTHLY.length > 0 ? Math.round(MONTHLY.reduce((s, x) => s + x.safetyAvg, 0) / MONTHLY.length) : 0) + "/100", color: "#16a34a", glowColor: "rgba(22,163,74,0.15)" },
                    { label: "Safety Compliance Peak", value: (MONTHLY.length > 0 ? Math.max(...MONTHLY.map(m => m.safetyAvg)) : 0) + "/100", color: "#7c3aed", glowColor: "rgba(124,58,237,0.15)" },
                    { label: "Evaluation Cycles Logged", value: MONTHLY.length, color: "#475569", glowColor: "rgba(71,85,105,0.15)" },
                  ].map(k => (
                    <div key={k.label} className="sm2-fs-kpi-card" style={{ "--glow": k.glowColor }}>
                      <div className="sm2-fs-kpi-value" style={{ color: k.color }}>{k.value}</div>
                      <div className="sm2-fs-kpi-label">{k.label}</div>
                    </div>
                  ))}
                </>
              )}

              {fullscreenChart === "grade" && (
                <>
                  {[
                    { label: "Avg Personnel Score", value: filteredFsUsers.length ? Math.round(filteredFsUsers.reduce((s, x) => s + x.score, 0) / filteredFsUsers.length) + "/100" : "—", color: "#2563eb", glowColor: "rgba(37,99,235,0.15)" },
                    { label: "Fit (PME Status)", value: filteredFsUsers.filter(u => u.pmeStatus === "Fit").length, color: "#16a34a", glowColor: "rgba(22,163,74,0.15)" },
                    { label: "Cleared (REF Status)", value: filteredFsUsers.filter(u => u.refStatus === "Cleared").length, color: "#0891b2", glowColor: "rgba(8,145,178,0.15)" },
                    { label: "Grade A Personnel", value: filteredFsUsers.filter(u => getCat(u.score) === "A").length, color: "#7c3aed", glowColor: "rgba(124,58,237,0.15)" },
                    { label: "High Risk Staff Count", value: filteredFsUsers.filter(u => u.pmeStatus === "Overdue" || u.refStatus === "Expired" || u.score < 50).length, color: "#dc2626", glowColor: "rgba(220,38,38,0.15)" },
                  ].map(k => (
                    <div key={k.label} className="sm2-fs-kpi-card" style={{ "--glow": k.glowColor }}>
                      <div className="sm2-fs-kpi-value" style={{ color: k.color }}>{k.value}</div>
                      <div className="sm2-fs-kpi-label">{k.label}</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Scaled High-Fidelity Chart */}
            <div className="sm2-fs-chart-container" style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}>
                {fullscreenChart === "station" && "📊 Station-wise Safety Compliance & Performance Comparison"}
                {fullscreenChart === "trend" && "📈 Monthly Safety Audits & Compliance Volumes"}
                {fullscreenChart === "grade" && "ðŸ… Staff Grading Allocation Matrix"}
              </h3>
              <div className="sm2-fs-chart-wrapper" style={{ width: "100%", height: "380px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  {fullscreenChart === "station" ? (
                    <BarChart data={fsStBarData} margin={{ top: 8, right: 10, left: -10, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<TiTooltip />} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="avgScore" name="Avg Performance Score (/100)" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={38} />
                      <Bar dataKey="safetyPct" name="Safety Compliance Rate (/100)" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={38} />
                    </BarChart>
                  ) : fullscreenChart === "trend" ? (
                    <LineChart data={MONTHLY} margin={{ top: 8, right: 10, left: -24, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<TiTooltip />} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="assessments" name="Tests Taken" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="safetyAvg" name="Safety Compliance Avg" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  ) : (
                    <PieChart>
                      <Pie data={fsPieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} dataKey="value" paddingAngle={4}>
                        {fsPieData.map((e, i) => <Cell key={e.name} fill={PIE_C[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n, p) => [`${v} Staff`, `Category ${p.payload.name}`]} />
                      <Legend formatter={(v, e) => `Grade ${e.payload.name} — ${e.payload.value} staff`} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }} />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Deep-Dive Grid/Table List */}
            <div className="sm2-fs-low-perf-section" style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                🔎 Detailed Evaluation Ledger
              </h3>

              {fullscreenChart === "station" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                  {filteredFsStations.map(st => {
                    const level = st.highRisk >= 2 ? "High" : st.highRisk > 0 ? "Medium" : "Low";
                    return (
                      <div key={st.id} className="ti2-highlight-card" style={{ borderTop: `4px solid ${RISK_C[level]}`, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "130px", background: "#f8fafc", padding: "16px", boxSizing: "border-box" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <strong style={{ fontSize: "14px", color: "#0f172a" }}>{st.name} ({st.code})</strong>
                            <span className="ti2-badge" style={{ background: RISK_B[level], color: RISK_C[level] }}>{level} Risk</span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "10px", marginTop: "8px" }}>
                            <span>Avg Score: <strong>{st.avgScore}/100</strong></span>
                            <span>Compliance: <strong>{st.safetyPct}/100</strong></span>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSelectedStation(st); setActivePage("stations"); setFullscreenChart(null); }}
                          className="ti2-link-btn-sm"
                          style={{ width: "100%", justifyContent: "center", marginTop: "12px", background: "#ffffff" }}
                        >
                          View Station Analytics →
                        </button>
                      </div>
                    );
                  })}
                  {filteredFsStations.length === 0 && (
                    <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", gridColumn: "1/-1", padding: "20px 0" }}>No stations match your current filters.</p>
                  )}
                </div>
              )}

              {fullscreenChart === "trend" && (
                <div className="ti2-table-wrap">
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 2fr", padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "11px" }}>
                    <span>Evaluation Period</span>
                    <span>Assessments Volume</span>
                    <span>Performance Avg (/100)</span>
                    <span>Safety Compliance Rating</span>
                  </div>
                  {MONTHLY.map(m => (
                    <div key={m.month} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 2fr", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                      <strong>{m.month}</strong>
                      <span>{m.assessments} tests administered</span>
                      <span>{m.avgScore}/100 avg</span>
                      <strong style={{ color: m.safetyAvg >= 80 ? "#16a34a" : "#ea580c" }}>{m.safetyAvg}/100 compliance</strong>
                    </div>
                  ))}
                </div>
              )}

              {fullscreenChart === "grade" && (
                <div className="ti2-table-wrap">
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr 1fr 1fr", padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "700", fontSize: "11px" }}>
                    <span>Pointsman Name</span>
                    <span>Staff ID</span>
                    <span>Station Location</span>
                    <span>PME Status</span>
                    <span>REF Status</span>
                    <span>Evaluation Score</span>
                  </div>
                  {filteredFsUsers.map(u => {
                    const grade = getCat(u.score);
                    return (
                      <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr 1fr 1fr", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: "13px", alignItems: "center" }}>
                        <strong>{u.name}</strong>
                        <span style={{ fontFamily: "monospace" }}>{u.id}</span>
                        <span>{u.station}</span>
                        <span style={{ color: u.pmeStatus === "Fit" ? "#16a34a" : "#dc2626", fontWeight: "600" }}>{u.pmeStatus}</span>
                        <span style={{ color: u.refStatus === "Cleared" ? "#16a34a" : "#dc2626", fontWeight: "600" }}>{u.refStatus}</span>
                        <strong><span className="ti2-badge" style={{ background: CAT_B[grade], color: CAT_C[grade] }}>Grade {grade} ({u.score}%)</span></strong>
                      </div>
                    );
                  })}
                  {filteredFsUsers.length === 0 && (
                    <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No personnel match your current filters.</p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      {renderChartZoomModal()}
    </div>
  );
}

