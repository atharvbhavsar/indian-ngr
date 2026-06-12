import { useMemo, useState, useEffect } from "react";
import { useStationMasterState } from "./hooks/modules/useStationMasterState";
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart2,
  Filter,
  Gauge,
  LogOut,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCircle2,
  Users,
  XCircle,
  ArrowUpDown,
  Activity,
  Lock,
  Info,
  Shield,
  FileDown,
  Maximize2,
  Plus,
  ArrowLeft,
  Building2,
  Edit,
  Trash2,
  UserPlus,
  Clock,
  ShieldAlert
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar,
  LabelList
} from "recharts";
import "./sdom.css";

/* ─── NAV ─── */
const navItems = [
  { key: "dashboard",     label: "Dashboard",            icon: BarChart3 },
  { key: "profile",       label: "My Profile",           icon: UserCircle2 },
  { key: "pointsmen",     label: "Pointsmen",            icon: Users },
  { key: "assess",        label: "Assess Pointsman",     icon: ClipboardCheck },
  { key: "myAssessment",  label: "My Assessment (by TI)",icon: ClipboardCheck },
  { key: "pmePosition",   label: "PME Position",         icon: Activity },
  { key: "refCourse",     label: "REF Course",           icon: BookOpen },
  { key: "counselling",   label: "Counselling Queue",    icon: ShieldAlert },
  { key: "reports",       label: "Reports & Analytics",  icon: FileBarChart2 }
];

/* ─── SM PROFILE ─── */
import { StationMasterPointsmanDetail } from './pages/modules/station_master/StationMasterPointsmanDetail';
import { StationMasterAssessForm } from './pages/modules/station_master/StationMasterAssessForm';
import { StationMasterMCQTest } from './pages/modules/station_master/StationMasterMCQTest';
import { StationMasterHistoryPage } from './pages/modules/station_master/StationMasterHistoryPage';
import { StationMasterAssessments } from './pages/modules/station_master/StationMasterAssessments';
import { StationMasterPointsmenList } from './pages/modules/station_master/StationMasterPointsmenList';
import { StationMasterPointsmanView } from './pages/modules/station_master/StationMasterPointsmanView';
import { StationMasterPointsmanModal } from './pages/modules/station_master/StationMasterPointsmanModal';
import { StationMasterPointsmenDetailAlt } from './pages/modules/station_master/StationMasterPointsmenDetailAlt';
import { StationMasterDashboard } from './pages/modules/station_master/StationMasterDashboard';
import { getCat, getCatColor, getCatBg, riskLevel, riskColor, formatQuarterPeriod } from './utils/scoreCalculator';
import { CustomTooltip } from './components/charts/CustomTooltip';
import { smProfile, initialPointsmen, pmAssessmentHistory, initialDrafts, YN_SECTIONS, defaultAssessForm, smTestQuestions, smAssessmentHistory, smSelfAssessment, monthlyTrend } from './data/mockStationMasterData';
import { useLanguage } from "./contexts/LanguageContext";
import { LanguageSelector } from "./components/LanguageSelector";

const CAT_BG = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2", Untested: "#f1f5f9" };
const CAT_COLOR = { A: "#15803d", B: "#1d4ed8", C: "#b45309", D: "#b91c1c", Untested: "#64748b" };

function StationMasterModule({ user, onLogout }) {
  const { t } = useLanguage();
  const state = useStationMasterState(user, onLogout);

  // Clear any stale cached history (may contain old mock/seed data)
  useEffect(() => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("sm_history_")) keysToRemove.push(k);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch(e) { /* ignore */ }
  }, []);

  /* ── PME local state ── */
  const [showPmeModal, setShowPmeModal] = useState(false);
  const [pmeFormHrmsId, setPmeFormHrmsId] = useState("");
  const [pmeFormStatus, setPmeFormStatus] = useState("Fit");
  const [pmeFormDoneDate, setPmeFormDoneDate] = useState("");
  const [pmeFormDueDate, setPmeFormDueDate] = useState("");
  const [pmeSearch, setPmeSearch] = useState("");
  const [pmeStatusFilter, setPmeStatusFilter] = useState("All");

  /* ── REF local state ── */
  const [showRefModal, setShowRefModal] = useState(false);
  const [refFormHrmsId, setRefFormHrmsId] = useState("");
  const [refFormStatus, setRefFormStatus] = useState("Completed");
  const [refFormDate, setRefFormDate] = useState("");
  const [refFormNextDue, setRefFormNextDue] = useState("");
  const [refFormRemarks, setRefFormRemarks] = useState("");
  const [refFormConductedBy, setRefFormConductedBy] = useState("");
  const [refSearch, setRefSearch] = useState("");
  const [refStatusFilter, setRefStatusFilter] = useState("All");

  /* ── COUNSELLING local state ── */
  const [showCounselScheduleModal, setShowCounselScheduleModal] = useState(false);
  const [counselScheduleId, setCounselScheduleId] = useState("");
  const [counselScheduleDate, setCounselScheduleDate] = useState("");
  const [counselScheduleTime, setCounselScheduleTime] = useState("");
  const [counselScheduleRemarks, setCounselScheduleRemarks] = useState("");

  const [showCounselResultModal, setShowCounselResultModal] = useState(false);
  const [counselResultId, setCounselResultId] = useState("");
  const [counselAttendance, setCounselAttendance] = useState("Present"); // "Present" | "Absent"
  const [counselObs, setCounselObs] = useState("");
  const [counselSafety, setCounselSafety] = useState("");
  const [counselBehavior, setCounselBehavior] = useState("");
  const [counselRecs, setCounselRecs] = useState("");
  const [counselFollowUp, setCounselFollowUp] = useState("");
  const [counselAbsenceRemarks, setCounselAbsenceRemarks] = useState("");

  const [showMonitoringModal, setShowMonitoringModal] = useState(false);
  const [monitoringHrmsId, setMonitoringHrmsId] = useState("");
  const [monitoringStatusVal, setMonitoringStatusVal] = useState("Under Observation");
  const [monitoringRiskVal, setMonitoringRiskVal] = useState("High");
  const [monitoringReviewText, setMonitoringReviewText] = useState("");
  const [monitoringFollowUpDate, setMonitoringFollowUpDate] = useState("");

  const [counselSearch, setCounselSearch] = useState("");
  const [counselStatusFilter, setCounselStatusFilter] = useState("All");
  const [selectedCounselRecord, setSelectedCounselRecord] = useState(null);
  const [showCounsellingStats, setShowCounsellingStats] = useState(false);

  const {
    activatedTests,
    activeQIdx,
    activeTab,
    assessForm,
    assessLocked,
    assessTarget,
    computeScore,
    drafts,
    dynamicMonthlyTrend,
    filteredFsPointsmen,
    filteredPm,
    filteredReports,
    fsCategory,
    fsEndDate,
    fsRisk,
    fsSearch,
    fsStartDate,
    fullscreenChart,
    handleSubmitTestAttempt,
    history,
    lowPerformers,
    myAssessSelected,
    openAssessForm,
    openPmAdd,
    openPmDetail,
    openPmEdit,
    openPmShift,
    pageMode,
    pieData,
    pmF,
    pmFilter,
    pmModal,
    pointsmen,
    removePm,
    repApplied,
    repF,
    reportFilter,
    savePmModal,
    selectedPm,
    selectedReportUserId,
    setActivatedTests,
    setActiveQIdx,
    setActiveTab,
    setAssessForm,
    setAssessLocked,
    setAssessTarget,
    setDrafts,
    setFsCategory,
    setFsEndDate,
    setFsRisk,
    setFsSearch,
    setFsStartDate,
    setFullscreenChart,
    setHistory,
    setMyAssessSelected,
    setPageMode,
    setPmF,
    setPmFilter,
    setPmModal,
    setPointsmen,
    setRepApplied,
    setRepF,
    setReportFilter,
    setSelectedPm,
    setSelectedReportUserId,
    setSmMcqTest,
    setStatusMsg,
    setSubmittedAssessments,
    setTestAssigned,
    setTestResponses,
    setViewingPm,
    setViewingStaff,
    smId,
    smMcqTest,
    smName,
    startTestAttempt,
    stats,
    statusMsg,
    submitAssessment,
    submittedAssessments,
    switchTab,
    testAssigned,
    testResponses,
    toggleYN,
    viewingPm,
    viewingStaff,
    stationSms,
    assignedTi,
    logSmPmeRecord,
    logSmRefRecord,
    counsellingQueue,
    scheduleCounselling,
    submitCounsellingResult,
    submitMonitoringReview,
    showCategoriesPanel, setShowCategoriesPanel,
    selectedCategory, setSelectedCategory,
    searchHrms, setSearchHrms,
    selectedHrmsIds, setSelectedHrmsIds,
    sendBatchAssessmentAccess, deactivateAssessmentAccess,
    allDbAssessments,
    updateEmployeeSchedule
  } = state;

  /* ════ RENDERERS ════ */

  /* ── DASHBOARD ── */
  const renderDashboard = () => (
    <StationMasterDashboard 
      stats={stats}
      pieData={pieData}
      lowPerformers={lowPerformers}
      fullscreenChart={fullscreenChart}
      setFullscreenChart={setFullscreenChart}
      fsSearch={fsSearch}
      setFsSearch={setFsSearch}
      fsCategory={fsCategory}
      setFsCategory={setFsCategory}
      fsRisk={fsRisk}
      setFsRisk={setFsRisk}
      fsStartDate={fsStartDate}
      setFsStartDate={setFsStartDate}
      fsEndDate={fsEndDate}
      setFsEndDate={setFsEndDate}
      filteredFsPointsmen={filteredFsPointsmen}
      dynamicMonthlyTrend={dynamicMonthlyTrend}
      pmAssessmentHistory={[]}
      pointsmen={pointsmen}
      smId={smId}
      drafts={drafts}
      viewingStaff={viewingStaff}
      setViewingStaff={setViewingStaff}
      setActiveTab={setActiveTab}
      openPmDetail={openPmDetail}
      user={user}
      stationSms={stationSms}
      assignedTi={assignedTi}
      counsellingQueue={counsellingQueue}
    />
  );

  /* ── PROFILE ── */
  const renderProfile = () => (
    <StationMasterPointsmanDetail
      smName={smName}
      smId={smId}
      smProfile={stationSms.find(s => s.hrmsId === smId) || { ...smProfile, ...user }}
      history={history}
    />
  );

  /* ── POINTSMEN LIST ── */
  const renderPointsmen = () => (
    <StationMasterPointsmenList
      viewingPm={viewingPm}
      setViewingPm={setViewingPm}
      openPmAdd={openPmAdd}
      pmF={pmF}
      setPmF={setPmF}
      filteredPm={filteredPm}
      smProfile={user}
      openPmEdit={openPmEdit}
      openPmShift={openPmShift}
      removePm={removePm}
      renderPointsmenDetail={renderPointsmenDetail}
    />
  );

  const renderPointsmenDetail = (s) => (
    <StationMasterPointsmenDetailAlt
      s={s}
      setViewingPm={setViewingPm}
      smProfile={user}
      allDbAssessments={allDbAssessments}
    />
  );

  const renderPointsmenModal = () => (
    <StationMasterPointsmanModal
      pmModal={pmModal}
      setPmModal={setPmModal}
      smProfile={user}
      savePmModal={savePmModal}
    />
  );

  /* ── PM DETAIL ── */
  const renderPmDetail = (pm) => {
    const pmAssessments = (allDbAssessments || []).filter(a => a.employee?.hrms_id === pm.hrmsId);
    const mappedHistory = pmAssessments.map(a => {
      const attempt = a.TEST_ATTEMPT?.[0] || {};
      const scoreVal = attempt.obtained_marks || 0;
      return {
        id: a.assessment_id,
        date: a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : new Date(a.created_at).toISOString().slice(0, 10),
        testMarks: scoreVal,
        addMarks: 0,
        total: scoreVal,
        category: attempt.category || a.category || getCat(scoreVal),
        approvalStatus: a.status || "Pending",
        tiRemarks: a.remarks || ""
      };
    });
    return (
      <StationMasterPointsmanView
        pm={pm}
        setPageMode={setPageMode}
        smProfile={user}
        pmAssessmentHistory={{ [pm.id]: mappedHistory }}
        setInspectRecord={setInspectRecord}
      />
    );
  };

  /* ── ASSESS POINTSMAN ── */
  const renderAssess = () => (
    <StationMasterAssessForm
      pageMode={pageMode}
      assessTarget={assessTarget}
      assessForm={assessForm}
      setAssessForm={setAssessForm}
      assessLocked={assessLocked}
      setPageMode={setPageMode}
      activatedTests={activatedTests}
      setActivatedTests={setActivatedTests}
      toggleYN={toggleYN}
      computeScore={computeScore}
      submitAssessment={submitAssessment}
      drafts={drafts}
      openAssessForm={openAssessForm}
      submittedAssessments={submittedAssessments}
      pointsmen={pointsmen}
      showCategoriesPanel={showCategoriesPanel}
      setShowCategoriesPanel={setShowCategoriesPanel}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      searchHrms={searchHrms}
      setSearchHrms={setSearchHrms}
      selectedHrmsIds={selectedHrmsIds}
      setSelectedHrmsIds={setSelectedHrmsIds}
      sendBatchAssessmentAccess={sendBatchAssessmentAccess}
      deactivateAssessmentAccess={deactivateAssessmentAccess}
      user={user}
      allDbAssessments={allDbAssessments}
      updateEmployeeSchedule={updateEmployeeSchedule}
      counsellingQueue={counsellingQueue}
    />
  );

  /* ── MY ASSESSMENT (by TI) — history list + detail view ── */
  const renderMyAssessment = () => (
    <StationMasterAssessments
      myAssessSelected={myAssessSelected}
      setMyAssessSelected={setMyAssessSelected}
      smMcqTest={smMcqTest}
      smSelfAssessment={null}
      testAssigned={testAssigned}
      smAssessmentHistory={history}
      startTestAttempt={startTestAttempt}
      smId={smId}
    />
  );

  /* ─── ONLINE MCQ SAFETY & RULE EXAM ATTEMPT SCREEN ─── */
  const renderTakeTest = () => (
    <StationMasterMCQTest
      activeQIdx={activeQIdx}
      setActiveQIdx={setActiveQIdx}
      testResponses={testResponses}
      setTestResponses={setTestResponses}
      setPageMode={setPageMode}
      smName={smName}
      smId={smId}
      handleSubmitTestAttempt={handleSubmitTestAttempt}
    />
  );

  const handleExportCSV = () => {
    const headers = ["Employee Name", "HRMS ID", "Score", "Grade", "Safety Score", "Risk Level", "Approval Status"];
    const csvRows = filteredReports.map(p => [
      `"${p.name || ""}"`,
      `"${p.hrmsId || ""}"`,
      `"${p.lastScore}/100"`,
      `"Cat. ${getCat(p.lastScore)}"`,
      `"${p.safetyScore}%"`,
      `"${riskLevel(p)}"`,
      `"${p.approvalStatus || ""}"`
    ]);
    const csvContent = [headers.join(","), ...csvRows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SM_Pointsmen_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── REPORTS ── */
  const renderReports = () => (
    <StationMasterHistoryPage
      selectedReportUserId={selectedReportUserId}
      setSelectedReportUserId={setSelectedReportUserId}
      repF={repF}
      setRepF={setRepF}
      pointsmen={pointsmen}
      smProfile={user}
      allDbAssessments={allDbAssessments}
    />
  );

  const renderPmePosition = () => {
    // Filtered pointsmen list based on search and status filters
    const filtered = pointsmen.filter(emp => {
      const matchSearch = !pmeSearch || 
        emp.name.toLowerCase().includes(pmeSearch.toLowerCase()) || 
        emp.hrmsId.toLowerCase().includes(pmeSearch.toLowerCase());
      
      const matchStatus = pmeStatusFilter === "All" || 
        emp.pmeStatus?.toLowerCase() === pmeStatusFilter.toLowerCase();
      
      return matchSearch && matchStatus;
    });

    const fitCount = pointsmen.filter(e => e.pmeStatus === "Fit").length;
    const dueCount = pointsmen.filter(e => e.pmeStatus === "Due" || e.pmeStatus === "Pending").length;
    const overdueCount = pointsmen.filter(e => e.pmeStatus === "Overdue" || e.pmeStatus === "Unfit").length;

    const handleOpenLogModal = (hrmsId = "") => {
      setPmeFormHrmsId(hrmsId);
      const matched = pointsmen.find(e => e.hrmsId === hrmsId);
      setPmeFormStatus(matched?.pmeStatus || "Fit");
      setPmeFormDoneDate(matched?.pmeDoneDate || "");
      setPmeFormDueDate(matched?.pmeDueDate || "");
      setShowPmeModal(true);
    };

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      if (!pmeFormHrmsId) {
        alert(t("Please select a pointsman."));
        return;
      }
      if (!pmeFormDueDate) {
        alert(t("Please specify the PME due date."));
        return;
      }
      const pmeData = {
        dueDate: pmeFormDueDate,
        doneDate: pmeFormDoneDate || null,
        status: pmeFormStatus
      };
      const resResult = await logSmPmeRecord(pmeFormHrmsId, pmeData);
      if (resResult && resResult.success) {
        setShowPmeModal(false);
        setPmeFormHrmsId("");
        setPmeFormDoneDate("");
        setPmeFormDueDate("");
        setPmeFormStatus("Fit");
      }
    };

    const statusBadge = (s) => {
      const map = { Fit: "sdom-badge-success", Pending: "sdom-badge-warning", Due: "sdom-badge-warning", Overdue: "sdom-badge-danger", Unfit: "sdom-badge-danger" };
      return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{t(s) || "N/A"}</span>;
    };

    return (
      <div className="sdom-fade" style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 className="sdom-page-title" style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>{t("PME Position & Compliance")}</h1>
            <p className="sdom-page-subtitle" style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>{t("Monitor Periodical Medical Examination clearance, schedule exams, and record medical clearance logs for Pointsmen at your station.")}</p>
          </div>
          <button 
            onClick={() => handleOpenLogModal("")} 
            className="sdom-btn-primary" 
            style={{ height: "42px", display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "white", padding: "0 20px", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
          >
            <Plus size={16}/> {t("Log PME Record")}
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div className="sdom-stat-card" style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #16a34a" }}>
            <div className="sdom-stat-value" style={{ fontSize: "24px", fontWeight: "800", color: "#16a34a" }}>{fitCount} {t("staff")}</div>
            <div className="sdom-stat-label" style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: "uppercase" }}>{t("PME FIT Clearance")}</div>
          </div>
          <div className="sdom-stat-card" style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #d97706" }}>
            <div className="sdom-stat-value" style={{ fontSize: "24px", fontWeight: "800", color: "#d97706" }}>{dueCount} {t("staff")}</div>
            <div className="sdom-stat-label" style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: "uppercase" }}>{t("PME Due / Pending")}</div>
          </div>
          <div className="sdom-stat-card" style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #dc2626" }}>
            <div className="sdom-stat-value" style={{ fontSize: "24px", fontWeight: "800", color: "#dc2626" }}>{overdueCount} {t("staff")}</div>
            <div className="sdom-stat-label" style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: "uppercase" }}>{t("PME Overdue (High Risk)")}</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="sdom-filter-bar" style={{ display: "flex", gap: "16px", background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 2 }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>{t("Search Staff")}</label>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input 
                type="text" 
                placeholder={t("Search by name or HRMS ID...")} 
                value={pmeSearch} 
                onChange={e => setPmeSearch(e.target.value)} 
                style={{ width: "100%", height: "42px", padding: "0 12px 0 36px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600", outline: "none" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>{t("PME Status")}</label>
            <select 
              value={pmeStatusFilter} 
              onChange={e => setPmeStatusFilter(e.target.value)} 
              style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}
            >
              <option value="All">{t("All Statuses")}</option>
              <option value="Fit">{t("Fit")}</option>
              <option value="Pending">{t("Pending")}</option>
              <option value="Due">{t("Due")}</option>
              <option value="Overdue">{t("Overdue")}</option>
              <option value="Unfit">{t("Unfit")}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="sdom-chart-card" style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="sdom-table-wrap" style={{ overflowX: "auto" }}>
            <table className="sdom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>{t("Name")}</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>{t("HRMS ID")}</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>{t("Designation")}</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>{t("Station")}</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>{t("PME Status")}</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>{t("PME Done Date")}</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>{t("PME Due Date")}</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700", textAlign: "right" }}>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.hrmsId} style={{ borderBottom: "1px solid #cbd5e1" }}>
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{emp.name}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontFamily: "monospace", color: "#475569" }}>{emp.hrmsId}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>{t(emp.designation)}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>{emp.stationName || emp.station}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px" }}>{statusBadge(emp.pmeStatus)}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>{emp.pmeDoneDate || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#dc2626", fontWeight: "700" }}>{emp.pmeDueDate || "—"}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button 
                        onClick={() => handleOpenLogModal(emp.hrmsId)} 
                        className="sdom-btn-primary" 
                        style={{ height: "30px", padding: "0 12px", borderRadius: "6px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                      >
                        {t("Update PME")}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>{t("No employee matched your filters.")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal form */}
        {showPmeModal && (
          <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e => e.target === e.currentTarget && setShowPmeModal(false)}>
            <div className="sdom-modal" style={{ width: "500px", maxWidth: "95vw", padding: "24px", background: "white", borderRadius: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{t("LOG PME MEDICAL RECORD")}</h3>
                <button type="button" onClick={() => setShowPmeModal(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}>✕</button>
              </div>

              <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>{t("Select Staff *")}</label>
                  <select 
                    value={pmeFormHrmsId} 
                    onChange={e => {
                      setPmeFormHrmsId(e.target.value);
                      const matched = pointsmen.find(x => x.hrmsId === e.target.value);
                      setPmeFormStatus(matched?.pmeStatus || "Fit");
                      setPmeFormDoneDate(matched?.pmeDoneDate || "");
                      setPmeFormDueDate(matched?.pmeDueDate || "");
                    }} 
                    style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600", width: "100%" }}
                    required
                  >
                    <option value="">{t("-- Choose Employee --")}</option>
                    {[...pointsmen].sort((a,b) => a.name.localeCompare(b.name)).map(emp => (
                      <option key={emp.hrmsId} value={emp.hrmsId}>{emp.name} ({emp.hrmsId} - {t(emp.designation)})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>{t("PME Status *")}</label>
                  <select 
                    value={pmeFormStatus} 
                    onChange={e => setPmeFormStatus(e.target.value)} 
                    style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600", width: "100%" }}
                    required
                  >
                    <option value="Fit">{t("Fit")}</option>
                    <option value="Unfit">{t("Unfit")}</option>
                    <option value="Pending">{t("Pending")}</option>
                    <option value="Overdue">{t("Overdue")}</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>{t("Done Date")}</label>
                    <input 
                      type="date" 
                      value={pmeFormDoneDate} 
                      onChange={e => setPmeFormDoneDate(e.target.value)} 
                      style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>{t("Due Date *")}</label>
                    <input 
                      type="date" 
                      value={pmeFormDueDate} 
                      onChange={e => setPmeFormDueDate(e.target.value)} 
                      style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button type="button" onClick={() => setShowPmeModal(false)} className="sdom-btn-secondary" style={{ height: "42px", padding: "0 20px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#334155", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>{t("Cancel")}</button>
                  <button type="submit" className="sdom-btn-primary" style={{ height: "42px", padding: "0 20px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>{t("Save PME Log")}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };


  /* ── REF COURSE ── */
  const renderRefCourse = () => {
    const REF_STATUSES = ["Completed", "Scheduled", "In Progress", "Pending", "Expired", "Cancelled"];

    const filtered = pointsmen.filter(emp => {
      const matchSearch = !refSearch ||
        emp.name.toLowerCase().includes(refSearch.toLowerCase()) ||
        emp.hrmsId.toLowerCase().includes(refSearch.toLowerCase());
      const matchStatus = refStatusFilter === "All" || emp.refStatus === refStatusFilter;
      return matchSearch && matchStatus;
    });

    const clearedCount = pointsmen.filter(e => e.refStatus === "Cleared" || e.refStatus === "Completed").length;
    const pendingCount = pointsmen.filter(e => e.refStatus === "Pending" || e.refStatus === "Scheduled" || e.refStatus === "In Progress").length;
    const expiredCount = pointsmen.filter(e => e.refStatus === "Expired" || e.refStatus === "Cancelled").length;

    const handleOpenRefModal = (hrmsId = "") => {
      setRefFormHrmsId(hrmsId);
      const matched = pointsmen.find(e => e.hrmsId === hrmsId);
      setRefFormStatus(matched?.refStatus || "Completed");
      setRefFormDate(matched?.refDoneDate || "");
      setRefFormNextDue(matched?.refDueDate || "");
      setRefFormRemarks("");
      setRefFormConductedBy(smName || "");
      setShowRefModal(true);
    };

    const handleRefSubmit = async (e) => {
      e.preventDefault();
      if (!refFormHrmsId) { alert(t("Please select a pointsman.")); return; }
      if (!refFormDate)    { alert(t("Please enter the REF training date.")); return; }
      const refData = {
        courseName:  "Refresher Course (REF)",
        refStatus:   refFormStatus,
        trainingDate: refFormDate,
        nextDueDate:  refFormNextDue || null,
        remarks:     refFormRemarks,
        conductedBy: refFormConductedBy || smName,
      };
      const result = await logSmRefRecord(refFormHrmsId, refData);
      if (result?.success) {
        setShowRefModal(false);
        setRefFormHrmsId(""); setRefFormStatus("Completed");
        setRefFormDate("");   setRefFormNextDue("");
        setRefFormRemarks(""); setRefFormConductedBy("");
      }
    };

    const refBadge = (s) => {
      const map = {
        Completed: "sdom-badge-success", Cleared: "sdom-badge-success",
        Scheduled: "sdom-badge-warning", "In Progress": "sdom-badge-warning", Pending: "sdom-badge-warning",
        Expired: "sdom-badge-danger", Cancelled: "sdom-badge-danger"
      };
      return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{t(s) || "N/A"}</span>;
    };

    return (
      <div className="sdom-fade" style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 className="sdom-page-title" style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>{t("REF Course Management")}</h1>
            <p className="sdom-page-subtitle" style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>{t("Schedule, conduct, and record Refresher Course (REF) training for Pointsmen at your station.")}</p>
          </div>
          <button
            onClick={() => handleOpenRefModal("")}
            style={{ height: "42px", display: "flex", alignItems: "center", gap: "8px", background: "#7c3aed", color: "white", padding: "0 20px", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
          >
            <Plus size={16}/> {t("Log REF Record")}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #16a34a" }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#16a34a" }}>{clearedCount} {t("staff")}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: "uppercase" }}>{t("REF Completed / Cleared")}</div>
          </div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #7c3aed" }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#7c3aed" }}>{pendingCount} {t("staff")}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: "uppercase" }}>{t("Scheduled / In Progress")}</div>
          </div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #dc2626" }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#dc2626" }}>{expiredCount} {t("staff")}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: "uppercase" }}>{t("Expired / Cancelled")}</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: "flex", gap: "16px", background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 2 }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>{t("Search Staff")}</label>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text" placeholder={t("Search by name or HRMS ID...")}
                value={refSearch} onChange={e => setRefSearch(e.target.value)}
                style={{ width: "100%", height: "42px", padding: "0 12px 0 36px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600", outline: "none" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>{t("REF Status")}</label>
            <select value={refStatusFilter} onChange={e => setRefStatusFilter(e.target.value)}
              style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}
            >
              <option value="All">{t("All Statuses")}</option>
              {REF_STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                {["Name", "HRMS ID", "Station", "REF Status", "Last REF Date", "Next Due Date", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.hrmsId} style={{ borderBottom: "1px solid #e8edf2" }}>
                  <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{emp.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", fontFamily: "monospace", color: "#475569" }}>{emp.hrmsId}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>{emp.stationName || emp.station || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px" }}>{refBadge(emp.refStatus)}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>{emp.refDoneDate || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#dc2626", fontWeight: "700" }}>{emp.refDueDate || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => handleOpenRefModal(emp.hrmsId)}
                      style={{ height: "30px", padding: "0 12px", borderRadius: "6px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                    >{t("Log REF")}</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>{t("No pointsmen matched your filters.")}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Log REF Modal */}
        {showRefModal && (
          <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e => e.target === e.currentTarget && setShowRefModal(false)}>
            <div className="sdom-modal" style={{ width: "520px", maxWidth: "95vw", padding: "28px", background: "white", borderRadius: "14px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{t("LOG REF COURSE RECORD")}</h3>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>{t("Refresher Course Training Record")}</p>
                </div>
                <button type="button" onClick={() => setShowRefModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>✕</button>
              </div>

              <form onSubmit={handleRefSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Staff Select */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>{t("Select Pointsman *")}</label>
                  <select value={refFormHrmsId}
                    onChange={e => {
                      setRefFormHrmsId(e.target.value);
                      const m = pointsmen.find(x => x.hrmsId === e.target.value);
                      setRefFormStatus(m?.refStatus || "Completed");
                    }}
                    style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600", width: "100%" }}
                    required
                  >
                    <option value="">{t("-- Choose Pointsman --")}</option>
                    {[...pointsmen].sort((a,b) => a.name.localeCompare(b.name)).map(emp => (
                      <option key={emp.hrmsId} value={emp.hrmsId}>{emp.name} ({emp.hrmsId})</option>
                    ))}
                  </select>
                </div>

                {/* REF Status */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>{t("REF Status *")}</label>
                  <select value={refFormStatus} onChange={e => setRefFormStatus(e.target.value)}
                    style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600", width: "100%" }}
                    required
                  >
                    {REF_STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
                  </select>
                </div>

                {/* Dates */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>{t("REF Training Date *")}</label>
                    <input type="date" value={refFormDate} onChange={e => setRefFormDate(e.target.value)}
                      style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>{t("Next REF Due Date")}</label>
                    <input type="date" value={refFormNextDue} onChange={e => setRefFormNextDue(e.target.value)}
                      style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </div>

                {/* Conducted By */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>{t("Conducted By")}</label>
                  <input type="text" value={refFormConductedBy} onChange={e => setRefFormConductedBy(e.target.value)}
                    placeholder={`${t("SM")}: ${smName}`}
                    style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}
                  />
                </div>

                {/* Remarks */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>{t("Remarks / Observations")}</label>
                  <textarea value={refFormRemarks} onChange={e => setRefFormRemarks(e.target.value)}
                    placeholder={t("Enter remarks about the REF training session...")}
                    style={{ minHeight: "80px", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontFamily: "inherit", resize: "vertical" }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button type="button" onClick={() => setShowRefModal(false)}
                    style={{ height: "42px", padding: "0 20px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#334155", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                  >{t("Cancel")}</button>
                  <button type="submit"
                    style={{ height: "42px", padding: "0 20px", background: "#7c3aed", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                  >{t("Save REF Record")}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── COUNSELLING & MONITORING MODULE ── */
  const renderCounselling = () => {
    const statuses = ["All", "Pending", "Scheduled", "Completed", "Absent"];

    // Filter queue
    const filteredQueue = counsellingQueue.filter(r => {
      const matchSearch = !counselSearch || 
        r.employeeName.toLowerCase().includes(counselSearch.toLowerCase()) ||
        r.employeeHrmsId.toLowerCase().includes(counselSearch.toLowerCase());
      
      const matchStatus = counselStatusFilter === "All" || r.status === counselStatusFilter;
      return matchSearch && matchStatus;
    });

    const handleOpenScheduleModal = (r) => {
      setCounselScheduleId(r.counselling_id);
      let parsed = {};
      try { if (r.remarks && r.remarks.trim().startsWith("{")) parsed = JSON.parse(r.remarks); } catch(_) {}
      setCounselScheduleDate(parsed.scheduledDate || "");
      setCounselScheduleTime(parsed.scheduledTime || "");
      setCounselScheduleRemarks(parsed.schedulingRemarks || "");
      setShowCounselScheduleModal(true);
    };

    const handleScheduleSubmit = async (e) => {
      e.preventDefault();
      if (!counselScheduleId) return;
      const res = await scheduleCounselling(counselScheduleId, counselScheduleDate, counselScheduleTime, counselScheduleRemarks);
      if (res?.success) {
        setShowCounselScheduleModal(false);
        setCounselScheduleId("");
        setCounselScheduleDate("");
        setCounselScheduleTime("");
        setCounselScheduleRemarks("");
      }
    };

    const handleOpenResultModal = (r) => {
      setCounselResultId(r.counselling_id);
      let parsed = {};
      try { if (r.remarks && r.remarks.trim().startsWith("{")) parsed = JSON.parse(r.remarks); } catch(_) {}
      setCounselAttendance("Present");
      setCounselObs(parsed.observations || "");
      setCounselSafety(parsed.safetyConcerns || "");
      setCounselBehavior(parsed.behaviouralConcerns || "");
      setCounselRecs(parsed.recommendations || "");
      setCounselFollowUp(parsed.followUpActions || "");
      setCounselAbsenceRemarks(parsed.absenceRemarks || "");
      setShowCounselResultModal(true);
    };

    const handleResultSubmit = async (e) => {
      e.preventDefault();
      if (!counselResultId) return;
      const remarksData = counselAttendance === "Present" ? {
        observations: counselObs,
        safetyConcerns: counselSafety,
        behaviouralConcerns: counselBehavior,
        recommendations: counselRecs,
        followUpActions: counselFollowUp
      } : {
        absenceRemarks: counselAbsenceRemarks
      };

      const res = await submitCounsellingResult(counselResultId, counselAttendance, remarksData);
      if (res?.success) {
        setShowCounselResultModal(false);
        setCounselResultId("");
        setCounselObs("");
        setCounselSafety("");
        setCounselBehavior("");
        setCounselRecs("");
        setCounselFollowUp("");
        setCounselAbsenceRemarks("");
      }
    };

    const handleOpenMonitoringModal = (r) => {
      setMonitoringHrmsId(r.employeeHrmsId);
      // Look up pointsman profile for current values
      const pm = pointsmen.find(x => x.hrmsId === r.employeeHrmsId) || {};
      setMonitoringStatusVal(pm.monitoringStatus || "Under Observation");
      setMonitoringRiskVal(pm.risk || "High");
      setMonitoringReviewText("");
      setMonitoringFollowUpDate("");
      setShowMonitoringModal(true);
    };

    const handleMonitoringSubmit = async (e) => {
      e.preventDefault();
      if (!monitoringHrmsId) return;
      const res = await submitMonitoringReview(monitoringHrmsId, {
        monitoringStatus: monitoringStatusVal,
        riskLevel: monitoringRiskVal,
        newReview: monitoringReviewText,
        followUpDate: monitoringFollowUpDate
      });
      if (res?.success) {
        setShowMonitoringModal(false);
        setMonitoringHrmsId("");
        setMonitoringReviewText("");
        setMonitoringFollowUpDate("");
      }
    };

    const counselBadge = (s) => {
      const map = {
        Pending: "sdom-badge-warning",
        Scheduled: "sdom-badge-info",
        Completed: "sdom-badge-success",
        Absent: "sdom-badge-danger"
      };
      return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{t(s)}</span>;
    };

    return (
      <div className="sdom-fade" style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 className="sdom-page-title" style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>{t("Safety Counselling Queue")}</h1>
            <p className="sdom-page-subtitle" style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>{t("Manage mandatory safety counselling and risk monitoring for Category D Pointsmen.")}</p>
          </div>
          <button
            onClick={() => setShowCounsellingStats(!showCounsellingStats)}
            style={{ height: "42px", display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0 16px", fontWeight: "700", cursor: "pointer", fontSize: "13px", color: "#334155" }}
          >
            {showCounsellingStats ? t("Hide Stats & Schedules") : t("Show Stats & Schedules")}
          </button>
        </div>

        {/* Counselling & Monitoring Stats Block */}
        {showCounsellingStats && counsellingQueue && (
          <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", padding: "20px", borderRadius: "12px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <ShieldAlert size={20} color="#dc2626" />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#991b1b" }}>{t("Safety Counselling & Category D Monitoring Stats")}</h3>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
              {[
                { label: "Total Category D Staff", val: pointsmen.filter(p => p.cat === 'D').length, bg: "#ffffff", border: "1px solid #fee2e2", color: "#dc2626" },
                { label: "Pending Counselling", val: counsellingQueue.filter(c => c.status === 'Pending').length, bg: "#ffffff", border: "1px solid #fee2e2", color: "#d97706" },
                { label: "Scheduled Counselling", val: counsellingQueue.filter(c => c.status === 'Scheduled').length, bg: "#ffffff", border: "1px solid #fee2e2", color: "#2563eb" },
                { label: "Completed Counselling", val: counsellingQueue.filter(c => c.status === 'Completed').length, bg: "#ffffff", border: "1px solid #fee2e2", color: "#16a34a" },
                { label: "Absent Staff Records", val: counsellingQueue.filter(c => c.status === 'Absent').length, bg: "#ffffff", border: "1px solid #fee2e2", color: "#9333ea" },
                { label: "Active Monitoring Cases", val: pointsmen.filter(p => p.monitoringStatus === "High Risk" || riskLevel(p) === "High" || p.cat === 'D').length, bg: "#ffffff", border: "1px solid #fee2e2", color: "#7f1d1d" }
              ].map((card, i) => (
                <div key={i} style={{ background: card.bg, border: card.border, padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: card.color }}>{card.val}</div>
                  <div style={{ fontSize: "10px", color: "#7f1d1d", fontWeight: "700", textTransform: "uppercase", marginTop: "4px", lineHeight: "1.2" }}>{t(card.label)}</div>
                </div>
              ))}
            </div>

            {/* Upcoming Review/Retest Dates */}
            {counsellingQueue.some(c => c.status === 'Scheduled') && (
              <div style={{ marginTop: "16px", background: "#ffffff", borderRadius: "8px", padding: "12px 16px", border: "1px solid #fee2e2" }}>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#991b1b", textTransform: "uppercase", marginBottom: "8px" }}>{t("Upcoming Session Schedule")}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {counsellingQueue.filter(c => c.status === 'Scheduled').map(c => {
                    let parsed = {};
                    try { if (c.remarks && c.remarks.trim().startsWith("{")) parsed = JSON.parse(c.remarks); } catch(_) {}
                    return (
                      <div key={c.counselling_id} style={{ fontSize: "12px", background: "#fef2f2", color: "#991b1b", padding: "6px 10px", borderRadius: "6px", border: "1px solid #fee2e2" }}>
                        <strong>{c.employeeName}</strong>: {parsed.scheduledDate} @ {parsed.scheduledTime}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Bar */}
        <div style={{ display: "flex", gap: "16px", background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 2 }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>{t("Search Pointsman")}</label>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text" placeholder={t("Search by name or HRMS ID...")}
                value={counselSearch} onChange={e => setCounselSearch(e.target.value)}
                style={{ width: "100%", height: "42px", padding: "0 12px 0 36px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600", outline: "none" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>{t("Counselling Status")}</label>
            <select value={counselStatusFilter} onChange={e => setCounselStatusFilter(e.target.value)}
              style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}
            >
              {statuses.map(s => <option key={s} value={s}>{s === "All" ? t("All Records") : t(s)}</option>)}
            </select>
          </div>
        </div>

        {/* Table Queue */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                {["Employee", "HRMS ID", "Trigger Assessment", "Latest Score", "Counselling Status", "Scheduled Date/Time", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontWeight: "700" }}>{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map(row => {
                let parsedRemarks = {};
                try { if (row.remarks && row.remarks.trim().startsWith("{")) parsedRemarks = JSON.parse(row.remarks); } catch(_) {}
                
                const score = row.assessment?.TEST_ATTEMPT?.[0]?.obtained_marks ?? "—";
                const type = row.assessment?.assessment_type ?? "Checklist Evaluation";
                
                return (
                  <tr key={row.counselling_id} style={{ borderBottom: "1px solid #e8edf2" }}>
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{row.employeeName}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontFamily: "monospace", color: "#475569" }}>{row.employeeHrmsId}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>{t(type)}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: "#dc2626" }}>{score}%</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px" }}>{counselBadge(row.status)}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>
                      {parsedRemarks.scheduledDate ? `${parsedRemarks.scheduledDate} ${parsedRemarks.scheduledTime || ""}` : t("Not Scheduled")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {(row.status === "Pending" || row.status === "Absent") && (
                          <button onClick={() => handleOpenScheduleModal(row)}
                            style={{ height: "30px", padding: "0 12px", borderRadius: "6px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                          >{t("Schedule")}</button>
                        )}
                        {row.status === "Scheduled" && (
                          <button onClick={() => handleOpenResultModal(row)}
                            style={{ height: "30px", padding: "0 12px", borderRadius: "6px", background: "#7c3aed", color: "white", border: "none", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                          >{t("Conduct Session")}</button>
                        )}
                        <button onClick={() => setSelectedCounselRecord(row)}
                          style={{ height: "30px", padding: "0 12px", borderRadius: "6px", background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                        >{t("Details")}</button>
                        {row.status === "Completed" && (
                          <button onClick={() => handleOpenMonitoringModal(row)}
                            style={{ height: "30px", padding: "0 12px", borderRadius: "6px", background: "#059669", color: "white", border: "none", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                          >{t("Monitor")}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredQueue.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>{t("No pointsmen in counselling queue.")}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Schedule Session Modal */}
        {showCounselScheduleModal && (
          <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={() => setShowCounselScheduleModal(false)}>
            <div className="sdom-modal" style={{ width: "450px", padding: "24px" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{t("Schedule Counselling Session")}</h3>
                <button type="button" onClick={() => setShowCounselScheduleModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
              </div>
              <form onSubmit={handleScheduleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Date *")}</label>
                  <input type="date" value={counselScheduleDate} onChange={e => setCounselScheduleDate(e.target.value)}
                    style={{ height: "40px", padding: "0 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} required />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Time *")}</label>
                  <input type="time" value={counselScheduleTime} onChange={e => setCounselScheduleTime(e.target.value)}
                    style={{ height: "40px", padding: "0 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} required />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Remarks / Preparation Instructions")}</label>
                  <textarea value={counselScheduleRemarks} onChange={e => setCounselScheduleRemarks(e.target.value)}
                    placeholder={t("Enter initial details for the pointsman...")}
                    style={{ minHeight: "80px", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button type="button" onClick={() => setShowCounselScheduleModal(false)} className="sdom-btn-outline" style={{ height: "40px" }}>{t("Cancel")}</button>
                  <button type="submit" className="sdom-btn-primary" style={{ height: "40px", background: "#7c3aed" }}>{t("Save Schedule")}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Conduct/Result Modal */}
        {showCounselResultModal && (
          <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={() => setShowCounselResultModal(false)}>
            <div className="sdom-modal" style={{ width: "550px", padding: "24px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{t("Counselling Session Attendance & Observations")}</h3>
                <button type="button" onClick={() => setShowCounselResultModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
              </div>
              <form onSubmit={handleResultSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Mark Attendance *")}</label>
                  <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                      <input type="radio" name="attendance" value="Present" checked={counselAttendance === "Present"} onChange={() => setCounselAttendance("Present")} />
                      {t("Present")}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                      <input type="radio" name="attendance" value="Absent" checked={counselAttendance === "Absent"} onChange={() => setCounselAttendance("Absent")} />
                      {t("Absent")}
                    </label>
                  </div>
                </div>

                {counselAttendance === "Present" ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("General Observations *")}</label>
                      <textarea value={counselObs} onChange={e => setCounselObs(e.target.value)} required
                        placeholder={t("Detailed observations during session...")}
                        style={{ minHeight: "60px", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "inherit" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Safety Concerns Identified *")}</label>
                      <textarea value={counselSafety} onChange={e => setCounselSafety(e.target.value)} required
                        placeholder={t("List of safety mistakes or logic slips...")}
                        style={{ minHeight: "60px", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "inherit" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Behavioural Concerns")}</label>
                      <textarea value={counselBehavior} onChange={e => setCounselBehavior(e.target.value)}
                        placeholder={t("Comportment, response to instruction...")}
                        style={{ minHeight: "60px", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "inherit" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Improvement Recommendations *")}</label>
                      <textarea value={counselRecs} onChange={e => setCounselRecs(e.target.value)} required
                        placeholder={t("Yard practice, mentoring steps...")}
                        style={{ minHeight: "60px", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "inherit" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Follow-up Actions")}</label>
                      <textarea value={counselFollowUp} onChange={e => setCounselFollowUp(e.target.value)}
                        placeholder={t("Scheduled assessments, review checks...")}
                        style={{ minHeight: "60px", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "inherit" }} />
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Absence Details / Audit Reason *")}</label>
                    <textarea value={counselAbsenceRemarks} onChange={e => setCounselAbsenceRemarks(e.target.value)} required
                      placeholder={t("Why did the employee fail to attend the session?...")}
                      style={{ minHeight: "100px", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "inherit" }} />
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button type="button" onClick={() => setShowCounselResultModal(false)} className="sdom-btn-outline" style={{ height: "40px" }}>{t("Cancel")}</button>
                  <button type="submit" className="sdom-btn-primary" style={{ height: "40px", background: "#7c3aed" }}>{t("Save Details")}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Monitoring Modal */}
        {showMonitoringModal && (
          <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={() => setShowMonitoringModal(false)}>
            <div className="sdom-modal" style={{ width: "480px", padding: "24px" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{t("Safety Monitoring Review")}</h3>
                <button type="button" onClick={() => setShowMonitoringModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
              </div>
              <form onSubmit={handleMonitoringSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Monitoring Status")}</label>
                  <select value={monitoringStatusVal} onChange={e => setMonitoringStatusVal(e.target.value)}
                    style={{ height: "40px", padding: "0 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "600" }}
                  >
                    <option value="Under Observation">{t("Under Observation")}</option>
                    <option value="Suspended">{t("Suspended")}</option>
                    <option value="Completed">{t("Completed / Fit for Duty")}</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Risk Level")}</label>
                  <select value={monitoringRiskVal} onChange={e => setMonitoringRiskVal(e.target.value)}
                    style={{ height: "40px", padding: "0 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "600" }}
                  >
                    <option value="High">{t("High Risk")}</option>
                    <option value="Medium">{t("Medium Risk")}</option>
                    <option value="Low">{t("Low Risk")}</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Next Review Follow-up Date")}</label>
                  <input type="date" value={monitoringFollowUpDate} onChange={e => setMonitoringFollowUpDate(e.target.value)}
                    style={{ height: "40px", padding: "0 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>{t("Review History Remarks *")}</label>
                  <textarea value={monitoringReviewText} onChange={e => setMonitoringReviewText(e.target.value)} required
                    placeholder={t("Enter details of field safety check...")}
                    style={{ minHeight: "80px", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button type="button" onClick={() => setShowMonitoringModal(false)} className="sdom-btn-outline" style={{ height: "40px" }}>{t("Cancel")}</button>
                  <button type="submit" className="sdom-btn-primary" style={{ height: "40px", background: "#059669" }}>{t("Save Review")}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detailed View Modal */}
        {selectedCounselRecord && (
          <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={() => setSelectedCounselRecord(null)}>
            <div className="sdom-modal" style={{ width: "620px", padding: "24px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{t("Safety Counselling File")}</h3>
                <button type="button" onClick={() => setSelectedCounselRecord(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
              </div>

              {/* Employee Bio */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>{t("Employee Name")}</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>{selectedCounselRecord.employeeName}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>{t("HRMS ID")}</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", fontFamily: "monospace" }}>{selectedCounselRecord.employeeHrmsId}</div>
                </div>
              </div>

              {/* Session Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>{t("Session State")}</h4>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "10px 14px", background: "#f8fafc", width: "40%", fontWeight: "700" }}>{t("Current Status")}</td>
                        <td style={{ padding: "10px 14px" }}>{counselBadge(selectedCounselRecord.status)}</td>
                      </tr>
                      {(() => {
                        let parsed = {};
                        try { if (selectedCounselRecord.remarks && selectedCounselRecord.remarks.trim().startsWith("{")) parsed = JSON.parse(selectedCounselRecord.remarks); } catch(_) {}
                        return (
                          <>
                            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={{ padding: "10px 14px", background: "#f8fafc", fontWeight: "700" }}>{t("Scheduled Date & Time")}</td>
                              <td style={{ padding: "10px 14px" }}>
                                {parsed.scheduledDate ? `${parsed.scheduledDate} ${parsed.scheduledTime || ""}` : t("Not Scheduled")}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={{ padding: "10px 14px", background: "#f8fafc", fontWeight: "700" }}>{t("Counsellor (SM)")}</td>
                              <td style={{ padding: "10px 14px" }}>
                                {selectedCounselRecord.counsellorName} ({selectedCounselRecord.counsellorHrmsId})
                              </td>
                            </tr>
                            {parsed.schedulingRemarks && (
                              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                <td style={{ padding: "10px 14px", background: "#f8fafc", fontWeight: "700" }}>{t("Initial Instructions")}</td>
                                <td style={{ padding: "10px 14px", color: "#475569" }}>{parsed.schedulingRemarks}</td>
                              </tr>
                            )}
                            {parsed.observations && (
                              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                <td style={{ padding: "10px 14px", background: "#f8fafc", fontWeight: "700" }}>{t("General Observations")}</td>
                                <td style={{ padding: "10px 14px", color: "#0f172a" }}>{parsed.observations}</td>
                              </tr>
                            )}
                            {parsed.safetyConcerns && (
                              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                <td style={{ padding: "10px 14px", background: "#f8fafc", fontWeight: "700" }}>{t("Safety Concerns")}</td>
                                <td style={{ padding: "10px 14px", color: "#dc2626", fontWeight: "600" }}>{parsed.safetyConcerns}</td>
                              </tr>
                            )}
                            {parsed.behaviouralConcerns && (
                              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                <td style={{ padding: "10px 14px", background: "#f8fafc", fontWeight: "700" }}>{t("Behavioural Remarks")}</td>
                                <td style={{ padding: "10px 14px", color: "#475569" }}>{parsed.behaviouralConcerns}</td>
                              </tr>
                            )}
                            {parsed.recommendations && (
                              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                <td style={{ padding: "10px 14px", background: "#f8fafc", fontWeight: "700" }}>{t("Recommendations")}</td>
                                <td style={{ padding: "10px 14px", color: "#2563eb", fontWeight: "600" }}>{parsed.recommendations}</td>
                              </tr>
                            )}
                            {parsed.followUpActions && (
                              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                <td style={{ padding: "10px 14px", background: "#f8fafc", fontWeight: "700" }}>{t("Follow-up Steps")}</td>
                                <td style={{ padding: "10px 14px", color: "#16a34a", fontWeight: "600" }}>{parsed.followUpActions}</td>
                              </tr>
                            )}
                            {parsed.absenceRemarks && (
                              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                <td style={{ padding: "10px 14px", background: "#f8fafc", fontWeight: "700" }}>{t("Absence Remarks")}</td>
                                <td style={{ padding: "10px 14px", color: "#dc2626" }}>{parsed.absenceRemarks}</td>
                              </tr>
                            )}
                            {parsed.reschedules && parsed.reschedules.length > 0 && (
                              <tr>
                                <td style={{ padding: "10px 14px", background: "#f8fafc", fontWeight: "700" }}>{t("Audit Reschedule History")}</td>
                                <td style={{ padding: "10px 14px" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {parsed.reschedules.map((res, index) => (
                                      <div key={index} style={{ fontSize: "11px", border: "1px solid #fee2e2", background: "#fff5f5", padding: "6px", borderRadius: "4px" }}>
                                        <strong>{t("Reschedule")} #{index + 1}</strong>: {t("Missed Date")}: {res.date} @ {res.time}
                                        <div style={{ color: "#7f1d1d", marginTop: "2px" }}>{t("Reason")}: {res.absenceRemarks}</div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button className="sdom-btn-primary" onClick={() => setSelectedCounselRecord(null)}>{t("Close")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ─── Dispatcher ─── */
  const renderContent = () => {
    if (pageMode === "takeTest") return renderTakeTest();

    switch (activeTab) {
      case "dashboard":    return renderDashboard();
      case "profile":      return renderProfile();
      case "pointsmen":    return renderPointsmen();
      case "assess":       return renderAssess();
      case "myAssessment": return renderMyAssessment();
      case "reports":      return renderReports();
      case "pmePosition":  return renderPmePosition();
      case "refCourse":    return renderRefCourse();
      case "counselling":  return renderCounselling();
      default: return renderDashboard();
    }
  };

  /* ─── Shell ─── */
  return (
    <div className="sm2-layout">
      <input type="checkbox" id="sdom-sidebar-toggle" className="sdom-sidebar-checkbox" style={{ display: "none" }} />
      <label htmlFor="sdom-sidebar-toggle" className="sdom-sidebar-close-backdrop"></label>
      <header className="sm2-topbar">
        <label htmlFor="sdom-sidebar-toggle" className="sdom-sidebar-toggle-btn" style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", background: "none", border: "none", color: "#ffffff", marginRight: "12px" }}>
          &#9776;
        </label>
        <div className="sm2-topbar-brand">
          <div className="sm2-topbar-logo" style={{ background: "#1E3A5F", color: "#ffffff", fontWeight: "800", fontSize: "0.95rem", padding: "0" }}><img src="/logo.webp" alt="IR Logo" style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }} /></div>
          <div>
            <h1>{t("Indian Railway Evaluation System")}</h1>
            <p>{t("Station Master")}<span className="desktop-only-txt"> Module</span></p>
          </div>
        </div>
        <div className="sm2-user-strip" style={{ gap: "12px", alignItems: "center" }}>
          <LanguageSelector />
          <div className="sm2-user-avatar">{smName.charAt(0)}</div>
          <div>
            <strong>{smName}</strong>
            <span>{smId}</span>
          </div>
          <button className="sm2-logout-btn" onClick={onLogout}>
            <LogOut size={15}/> {t("Logout")}
          </button>
        </div>
      </header>

      <div className="sm2-shell">
        <aside className="sm2-sidebar">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.key}
                className={`sm2-nav-item ${activeTab === item.key ? "active" : ""}`}
                onClick={() => switchTab(item.key)}>
                <Icon size={17}/>
                <span>{t(item.label)}</span>
              </button>
            );
          })}
        </aside>

        <main className="sm2-main">
          {statusMsg && (
            <div className="sm2-status-banner">
              <CheckCircle2 size={14}/> {statusMsg}
              <button className="sm2-dismiss" onClick={() => setStatusMsg("")}>×</button>
            </div>
          )}
            <div className="sm2-page-wrap">
              {renderContent()}
            </div>
          </main>
        </div>

        {/* ══════════════════════════════════════════
            FULLSCREEN ANALYTICS MODAL
        ══════════════════════════════════════════ */}
        {fullscreenChart && (
          <div className="sm2-fullscreen-modal">
            {/* ── Modal Header ── */}
            <div className="sm2-fullscreen-header">
              <div style={{ display: "flex", alignItems: 12, gap: 12 }}>
                <div className="sm2-fullscreen-icon-wrap">
                  {fullscreenChart === "monthly"     && <TrendingUp size={18} color="#93c5fd"/>}
                  {fullscreenChart === "safety"      && <Activity   size={18} color="#a78bfa"/>}
                  {fullscreenChart === "performance" && <BarChart3  size={18} color="#34d399"/>}
                </div>
                <div>
                  <h2>
                    {fullscreenChart === "monthly"     && t("Monthly Assessment Trend — Deep Dive")}
                    {fullscreenChart === "safety"      && t("Safety Compliance Trend — Deep Dive")}
                    {fullscreenChart === "performance" && t("Performance Distribution — Deep Dive")}
                  </h2>
                  <p>
                    {t("Indian Railway Evaluation System · Station Master Analytics")}
                  </p>
                </div>
              </div>
              <button className="sm2-fullscreen-close-btn" onClick={() => setFullscreenChart(null)}>
                ✕ {t("Close")}
              </button>
            </div>

            {/* ── Filter Bar ── */}
            <div className="sm2-fullscreen-filter-bar">
              <span className="sm2-fs-filter-tag">{t("FILTERS")}</span>
              <input
                type="text" placeholder={t("Search staff name / HRMS…")}
                value={fsSearch} onChange={e => setFsSearch(e.target.value)}
                className="sm2-fs-input"
              />
              <input type="date" value={fsStartDate} onChange={e => setFsStartDate(e.target.value)} className="sm2-fs-input" />
              <span className="sm2-fs-label">{t("to")}</span>
              <input type="date" value={fsEndDate} onChange={e => setFsEndDate(e.target.value)} className="sm2-fs-input" />
              <select value={fsCategory} onChange={e => setFsCategory(e.target.value)} className="sm2-fs-select">
                <option value="All">{t("All Categories")}</option>
                <option value="A">{t("Category A")}</option>
                <option value="B">{t("Category B")}</option>
                <option value="C">{t("Category C")}</option>
                <option value="D">{t("Category D")}</option>
              </select>
              <select value={fsRisk} onChange={e => setFsRisk(e.target.value)} className="sm2-fs-select">
                <option value="All">{t("All Risks")}</option>
                <option value="Low">{t("Low Risk")}</option>
                <option value="Medium">{t("Medium Risk")}</option>
                <option value="High">{t("High Risk")}</option>
              </select>
              <button onClick={() => { setFsSearch(""); setFsStartDate(""); setFsEndDate(""); setFsCategory("All"); setFsRisk("All"); }} className="sm2-fs-reset-btn">
                {t("Reset")}
              </button>
              <div className="sm2-fs-counter">
                {t("Showing")} <strong>{filteredFsPointsmen.length}</strong> {t("of")} {pointsmen.length} {t("staff")}
              </div>
            </div>

            {/* ── Main Content ── */}
            <div className="sm2-fullscreen-content">

              {/* KPI Summary Row */}
              <div className="sm2-fs-kpi-row">
                {[
                  { label: "Avg Score", value: filteredFsPointsmen.length ? Math.round(filteredFsPointsmen.reduce((s,p)=>s+p.lastScore,0)/filteredFsPointsmen.length) + "/100" : "—", color: "#60a5fa", glowColor: "rgba(96,165,250,0.15)" },
                  { label: "Avg Safety", value: filteredFsPointsmen.length ? Math.round(filteredFsPointsmen.reduce((s,p)=>s+p.safetyScore,0)/filteredFsPointsmen.length) + "/100" : "—", color: "#a78bfa", glowColor: "rgba(167,139,250,0.15)" },
                  { label: "High Risk", value: filteredFsPointsmen.filter(p=>riskLevel(p)==="High").length, color: "#f87171", glowColor: "rgba(248,113,113,0.15)" },
                  { label: "Cat A Staff", value: filteredFsPointsmen.filter(p=>p.cat==="A").length, color: "#34d399", glowColor: "rgba(52,211,153,0.15)" },
                  { label: "Fit (PME)", value: filteredFsPointsmen.filter(p=>p.pmeStatus==="Fit").length, color: "#fbbf24", glowColor: "rgba(251,191,36,0.15)" },
                ].map(k => (
                  <div key={k.label} className="sm2-fs-kpi-card" style={{ "--glow": k.glowColor }}>
                    <div className="sm2-fs-kpi-value" style={{ color: k.color }}>{k.value}</div>
                    <div className="sm2-fs-kpi-label">{t(k.label)}</div>
                  </div>
                ))}
              </div>

              {/* Large Chart */}
              <div className="sm2-fs-chart-container">
                <h3>
                  {fullscreenChart === "monthly"     && `📈 ${t("Monthly Avg Score & Assessment Volume")}`}
                  {fullscreenChart === "safety"      && `🛡️ ${t("Monthly Safety Compliance Avg (%)")}`}
                  {fullscreenChart === "performance" && `🏅 ${t("Staff Category Distribution")}`}
                </h3>
                <div className="sm2-fs-chart-wrapper">
                  <ResponsiveContainer width="100%" height={320}>
                    {fullscreenChart === "monthly" ? (
                      <LineChart data={dynamicMonthlyTrend} margin={{top:10,right:30,left:-10,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/>
                        <XAxis dataKey="month" tick={{fontSize:12,fill:"#64748b"}} stroke="rgba(0,0,0,0.1)"/>
                        <YAxis tick={{fontSize:12,fill:"#64748b"}} stroke="rgba(0,0,0,0.1)"/>
                        <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #cbd5e1",borderRadius:8,color:"#0f172a",fontSize:12}}/>
                        <Legend wrapperStyle={{fontSize:12,color:"#4b5563"}}/>
                        <Line type="monotone" dataKey="avgScore" name={t("Avg Score")} stroke="#2563eb" strokeWidth={3} dot={{r:5,fill:"#2563eb"}} activeDot={{r:7}}/>
                        <Line type="monotone" dataKey="assessments" name={t("Assessments")} stroke="#16a34a" strokeWidth={2.5} dot={{r:4,fill:"#16a34a"}} strokeDasharray="6 3"/>
                      </LineChart>
                    ) : fullscreenChart === "safety" ? (
                      <BarChart data={dynamicMonthlyTrend} margin={{top:10,right:30,left:-10,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/>
                        <XAxis dataKey="month" tick={{fontSize:12,fill:"#64748b"}} stroke="rgba(0,0,0,0.1)"/>
                        <YAxis domain={[0,100]} tick={{fontSize:12,fill:"#64748b"}} stroke="rgba(0,0,0,0.1)"/>
                        <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #cbd5e1",borderRadius:8,color:"#0f172a",fontSize:12}}/>
                        <Legend wrapperStyle={{fontSize:12,color:"#4b5563"}}/>
                        <Bar dataKey="safetyAvg" name={t("Safety Avg %")} fill="#7c3aed" radius={[6,6,0,0]}/>
                        <Bar dataKey="avgScore"  name={t("Score Avg %")}  fill="#2563eb" radius={[6,6,0,0]}/>
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={(() => {
                            const counts = {A:0,B:0,C:0,D:0};
                            filteredFsPointsmen.forEach(p => { counts[p.cat || "Untested"]++; });
                            return Object.entries(counts).filter(([,c])=>c>0).map(([cat,count])=>({name:`${t("Cat.")} ${cat}`,value:count}));
                          })()}
                          cx="50%" cy="50%" innerRadius={90} outerRadius={140}
                          dataKey="value" paddingAngle={4}
                        >
                          {["#2563eb","#16a34a","#f59e0b","#dc2626"].map((c,i) => <Cell key={i} fill={c}/>)}
                        </Pie>
                        <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #cbd5e1",borderRadius:8,color:"#0f172a",fontSize:12}}/>
                        <Legend wrapperStyle={{fontSize:13,color:"#4b5563"}} iconType="circle" iconSize={10}/>
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Low Performers Deep-Dive Table */}
              <div className="sm2-fs-low-perf-section">
                <h3>
                  <span style={{color:"#f87171",marginRight:6}}>⚠</span> {t("Low Performing Staff — Direct Intervention Required")}
                </h3>
                <div className="sm2-fs-grid">
                  {[...filteredFsPointsmen]
                    .sort((a,b)=>a.lastScore-b.lastScore)
                    .slice(0,6)
                    .map(p => {
                      const cat  = p.cat;
                      const risk = riskLevel(p);
                      const rColor = risk==="High"?"#f87171":risk==="Medium"?"#fbbf24":risk==="Untested"?"#94a3b8":"#34d399";
                      return (
                        <div key={p.id} className="sm2-fs-card" style={{ "--border-color": rColor }} onClick={() => {
                          setFullscreenChart(null);
                          openPmDetail(p);
                          setActiveTab("pointsmen");
                        }}>
                          <div className="sm2-fs-card-header">
                            <div>
                              <div className="sm2-fs-card-name">{p.name}</div>
                              <div className="sm2-fs-card-id">{p.hrmsId}</div>
                            </div>
                            <span className="sm2-fs-card-cat" style={{ background: CAT_BG[cat] || "#f1f5f9", color: CAT_COLOR[cat] || "#64748b" }}>
                              {cat === "Untested" ? t("Untested") : `${t("Cat.")} ${cat}`}
                            </span>
                          </div>
                          <div className="sm2-fs-card-meta-row">
                            <span className="sm2-fs-card-risk-badge" style={{
                              background: risk==="High"?"rgba(248,113,113,0.15)":risk==="Medium"?"rgba(251,191,36,0.15)":"rgba(52,211,153,0.15)",
                              color: rColor
                            }}>{t(risk)} {t("Risk")}</span>
                            <span className="sm2-fs-card-incident-lbl">{p.incidents} {p.incidents === 1 ? t("incident") : t("incidents")}</span>
                          </div>
                          <div className="sm2-fs-card-progress-item">
                            <div className="sm2-fs-card-progress-lbl">
                              <span>{t("Score")}</span>
                              <span style={{color:p.lastScore<50?"#f87171":"#fbbf24"}}>{p.lastScore}/100</span>
                            </div>
                            <div className="sm2-fs-card-progress-track">
                              <div className="sm2-fs-card-progress-bar" style={{ width: `${p.lastScore}%`, background: p.lastScore<50?"#f87171":"#fbbf24" }}/>
                            </div>
                          </div>
                          <div className="sm2-fs-card-progress-item" style={{ marginTop: 10 }}>
                            <div className="sm2-fs-card-progress-lbl">
                              <span>{t("Safety Score")}</span>
                              <span style={{color:p.safetyScore<60?"#f87171":"#a78bfa"}}>{p.safetyScore}/100</span>
                            </div>
                            <div className="sm2-fs-card-progress-track">
                              <div className="sm2-fs-card-progress-bar" style={{ width: `${p.safetyScore}%`, background: p.safetyScore<60?"#f87171":"#a78bfa" }}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {filteredFsPointsmen.length === 0 && (
                  <p style={{color:"#64748b",fontSize:13,gridColumn:"1/-1",textAlign:"center",padding:"24px 0"}}>{t("No staff match the current filters.")}</p>
                )}
              </div>
            </div>

          </div>{/* end content */}
        </div>
      )}
      {renderPointsmenModal()}
    </div>
  );
}

export default StationMasterModule;
