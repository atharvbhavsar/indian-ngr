import { useState, useMemo, useEffect } from 'react';
import { MONTHLY_TREND, ASSESSMENT_MONTHLY, COMPLIANCE, CAT_COLORS, RISK_COLORS, STATUS_COLORS, generate96Stations, DASHBOARD_96_STATIONS, stationProgressData, categoryData, sidebarItems, summaryCards, designationOptions, departmentOptions, userTypeOptions, reportingOfficerOptions, aomReadOnlyProfile, initialUserFormData, initialFilterData, stationZoneOptions, stationDivisionOptions, stationCategoryOptions, stationTypeOptions, initialStationFormData, initialStationFilterData, initialStations, tiCategoryOptions, tiAssessmentStatusOptions, initialTrafficInspectors, hrmsTiDirectory, initialTiFormData, stationAverageScoreData, initialPendingAssessments, initialApprovedAssessments, initialReportRows, assessmentCriteria } from '../constants/aomMockData';
import {
  Activity, AlertCircle, AlertTriangle, ArrowRightLeft, ArrowLeft, BarChart3, Building2, BusFront,
  ClipboardCheck, Eye, ExternalLink, Filter, Cog, FileCheck, FileDown, FileText, FileBarChart2,
  LayoutDashboard, Lock, LogOut, PlusCircle, Plus, Search, ShieldCheck, Star, UserCheck, UserPlus,
  UserRoundSearch, Users, Edit, Trash2, TrendingUp, UserRound, TrainFront, CheckCircle, Clock, XCircle,
  MapPin, Phone, Calendar, Award, Globe, Tag, GitBranch, Cpu, Layers, Zap, Mail, AlignJustify, Gauge, UserCircle2
} from 'lucide-react';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, CartesianGrid, LabelList } from 'recharts';
import { saDataService } from '../services/saDataService';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { TI_SM_CRITERIA, TI_SS_CRITERIA, TI_TM_CRITERIA } from '../constants/trafficInspectorConstants';
import { monitoringService } from '../services/monitoringService';
import { SAStaffModal } from '../components/super-admin/SAStaffModal';
import { SAStationDetail } from '../components/super-admin/views/SAStationDetail';
import { SAStationDirectory } from '../components/super-admin/views/SAStationDirectory';

export function useAomState(user, onLogout) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [pmModal, setPmModal] = useState(null);
  const [pmF, setPmF] = useState({ name: "", station: "All", cat: "All", risk: "All" });

  const [allDbAssessments, setAllDbAssessments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedHrmsIds, setSelectedHrmsIds] = useState([]);
  const [viewUpcomingOnly, setViewUpcomingOnly] = useState(false);

  const openPmAdd = () => {
    setPmModal({
      mode: "add",
      role: "pointsmen",
      data: {
        id: `PM_${Date.now().toString().slice(-4)}`,
        name: "",
        contact: "",
        email: "",
        password: "",
        division: "Nagpur",
        smDivision: "Nagpur",
        zone: "Central Railway",
        smZone: "Central Railway",
        station: stations[0]?.name || "Nagpur Junction",
        smStation: stations[0]?.name || "Nagpur Junction",
        cat: "A",
        reportingSm: "",
        workLocation: "",
        shift: "",
        lastDate: new Date().toISOString().split('T')[0]
      }
    });
  };

  const openPmEdit = (pm) => {
    setPmModal({
      mode: "edit",
      role: "pointsmen",
      data: {
        ...pm,
        id: pm.hrmsId || pm.id,
        station: pm.station || pm.stationName,
        smStation: pm.station || pm.stationName
      }
    });
  };

  const openPmShift = (pm) => {
    setPmModal({
      mode: "shift",
      role: "pointsmen",
      data: {
        ...pm,
        id: pm.hrmsId || pm.id,
        station: pm.station || pm.stationName,
        smStation: pm.station || pm.stationName
      }
    });
  };

  const savePmModal = async () => {
    if (!pmModal.data.name || !pmModal.data.id) {
      alert("Name and HRMS ID are required.");
      return;
    }
    try {
      const data = pmModal.data;
      const modalData = {
        id: data.id,
        name: data.name,
        contact: data.contact,
        email: data.email,
        password: data.password,
        role: pmModal.mode === "shift" ? pmModal.role : "Pointsman",
        station: data.station || data.smStation,
        division: data.division || data.smDivision,
        lastDate: data.lastDate || new Date().toISOString().split('T')[0],
        score: data.score !== undefined ? data.score : 80,
        cat: data.cat || "A",
        reportingSm: data.reportingSm || "",
        workLocation: data.workLocation || "",
        shift: data.shift || "",
        jurisdiction: data.jurisdiction || "",
        pmeStatus: data.pmeStatus || "Fit",
        refStatus: data.refStatus || "Cleared"
      };
      await saDataService.saveUser(modalData, pmModal.mode);
      setPmModal(null);
      await fetchLiveDatabaseData();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const removePm = async (id) => {
    if (window.confirm("Remove this Pointsman?")) {
      try {
        await saDataService.removeUser(id);
        await fetchLiveDatabaseData();
      } catch (err) {
        alert("Error removing: " + err.message);
      }
    }
  };

  const openSmAdd = () => {
    setSmModal({
      mode: "add",
      role: "sm",
      data: {
        id: `SM_${Date.now().toString().slice(-4)}`,
        name: "",
        contact: "",
        email: "",
        password: "",
        division: "Nagpur",
        smDivision: "Nagpur",
        zone: "Central Railway",
        smZone: "Central Railway",
        station: stations[0]?.name || "Nagpur Junction",
        smStation: stations[0]?.name || "Nagpur Junction",
        cat: "A",
        lastDate: new Date().toISOString().split('T')[0]
      }
    });
  };

  const openSmEdit = (sm) => {
    setSmModal({
      mode: "edit",
      role: "sm",
      data: {
        ...sm,
        id: sm.hrmsId || sm.id,
        station: sm.station || sm.stationName,
        smStation: sm.station || sm.stationName,
        division: sm.division,
        smDivision: sm.division,
        zone: sm.zone,
        smZone: sm.zone
      }
    });
  };

  const openSmShift = (sm) => {
    setSmModal({
      mode: "shift",
      role: "sm",
      data: {
        ...sm,
        id: sm.hrmsId || sm.id,
        station: sm.station || sm.stationName,
        smStation: sm.station || sm.stationName,
        division: sm.division,
        smDivision: sm.division,
        zone: sm.zone,
        smZone: sm.zone
      }
    });
  };

  const saveSmModal = async () => {
    if (!smModal.data.name || !smModal.data.id) {
      alert("Name and HRMS ID are required.");
      return;
    }
    try {
      const data = smModal.data;
      const modalData = {
        id: data.id,
        name: data.name,
        contact: data.contact,
        email: data.email,
        password: data.password,
        role: smModal.mode === "shift" ? smModal.role : "Station Master",
        station: data.station || data.smStation,
        division: data.division || data.smDivision,
        lastDate: data.lastDate || new Date().toISOString().split('T')[0],
        score: data.score !== undefined ? data.score : 80,
        cat: data.cat || "A",
        reportingSm: data.reportingSm || "",
        workLocation: data.workLocation || "",
        shift: data.shift || "",
        jurisdiction: data.jurisdiction || ""
      };
      await saDataService.saveUser(modalData, smModal.mode);
      setSmModal(null);
      await fetchLiveDatabaseData();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const removeSm = async (id) => {
    if (window.confirm("Remove this Station Master?")) {
      try {
        await saDataService.removeUser(id);
        await fetchLiveDatabaseData();
      } catch (err) {
        alert("Error removing: " + err.message);
      }
    }
  };

  const openTiAdd = () => {
    setTiModal({
      mode: "add",
      role: "ti",
      data: {
        id: `TI_${Date.now().toString().slice(-4)}`,
        name: "",
        contact: "",
        email: "",
        password: "",
        division: "Nagpur",
        smDivision: "Nagpur",
        zone: "Central Railway",
        smZone: "Central Railway",
        station: stations[0]?.name || "Nagpur Junction",
        smStation: stations[0]?.name || "Nagpur Junction",
        cat: "A",
        jurisdiction: "",
        linkedStations: "",
        lastDate: new Date().toISOString().split('T')[0]
      }
    });
  };

  const openTiEdit = (ti) => {
    setTiModal({
      mode: "edit",
      role: "ti",
      data: {
        ...ti,
        id: ti.employeeId || ti.hrmsId || ti.id,
        station: ti.station || ti.stationName,
        smStation: ti.station || ti.stationName,
        division: ti.division,
        smDivision: ti.division,
        zone: ti.zone,
        smZone: ti.zone,
        contact: ti.contact || ti.phone || ti.contactNumber,
        email: ti.email || ti.emailId
      }
    });
  };

  const removeTi = async (id) => {
    if (window.confirm("Remove this Traffic Inspector?")) {
      try {
        await saDataService.removeUser(id);
        await fetchLiveDatabaseData();
      } catch (err) {
        alert("Error removing: " + err.message);
      }
    }
  };

  const saveTiModal = async () => {
    if (!tiModal.data.name || !tiModal.data.id) {
      alert("Name and Employee ID are required.");
      return;
    }
    try {
      const data = tiModal.data;
      const modalData = {
        id: data.id,
        name: data.name,
        contact: data.contact,
        email: data.email,
        password: data.password,
        role: "Traffic Inspector",
        station: data.station || data.smStation,
        division: data.division || data.smDivision,
        lastDate: data.lastDate || new Date().toISOString().split('T')[0],
        score: data.score !== undefined ? data.score : 85,
        cat: data.cat || "A",
        reportingSm: data.reportingSm || "",
        workLocation: data.workLocation || "",
        shift: data.shift || "",
        jurisdiction: data.jurisdiction || "",
        linkedStations: data.linkedStations || ""
      };
      await saDataService.saveUser(modalData, tiModal.mode);
      setTiModal(null);
      await fetchLiveDatabaseData();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const openSsAdd = () => {
    setSsModal({
      mode: "add",
      role: "ss",
      data: {
        id: `SS_${Date.now().toString().slice(-4)}`,
        name: "",
        contact: "",
        email: "",
        password: "",
        division: "Nagpur",
        smDivision: "Nagpur",
        zone: "Central Railway",
        smZone: "Central Railway",
        station: stations[0]?.name || "Nagpur Junction",
        smStation: stations[0]?.name || "Nagpur Junction",
        cat: "A",
        lastDate: new Date().toISOString().split('T')[0]
      }
    });
  };

  const openSsEdit = (ss) => {
    setSsModal({
      mode: "edit",
      role: "ss",
      data: {
        ...ss,
        id: ss.employeeId || ss.hrmsId || ss.id,
        station: ss.station || ss.stationName,
        smStation: ss.station || ss.stationName,
        division: ss.division,
        smDivision: ss.division,
        zone: ss.zone,
        smZone: ss.zone
      }
    });
  };

  const openSsShift = (ss) => {
    setSsModal({
      mode: "shift",
      role: "ss",
      data: {
        ...ss,
        id: ss.employeeId || ss.hrmsId || ss.id,
        station: ss.station || ss.stationName,
        smStation: ss.station || ss.stationName,
        division: ss.division,
        smDivision: ss.division,
        zone: ss.zone,
        smZone: ss.zone
      }
    });
  };

  const saveSsModal = async () => {
    if (!ssModal.data.name || !ssModal.data.id) {
      alert("Name and Employee ID are required.");
      return;
    }
    try {
      const data = ssModal.data;
      const modalData = {
        id: data.id,
        name: data.name,
        contact: data.contact,
        email: data.email,
        password: data.password,
        role: ssModal.mode === "shift" ? ssModal.role : "Station Superintendent",
        station: data.station || data.smStation,
        division: data.division || data.smDivision,
        lastDate: data.lastDate || new Date().toISOString().split('T')[0],
        score: data.score !== undefined ? data.score : 80,
        cat: data.cat || "A",
        reportingSm: data.reportingSm || "",
        workLocation: data.workLocation || "",
        shift: data.shift || "",
        jurisdiction: data.jurisdiction || ""
      };
      await saDataService.saveUser(modalData, ssModal.mode);
      setSsModal(null);
      await fetchLiveDatabaseData();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const removeSs = async (id) => {
    if (window.confirm("Remove this Station Superintendent?")) {
      try {
        await saDataService.removeUser(id);
        await fetchLiveDatabaseData();
      } catch (err) {
        alert("Error removing: " + err.message);
      }
    }
  };

  const openTmAdd = () => {
    setTmModal({
      mode: "add",
      role: "tm",
      data: {
        id: `TM_${Date.now().toString().slice(-4)}`,
        name: "",
        contact: "",
        email: "",
        password: "",
        division: "Nagpur",
        smDivision: "Nagpur",
        zone: "Central Railway",
        smZone: "Central Railway",
        station: stations[0]?.name || "Nagpur Junction",
        smStation: stations[0]?.name || "Nagpur Junction",
        cat: "A",
        workLocation: "Nagpur Depot",
        lastDate: new Date().toISOString().split('T')[0]
      }
    });
  };

  const openTmEdit = (tm) => {
    setTmModal({
      mode: "edit",
      role: "tm",
      data: {
        ...tm,
        id: tm.employeeId || tm.hrmsId || tm.id,
        station: tm.station || tm.stationName,
        smStation: tm.station || tm.stationName,
        division: tm.division,
        smDivision: tm.division,
        zone: tm.zone,
        smZone: tm.zone
      }
    });
  };

  const openTmShift = (tm) => {
    setTmModal({
      mode: "shift",
      role: "tm",
      data: {
        ...tm,
        id: tm.employeeId || tm.hrmsId || tm.id,
        station: tm.station || tm.stationName,
        smStation: tm.station || tm.stationName,
        division: tm.division,
        smDivision: tm.division,
        zone: tm.zone,
        smZone: tm.zone
      }
    });
  };

  const saveTmModal = async () => {
    if (!tmModal.data.name || !tmModal.data.id) {
      alert("Name and Employee ID are required.");
      return;
    }
    try {
      const data = tmModal.data;
      const modalData = {
        id: data.id,
        name: data.name,
        contact: data.contact,
        email: data.email,
        password: data.password,
        role: tmModal.mode === "shift" ? tmModal.role : "Train Manager",
        station: data.station || data.smStation,
        division: data.division || data.smDivision,
        lastDate: data.lastDate || new Date().toISOString().split('T')[0],
        score: data.score !== undefined ? data.score : 80,
        cat: data.cat || "A",
        reportingSm: data.reportingSm || "",
        workLocation: data.workLocation || "",
        shift: data.shift || "",
        jurisdiction: data.jurisdiction || ""
      };
      await saDataService.saveUser(modalData, tmModal.mode);
      setTmModal(null);
      await fetchLiveDatabaseData();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const removeTm = async (id) => {
    if (window.confirm("Remove this Train Manager?")) {
      try {
        await saDataService.removeUser(id);
        await fetchLiveDatabaseData();
      } catch (err) {
        alert("Error removing: " + err.message);
      }
    }
  };
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("FY 2025-26 - Q3");

  // ── AOM Approvals Page State (mirrors TI's PM Review exactly) ──
  const [aomApprovalTab, setAomApprovalTab] = useState("SM"); // "SM" | "TM"
  const [aomReviewTab, setAomReviewTab] = useState("Pending"); // Pending/Approved/Rejected
  const [aomReviewSearch, setAomReviewSearch] = useState("");
  const [aomReviewStation, setAomReviewStation] = useState("All");
  const [aomSelectedId, setAomSelectedId] = useState(null);
  const [aomEditSections, setAomEditSections] = useState({});
  const [aomAomRemarks, setAomAomRemarks] = useState({});
  const [aomShowAudit, setAomShowAudit] = useState({});
  const [aomRejectMode, setAomRejectMode] = useState({});
  const [aomApprovalNotice, setAomApprovalNotice] = useState("");
  const [aomSMList, setAomSMList] = useState([]);
  const [aomSSList, setAomSSList] = useState([]);
  const [aomTMList, setAomTMList] = useState([]);

  // Refresh SM/SS/TM lists from database whenever Approvals page is active
  useEffect(() => {
    if (activePage === "Approvals") {
      fetchLiveDatabaseData();
    }
  }, [activePage]);

  const aomCatColor = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };
  const aomCatBg = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
  const aomGetCat = s => s >= 80 ? "A" : s >= 50 ? "B" : s >= 26 ? "C" : "D";

  const aomCurrentList = aomApprovalTab === "SM" ? aomSMList : (aomApprovalTab === "SS" ? aomSSList : aomTMList);
  const aomSelectedItem = aomSelectedId ? aomCurrentList.find(x => x.id === aomSelectedId) || null : null;

  const aomFilteredList = aomCurrentList.filter(item => {
    const st = aomReviewTab === "Pending" ? item.status === "Submitted" : item.status === aomReviewTab;
    const s = !aomReviewSearch || item.name.toLowerCase().includes(aomReviewSearch.toLowerCase()) || item.hrmsId.toLowerCase().includes(aomReviewSearch.toLowerCase());
    const r = aomReviewStation === "All" || item.station === aomReviewStation;
    return st && s && r;
  });

  const aomOpenReview = (id) => {
    const rec = aomCurrentList.find(x => x.id === id);
    if (!rec) return;
    setAomSelectedId(id);

    let builtSecs = [];
    // Priority 1: Use real sections stored from Supabase TEST_ATTEMPT answers
    if (rec.sections && rec.sections.length > 0) {
      builtSecs = rec.sections.map(s => ({
        title: s.title,
        score: s.marks !== undefined ? s.marks : (s.score || 0),
        max: s.outOf !== undefined ? s.outOf : (s.max || 25)
      }));
    } else if (aomApprovalTab === "SM") {
      // Fallback: distribute proportionally (no real section data available)
      const total = rec.score || 0;
      builtSecs = [
        { title: "Knowledge of Rules (MCQ)", score: Math.round(total * 0.25), max: 25 },
        { title: "Alertness and Observation of Rules", score: Math.round(total * 0.25), max: 25 },
        { title: "Safety Record", score: Math.round(total * 0.15), max: 15 },
        { title: "Leadership and Management", score: Math.round(total * 0.15), max: 15 },
        { title: "Discipline", score: Math.round(total * 0.10), max: 10 },
        { title: "Appearance and Neatness", score: Math.round(total * 0.10), max: 10 }
      ];
    } else if (aomApprovalTab === "SS") {
      // Fallback: distribute proportionally (no real section data available)
      const total = rec.score || 0;
      builtSecs = [
        { title: "Station Operations & Supervision", score: Math.round(total * 0.25), max: 25 },
        { title: "Staff Management & Discipline", score: Math.round(total * 0.20), max: 20 },
        { title: "Records & Documentation", score: Math.round(total * 0.15), max: 15 },
        { title: "Safety Compliance & Emergency", score: Math.round(total * 0.25), max: 25 },
        { title: "Infrastructure & Asset Maintenance", score: Math.round(total * 0.15), max: 15 },
        { title: "Written Exam (Knowledge)", score: 0, max: 25 }
      ];
    } else {
      // Train Manager criteria fallback
      const total = rec.score || 0;
      builtSecs = [
        { title: "Train Safety & Brake Inspection", score: Math.round(total * 0.15), max: 15 },
        { title: "Signaling & Whistle Compliance", score: Math.round(total * 0.15), max: 15 },
        { title: "Shunting & Coupling Ops", score: Math.round(total * 0.15), max: 15 },
        { title: "Train Log & Guard Certificates", score: Math.round(total * 0.15), max: 15 },
        { title: "Emergency Train Protection", score: Math.round(total * 0.15), max: 15 },
        { title: "Written Exam (Knowledge)", score: 0, max: 25 }
      ];
    }

    setAomEditSections(prev => ({ ...prev, [id]: builtSecs }));
    setAomAomRemarks(prev => ({ ...prev, [id]: rec.aomRemarks || "" }));
    setAomRejectMode(prev => ({ ...prev, [id]: false }));
  };

  const aomUpdateSec = (id, idx, val) => {
    setAomEditSections(prev => {
      const arr = [...prev[id]]; arr[idx] = { ...arr[idx], score: Math.max(0, Math.min(arr[idx].max, Number(val) || 0)) };
      return { ...prev, [id]: arr };
    });
  };

  const aomFinalize = async (id, mode, rejectNote = "") => {
    try {
      const newStatus = mode === "reject" ? "Rejected" : "Approved";

      const { error: updateError } = await supabase
        .from("ASSESSMENT")
        .update({ status: newStatus })
        .eq("assessment_id", id);
      if (updateError) throw updateError;

      const { data: approvalData } = await supabase
        .from("APPROVAL")
        .select("approval_id")
        .eq("assessment_id", id)
        .maybeSingle();

      if (approvalData) {
        await supabase.from("REVIEW").insert([{
          approval_id: approvalData.approval_id,
          reviewed_by: user.userId,
          review_level: "AOM",
          remarks: mode === "reject" ? rejectNote : (aomAomRemarks[id] || "Approved by AOM")
        }]);
      } else {
        await supabase.from("APPROVAL").insert([{
          assessment_id: id,
          approved_by: user.userId,
          approval_level: "Traffic Inspector",
          remarks: mode === "reject" ? rejectNote : (aomAomRemarks[id] || "Approved by AOM")
        }]);
      }

      if (mode !== "reject") {
        const currentList = aomApprovalTab === "SM" ? aomSMList : (aomApprovalTab === "SS" ? aomSSList : aomTMList);
        const targetAssess = currentList.find(x => x.id === id);
        const secs = aomEditSections[id] || [];
        const total = secs.reduce((s, x) => s + x.score, 0);

        const isAlcoholic = targetAssess?.alcoholicStatus === "Alcoholic";
        const finalCat = isAlcoholic ? "D" : aomGetCat(total);

        // Retrieve existing TEST_ATTEMPT record
        const { data: existingAttempt } = await supabase
          .from("TEST_ATTEMPT")
          .select("answers, total_marks")
          .eq("assessment_id", id)
          .maybeSingle();

        let originalAnswers = {};
        if (existingAttempt?.answers) {
          originalAnswers = existingAttempt.answers;
          if (typeof originalAnswers === "string") {
            try { originalAnswers = JSON.parse(originalAnswers); } catch (e) { }
          }
        }

        const isOnline = targetAssess?.isOnlineExam || (existingAttempt?.total_marks === 25);
        const finalTotalMarks = isOnline ? (existingAttempt?.total_marks || 25) : 100;

        const mcqSec = secs.find(s => s.title.includes("MCQ") || s.title.includes("Written Exam") || s.title.includes("Knowledge"));
        const newMcqScore = mcqSec ? mcqSec.score : (isOnline ? total : 0);

        let updatedAnswers;
        if (Array.isArray(originalAnswers)) {
          updatedAnswers = {
            questions: originalAnswers,
            sections: secs.map(s => ({
              title: s.title,
              marks: s.score,
              outOf: s.max
            })),
            mcqScore: newMcqScore,
            knowledgeMarks: newMcqScore.toString()
          };
        } else {
          updatedAnswers = {
            ...originalAnswers,
            sections: secs.map(s => ({
              title: s.title,
              marks: s.score,
              outOf: s.max
            })),
            mcqScore: newMcqScore,
            knowledgeMarks: newMcqScore.toString()
          };
        }

        await supabase.from("TEST_ATTEMPT").update({
          obtained_marks: total,
          percentage: total,
          category: finalCat,
          total_marks: finalTotalMarks,
          answers: updatedAnswers
        }).eq("assessment_id", id);

        if (targetAssess?.hrmsId) {
          const emp = users.find(u => u.hrmsId === targetAssess.hrmsId);
          if (emp?.user_id) {
            await supabase.from("EMPLOYEE_PROFILE").update({
              current_score: total,
              category: finalCat
            }).eq("user_id", emp.user_id);
          }
        }

        // Trigger Category D auto-protocol if score is Category D or is alcoholic
        if (total < 50 || finalCat === 'D') {
          try {
            const { data: aData } = await supabase
              .from("ASSESSMENT")
              .select("conducted_by, employee_id")
              .eq("assessment_id", id)
              .single();
            const condBy = aData?.conducted_by || user.userId;
            const empId = aData?.employee_id || targetAssess?.hrmsId;
            await assessmentService.triggerCategoryDProtocol(empId, id, total, finalCat, condBy);
          } catch (dErr) {
            console.error("Failed to trigger Category D protocol during AOM finalize:", dErr);
          }
        }
      }

      await fetchLiveDatabaseData();

      setAomSelectedId(null);
      setAomApprovalNotice(mode === "reject" ? "Assessment rejected." : "Assessment approved successfully.");
      setTimeout(() => setAomApprovalNotice(""), 4000);
      setAomReviewTab(mode === "reject" ? "Rejected" : "Approved");
    } catch (err) {
      console.error("Error finalizing assessment by AOM:", err);
      setAomApprovalNotice("Failed to finalize assessment in database.");
      setTimeout(() => setAomApprovalNotice(""), 4000);
    }
  };

  const aomAllStations = [...new Set(aomCurrentList.map(x => x.station))];
  const [searchStations, setSearchStations] = useState("");
  // Chart Zoom Modal states
  const [isChartZoomModalOpen, setIsChartZoomModalOpen] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState("progress"); // "progress" or "score"
  const [zoomPopupPage, setZoomPopupPage] = useState(1);
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
  const [userFormData, setUserFormData] = useState(initialUserFormData);
  const [formErrors, setFormErrors] = useState({});
  const [users, setUsers] = useState([
    {
      id: 1,
      employeeName: "S. K. Sharma",
      hrmsId: "PM_8820",
      mobileNo: "9876543210",
      emailId: "sksharma@rail.in",
      designation: "Pointsman",
      department: "Operations",
      userType: "Employee",
      reportingOfficer: "R. Kumar",
      zone: "Central Railway",
      division: "Nagpur",
      stationName: "Nagpur Main",
      reportingSm: "A. Patil",
      shift: "Morning Shift (06:00 - 14:00)",
      workLocation: "Yard",
      status: "Active",
      marks: 85
    },
    {
      id: 2,
      employeeName: "R. D. Jadhav",
      hrmsId: "SM_5521",
      mobileNo: "9876543211",
      emailId: "rdjadhav@rail.in",
      designation: "Station Master",
      department: "Operations",
      userType: "Manager",
      reportingOfficer: "S. Deshmukh",
      zone: "Central Railway",
      division: "Pune",
      stationName: "Pune Junction",
      smStation: "Pune Junction",
      smDivision: "Pune",
      smZone: "Central Railway",
      status: "Active",
      marks: 92
    },
    {
      id: 3,
      employeeName: "A. P. Kulkarni",
      hrmsId: "TI_2101",
      mobileNo: "9876543212",
      emailId: "apkulkarni@rail.in",
      designation: "Traffic Inspector",
      department: "Operations",
      userType: "Manager",
      reportingOfficer: "P. Nair",
      zone: "Central Railway",
      division: "Nagpur",
      stationName: "Nagpur Main",
      jurisdiction: "Nagpur Division",
      linkedStations: "Nagpur Main, Wardha Junction, Sewagram",
      reportingAom: "A. K. Sinha (AOM/G)",
      status: "Active",
      marks: 78
    }
  ]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [pendingFilters, setPendingFilters] = useState(initialFilterData);
  const [appliedFilters, setAppliedFilters] = useState(initialFilterData);
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stations, setStations] = useState([]);
  const defaultStationForm = {
    stationName: "",
    stationCode: "",
    zone: "Central Railway",
    division: "Nagpur",
    section: "Nagpur - Wardha",
    category: "A",
    status: "Active",
    assignedTi: "",
    platforms: "3",
    runningLines: "5",
    address: "",
    district: "Nagpur",
    state: "Maharashtra",
    stationType: "Junction"
  };
  const [stationFormData, setStationFormData] = useState(defaultStationForm);
  const [stationFormErrors, setStationFormErrors] = useState({});
  const [pendingStationFilters, setPendingStationFilters] = useState(initialStationFilterData);
  const [appliedStationFilters, setAppliedStationFilters] = useState(initialStationFilterData);
  const [stationSearch, setStationSearch] = useState("");
  const [stationMasterSearch, setStationMasterSearch] = useState("");
  const [stationCurrentPage, setStationCurrentPage] = useState(1);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedSMProfile, setSelectedSMProfile] = useState(null);
  const [userShiftDrafts, setUserShiftDrafts] = useState({});

  // Super Admin Replicated Stations View States
  const [view, setView] = useState(null); // { type, data, returnTo, stationData } for station/staff drill-down pages
  const [stF, setStF] = useState({ name: "" }); // search filter
  const [newStName, setNewStName] = useState("");
  const [newStCode, setNewStCode] = useState("");
  const [newStTi, setNewStTi] = useState("TI NGP");
  const [newStDivision, setNewStDivision] = useState("Nagpur");
  const [newStZone, setNewStZone] = useState("CR");
  const [newStCategory, setNewStCategory] = useState("A");
  const [newStClass, setNewStClass] = useState("Class B");
  const [newStType, setNewStType] = useState("Junction");
  const [newStSignaling, setNewStSignaling] = useState("Electronic Interlocking (EI)");
  const [newStPlatforms, setNewStPlatforms] = useState(3);
  const [newStTracks, setNewStTracks] = useState(5);
  const [newStDailyFootfall, setNewStDailyFootfall] = useState(15000);
  const [newStLatitude, setNewStLatitude] = useState("21.1500° N");
  const [newStLongitude, setNewStLongitude] = useState("79.0900° E");
  const [newStContactNumber, setNewStContactNumber] = useState("+91-712-2560158");
  const [newStEmailId, setNewStEmailId] = useState("");
  const [newStLineConfig, setNewStLineConfig] = useState("Double Line");
  const [newStElectrified, setNewStElectrified] = useState("Electrified AC 25kV");
  const [showAddStation, setShowAddStation] = useState(false);

  // States for Pointsman Under Station Master Page
  const [selectedSMForPointsmen, setSelectedSMForPointsmen] = useState(null);
  const [selectedPointsmanForMonitoring, setSelectedPointsmanForMonitoring] = useState(null);
  const [pointsmanSearchText, setPointsmanSearchText] = useState("");
  const [pointsmanRiskFilter, setPointsmanRiskFilter] = useState("All");
  const [pointsmanStatusFilter, setPointsmanStatusFilter] = useState("All");

  const handleChartClick = (state, chartType) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const clickedStationName = state.activePayload[0].payload.station;
      if (clickedStationName) {
        setZoomPopupSearch(clickedStationName);
      }
      setSelectedChartType(chartType);
      setIsChartZoomModalOpen(true);
      setZoomPopupPage(1);
    } else {
      setSelectedChartType(chartType);
      setIsChartZoomModalOpen(true);
      setZoomPopupPage(1);
    }
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

  const [aomPointsmen, setAomPointsmen] = useState([]);
  const [aomStationMasters, setAomStationMasters] = useState([]);

  const [smModal, setSmModal] = useState(null);
  const [ssModal, setSsModal] = useState(null);
  const [tmModal, setTmModal] = useState(null);
  const [tiModal, setTiModal] = useState(null);

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

  const handleTiViewClick = (tiRow) => {
    setSelectedTIForStationMasters(tiRow);
    setActivePage("Station Masters Under TI");
  };

  const handleStationMasterClick = (sm) => {
    setSelectedSMForPointsmen(sm);
    setSelectedPointsmanForMonitoring(null);
    setPointsmanSearchText("");
    setPointsmanRiskFilter("All");
    setPointsmanStatusFilter("All");
    setActivePage("Pointsman Under Station Master");
  };

  const stationMastersDirectory = aomStationMasters;

  const filteredStationMasters = stationMastersDirectory.filter((row) => {
    const q = stationMasterSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.stationName.toLowerCase().includes(q) ||
      row.stationCode.toLowerCase().includes(q) ||
      row.division.toLowerCase().includes(q)
    );
  });

  const handleShiftStationMaster = (smName, targetStationCode) => {
    if (!targetStationCode) return;

    const currentStation = stations.find(s => s.stationMasterName === smName);
    if (!currentStation) return;

    const targetStationObj = stations.find(s => s.stationCode === targetStationCode);
    const targetStationName = targetStationObj ? targetStationObj.stationName : targetStationCode;

    if (!window.confirm(`Are you sure you want to shift Station Master ${smName} from ${currentStation.stationName} to ${targetStationName}?`)) {
      return;
    }

    setStations(prev => prev.map(s => {
      if (s.stationCode === currentStation.stationCode) {
        return {
          ...s,
          stationMasterName: "",
          contactNumber: "",
          emailId: ""
        };
      }
      if (s.stationCode === targetStationCode) {
        return {
          ...s,
          stationMasterName: smName,
          contactNumber: currentStation.contactNumber,
          emailId: currentStation.emailId
        };
      }
      return s;
    }));

    setSmShiftDrafts(prev => {
      const next = { ...prev };
      delete next[smName];
      return next;
    });
  };

  const handleDeleteStationMaster = (smName) => {
    if (!window.confirm(`Are you sure you want to delete Station Master ${smName}?`)) {
      return;
    }

    setStations(prev => prev.map(s => {
      if (s.stationMasterName === smName) {
        return {
          ...s,
          stationMasterName: "",
          contactNumber: "",
          emailId: ""
        };
      }
      return s;
    }));
  };

  const logAomPmeRecord = async (employeeHrmsId, pmeData) => {
    try {
      const { data: uData, error: uErr } = await supabase
        .from('USERS')
        .select('user_id')
        .eq('hrms_id', employeeHrmsId)
        .single();

      if (uErr || !uData?.user_id) throw new Error("Employee not found in database.");

      const userId = uData.user_id;
      const res = await monitoringService.logPmeRecord(userId, pmeData);
      if (res && res.success) {
        await fetchLiveDatabaseData();
        return { success: true };
      } else {
        throw new Error(res?.error || "Failed to log PME record.");
      }
    } catch (err) {
      console.error("Error logging PME record:", err);
      alert("Error logging PME record: " + err.message);
      return { success: false, error: err.message };
    }
  };

  const [stationDetailId, setStationDetailId] = useState(null);
  const [isStationEditMode, setIsStationEditMode] = useState(false);
  const [tiSearch, setTiSearch] = useState("");
  const [trafficInspectors, setTrafficInspectors] = useState([]);
  const [tiFormData, setTiFormData] = useState(initialTiFormData);
  const [tiFormErrors, setTiFormErrors] = useState({});
  const [tiAddMode, setTiAddMode] = useState("form");
  const [tiHrmsSearch, setTiHrmsSearch] = useState("");
  const [tiNotice, setTiNotice] = useState("");
  const [selectedTiId, setSelectedTiId] = useState(null);
  const [tiLinkTargetId, setTiLinkTargetId] = useState(null);
  const [tiLinkDraft, setTiLinkDraft] = useState({ stations: [], sms: [] });
  const [tiShiftDrafts, setTiShiftDrafts] = useState({});
  const [smShiftDrafts, setSmShiftDrafts] = useState({});
  const [selectedTIForStationMasters, setSelectedTIForStationMasters] = useState(null);
  const [pendingAssessments, setPendingAssessments] = useState([]);
  const [approvedAssessments, setApprovedAssessments] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportDesignation, setReportDesignation] = useState("All Designations");
  const [repF, setRepF] = useState({ search: "", role: "All", station: "All", cat: "All", risk: "All", ti: "All" });
  const [repApplied, setRepApplied] = useState(false);
  const [selectedReportUserId, setSelectedReportUserId] = useState(null);
  const [assessmentActionNotice, setAssessmentActionNotice] = useState("");
  const [assessmentRoleTab, setAssessmentRoleTab] = useState("TI");
  const [openAssessmentId, setOpenAssessmentId] = useState(null);
  const [answersByAssessment, setAnswersByAssessment] = useState({});
  const [expandedCriterionKey, setExpandedCriterionKey] = useState({});
  const [assessSearch, setAssessSearch] = useState("");
  const [assessStation, setAssessStation] = useState("All");
  const [assessStatus, setAssessStatus] = useState("All");
  const [assessDate, setAssessDate] = useState("");
  const [aomSettings, setAomSettings] = useState({
    emailAlerts: true,
    smsAlerts: true,
    weeklyDigest: true,
    autoEscalation: true,
    reportVisibility: "All",
    defaultAssessmentTab: "TI"
  });
  const [settingsNotice, setSettingsNotice] = useState("");

  // Open assessment from URL (e.g. ?assessment=ID) in a new tab/link
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const aid = params.get("assessment");
      if (aid) {
        setActivePage("Assessments");
        setOpenAssessmentId(aid);
        const found = pendingAssessments.find((it) => it.id === aid) || approvedAssessments.find((it) => it.id === aid);
        if (found) {
          if ((found.title || "").startsWith("Station Master")) setAssessmentRoleTab("SM");
          else if ((found.title || "").startsWith("Train Manager")) setAssessmentRoleTab("TM");
          else setAssessmentRoleTab("TI");
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Employee Management Page State
  const [empSearchText, setEmpSearchText] = useState("");
  const [empDesignationFilter, setEmpDesignationFilter] = useState("All");
  const [empStationFilter, setEmpStationFilter] = useState("All");
  const [empDivisionFilter, setEmpDivisionFilter] = useState("All");
  const [empZoneFilter, setEmpZoneFilter] = useState("All");
  const [empCategoryFilter, setEmpCategoryFilter] = useState("All");
  const [empRiskFilter, setEmpRiskFilter] = useState("All");
  const [empStatusFilter, setEmpStatusFilter] = useState("All");
  const [empMonitoringFilter, setEmpMonitoringFilter] = useState("All");

  const [empSortConfig, setEmpSortConfig] = useState({ key: "name", direction: "ascending" });
  const [empCurrentPage, setEmpCurrentPage] = useState(1);
  const [deactivatedUserIds, setDeactivatedUserIds] = useState(new Set());
  const [empShiftDrafts, setEmpShiftDrafts] = useState({});

  // Role-directory filter state (shared for all 5 roles)
  const [roleFilterName, setRoleFilterName] = useState("");
  const [roleFilterStation, setRoleFilterStation] = useState("All");
  const [roleFilterDivision, setRoleFilterDivision] = useState("All");
  const [roleFilterCat, setRoleFilterCat] = useState("All");
  const [roleFilterRisk, setRoleFilterRisk] = useState("All");
  const [selectedRoleEmployee, setSelectedRoleEmployee] = useState(null);
  const [roleShiftDrafts, setRoleShiftDrafts] = useState({});
  const [tiActivatedAssessments, setTiActivatedAssessments] = useState({});
  const [tiAssessmentFormOpen, setTiAssessmentFormOpen] = useState(null); // hrmsId of TI being assessed
  const [tiAssessmentAnswers, setTiAssessmentAnswers] = useState({});
  const [ssActivationTrigger, setSsActivationTrigger] = useState(0);

  const [aomSuperintendents, setAomSuperintendents] = useState([]);
  const [aomTrainManagers, setAomTrainManagers] = useState([]);

  const allEmployees = useMemo(() => {
    return [
      ...aomPointsmen.map((p) => {
        const isUnassessed = p.approvalStatus === "Pending First Assessment" || p.status === "Pending First Assessment";
        return {
          hrmsId: p.hrmsId,
          name: p.name,
          gender: p.gender || "Male",
          age: p.age || 35,
          doj: p.doj || "2018-06-15",
          basePay: p.basePay || "₹28,500",
          designation: "Pointsman",
          role: "pointsmen",
          stationName: p.stationName,
          stationCode: p.stationCode,
          division: p.division || "Nagpur",
          zone: p.zone || "CR",
          category: p.cat || getPmCat(p.lastScore),
          riskLevel: p.risk || getPmRisk(p),
          assessmentStatus: p.approvalStatus,
          lastScore: isUnassessed ? null : p.lastScore,
          safetyScore: isUnassessed ? null : p.safetyScore,
          totalAssessments: isUnassessed ? 0 : p.totalAssessments,
          lastAssessedDate: isUnassessed ? "No Assessment Taken" : (p.lastAssessDate || p.doj || "2026-03-28"),
          monitoringStatus: deactivatedUserIds.has(p.hrmsId) ? "Deactivated" : (p.monitoringStatus || "Active"),
          contactNumber: p.contact || "—",
          emailId: p.email || `${p.hrmsId.toLowerCase()}@rail.in`,
          pmeStatus: p.pmeStatus || "Fit",
          pmeDueDate: p.pmeDueDate || null,
          pmeDoneDate: p.pmeDoneDate || null,
          refStatus: p.refStatus || "Cleared"
        };
      }),
      ...aomStationMasters.map((sm, idx) => {
        const smHrmsId = sm.hrmsId || sm.id || `SM_${1001 + idx}`;
        const isUnassessed = sm.approvalStatus === "Pending First Assessment" || sm.status === "Pending First Assessment";
        return {
          hrmsId: smHrmsId,
          name: sm.name,
          gender: sm.gender || "Male",
          age: sm.age || 42,
          doj: sm.doj || "2010-05-15",
          basePay: sm.basePay || "₹56,000",
          designation: "Station Master",
          role: "sm",
          stationName: sm.stationName,
          stationCode: sm.stationCode,
          division: sm.division,
          zone: sm.zone || "CR",
          category: sm.cat || "A",
          riskLevel: sm.riskLevel || sm.risk || "Low",
          assessmentStatus: sm.approvalStatus || sm.status || "Approved",
          lastScore: isUnassessed ? null : (sm.lastScore || sm.score || 0),
          safetyScore: isUnassessed ? null : (sm.safetyScore || 0),
          totalAssessments: isUnassessed ? 0 : (sm.totalAssessments || 0),
          lastAssessedDate: isUnassessed ? "No Assessment Taken" : (sm.lastAssessedDate || sm.lastAssessDate || sm.doj || null),
          monitoringStatus: deactivatedUserIds.has(smHrmsId) ? "Deactivated" : (sm.monitoringStatus || "Active"),
          contactNumber: sm.contactNumber || sm.contact || "—",
          emailId: sm.emailId || sm.email || `${smHrmsId.toLowerCase()}@rail.in`,
          pmeStatus: sm.pmeStatus || "Fit",
          pmeDueDate: sm.pmeDueDate || null,
          pmeDoneDate: sm.pmeDoneDate || null,
          refStatus: sm.refStatus || "Cleared"
        };
      }),
      ...aomSuperintendents.map((ss) => {
        const isUnassessed = ss.status === "Pending First Assessment" || ss.approvalStatus === "Pending First Assessment";
        return {
          hrmsId: ss.employeeId,
          name: ss.name,
          gender: "Male",
          age: 46,
          doj: "2008-03-12",
          basePay: "₹62,000",
          designation: "Station Superintendent",
          role: "ss",
          stationName: ss.station,
          stationCode: ss.stationCode || (ss.station === "Nagpur Junction" ? "NGP" : "PBN"),
          division: ss.division,
          zone: ss.zone || "CR",
          category: ss.cat || "A",
          riskLevel: ss.risk || "Low",
          assessmentStatus: ss.status || ss.approvalStatus || "Approved",
          lastScore: isUnassessed ? null : ss.score,
          safetyScore: isUnassessed ? null : (ss.score + 4),
          totalAssessments: isUnassessed ? 0 : 11,
          lastAssessedDate: isUnassessed ? "No Assessment Taken" : (ss.lastDate || ss.doj || "2026-04-18"),
          monitoringStatus: deactivatedUserIds.has(ss.employeeId) ? "Deactivated" : "Active",
          contactNumber: ss.contact || "—",
          emailId: ss.email || `${ss.employeeId.toLowerCase()}@rail.in`,
          pmeStatus: ss.pmeStatus || "Fit",
          pmeDueDate: ss.pmeDueDate || null,
          pmeDoneDate: ss.pmeDoneDate || null,
          refStatus: ss.refStatus || "Cleared"
        };
      }),
      ...aomTrainManagers.map((tm) => {
        const isUnassessed = tm.status === "Pending First Assessment" || tm.approvalStatus === "Pending First Assessment";
        return {
          hrmsId: tm.employeeId,
          name: tm.name,
          gender: "Male",
          age: 39,
          doj: "2014-09-05",
          basePay: "₹48,000",
          designation: "Train Manager",
          role: "tm",
          stationName: tm.station,
          stationCode: tm.stationCode || (tm.station === "Nagpur Junction" ? "NGP" : tm.station === "AMLA" ? "AMLA" : "NGP"),
          division: tm.division,
          zone: tm.zone || "CR",
          category: tm.cat || "A",
          riskLevel: tm.risk || "Low",
          assessmentStatus: tm.status || tm.approvalStatus || "Approved",
          lastScore: isUnassessed ? null : tm.score,
          safetyScore: isUnassessed ? null : (tm.score + 3),
          totalAssessments: isUnassessed ? 0 : 8,
          lastAssessedDate: isUnassessed ? "No Assessment Taken" : (tm.lastDate || tm.doj || "2026-04-14"),
          monitoringStatus: deactivatedUserIds.has(tm.employeeId) ? "Deactivated" : "Active",
          contactNumber: tm.contact || "—",
          emailId: tm.email || `${tm.employeeId.toLowerCase()}@rail.in`,
          workLocation: tm.workLocation || "Nagpur Depot",
          reportingSm: tm.reportingSm || "NGP-BSL Section",
          shift: tm.shift || "Goods Train Beat",
          pmeStatus: tm.pmeStatus || "Fit",
          pmeDueDate: tm.pmeDueDate || null,
          pmeDoneDate: tm.pmeDoneDate || null,
          refStatus: tm.refStatus || "Cleared"
        };
      }),
      ...trafficInspectors.map((ti, idx) => {
        const isUnassessed = ti.status === "Pending First Assessment" || ti.approvalStatus === "Pending First Assessment";
        return {
          hrmsId: ti.employeeId,
          name: ti.name,
          gender: "Male",
          age: 48,
          doj: "2006-11-20",
          basePay: "₹68,000",
          designation: "Traffic Inspector",
          role: "ti",
          stationName: ti.stationName || ti.station || "Division HQ",
          stationCode: ti.stationCode || (ti.stationName === "Nagpur Junction" ? "NGP" : ti.stationName === "Parbhani Junction" ? "PBN" : "AMLA"),
          division: ti.division || "Nagpur",
          zone: ti.zone || "CR",
          category: ti.cat || ti.category || "A",
          riskLevel: ti.risk || ti.riskLevel || "Low",
          assessmentStatus: ti.status || ti.approvalStatus || "Approved",
          lastScore: isUnassessed ? null : (ti.lastScore || ti.score || 88),
          safetyScore: isUnassessed ? null : 95,
          totalAssessments: isUnassessed ? 0 : (ti.totalAssessments || 8),
          lastAssessedDate: isUnassessed ? "No Assessment Taken" : (ti.lastDate || ti.doj || "2026-03-15"),
          monitoringStatus: deactivatedUserIds.has(ti.employeeId) ? "Deactivated" : "Active",
          contactNumber: ti.contact || ti.phone || "—",
          emailId: ti.email || `${ti.employeeId.toLowerCase()}@rail.in`,
          pmeStatus: ti.pmeStatus || "Fit",
          pmeDueDate: ti.pmeDueDate || null,
          pmeDoneDate: ti.pmeDoneDate || null,
          refStatus: ti.refStatus || "Cleared",
          jurisdiction: ti.jurisdiction || "",
          linkedStations: ti.linkedStations || ""
        };
      })
    ];
  }, [aomPointsmen, aomStationMasters, stations, aomSuperintendents, aomTrainManagers, trafficInspectors, deactivatedUserIds]);

  const pageSize = 8;
  const stationPageSize = 8;

  const todayIso = () => new Date().toISOString().slice(0, 10);

  const extractDesignation = (title) => title.split(" - ")[0] || "Employee";

  const resolveAssessmentTab = (title) => {
    const designation = extractDesignation(title);
    if (designation === "Station Master") return "SM";
    if (designation === "Train Manager") return "TM";
    if (designation === "Station Superintendent") return "SS";
    return "TI";
  };

  const renderCategoryBadge = (category) => {
    const value = String(category || "").trim().toUpperCase();
    const isRank = ["A", "B", "C", "D"].includes(value);

    if (isRank) {
      return <span className={`category-circle category-${value.toLowerCase()}`}>{value}</span>;
    }

    return <span className="category-text-chip">{value || "-"}</span>;
  };

  const buildPrefilledAnswers = (title) => {
    const tab = resolveAssessmentTab(title);
    if (tab === "SM" || tab === "TM") {
      return {
        knowledgeOfRules: "",
        alertnessAndObservation: "",
        safetyRecord: "",
        leadershipAndManagement: "",
        discipline: "",
        appearanceAndNeatness: "",
        alcoholicStatus: "Non-Alcoholic",
        pmeStatus: "Fit",
        refStatus: "Cleared",
        counselling: "Not Required",
        automaticTraining: "Not Required",
        remarks: ""
      };
    }

    return {
      knowledgeOfRules: "",
      alertnessAndObservation_0: "",
      alertnessAndObservation_1: "",
      alertnessAndObservation_2: "",
      alertnessAndObservation_3: "",
      alertnessAndObservation_4: "",
      safetyRecord_0: "",
      safetyRecord_1: "",
      safetyRecord_2: "",
      safetyRecord_3: "",
      safetyRecord_4: "",
      leadershipAndManagement_0: "",
      leadershipAndManagement_1: "",
      leadershipAndManagement_2: "",
      leadershipAndManagement_3: "",
      leadershipAndManagement_4: "",
      discipline_0: "",
      discipline_1: "",
      discipline_2: "",
      discipline_3: "",
      discipline_4: "",
      appearanceAndNeatness_0: "",
      appearanceAndNeatness_1: "",
      appearanceAndNeatness_2: "",
      appearanceAndNeatness_3: "",
      appearanceAndNeatness_4: "",
      alcoholicStatus: "Non-Alcoholic",
      pmeStatus: "Fit",
      refStatus: "Cleared",
      counselling: "Not Required",
      automaticTraining: "Not Required",
      remarks: ""
    };
  };

  const getTiSectionScore = (criterionKey, answers, quizMarks = null) => {
    if (criterionKey === "knowledgeOfRules" || criterionKey === "knowledgeMarks") {
      return (quizMarks !== null && quizMarks !== undefined) ? Number(quizMarks) : (answers.knowledgeOfRules === "yes" || answers.knowledgeOfRules === "Yes" ? 25 : 0);
    }
    let weight = 0;

    const tmCrit = TI_TM_CRITERIA.find(c => c.key === criterionKey);
    if (tmCrit) {
      weight = 3;
    } else {
      const ssCrit = TI_SS_CRITERIA.find(c => c.key === criterionKey);
      if (ssCrit) {
        weight = ssCrit.weight;
      } else {
        const smCrit = TI_SM_CRITERIA.find(c => c.key === criterionKey);
        if (smCrit) {
          weight = smCrit.weight;
        } else {
          const tiCrit = assessmentCriteria.find(c => c.key === criterionKey);
          if (tiCrit) {
            if (criterionKey === "alertnessAndObservation") weight = 5;
            else if (criterionKey === "safetyRecord") weight = 3;
            else if (criterionKey === "leadershipAndManagement") weight = 3;
            else if (criterionKey === "discipline") weight = 2;
            else if (criterionKey === "appearanceAndNeatness") weight = 2;
          }
        }
      }
    }

    if (weight === 0) return 0;

    let score = 0;
    for (let i = 0; i < 5; i++) {
      const arrVal = Array.isArray(answers[criterionKey]) ? answers[criterionKey][i] : null;
      const val = answers[`${criterionKey}_${i}`] || arrVal;
      if (val === "yes" || val === "Yes") {
        score += weight;
      }
    }
    return score;
  };

  const calculateAssessmentScore = (answers = {}, isMultiSection = false, quizMarks = null, tab = "TI") => {
    let criteriaToUse = assessmentCriteria;
    if (tab === "TM") criteriaToUse = TI_TM_CRITERIA;

    if (isMultiSection || tab === "TM") {
      let sum = criteriaToUse.reduce((total, criterion) => {
        return total + getTiSectionScore(criterion.key, answers, quizMarks);
      }, 0);
      if (tab === "TM") {
        sum += getTiSectionScore("knowledgeMarks", answers, quizMarks);
      }
      return sum;
    }
    return criteriaToUse.reduce((total, criterion) => {
      return total + (answers[criterion.key] === "yes" ? criterion.marks : 0);
    }, 0);
  };

  const countAnsweredCriteria = (answers = {}) =>
    assessmentCriteria.reduce((count, criterion) => {
      const value = answers[criterion.key];
      return count + (value === "yes" || value === "no" ? 1 : 0);
    }, 0);

  const computeScoreAndGrade = (target) => {
    const effectiveAnswers = answersByAssessment[target.id] || buildPrefilledAnswers(target.title);
    const tab = resolveAssessmentTab(target.title);
    const isMultiSection = tab === "TI" || tab === "SS" || tab === "TM";

    let effectiveQuizMarks = target.quizMarks;
    if (effectiveQuizMarks === null || effectiveQuizMarks === undefined) {
      const hrmsId = target.hrmsId || target.employeeId || target.id;
      const offlineSs = JSON.parse(sessionStorage.getItem(`ss_mcq_test_${hrmsId}`) || localStorage.getItem(`ss_mcq_test_${hrmsId}`) || "null");
      const offlineSm = JSON.parse(sessionStorage.getItem(`sm_mcq_test_${hrmsId}`) || localStorage.getItem(`sm_mcq_test_${hrmsId}`) || "null");
      const offlineTm = JSON.parse(sessionStorage.getItem(`tm_mcq_test_${hrmsId}`) || localStorage.getItem(`tm_mcq_test_${hrmsId}`) || "null");
      const offlinePm = JSON.parse(sessionStorage.getItem(`pm_mcq_test_${hrmsId}`) || localStorage.getItem(`pm_mcq_test_${hrmsId}`) || "null");

      if (offlineSs && offlineSs.correctCount !== undefined) effectiveQuizMarks = offlineSs.correctCount;
      else if (offlineSm && offlineSm.correctCount !== undefined) effectiveQuizMarks = offlineSm.correctCount;
      else if (offlineTm && offlineTm.correctCount !== undefined) effectiveQuizMarks = offlineTm.correctCount;
      else if (offlinePm && offlinePm.correctCount !== undefined) effectiveQuizMarks = offlinePm.correctCount;
    }

    const score = calculateAssessmentScore(effectiveAnswers, isMultiSection, effectiveQuizMarks, tab);
    let grade = score >= 90 ? "A" : score >= 80 ? "B" : "C";
    if (effectiveAnswers.alcoholicStatus === "Alcoholic") {
      grade = "D";
    }
    return { score, grade };
  };

  const buildAssessmentTableMeta = (item, approved = false) => {
    const designation = extractDesignation(item.title);
    const hrmsId = item.id || item.title.split(" - ")[1] || "-";
    const nameMatch = item.employeeLine?.match(/Employee:\s*([^|]+)/i);
    const employeeName = nameMatch ? nameMatch[1].trim() : "-";
    const dateLine = item.assessedByLine || item.detail || "";
    const dateMatch = dateLine.match(/(\d{4}-\d{2}-\d{2})/);
    const lastAssessed = dateMatch ? dateMatch[1] : "-";

    if (approved) {
      const scoreMatch = (item.score || "").match(/Score:\s*(\d+)\/100\s*-\s*Grade:\s*([A-D])/i);
      return {
        hrmsId,
        employeeName,
        designation,
        status: "Approved",
        score: scoreMatch ? scoreMatch[1] : "-",
        grade: scoreMatch ? scoreMatch[2].toUpperCase() : "-",
        lastAssessed
      };
    }

    const { score, grade } = computeScoreAndGrade(item);
    return {
      hrmsId,
      employeeName,
      designation,
      status: item.statusLabel || "Pending",
      score,
      grade,
      lastAssessed
    };
  };

  const handleViewAssessmentDetails = (title, detailLine, statusLabel) => {
    setAssessmentActionNotice(`Opened details for ${title}`);
    window.alert(`${title}\n${detailLine}\nStatus: ${statusLabel}`);
  };

  const handleAssignAssessment = async (employeeIdOrHrms, roleName) => {
    if (!isSupabaseConfigured) return;
    try {
      const typeMap = {
        'Traffic Inspector': 'Safety Exam',
        'Station Superintendent': 'Station Superintendent Assessment',
        'Station Master': 'Station Master Assessment',
        'Train Manager': 'Train Manager Assessment',
        'Pointsman': 'Checklist Evaluation'
      };
      const assessmentType = typeMap[roleName] || 'Assessment';

      const isValidUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

      // Resolve employee HRMS ID → UUID if needed
      let resolvedEmployeeId = employeeIdOrHrms;
      if (!isValidUUID(resolvedEmployeeId)) {
        const { data: uData, error: uErr } = await supabase
          .from('USERS')
          .select('user_id')
          .eq('hrms_id', resolvedEmployeeId)
          .single();
        if (uErr || !uData) throw new Error(`Could not find user with HRMS ID: ${resolvedEmployeeId}`);
        resolvedEmployeeId = uData.user_id;
      }

      // Resolve AOM (conducted_by) UUID — user.userId may be undefined for sandbox logins
      let conductedByUuid = user.userId;
      if (!isValidUUID(conductedByUuid)) {
        // Try to resolve from user.hrmsId
        const aomHrms = user.hrmsId || user.hrms_id;
        if (aomHrms) {
          const { data: aomData } = await supabase
            .from('USERS')
            .select('user_id')
            .eq('hrms_id', aomHrms)
            .single();
          if (aomData?.user_id) conductedByUuid = aomData.user_id;
        }
        // Final fallback: use employee's own UUID (acceptable for sandbox demo)
        if (!isValidUUID(conductedByUuid)) {
          conductedByUuid = resolvedEmployeeId;
        }
      }

      // Check if there's already a Pending, AVAILABLE, or Submitted exam for this employee
      const { data: existing } = await supabase
        .from('ASSESSMENT')
        .select('assessment_id, status')
        .eq('employee_id', resolvedEmployeeId)
        .in('status', ['Pending', 'Submitted', 'AVAILABLE'])
        .limit(1);

      if (existing && existing.length > 0) {
        setAssessmentActionNotice(`This employee already has a ${existing[0].status} exam. Cannot send duplicate access.`);
        return;
      }

      // Check if there is an existing assessment record for this employee with status 'LOCKED'
      const { data: lockedAssessments } = await supabase
        .from('ASSESSMENT')
        .select('assessment_id')
        .eq('employee_id', resolvedEmployeeId)
        .eq('status', 'LOCKED')
        .limit(1);

      if (lockedAssessments && lockedAssessments.length > 0) {
        // Update status of the existing LOCKED record to 'AVAILABLE'
        const { error: updateError } = await supabase
          .from('ASSESSMENT')
          .update({
            status: 'AVAILABLE',
            conducted_by: conductedByUuid,
            assessment_date: new Date().toISOString().slice(0, 10),
            assessment_type: assessmentType
          })
          .eq('assessment_id', lockedAssessments[0].assessment_id);
        if (updateError) throw updateError;
      } else {
        // Insert new assessment with status 'AVAILABLE'
        const { error } = await supabase.from('ASSESSMENT').insert([{
          employee_id: resolvedEmployeeId,
          conducted_by: conductedByUuid,
          assessment_date: new Date().toISOString().slice(0, 10),
          assessment_type: assessmentType,
          status: 'AVAILABLE'
        }]);
        if (error) throw error;
      }

      // Sync test activation to localStorage for mock/demo offline modules
      let employeeHrmsId = employeeIdOrHrms;
      if (isValidUUID(employeeHrmsId)) {
        try {
          const { data: userData } = await supabase
            .from('USERS')
            .select('hrms_id')
            .eq('user_id', employeeHrmsId)
            .single();
          if (userData?.hrms_id) {
            employeeHrmsId = userData.hrms_id;
          }
        } catch (uErr) {
          console.error("Error fetching hrms_id in handleAssignAssessment:", uErr);
        }
      }

      if (employeeHrmsId) {
        if (roleName === "Station Superintendent" || assessmentType === "Station Superintendent Assessment" || assessmentType === "SS Assessment") {
          localStorage.setItem(`ss_test_activated_${employeeHrmsId}`, "true");
          localStorage.setItem(`ss_test_activated_time_${employeeHrmsId}`, Date.now().toString());
          localStorage.setItem(`ss_test_assigned_${employeeHrmsId}`, "Assigned");
          localStorage.removeItem(`ss_mcq_test_${employeeHrmsId}`);
        } else if (roleName === "Station Master" || assessmentType === "Station Master Assessment" || assessmentType === "SM Assessment") {
          localStorage.setItem(`sm_test_activated_${employeeHrmsId}`, "true");
          localStorage.setItem(`sm_test_activated_time_${employeeHrmsId}`, Date.now().toString());
          localStorage.setItem(`sm_test_assigned_${employeeHrmsId}`, "Assigned");
          localStorage.removeItem(`sm_mcq_test_${employeeHrmsId}`);
        } else if (roleName === "Train Manager" || assessmentType === "Train Manager Assessment" || assessmentType === "TM Assessment") {
          localStorage.setItem(`tm_test_activated_${employeeHrmsId}`, "true");
          localStorage.setItem(`tm_test_activated_time_${employeeHrmsId}`, Date.now().toString());
          localStorage.setItem(`tm_test_assigned_${employeeHrmsId}`, "Assigned");
          localStorage.removeItem(`tm_mcq_test_${employeeHrmsId}`);
        } else if (roleName === "Pointsman" || assessmentType === "Checklist Evaluation" || assessmentType === "PM Assessment" || assessmentType === "Pointsman Checklist") {
          localStorage.setItem(`pm_test_activated_${employeeHrmsId}`, "true");
          localStorage.setItem(`pm_test_activated_time_${employeeHrmsId}`, Date.now().toString());
          localStorage.setItem(`pm_test_assigned_${employeeHrmsId}`, "Assigned");
          localStorage.removeItem(`pm_mcq_test_${employeeHrmsId}`);
        } else if (roleName === "Traffic Inspector" || assessmentType === "Safety Exam" || assessmentType === "TI Assessment") {
          localStorage.setItem(`ti_test_activated_${employeeHrmsId}`, "true");
          localStorage.setItem(`ti_test_activated_time_${employeeHrmsId}`, Date.now().toString());
          localStorage.setItem(`ti_test_assigned_${employeeHrmsId}`, "Assigned");
          localStorage.removeItem(`ti_mcq_test_${employeeHrmsId}`);
        }
        window.dispatchEvent(new Event("storage"));
      }

      setAssessmentActionNotice(`Exam access sent successfully!`);
      if (assessmentType === "Safety Exam") {
        window.alert("test is been send to the TI.");
      } else {
        window.alert("Assessment access has been successfully sent to the employee.");
      }
      await fetchLiveDatabaseData();
    } catch (err) {
      console.error("Error assigning assessment:", err);
      setAssessmentActionNotice(`Failed to assign assessment: ${err.message || err.details || JSON.stringify(err)}`);
    }
  };

  const sendBatchExamAccessAOM = async (role, hrmsIds) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      let aomUserUuid = user?.userId;
      const isValidUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

      if (!isValidUUID(aomUserUuid)) {
        const aomHrms = user.hrmsId || user.hrms_id;
        if (aomHrms) {
          const { data: aomData } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", aomHrms)
            .single();
          if (aomData?.user_id) aomUserUuid = aomData.user_id;
        }
      }

      const roleName = role === "TI" ? "Traffic Inspector" : "Station Superintendent";
      const assessType = role === "TI" ? "Safety Exam" : "Station Superintendent Assessment";
      const keyPrefix = role.toLowerCase(); // "ti" or "ss"

      for (const hrmsId of hrmsIds) {
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
                  conducted_by: aomUserUuid || empUserUuid,
                  assessment_date: today,
                  assessment_type: assessType
                })
                .eq("assessment_id", lockedAssessments[0].assessment_id);
            } else {
              // Insert a new AVAILABLE assessment record
              await supabase.from("ASSESSMENT").insert([{
                employee_id: empUserUuid,
                conducted_by: aomUserUuid || empUserUuid,
                assessment_type: assessType,
                status: "AVAILABLE",
                assessment_date: today
              }]);
            }

            // Create notification for employee
            const aomName = user?.name || "AOM";
            await supabase.from("NOTIFICATION").insert([{
              user_id: empUserUuid,
              title: "Assessment Access Granted",
              message: `Your safety competency assessment has been activated by Area Operations Manager ${aomName}. You can now attempt the safety exam in your portal.`,
              is_read: false
            }]);
          }
        }
      }

      window.dispatchEvent(new Event("storage"));
      await fetchLiveDatabaseData();
      setSelectedHrmsIds([]);
      setAssessmentActionNotice(`Successfully activated assessment access for ${hrmsIds.length} employee(s).`);
    } catch (err) {
      console.error("Error in batch activation:", err);
      alert("Error sending batch assessment access: " + err.message);
    }
  };

  const updateEmployeeScheduleAOM = async (role, hrmsId, date, time, reason) => {
    if (!hrmsId || !date) return { success: false, error: "Missing required fields" };
    try {
      const today = new Date().toISOString().slice(0, 10);

      // Resolve AOM User UUID
      let aomUserUuid = user?.userId;
      const isValidUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

      if (!isValidUUID(aomUserUuid)) {
        const aomHrms = user.hrmsId || user.hrms_id;
        if (aomHrms) {
          const { data: aomData } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", aomHrms)
            .single();
          if (aomData?.user_id) aomUserUuid = aomData.user_id;
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

        const baseAssessType = role === "SM" ? "Station Master Assessment" :
                               role === "SS" ? "Station Superintendent Assessment" :
                               role === "TM" ? "Train Manager Assessment" :
                               role === "TI" ? "Safety Exam" :
                               "Safety Exam";
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
              conducted_by: aomUserUuid || empUserUuid,
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
          user_id: aomUserUuid || empUserUuid,
          action: `Prev: ${prevDate} | New: ${date} ${time || "10:00 AM"} | Reason: ${reason} | Emp: ${hrmsId}`,
          table_name: "ASSESSMENT",
          record_id: assessmentId
        }]);

        // Insert Notification for Employee
        const aomName = user?.name || "AOM";
        await supabase.from("NOTIFICATION").insert([{
          user_id: empUserUuid,
          title: "Assessment Schedule Modified",
          message: `Your safety assessment schedule has been modified by Area Operations Manager ${aomName}. New Due Date: ${date} ${time || "10:00 AM"}.`,
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

  const handleApproveAssessment = async (id) => {
    const target = pendingAssessments.find((item) => item.id === id);
    if (!target) {
      return;
    }

    const answers = answersByAssessment[id] || {};
    const tab = resolveAssessmentTab(target.title);
    const isMultiSection = tab === "TI" || tab === "SS";

    // Validate alcoholicStatus
    if (!answers.alcoholicStatus || (answers.alcoholicStatus !== "Alcoholic" && answers.alcoholicStatus !== "Non-Alcoholic")) {
      alert("Validation Error: Please select an Alcoholic Status.");
      return;
    }

    // Validate checklist questions
    let requiredKeys = [];
    if (isMultiSection) {
      // Extract offline quizMarks if target.quizMarks is null
      let effectiveQuizMarks = target.quizMarks;
      if (effectiveQuizMarks === null || effectiveQuizMarks === undefined) {
        const hrmsId = target.hrmsId || target.employeeId || target.id;
        const offlineSs = JSON.parse(sessionStorage.getItem(`ss_mcq_test_${hrmsId}`) || localStorage.getItem(`ss_mcq_test_${hrmsId}`) || "null");
        const offlineSm = JSON.parse(sessionStorage.getItem(`sm_mcq_test_${hrmsId}`) || localStorage.getItem(`sm_mcq_test_${hrmsId}`) || "null");
        const offlineTm = JSON.parse(sessionStorage.getItem(`tm_mcq_test_${hrmsId}`) || localStorage.getItem(`tm_mcq_test_${hrmsId}`) || "null");
        const offlinePm = JSON.parse(sessionStorage.getItem(`pm_mcq_test_${hrmsId}`) || localStorage.getItem(`pm_mcq_test_${hrmsId}`) || "null");
        if (offlineSs && offlineSs.correctCount !== undefined) effectiveQuizMarks = offlineSs.correctCount;
        else if (offlineSm && offlineSm.correctCount !== undefined) effectiveQuizMarks = offlineSm.correctCount;
        else if (offlineTm && offlineTm.correctCount !== undefined) effectiveQuizMarks = offlineTm.correctCount;
        else if (offlinePm && offlinePm.correctCount !== undefined) effectiveQuizMarks = offlinePm.correctCount;
      }

      // For SS/TI, Knowledge of Rules is filled by CBT unless effectiveQuizMarks is null
      if (effectiveQuizMarks === null || effectiveQuizMarks === undefined) {
        requiredKeys.push("knowledgeOfRules");
      }
      const criteriaList = [
        "alertnessAndObservation",
        "safetyRecord",
        "leadershipAndManagement",
        "discipline",
        "appearanceAndNeatness"
      ];
      criteriaList.forEach((crit) => {
        for (let i = 0; i < 5; i++) {
          requiredKeys.push(`${crit}_${i}`);
        }
      });
    } else {
      requiredKeys = [
        "knowledgeOfRules",
        "alertnessAndObservation",
        "safetyRecord",
        "leadershipAndManagement",
        "discipline",
        "appearanceAndNeatness"
      ];
    }

    for (const key of requiredKeys) {
      let val = answers[key];
      if (val === undefined || val === null || val === "") {
        const underIdx = key.lastIndexOf("_");
        if (underIdx !== -1) {
          const secKey = key.substring(0, underIdx);
          const idx = parseInt(key.substring(underIdx + 1));
          if (Array.isArray(answers[secKey])) {
            val = answers[secKey][idx];
          }
        }
      }
      if (val !== "yes" && val !== "no" && val !== "Yes" && val !== "No") {
        alert("Validation Error: Please answer all checklist questions (Yes/No).");
        return;
      }
    }

    const { score: computedScore, grade } = computeScoreAndGrade(target);

    // Resolve AOM UUID for approved_by
    const isValidUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    let approvedByUuid = user.userId;
    if (!isValidUUID(approvedByUuid)) {
      const aomHrms = user.hrmsId || user.hrms_id;
      if (aomHrms) {
        const { data: aomData } = await supabase
          .from('USERS').select('user_id').eq('hrms_id', aomHrms).single();
        if (aomData?.user_id) approvedByUuid = aomData.user_id;
      }
    }

    try {
      const { error: updateError } = await supabase
        .from("ASSESSMENT")
        .update({ status: "Approved" })
        .eq("assessment_id", id);
      if (updateError) throw updateError;

      if (approvedByUuid) {
        await supabase.from("APPROVAL").insert([{
          assessment_id: id,
          approved_by: approvedByUuid,
          approval_level: "AOM",
          remarks: "Approved by AOM via console"
        }]);
      }

      // Update TEST_ATTEMPT with the final combined score (MCQ 25 + checklist 75)
      const { error: taErr } = await supabase.from("TEST_ATTEMPT").update({
        obtained_marks: computedScore,
        percentage: computedScore,
        category: grade,
        total_marks: 100,
        answers: answers
      }).eq("assessment_id", id);
      if (taErr) console.warn("TEST_ATTEMPT update warning:", taErr.message);

      // Update EMPLOYEE_PROFILE with the final score and category
      const hrmsId = target.title.split(" - ")[1] || "";
      const targetEmp = users.find(u => u.hrmsId === hrmsId || u.id === hrmsId);
      const empUserId = targetEmp?.user_id || (isValidUUID(target.employeeId) ? target.employeeId : null);
      if (empUserId) {
        await supabase.from("EMPLOYEE_PROFILE").update({
          current_score: computedScore,
          category: grade
        }).eq("user_id", empUserId);
      }

      setAssessmentActionNotice(`${target.title} approved. Score: ${computedScore}/100 (${grade})`);
      setOpenAssessmentId((prev) => (prev === id ? null : prev));
      await fetchLiveDatabaseData();
    } catch (err) {
      console.error("Error approving assessment:", err);
      setAssessmentActionNotice("Failed to approve assessment in database.");
    }
  };

  const handleRejectAssessment = async (id) => {
    const target = pendingAssessments.find((item) => item.id === id);
    if (!target) return;
    try {
      const { error: updateError } = await supabase
        .from("ASSESSMENT")
        .update({ status: "Rejected" })
        .eq("assessment_id", id);
      if (updateError) throw updateError;

      setAssessmentActionNotice(`${target.title} rejected.`);
      setOpenAssessmentId((prev) => (prev === id ? null : prev));
      await fetchLiveDatabaseData();
    } catch (err) {
      console.error("Error rejecting assessment:", err);
      setAssessmentActionNotice("Failed to reject assessment in database.");
    }
  };

  const handleStartAssessment = (id) => {
    setPendingAssessments((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
            ...item,
            statusLabel: "Pending Approval",
            assessedByLine: `Assessed by: AOM/G - on ${todayIso()}`,
            actionType: "approval"
          }
          : item
      )
    );
    setReportRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
            ...row,
            assessmentStatus: "In Progress",
            lastAssessed: todayIso()
          }
          : row
      )
    );
    setAssessmentActionNotice(`Assessment started for ${id}.`);
  };

  const handleOpenAssessmentForm = (item) => {
    const tab = resolveAssessmentTab(item.title);
    setAssessmentRoleTab(tab);
    setOpenAssessmentId(item.id);

    const origAssess = allDbAssessments ? allDbAssessments.find(a => a.assessment_id === item.id) : null;
    const dbAnswers = origAssess?.TEST_ATTEMPT?.[0]?.answers || origAssess?.TEST_ATTEMPT?.answers;
    let parsedAnswers = {};
    if (dbAnswers) {
      try {
        parsedAnswers = typeof dbAnswers === "string" ? JSON.parse(dbAnswers) : dbAnswers;
      } catch (e) {
        console.error("Error parsing dbAnswers:", e);
      }
    }

    setAnswersByAssessment((prev) => {
      return {
        ...prev,
        [item.id]: {
          ...buildPrefilledAnswers(item.title),
          ...parsedAnswers
        }
      };
    });
  };

  const getTiRosterList = () => {
    return trafficInspectors.map((ti) => {
      const pending = pendingAssessments.find(p => p.employeeId === ti.employeeId || p.id === ti.employeeId);
      const approved = approvedAssessments.find(a => a.employeeId === ti.employeeId || a.id === ti.employeeId);

      let status = "Pending";
      let score = ti.lastScore || "";
      let lastAssessed = ti.lastAssessedDate || "2026-04-07";

      if (pending) {
        status = pending.actionType === "approval" ? "Submitted" : "Exam Sent";
      } else if (approved) {
        status = "Approved";
        const match = approved.score?.match(/Score:\s*(\d+)/i);
        score = match ? parseInt(match[1]) : (ti.lastScore || 85);
        const dateMatch = approved.detail?.match(/on\s+(\d{4}-\d{2}-\d{2})/i);
        lastAssessed = dateMatch ? dateMatch[1] : "2026-04-07";
      } else {
        status = ti.assessmentStatus === "Completed" ? "Approved" : (ti.assessmentStatus || "Pending");
      }

      return {
        ...ti,
        status,
        score,
        lastAssessed
      };
    });
  };

  const openTiForm = (ti) => {
    let pendingItem = pendingAssessments.find(p => p.employeeId === ti.employeeId || p.id === ti.employeeId || p.hrmsId === (ti.hrmsId || ti.employeeId));
    if (!pendingItem) {
      const approvedItem = approvedAssessments.find(a => a.employeeId === ti.employeeId || a.id === ti.employeeId || a.hrmsId === (ti.hrmsId || ti.employeeId));
      if (approvedItem) {
        pendingItem = {
          id: approvedItem.id,
          title: approvedItem.title,
          statusLabel: "Approved",
          assessedByLine: approvedItem.detail,
          employeeLine: `Employee: ${ti.name} | Division: ${ti.division || "Nagpur"}`,
          actionType: "approval"
        };
      } else {
        window.alert("No active assessment found. Please assign an exam first.");
        return;
      }
    }

    setOpenAssessmentId(pendingItem.id);
    const tab = resolveAssessmentTab(pendingItem.title);
    setAssessmentRoleTab(tab);

    const origAssess = allDbAssessments ? allDbAssessments.find(a => a.assessment_id === pendingItem.id) : null;
    const dbAnswers = origAssess?.TEST_ATTEMPT?.[0]?.answers || origAssess?.TEST_ATTEMPT?.answers;
    let parsedAnswers = {};
    if (dbAnswers) {
      try {
        parsedAnswers = typeof dbAnswers === "string" ? JSON.parse(dbAnswers) : dbAnswers;
      } catch (e) {
        console.error("Error parsing dbAnswers:", e);
      }
    }

    const totalScore = origAssess?.TEST_ATTEMPT?.[0]?.obtained_marks || origAssess?.TEST_ATTEMPT?.obtained_marks || 0;
    if (totalScore > 0 && Object.keys(parsedAnswers).length === 0) {
      if (tab === "TI") {
        const mcqScore = Math.round(totalScore * 0.25);
        const checklistTarget = totalScore - mcqScore;
        const sections = [
          { key: "alertnessAndObservation", weight: 5 },
          { key: "safetyRecord", weight: 3 },
          { key: "leadershipAndManagement", weight: 3 },
          { key: "discipline", weight: 2 },
          { key: "appearanceAndNeatness", weight: 2 }
        ];
        const slots = [];
        sections.forEach(sec => {
          for (let i = 0; i < 5; i++) {
            slots.push({ key: `${sec.key}_${i}`, weight: sec.weight });
          }
        });
        slots.sort((a, b) => b.weight - a.weight);
        let recursiveCalls = 0;
        const findSubset = (target, index, currentSum, chosen) => {
          recursiveCalls++;
          if (recursiveCalls > 500) return false;
          if (currentSum === target) return true;
          if (index >= slots.length || currentSum > target) return false;
          chosen.add(slots[index].key);
          if (findSubset(target, index + 1, currentSum + slots[index].weight, chosen)) return true;
          chosen.delete(slots[index].key);
          if (findSubset(target, index + 1, currentSum, chosen)) return true;
          return false;
        };
        let tempTarget = checklistTarget;
        while (tempTarget >= 0) {
          const chosenKeys = new Set();
          if (findSubset(tempTarget, 0, 0, chosenKeys)) {
            slots.forEach(slot => {
              parsedAnswers[slot.key] = chosenKeys.has(slot.key) ? "yes" : "no";
            });
            break;
          }
          tempTarget--;
        }
        parsedAnswers.mcqScore = mcqScore;
        parsedAnswers.knowledgeMarks = String(mcqScore);
        parsedAnswers.knowledgeOfRules = mcqScore >= 12 ? "yes" : "no";
        parsedAnswers.alcoholicStatus = "Non-Alcoholic";
        parsedAnswers.pmeStatus = "Fit";
        parsedAnswers.refStatus = "Cleared";
        parsedAnswers.counselling = "Not Required";
        parsedAnswers.automaticTraining = "Not Required";
        parsedAnswers.remarks = "Synced from database score";
      }
    }

    setAnswersByAssessment((prev) => {
      return {
        ...prev,
        [pendingItem.id]: {
          ...buildPrefilledAnswers(pendingItem.title),
          ...parsedAnswers
        }
      };
    });
  };

  const handleAnswerChange = (assessmentId, criterionKey, value) => {
    setAnswersByAssessment((prev) => ({
      ...prev,
      [assessmentId]: {
        ...(prev[assessmentId] || {}),
        [criterionKey]: value
      }
    }));
  };

  const handleSelectAllYes = (assessmentIds, roleTab) => {
    if (!assessmentIds || assessmentIds.length === 0) {
      setAssessmentActionNotice("No employees available in the selected option.");
      return;
    }

    const allYes = assessmentCriteria.reduce((acc, criterion) => {
      acc[criterion.key] = "yes";
      return acc;
    }, {});

    const isMultiSection = roleTab === "TI" || roleTab === "SS";
    const multiSecYes = {
      knowledgeOfRules: "yes",
      alcoholicStatus: "Non-Alcoholic",
      pmeStatus: "Fit",
      refStatus: "Cleared",
      counselling: "Not Required",
      automaticTraining: "Not Required",
      remarks: ""
    };
    const criteriaList = [
      "alertnessAndObservation",
      "safetyRecord",
      "leadershipAndManagement",
      "discipline",
      "appearanceAndNeatness"
    ];
    criteriaList.forEach(crit => {
      for (let i = 0; i < 5; i++) {
        multiSecYes[`${crit}_${i}`] = "yes";
      }
    });

    setAnswersByAssessment((prev) => {
      const next = { ...prev };
      assessmentIds.forEach((assessmentId) => {
        next[assessmentId] = isMultiSection ? { ...multiSecYes } : { ...allYes };
      });
      return next;
    });

    setAssessmentActionNotice(`All answers marked Yes for ${assessmentIds.length} employee(s) in ${roleTab} option.`);
  };

  const handleApproveAllInSelectedOption = () => {
    const targets = pendingAssessments.filter((item) => resolveAssessmentTab(item.title) === assessmentRoleTab);
    if (targets.length === 0) {
      setAssessmentActionNotice("No employees to approve in the selected option.");
      return;
    }

    const approvedDate = todayIso();
    const approvedBatch = targets.map((target) => {
      const { score, grade } = computeScoreAndGrade(target);
      return {
        id: target.id,
        title: target.title,
        employeeLine: target.employeeLine,
        detail: `Approved by: AOM/G - on ${approvedDate}`,
        score: `Score: ${score}/100 - Grade: ${grade}`
      };
    });

    const updatesById = approvedBatch.reduce((acc, item) => {
      const scoreMatch = (item.score || "").match(/Score:\s*(\d+)\/100\s*-\s*Grade:\s*([A-D])/i);
      acc[item.id] = {
        score: scoreMatch ? scoreMatch[1] : "-",
        grade: scoreMatch ? scoreMatch[2].toUpperCase() : "-",
        lastAssessed: approvedDate
      };
      return acc;
    }, {});

    setPendingAssessments((prev) => prev.filter((item) => resolveAssessmentTab(item.title) !== assessmentRoleTab));
    setApprovedAssessments((prev) => [...approvedBatch, ...prev]);
    setReportRows((prev) =>
      prev.map((row) => {
        const updated = updatesById[row.id];
        if (!updated) {
          return row;
        }

        return {
          ...row,
          assessmentStatus: "Approved",
          score: updated.score,
          grade: updated.grade,
          lastAssessed: updated.lastAssessed
        };
      })
    );

    setOpenAssessmentId((prev) => (targets.some((item) => item.id === prev) ? null : prev));
    setAssessmentActionNotice(`Approved all ${targets.length} employee(s) in ${assessmentRoleTab} option.`);
  };

  const toggleCriterion = (assessmentId, criterionKey) => {
    setExpandedCriterionKey((prev) => {
      const mapKey = `${assessmentId}:${criterionKey}`;
      return {
        ...prev,
        [mapKey]: !prev[mapKey]
      };
    });
  };

  const handleViewReport = (row) => {
    window.alert(
      `${row.designation} - ${row.hrmsId}\nEmployee: ${row.name}\nStatus: ${row.assessmentStatus}\nScore: ${row.score}\nGrade: ${row.grade}\nLast Assessed: ${row.lastAssessed}`
    );
  };

  const handleAssessReport = (id) => {
    setReportRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
            ...row,
            assessmentStatus: "In Progress",
            lastAssessed: todayIso()
          }
          : row
      )
    );
    setAssessmentActionNotice(`Assessment opened for ${id}.`);
  };

  const handleSettingsToggle = (key) => {
    setAomSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSettingsSelect = (key, value) => {
    setAomSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    setAssessmentRoleTab(aomSettings.defaultAssessmentTab);
    setSettingsNotice("Settings saved successfully.");
  };

  const filteredReportRows = reportRows.filter((row) => {
    const searchText = reportSearchQuery.trim().toLowerCase();
    const matchesSearch =
      searchText.length === 0 ||
      row.hrmsId.toLowerCase().includes(searchText) ||
      row.name.toLowerCase().includes(searchText);
    const matchesDesignation = reportDesignation === "All Designations" || row.designation === reportDesignation;
    return matchesSearch && matchesDesignation;
  });

  const handleSidebarClick = (label) => {
    setView(null);
    setSelectedReportUserId(null);
    setRepApplied(false);
    setActivePage(label);

    if (label !== "Add Station") {
      setStationFormErrors({});
    }

    if (label === "Add Station") {
      setStationFormData(defaultStationForm);
      setStationFormErrors({});
      setStationDetailId(null);
      setIsStationEditMode(false);
    }

    // Reset role-directory filters when switching between role pages
    if (["Pointsmen", "Station Masters", "Station Superintendents", "Train Managers", "Traffic Inspectors"].includes(label)) {
      setRoleFilterName("");
      setRoleFilterStation("All");
      setRoleFilterDivision("All");
      setRoleFilterCat("All");
      setRoleFilterRisk("All");
      setSelectedRoleEmployee(null);
      setTiAssessmentFormOpen(null);
    }
  };


  const handleStationSubPage = (label) => {
    setActivePage(label);

    if (label === "Add Station") {
      setStationFormData(defaultStationForm);
      setStationFormErrors({});
      setStationDetailId(null);
      setIsStationEditMode(false);
    }
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setPendingFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateUserForm = () => {
    const errors = {};
    if (!userFormData.employeeName || !userFormData.employeeName.trim()) errors.employeeName = "Full Name is required";
    if (!userFormData.hrmsId || !userFormData.hrmsId.trim()) errors.hrmsId = "HRMS ID / Employee ID is required";
    if (!userFormData.mobileNo || !userFormData.mobileNo.trim()) errors.mobileNo = "Mobile Number is required";
    if (!userFormData.emailId || !userFormData.emailId.trim()) errors.emailId = "Email ID is required";
    if (!userFormData.designation) errors.designation = "Role / Designation is required";
    if (!userFormData.zone) errors.zone = "Zone is required";
    if (!userFormData.division) errors.division = "Division is required";
    if (!userFormData.stationName) errors.stationName = "Station Name is required";

    if (userFormData.designation === "Pointsman") {
      if (!userFormData.reportingSm || !userFormData.reportingSm.trim()) errors.reportingSm = "Reporting Station Master is required";
      if (!userFormData.shift) errors.shift = "Shift is required";
      if (!userFormData.workLocation || !userFormData.workLocation.trim()) errors.workLocation = "Work Location is required";
    } else if (userFormData.designation === "Station Master") {
      if (!userFormData.smStation) errors.smStation = "SM Station is required";
      if (!userFormData.smDivision) errors.smDivision = "SM Division is required";
      if (!userFormData.smZone) errors.smZone = "SM Zone is required";
    } else if (userFormData.designation === "Traffic Inspector") {
      if (!userFormData.jurisdiction || !userFormData.jurisdiction.trim()) errors.jurisdiction = "Jurisdiction is required";
      if (!userFormData.linkedStations || !userFormData.linkedStations.trim()) errors.linkedStations = "Linked Stations are required";
      if (!userFormData.reportingAom) errors.reportingAom = "Reporting AOM is required";
    }
    return errors;
  };

  const handleSubmitUser = (e) => {
    e.preventDefault();
    const errors = validateUserForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingUserId) {
      setUsers((prev) =>
        prev.map((row) =>
          row.id === editingUserId
            ? {
              ...row,
              ...userFormData
            }
            : row
        )
      );
      setEditingUserId(null);
    } else {
      setUsers((prev) => [
        ...prev,
        {
          ...userFormData,
          id: Date.now(),
          marks: 0
        }
      ]);
    }

    setUserFormData(initialUserFormData);
    setFormErrors({});
  };

  const handleEditUser = (id) => {
    const existing = users.find((row) => row.id === id);
    if (!existing) {
      return;
    }

    setUserFormData({
      employeeName: existing.employeeName || "",
      hrmsId: existing.hrmsId || "",
      mobileNo: existing.mobileNo || "",
      emailId: existing.emailId || "",
      designation: existing.designation || "",
      department: existing.department || "Operations",
      userType: existing.userType || "Employee",
      reportingOfficer: existing.reportingOfficer || "R. Kumar",
      zone: existing.zone || "",
      division: existing.division || "",
      stationName: existing.stationName || "",
      reportingSm: existing.reportingSm || "",
      shift: existing.shift || "",
      workLocation: existing.workLocation || "",
      smStation: existing.smStation || "",
      smDivision: existing.smDivision || "",
      smZone: existing.smZone || "",
      jurisdiction: existing.jurisdiction || "",
      linkedStations: existing.linkedStations || "",
      reportingAom: existing.reportingAom || ""
    });
    setEditingUserId(id);
    setFormErrors({});
  };

  const handleDeleteUser = (id) => {
    setUsers((prev) => prev.filter((row) => row.id !== id));
    if (editingUserId === id) {
      setEditingUserId(null);
      setUserFormData(initialUserFormData);
      setFormErrors({});
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setAppliedFilters(pendingFilters);
    setCurrentPage(1);
  };

  const filteredUsers = users.filter((row) => {
    const normalizedSearch = tableSearch.trim().toLowerCase();
    const matchSearch =
      normalizedSearch.length === 0 ||
      row.employeeName.toLowerCase().includes(normalizedSearch) ||
      row.hrmsId.toLowerCase().includes(normalizedSearch) ||
      row.mobileNo.toLowerCase().includes(normalizedSearch);

    const matchFilters =
      (appliedFilters.mobileNo === "" || row.mobileNo.includes(appliedFilters.mobileNo)) &&
      (appliedFilters.designation === "" || row.designation === appliedFilters.designation) &&
      (appliedFilters.hrmsId === "" || row.hrmsId.toLowerCase().includes(appliedFilters.hrmsId.toLowerCase())) &&
      (appliedFilters.department === "" || row.department === appliedFilters.department) &&
      (appliedFilters.userType === "" || row.userType === appliedFilters.userType);

    return matchSearch && matchFilters;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleStationFormChange = (e) => {
    const { name, value } = e.target;
    setStationFormData((prev) => {
      const updated = {
        ...prev,
        [name]: name === "stationCode" ? value.toUpperCase() : value
      };
      if (name === "runningLines") {
        updated.tracks = value;
      } else if (name === "tracks") {
        updated.runningLines = value;
      }
      return updated;
    });

    if (stationFormErrors[name]) {
      setStationFormErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
    if (name === "runningLines" && stationFormErrors.tracks) {
      setStationFormErrors((prev) => ({ ...prev, tracks: "" }));
    } else if (name === "tracks" && stationFormErrors.runningLines) {
      setStationFormErrors((prev) => ({ ...prev, runningLines: "" }));
    }
  };

  const handleStationStatusToggle = () => {
    setStationFormData((prev) => ({
      ...prev,
      status: prev.status === "Active" ? "Inactive" : "Active"
    }));
  };

  const validateStationForm = (formMode) => {
    const errors = {};
    const nameExists = stations.some(
      (station) => station.stationName.trim().toLowerCase() === stationFormData.stationName.trim().toLowerCase() && station.id !== stationDetailId
    );
    const codeExists = stations.some(
      (station) => station.stationCode.trim().toUpperCase() === stationFormData.stationCode.trim().toUpperCase() && station.id !== stationDetailId
    );

    if (!stationFormData.stationName.trim()) {
      errors.stationName = "Station Name is required";
    } else if (nameExists) {
      errors.stationName = "Station Name must be unique";
    }

    if (!stationFormData.stationCode.trim()) {
      errors.stationCode = "Station Code is required";
    } else if (codeExists) {
      errors.stationCode = "Station Code must be unique";
    }

    if (!stationFormData.platforms) errors.platforms = "Platforms count is required";
    if (!stationFormData.runningLines && !stationFormData.tracks) {
      errors.runningLines = "Running Lines count is required";
    }
    if (!stationFormData.address.trim()) errors.address = "Address is required";
    if (!stationFormData.district.trim()) errors.district = "District is required";
    if (!stationFormData.state.trim()) errors.state = "State is required";

    return errors;
  };

  const handleAddStationSubmit = async (e) => {
    e.preventDefault();
    const errors = validateStationForm("create");

    if (Object.keys(errors).length > 0) {
      setStationFormErrors(errors);
      return;
    }

    try {
      const payload = {
        stationName: stationFormData.stationName.trim(),
        stationCode: stationFormData.stationCode.trim().toUpperCase(),
        division: "Nagpur",
        zone: "Central Railway",
        category: stationFormData.category || "A",
        platforms: Number(stationFormData.platforms),
        runningLines: Number(stationFormData.runningLines || stationFormData.tracks),
        stationType: stationFormData.stationType || "Junction",
        status: stationFormData.status || "Active",
        address: stationFormData.address.trim(),
        district: stationFormData.district.trim(),
        state: stationFormData.state.trim(),
        section: "",
        assignedTi: ""
      };

      await saDataService.saveStation(payload, "add");
      setStationFormData(defaultStationForm);
      setStationFormErrors({});
      await fetchLiveDatabaseData();
      setActivePage("Station Management");
    } catch (err) {
      console.error("Error saving station in AOM:", err);
      alert("Failed to save station: " + err.message);
    }
  };

  const handleResetStationForm = () => {
    setStationFormData(defaultStationForm);
    setStationFormErrors({});
  };

  const handleStationFilterChange = (e) => {
    const { name, value } = e.target;
    setPendingStationFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyStationFilter = (e) => {
    e.preventDefault();
    setAppliedStationFilters(pendingStationFilters);
    setStationCurrentPage(1);
  };

  const filteredStations = stations.filter((station) => {
    const normalizedSearch = stationSearch.trim().toLowerCase();
    const matchSearch =
      normalizedSearch.length === 0 ||
      station.stationName.toLowerCase().includes(normalizedSearch) ||
      station.stationCode.toLowerCase().includes(normalizedSearch);

    const matchFilters =
      (appliedStationFilters.zone === "" || station.zone === appliedStationFilters.zone) &&
      (appliedStationFilters.division === "" || station.division === appliedStationFilters.division) &&
      (appliedStationFilters.category === "" || station.category === appliedStationFilters.category) &&
      (appliedStationFilters.status === "" || station.status === appliedStationFilters.status);

    return matchSearch && matchFilters;
  });

  const stationTotalPages = Math.max(1, Math.ceil(filteredStations.length / stationPageSize));
  const pagedStations = filteredStations.slice(
    (stationCurrentPage - 1) * stationPageSize,
    stationCurrentPage * stationPageSize
  );

  const goToPrevStationPage = () => {
    setStationCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextStationPage = () => {
    setStationCurrentPage((prev) => Math.min(stationTotalPages, prev + 1));
  };

  const openStationView = (stationId, editable = false) => {
    const target = stations.find((station) => station.id === stationId || station.stationId === stationId);
    if (!target) {
      return;
    }

    setStationDetailId(stationId);
    setStationFormData({
      stationName: target.stationName || target.name || "",
      stationCode: target.stationCode || target.code || "",
      zone: target.zone || "Central Railway",
      division: target.division || "Nagpur",
      section: target.section || "Nagpur - Wardha",
      category: target.category || "A",
      status: target.status || "Active",
      assignedTi: target.assignedTi || "",
      platforms: String(target.platforms || "3"),
      runningLines: String(target.runningLines || target.tracks || "5"),
      tracks: String(target.runningLines || target.tracks || "5"),
      address: target.address || "",
      district: target.district || "Nagpur",
      state: target.state || "Maharashtra",
      stationType: target.stationType || "Junction"
    });
    setStationFormErrors({});
    setIsStationEditMode(editable);
    setActivePage("View / Edit Station");
  };

  const handleUpdateStation = async (e) => {
    e.preventDefault();

    const errors = validateStationForm("update");
    if (Object.keys(errors).length > 0) {
      setStationFormErrors(errors);
      return;
    }

    try {
      const payload = {
        id: stationDetailId,
        stationName: stationFormData.stationName.trim(),
        stationCode: stationFormData.stationCode.trim().toUpperCase(),
        division: "Nagpur",
        zone: "Central Railway",
        category: stationFormData.category || "A",
        platforms: Number(stationFormData.platforms),
        runningLines: Number(stationFormData.runningLines || stationFormData.tracks),
        stationType: stationFormData.stationType || "Junction",
        status: stationFormData.status || "Active",
        address: stationFormData.address.trim(),
        district: stationFormData.district.trim(),
        state: stationFormData.state.trim(),
        section: "",
        assignedTi: ""
      };

      await saDataService.saveStation(payload, "edit");
      setStationFormData(defaultStationForm);
      setStationFormErrors({});
      setIsStationEditMode(false);
      setStationDetailId(null);
      await fetchLiveDatabaseData();
      setActivePage("Station Management");
    } catch (err) {
      console.error("Error updating station in AOM:", err);
      alert("Failed to update station: " + err.message);
    }
  };

  const handleDeleteStation = async (stationId) => {
    const targetStation = stations.find((station) => station.id === stationId || station.stationId === stationId);
    if (!targetStation) return;

    if (!window.confirm(`Are you sure you want to permanently delete station ${targetStation.stationName}?`)) {
      return;
    }

    // Check dependency: has operational staff assigned
    const assignedStaff = users.filter((u) => u.station === targetStation.stationName);
    if (assignedStaff.length > 0) {
      const staffNames = assignedStaff.map(u => `${u.name} (${u.hrmsId})`).join(", ");
      alert(`Cannot delete station. Operational staff are currently assigned to this station: ${staffNames}. Please reassign or delete these staff members first.`);
      return;
    }

    try {
      const res = await saDataService.deleteStation(stationId, targetStation.stationName);
      if (res && res.success) {
        setStations((prev) => prev.filter((station) => station.id !== stationId && station.stationId !== stationId));
        if (stationDetailId === stationId) {
          setStationDetailId(null);
          setIsStationEditMode(false);
        }
        await fetchLiveDatabaseData();
        setActivePage("Station Management");
      } else {
        alert("Failed to delete station: " + (res?.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error deleting station:", err);
      alert("Error deleting station: " + err.message);
    }
  };

  const handleTiFormChange = (e) => {
    const { name, value } = e.target;
    setTiFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (tiFormErrors[name]) {
      setTiFormErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateTiForm = () => {
    const errors = {};
    if (!tiFormData.name.trim()) errors.name = "Name is required";
    if (!tiFormData.employeeId.trim()) errors.employeeId = "Employee ID is required";
    if (!tiFormData.jurisdiction.trim()) errors.jurisdiction = "Jurisdiction is required";
    if (!tiFormData.category.trim()) errors.category = "Category is required";

    const duplicate = trafficInspectors.some(
      (row) => row.employeeId.toLowerCase() === tiFormData.employeeId.trim().toLowerCase()
    );
    if (duplicate) errors.employeeId = "Employee ID already exists";

    return errors;
  };

  const handleAddTiByForm = (e) => {
    e.preventDefault();
    const errors = validateTiForm();

    if (Object.keys(errors).length > 0) {
      setTiFormErrors(errors);
      return;
    }

    setTrafficInspectors((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...tiFormData,
        employeeId: tiFormData.employeeId.trim().toUpperCase(),
        division: tiFormData.jurisdiction,
        linkedStations: [],
        linkedSms: [],
        phone: "-",
        email: "-"
      }
    ]);

    setTiFormData(initialTiFormData);
    setTiFormErrors({});
    setTiNotice("Traffic Inspector added successfully.");
  };

  const matchedTiByHrms = hrmsTiDirectory.find(
    (row) => row.hrmsId.toLowerCase() === tiHrmsSearch.trim().toLowerCase()
  );

  const handleAddTiByHrms = () => {
    if (!matchedTiByHrms) {
      setTiNotice("No TI found with this HRMS ID.");
      return;
    }

    const alreadyExists = trafficInspectors.some(
      (row) => row.employeeId.toLowerCase() === matchedTiByHrms.hrmsId.toLowerCase()
    );

    if (alreadyExists) {
      setTiNotice("This TI already exists in the division list.");
      return;
    }

    setTrafficInspectors((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: matchedTiByHrms.name,
        employeeId: matchedTiByHrms.hrmsId,
        jurisdiction: matchedTiByHrms.jurisdiction,
        category: matchedTiByHrms.category,
        assessmentStatus: matchedTiByHrms.assessmentStatus,
        linkedStations: [],
        linkedSms: [],
        division: matchedTiByHrms.division,
        phone: matchedTiByHrms.phone,
        email: matchedTiByHrms.email
      }
    ]);

    setTiNotice(`Added ${matchedTiByHrms.name} from HRMS search.`);
    setTiHrmsSearch("");
  };

  const handleRemoveTi = (id) => {
    const ti = trafficInspectors.find((t) => t.id === id);
    const name = ti ? ti.name : "this Traffic Inspector";
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }
    setTrafficInspectors((prev) => prev.filter((ti) => ti.id !== id));
    if (selectedTiId === id) {
      setSelectedTiId(null);
    }
    if (tiLinkTargetId === id) {
      setTiLinkTargetId(null);
      setTiLinkDraft({ stations: [], sms: [] });
    }
  };

  const handleOpenTiProfile = (id) => {
    setSelectedTiId(id);
    setActivePage("Traffic Inspector Profile");
  };

  const handleOpenLinkTi = (id) => {
    const selected = trafficInspectors.find((row) => row.id === id);
    if (!selected) {
      return;
    }

    setTiLinkTargetId(id);
    setTiLinkDraft({
      stations: selected.linkedStations || [],
      sms: selected.linkedSms || []
    });
  };

  const toggleMultiValue = (type, value) => {
    setTiLinkDraft((prev) => {
      const currentValues = prev[type];
      const exists = currentValues.includes(value);
      return {
        ...prev,
        [type]: exists ? currentValues.filter((entry) => entry !== value) : [...currentValues, value]
      };
    });
  };

  const handleSaveTiLinks = () => {
    setTrafficInspectors((prev) =>
      prev.map((row) =>
        row.id === tiLinkTargetId
          ? {
            ...row,
            linkedStations: tiLinkDraft.stations,
            linkedSms: tiLinkDraft.sms
          }
          : row
      )
    );

    setTiNotice("TI links updated for Stations and SMs.");
    setTiLinkTargetId(null);
    setTiLinkDraft({ stations: [], sms: [] });
  };

  const handleShiftTi = (id) => {
    const targetDivision = tiShiftDrafts[id];
    if (!targetDivision) {
      return;
    }

    setTrafficInspectors((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
            ...row,
            jurisdiction: targetDivision,
            division: targetDivision
          }
          : row
      )
    );

    setTiNotice("TI jurisdiction updated successfully.");
  };

  const filteredTrafficInspectors = trafficInspectors.filter((row) => {
    const q = tiSearch.trim().toLowerCase();
    if (!q) {
      return true;
    }

    return row.name.toLowerCase().includes(q) || row.employeeId.toLowerCase().includes(q);
  });

  const selectedTiProfile = trafficInspectors.find((row) => row.id === selectedTiId) || null;
  const linkTargetTi = trafficInspectors.find((row) => row.id === tiLinkTargetId) || null;
  const stationLinkOptions = Array.from(new Set(stations.map((station) => station.stationName)));
  const smLinkOptions = Array.from(
    new Set(stations.map((station) => station.stationMasterName).filter((name) => Boolean(name && name.trim())))
  );

  const renderStationFormFields = (isReadOnly = false) => {
    return (
      <>
        <div className="add-user-grid station-grid">
          <div className="add-user-col">
            <h3 style={{ margin: "0 0 15px 0", color: "#1e293b", fontSize: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>Station Information</h3>

            <div className="form-group">
              <label>Station Name *</label>
              <input
                type="text"
                name="stationName"
                value={stationFormData.stationName}
                onChange={handleStationFormChange}
                placeholder="Enter station name"
                className={stationFormErrors.stationName ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.stationName && <span className="error-text">{stationFormErrors.stationName}</span>}
            </div>

            <div className="form-group">
              <label>Station Code *</label>
              <input
                type="text"
                name="stationCode"
                value={stationFormData.stationCode}
                onChange={handleStationFormChange}
                placeholder="e.g. NGP, WR"
                className={stationFormErrors.stationCode ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.stationCode && <span className="error-text">{stationFormErrors.stationCode}</span>}
            </div>


            <div className="form-group">
              <label>Station Status</label>
              <select
                name="status"
                value={stationFormData.status}
                onChange={handleStationFormChange}
                disabled={isReadOnly}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <h3 style={{ margin: "25px 0 15px 0", color: "#1e293b", fontSize: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>Railway Hierarchy</h3>

            <div className="form-group">
              <label>Division (Nagpur Division Only)</label>
              <input
                type="text"
                name="division"
                value={stationFormData.division || "Nagpur"}
                readOnly={true}
                className="readonly-input"
                style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
              />
            </div>
          </div>

          <div className="add-user-col">
            <h3 style={{ margin: "0 0 15px 0", color: "#1e293b", fontSize: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>Operational & Location Details</h3>

            <div className="form-group">
              <label>Number of Platforms *</label>
              <input
                type="number"
                min="0"
                name="platforms"
                value={stationFormData.platforms}
                onChange={handleStationFormChange}
                placeholder="Enter number of platforms"
                className={stationFormErrors.platforms ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.platforms && <span className="error-text">{stationFormErrors.platforms}</span>}
            </div>

            <div className="form-group">
              <label>Number of Running Lines *</label>
              <input
                type="number"
                min="0"
                name="runningLines"
                value={stationFormData.runningLines || stationFormData.tracks || ""}
                onChange={handleStationFormChange}
                placeholder="Enter number of running lines"
                className={stationFormErrors.runningLines ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.runningLines && <span className="error-text">{stationFormErrors.runningLines}</span>}
            </div>

            <div className="form-group">
              <label>District *</label>
              <input
                type="text"
                name="district"
                value={stationFormData.district}
                onChange={handleStationFormChange}
                placeholder="Enter district"
                className={stationFormErrors.district ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.district && <span className="error-text">{stationFormErrors.district}</span>}
            </div>

            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                name="state"
                value={stationFormData.state}
                onChange={handleStationFormChange}
                placeholder="Enter state"
                className={stationFormErrors.state ? "error" : ""}
                readOnly={isReadOnly}
              />
              {stationFormErrors.state && <span className="error-text">{stationFormErrors.state}</span>}
            </div>

            <div className="form-group">
              <label>Address *</label>
              <textarea
                name="address"
                value={stationFormData.address}
                onChange={handleStationFormChange}
                placeholder="Enter address"
                className={stationFormErrors.address ? "error" : ""}
                readOnly={isReadOnly}
                style={{ height: "80px" }}
              />
              {stationFormErrors.address && <span className="error-text">{stationFormErrors.address}</span>}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderPointsmanMonitoringDetail = (pm) => {
    const cat = pm.cat || "A";
    const risk = pm.risk || "Low";

    // Load actual assessment attempts dynamically from allDbAssessments
    const userDbAssessments = allDbAssessments.filter(a => a.employee?.hrms_id === pm.hrmsId);
    const hist = userDbAssessments.map(a => {
      const score = a.TEST_ATTEMPT?.[0]?.obtained_marks || 0;
      const subDate = a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : new Date(a.created_at).toISOString().slice(0, 10);
      const answers = a.TEST_ATTEMPT?.[0]?.answers || {};
      let parsedAnswers = answers;
      if (typeof parsedAnswers === "string") {
        try { parsedAnswers = JSON.parse(parsedAnswers); } catch (e) { }
      }
      return {
        date: subDate,
        testMarks: score,
        addMarks: 0,
        total: score,
        grade: a.TEST_ATTEMPT?.[0]?.category || "A",
        approvalStatus: a.status === "Pending" ? "Submitted" : a.status,
        remarks: parsedAnswers?.remarks || a.APPROVAL?.remarks || "No remarks"
      };
    });

    return (
      <div className="pointsman-monitoring-detail-wrapper" style={{ animation: "fadeIn 0.3s ease-out" }}>
        {/* TITLE AND BACK BUTTON HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Pointsman Details</h2>
          <button
            type="button"
            className="sm2-monitor-btn"
            onClick={() => setSelectedPointsmanForMonitoring(null)}
            style={{
              backgroundColor: "#ffffff",
              color: "#1d4ed8",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "6px 16px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            — Back
          </button>
        </div>

        {/* HERO CARD */}
        <div className="sm2-pm-hero" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          color: "#0f172a",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
          marginBottom: "24px",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div className="sm2-pm-avatar" style={{
              width: "54px",
              height: "54px",
              background: "#2563eb",
              color: "#ffffff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "800"
            }}>
              {pm.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{pm.name}</h3>
              <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                {pm.hrmsId} · Pointsman · {pm.stationName}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{
                  background: "#dcfce7",
                  color: "#15803d",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "700"
                }}>
                  Category {cat}
                </span>
                <span style={{
                  background: "#dcfce7",
                  color: "#15803d",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "700"
                }}>
                  {risk} Risk
                </span>
                <span style={{
                  background: "#fef3c7",
                  color: "#d97706",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "700"
                }}>
                  {pm.approvalStatus}
                </span>
              </div>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="sm2-pm-quick-stats" style={{
            display: "flex",
            gap: "36px",
            marginRight: "20px"
          }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Latest Score</span>
              <strong style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{pm.lastScore}/100</strong>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Safety Score</span>
              <strong style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{pm.safetyScore}/100</strong>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Assessments</span>
              <strong style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{pm.totalAssessments}</strong>
            </div>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
            <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Gender</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginTop: "4px", display: "block" }}>{pm.gender}</span>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
            <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Age</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginTop: "4px", display: "block" }}>{pm.age} yrs</span>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
            <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date of Joining</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginTop: "4px", display: "block" }}>{pm.doj}</span>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
            <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Base Pay</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginTop: "4px", display: "block" }}>₹28,500</span>
          </div>
        </div>

        {/* MONITORING STATUS SECTION */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
          marginBottom: "24px"
        }}>
          <h4 style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: "0 0 16px 0",
            fontSize: "14px",
            fontWeight: "750",
            color: "#0f172a",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            <Activity size={16} color="#0f172a" style={{ marginRight: "4px" }} /> Monitoring Status
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {[
              {
                status: "Active",
                color: "#16a34a",
                bg: "#dcfce7",
                icon: (
                  <span style={{ color: "#16a34a", marginRight: "4px", fontSize: "14px" }}>🟢</span>
                ),
                desc: "Available for yard operations"
              },
              {
                status: "On Duty",
                color: "#d97706",
                bg: "#fef3c7",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
                desc: "Currently executing track tasks"
              },
              {
                status: "Off Duty",
                color: "#64748b",
                bg: "#f1f5f9",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
                desc: "Resting / Shift ended"
              },
              {
                status: "Absent",
                color: "#dc2626",
                bg: "#fee2e2",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ),
                desc: "Unexcused leave of absence"
              }
            ].map(item => {
              const isActive = (pm.monitoringStatus || "Active") === item.status;
              return (
                <div
                  key={item.status}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    border: isActive ? `1.5px solid ${item.color}` : "1.5px solid #e2e8f0",
                    background: isActive ? item.bg : "#ffffff",
                    boxShadow: isActive ? `0 4px 14px ${item.color}15` : "none",
                    opacity: isActive ? 1 : 0.6,
                    transform: isActive ? "scale(1.02)" : "none",
                    transition: "all 0.2s ease",
                    cursor: "default"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: isActive ? item.color : "#334155"
                      }}>
                        {item.status}
                      </span>
                    </div>
                    {isActive && (
                      <span style={{
                        fontSize: "9px",
                        fontWeight: "800",
                        background: item.color,
                        color: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        textTransform: "uppercase",
                        letterSpacing: "0.2px"
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: "11px",
                    color: isActive ? "#334155" : "#64748b",
                    fontWeight: isActive ? "500" : "400",
                    lineHeight: "1.4"
                  }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SAFETY COMPLIANCE SECTION */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px", marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Safety Compliance</h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>PME Status</span>
              <strong style={{ fontSize: "15px", fontWeight: "700", color: pm.pmeStatus === "Fit" ? "#16a34a" : "#dc2626", marginTop: "4px", display: "block" }}>{pm.pmeStatus}</strong>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>REF Status</span>
              <strong style={{ fontSize: "15px", fontWeight: "700", color: pm.refStatus === "Cleared" ? "#16a34a" : "#d97706", marginTop: "4px", display: "block" }}>{pm.refStatus}</strong>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Disciplinary</span>
              <strong style={{ fontSize: "15px", fontWeight: "700", color: pm.disciplinary === "None" ? "#16a34a" : "#dc2626", marginTop: "4px", display: "block" }}>{pm.disciplinary}</strong>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Incidents</span>
              <strong style={{ fontSize: "15px", fontWeight: "700", color: pm.incidents === 0 ? "#16a34a" : "#dc2626", marginTop: "4px", display: "block" }}>{pm.incidents === 0 ? "0 reported" : `${pm.incidents} reported`}</strong>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "8px" }}>Overall Safety Compliance</span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1, height: "8px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: `${pm.safetyScore}%`, height: "100%", background: "#16a34a", borderRadius: "9999px" }}></div>
              </div>
              <span style={{ fontSize: "13px", fontWeight: "800", color: "#16a34a", marginLeft: "12px" }}>{pm.safetyScore}/100</span>
            </div>
          </div>
        </div>

        {/* HISTORICAL ASSESSMENTS TABLE */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
          <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Assessment History</h4>
          <div className="users-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="reports-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Date</th>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Test Marks</th>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Add. Marks</th>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Total</th>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Grade</th>
                  <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", background: "#f8fafc" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {hist.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                      No assessment records found.
                    </td>
                  </tr>
                ) : (
                  hist.map((h, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>{h.date}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>{h.testMarks}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>{h.addMarks}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{h.total}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          background: h.grade === "A" ? "#dcfce7" : h.grade === "B" ? "#dbeafe" : h.grade === "C" ? "#fef3c7" : "#fee2e2",
                          color: h.grade === "A" ? "#15803d" : h.grade === "B" ? "#1d4ed8" : h.grade === "C" ? "#b45309" : "#b91c1c",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: "700",
                          fontSize: "11px"
                        }}>Cat. {h.grade}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          background: h.approvalStatus === "Approved" ? "#dcfce7" : h.approvalStatus === "Pending" ? "#fef3c7" : "#fee2e2",
                          color: h.approvalStatus === "Approved" ? "#15803d" : h.approvalStatus === "Pending" ? "#d97706" : "#b91c1c",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: "700",
                          fontSize: "11px"
                        }}>{h.approvalStatus}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAddStationModal = () => {
    if (!showAddStation) return null;
    return (
      <div className="sdom-modal-overlay" style={{ zIndex: 99999, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
        <div className="sdom-modal" style={{ width: "800px", maxWidth: "95%", borderRadius: "16px", padding: "28px", display: "flex", flexDirection: "column", maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#0B1F3A", display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 size={24} style={{ color: "#2563eb" }} /> Add New Railway Station
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>Create a comprehensive official record with infrastructure & technical parameters.</p>
            </div>
            <button type="button" onClick={() => setShowAddStation(false)} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0 }}>&times;</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* SECTION 1: IDENTITY */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", borderLeft: "3px solid #2563eb", paddingLeft: "8px" }}>1. Station Identity & Jurisdiction</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Station Name *</label>
                  <input type="text" value={newStName} onChange={e => setNewStName(e.target.value)} placeholder="e.g. Wardha Junction" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Station Code *</label>
                  <input type="text" value={newStCode} onChange={e => setNewStCode(e.target.value)} placeholder="e.g. WR" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Assigned TI Area *</label>
                  <select value={newStTi} onChange={e => setNewStTi(e.target.value)}>
                    <option value="TI NGP">TI NGP (Nagpur)</option>
                    <option value="TI PAR">TI PAR (Parasia)</option>
                    <option value="TI AMLA">TI AMLA (Amla)</option>
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Railway Division *</label>
                  <select value={newStDivision} onChange={e => setNewStDivision(e.target.value)}>
                    <option value="Nagpur">Nagpur Division</option>
                    <option value="Pune">Pune Division</option>
                    <option value="Mumbai">Mumbai Division</option>
                    <option value="Solapur">Solapur Division</option>
                    <option value="Bhusawal">Bhusawal Division</option>
                  </select>
                </div>
                <div className="sdom-filter-field" style={{ gridColumn: "span 2" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Railway Zone *</label>
                  <select value={newStZone} onChange={e => setNewStZone(e.target.value)}>
                    <option value="CR">Central Railway (CR)</option>
                    <option value="WR">Western Railway (WR)</option>
                    <option value="SECR">South East Central Railway (SECR)</option>
                    <option value="SR">Southern Railway (SR)</option>
                    <option value="NR">Northern Railway (NR)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: TECHNICAL & INFRASTRUCTURE */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", borderLeft: "3px solid #2563eb", paddingLeft: "8px" }}>2. Technical Infrastructure & Systems</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Number of Platforms *</label>
                  <input type="number" min="1" max="24" value={newStPlatforms} onChange={e => setNewStPlatforms(Math.max(1, parseInt(e.target.value) || 1))} />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Operational Tracks *</label>
                  <input type="number" min="1" max="48" value={newStTracks} onChange={e => setNewStTracks(Math.max(1, parseInt(e.target.value) || 1))} />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Line Configuration *</label>
                  <select value={newStLineConfig} onChange={e => setNewStLineConfig(e.target.value)}>
                    <option value="Single Line">Single Line</option>
                    <option value="Double Line">Double Line</option>
                    <option value="Triple Line">Triple Line</option>
                    <option value="Quadruple Line">Quadruple Line</option>
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Electrification Status *</label>
                  <select value={newStElectrified} onChange={e => setNewStElectrified(e.target.value)}>
                    <option value="Electrified AC 25kV">Electrified AC 25kV</option>
                    <option value="Under Electrification">Under Electrification</option>
                    <option value="Non-Electrified">Non-Electrified</option>
                  </select>
                </div>
                <div className="sdom-filter-field" style={{ gridColumn: "span 2" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Signaling System Type *</label>
                  <select value={newStSignaling} onChange={e => setNewStSignaling(e.target.value)}>
                    <option value="Electronic Interlocking (EI)">Electronic Interlocking (EI)</option>
                    <option value="Route Relay Interlocking (RRI)">Route Relay Interlocking (RRI)</option>
                    <option value="Panel Interlocking (PI)">Panel Interlocking (PI)</option>
                    <option value="Mechanical Lever Cabin">Mechanical Lever Cabin</option>
                    <option value="One Train Only System">One Train Only System</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: LOGISTICS & LOGISTICAL CLASS */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", borderLeft: "3px solid #2563eb", paddingLeft: "8px" }}>3. Logistics & Operating Profile</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Station Category *</label>
                  <select value={newStCategory} onChange={e => setNewStCategory(e.target.value)}>
                    <option value="A">Category A (Major Junctions)</option>
                    <option value="B">Category B (Intermediate Stations)</option>
                    <option value="C">Category C (Suburban Stations)</option>
                    <option value="D">Category D (Halts & Flag Stations)</option>
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Operating Class *</label>
                  <select value={newStClass} onChange={e => setNewStClass(e.target.value)}>
                    <option value="Special Class">Special Class</option>
                    <option value="Class A">Class A Station</option>
                    <option value="Class B">Class B Station</option>
                    <option value="Class C">Class C Station</option>
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Station Type *</label>
                  <select value={newStType} onChange={e => setNewStType(e.target.value)}>
                    <option value="Junction">Junction Station</option>
                    <option value="Terminal">Terminal Station</option>
                    <option value="Block Station">Block Station</option>
                    <option value="Flag Station">Flag Station</option>
                    <option value="Wayside Station">Wayside Station</option>
                  </select>
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Average Daily Passenger Footfall *</label>
                  <input type="number" min="0" value={newStDailyFootfall} onChange={e => setNewStDailyFootfall(Math.max(0, parseInt(e.target.value) || 0))} placeholder="e.g. 15000" />
                </div>
              </div>
            </div>

            {/* SECTION 4: LOCATION & CONTACTS */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", borderLeft: "3px solid #2563eb", paddingLeft: "8px" }}>4. Geographic Location & Official Communications</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Latitude *</label>
                  <input type="text" value={newStLatitude} onChange={e => setNewStLatitude(e.target.value)} placeholder="e.g. 21.1500° N" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Longitude *</label>
                  <input type="text" value={newStLongitude} onChange={e => setNewStLongitude(e.target.value)} placeholder="e.g. 79.0900° E" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Official Station Contact *</label>
                  <input type="text" value={newStContactNumber} onChange={e => setNewStContactNumber(e.target.value)} placeholder="e.g. +91-712-2560158" />
                </div>
                <div className="sdom-filter-field">
                  <label style={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>Official Email ID (Optional)</label>
                  <input type="email" value={newStEmailId} onChange={e => setNewStEmailId(e.target.value)} placeholder="e.g. station.master@cr.railnet.gov.in" />
                </div>
              </div>
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "14px", marginTop: "28px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
            <button className="sdom-btn-outline" style={{ padding: "10px 20px" }} onClick={() => setShowAddStation(false)}>Cancel</button>
            <button className="sdom-btn-primary" style={{ padding: "10px 24px", display: "flex", alignItems: "center", gap: "6px" }} onClick={handleAddStation}>
              <Plus size={16} /> Create Station
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPmModal = () => {
    if (!pmModal) return null;
    return (
      <SAStaffModal
        modal={pmModal}
        setModal={setPmModal}
        stations={stations}
        staff={users}
        saveModal={savePmModal}
      />
    );
  };

  const renderTiModal = () => {
    if (!tiModal) return null;
    return (
      <SAStaffModal
        modal={tiModal}
        setModal={setTiModal}
        stations={stations}
        staff={users}
        saveModal={saveTiModal}
      />
    );
  };

  const renderSmModal = () => {
    if (!smModal) return null;
    return (
      <SAStaffModal
        modal={smModal}
        setModal={setSmModal}
        stations={stations}
        staff={users}
        saveModal={saveSmModal}
      />
    );
  };

  const renderSsModal = () => {
    if (!ssModal) return null;
    return (
      <SAStaffModal
        modal={ssModal}
        setModal={setSsModal}
        stations={stations}
        staff={users}
        saveModal={saveSsModal}
      />
    );
  };

  const renderTmModal = () => {
    if (!tmModal) return null;
    return (
      <SAStaffModal
        modal={tmModal}
        setModal={setTmModal}
        stations={stations}
        staff={users}
        saveModal={saveTmModal}
      />
    );
  };

  const renderChartZoomModal = () => {
    if (!isChartZoomModalOpen) return null;

    // Filter math logic on unifiedStations
    const filtered = unifiedStations.filter(st => {
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
      { name: "Category A", value: catA, color: "#1e40af" },
      { name: "Category B", value: catB, color: "#5b21b6" },
      { name: "Category C", value: catC, color: "#92400e" },
      { name: "Category D", value: catD, color: "#9d174d" }
    ].filter(item => item.value > 0);

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

    return (
      <div
        className="zoom-modal-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          zIndex: 9999,
          overflowY: "auto",
          display: "block",
          padding: 0,
          animation: "fadeIn 0.2s ease-out"
        }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div
          className="zoom-modal-container"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 0,
            width: "100%",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "none",
            overflow: "visible",
            border: "none",
            animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc",
              position: "sticky",
              top: 0,
              zIndex: 100
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                {selectedChartType === "progress"
                  ? "Station-wise Evaluation Progress"
                  : selectedChartType === "score"
                    ? "Station-wise Average Score"
                    : "Category Distribution"}
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                Page {currentPage} of {totalPages} (Showing 10 stations per page out of {filtered.length} matching stations)
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setIsChartZoomModalOpen(false)}
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Close Zoom View
              </button>
            </div>
          </div>

          {/* Modal Body Container */}
          <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "20px", overflow: "visible" }}>

            {/* 1. FILTER CONTROLS GRID */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Operational Search & Diagnostics Filters
                </h4>
                <button
                  type="button"
                  onClick={handleResetPopupFilters}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: "750",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Reset Diagnostics Filters
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "12px"
                }}
              >
                {/* Search */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Quick Search</label>
                  <input
                    type="text"
                    placeholder="Search name/code..."
                    value={zoomPopupSearch}
                    onChange={(e) => { setZoomPopupSearch(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  />
                </div>

                {/* Zone */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Zone</label>
                  <select
                    value={zoomPopupZone}
                    onChange={(e) => { setZoomPopupZone(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                  >
                    <option value="All">All Zones</option>
                    <option value="CR">CR (Central Rly)</option>
                  </select>
                </div>

                {/* Division */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Division</label>
                  <select
                    value={zoomPopupDivision}
                    onChange={(e) => { setZoomPopupDivision(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                  >
                    <option value="All">All Divisions</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Pune">Pune</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Solapur">Solapur</option>
                    <option value="Bhusawal">Bhusawal</option>
                  </select>
                </div>

                {/* Station Name */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Station Name</label>
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    value={zoomPopupStationName === "All" ? "" : zoomPopupStationName}
                    onChange={(e) => { setZoomPopupStationName(e.target.value || "All"); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  />
                </div>

                {/* Station Code */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Station Code</label>
                  <input
                    type="text"
                    placeholder="Filter by code..."
                    value={zoomPopupStationCode === "All" ? "" : zoomPopupStationCode}
                    onChange={(e) => { setZoomPopupStationCode(e.target.value || "All"); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Category</label>
                  <select
                    value={zoomPopupCategory}
                    onChange={(e) => { setZoomPopupCategory(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                  >
                    <option value="All">All Categories</option>
                    <option value="A">Cat. A</option>
                    <option value="B">Cat. B</option>
                    <option value="C">Cat. C</option>
                    <option value="D">Cat. D</option>
                  </select>
                </div>

                {/* Risk Level */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Risk Level</label>
                  <select
                    value={zoomPopupRisk}
                    onChange={(e) => { setZoomPopupRisk(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                  >
                    <option value="All">All Risks</option>
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Status</label>
                  <select
                    value={zoomPopupStatus}
                    onChange={(e) => { setZoomPopupStatus(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Date range start */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Start Date</label>
                  <input
                    type="date"
                    value={zoomPopupStartDate}
                    onChange={(e) => { setZoomPopupStartDate(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "5px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", color: "#334155" }}
                  />
                </div>

                {/* Date range end */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>End Date</label>
                  <input
                    type="date"
                    value={zoomPopupEndDate}
                    onChange={(e) => { setZoomPopupEndDate(e.target.value); setZoomPopupPage(1); }}
                    style={{ width: "100%", padding: "5px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", color: "#334155" }}
                  />
                </div>
              </div>
            </div>

            {/* 2. DYNAMIC REAL-TIME CHART BOX */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "750", color: "#0f172a" }}>
                  {selectedChartType === "progress"
                    ? "Evaluation Progress Trends (Completed vs Pending)"
                    : selectedChartType === "score"
                      ? "Average Safety Evaluation Scores (/100)"
                      : "Category Distribution Breakdown"}
                </h4>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                  Showing 10 stations on this page
                </span>
              </div>

              <div style={{ height: "260px", width: "100%" }}>
                {selectedChartType === "category" ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", gap: "60px" }}>
                    <div style={{ width: "220px", height: "220px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={modalPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={88}
                            dataKey="value"
                            label={({ name, value }) => `${name.replace("Category ", "")}: ${value}`}
                          >
                            {modalPieData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} Station(s)`, "Count"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {modalPieData.map((item) => (
                        <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                          <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: item.color }} />
                          <span>{item.name}:</span>
                          <span style={{ color: "#0f172a" }}>{item.value} Station(s) ({((item.value / (totalCount || 1)) * 100).toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={modalChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                      barGap={6}
                    >
                      <XAxis
                        dataKey="station"
                        tick={{ fontSize: 10, fill: "#475569" }}
                        height={40}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "#475569" }} domain={selectedChartType === "score" ? [0, 100] : undefined} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", color: "#ffffff", borderRadius: "8px", border: "none", fontSize: "12px" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                      {selectedChartType === "progress" ? (
                        <>
                          <Bar dataKey="completed" fill="#0d2948" name="Completed Evaluations" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="pending" fill="#f5ae3f" name="Pending Evaluations" radius={[4, 4, 0, 0]} />
                        </>
                      ) : (
                        <Bar dataKey="avgScore" fill="#1f7a5c" name="Average Evaluation Score" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 3. DETAILED STATION DATA TABLE */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155" }}>Station Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155" }}>Code</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155" }}>Division</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155" }}>Zone</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155", textAlign: "right" }}>Completed</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155", textAlign: "right" }}>Pending</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155", textAlign: "right" }}>Avg. Score</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155", textAlign: "center" }}>Category</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155", textAlign: "center" }}>Risk Level</th>
                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "#334155" }}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                        No stations matching the selected diagnostics criteria.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((st) => {
                      const riskColor = st.riskLevel === "High" ? "#ef4444" : st.riskLevel === "Medium" ? "#ea580c" : "#16a34a";
                      const riskBg = st.riskLevel === "High" ? "#fef2f2" : st.riskLevel === "Medium" ? "#fff7ed" : "#dcfce7";
                      const catBg = st.category === "A" ? "#eff6ff" : st.category === "B" ? "#f5f3ff" : st.category === "C" ? "#fffbeb" : "#fdf2f8";
                      const catColor = st.category === "A" ? "#1e40af" : st.category === "B" ? "#5b21b6" : st.category === "C" ? "#92400e" : "#9d174d";

                      return (
                        <tr key={st.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0f172a" }}>{st.stationName}</td>
                          <td style={{ padding: "12px 16px", fontWeight: "700", color: "#475569" }}>{st.stationCode}</td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{st.division}</td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{st.zone}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700", color: "#0d2948" }}>{st.completed}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700", color: "#f5ae3f" }}>{st.pending}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700", color: "#1f7a5c" }}>{st.avgScore}/100</td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <span style={{ background: catBg, color: catColor, padding: "2px 8px", borderRadius: "4px", fontWeight: "700", fontSize: "11px" }}>
                              Cat {st.category}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <span style={{ background: riskBg, color: riskColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px" }}>
                              {st.riskLevel}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#64748b" }}>{st.lastUpdatedDate}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Modal Footer (SLIDER / TABS PAGINATION) */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ fontSize: "13px", color: "#475569", fontWeight: "600" }}>
              Showing {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} stations
            </div>

            {/* Page tabs */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setZoomPopupPage(p => Math.max(p - 1, 1))}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: currentPage === 1 ? "default" : "pointer",
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                Previous
              </button>

              <div style={{ display: "flex", gap: "4px" }}>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setZoomPopupPage(pageNum)}
                      style={{
                        width: "32px",
                        height: "32px",
                        border: isActive ? "1px solid #2563eb" : "1px solid #cbd5e1",
                        borderRadius: "6px",
                        background: isActive ? "#2563eb" : "#ffffff",
                        color: isActive ? "#ffffff" : "#334155",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setZoomPopupPage(p => Math.min(p + 1, totalPages))}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: currentPage === totalPages ? "default" : "pointer",
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmployeeManagement = () => {
    // 1. Dynamic Master Employee List Compilation
    const allEmployees = [
      ...aomPointsmen.map(p => {
        const isUnassessed = p.approvalStatus === "Pending First Assessment" || p.status === "Pending First Assessment";
        return {
          hrmsId: p.hrmsId,
          name: p.name,
          gender: p.gender || "Male",
          age: p.age || 35,
          doj: p.doj,
          basePay: p.basePay || "₹28,500",
          designation: "Pointsman",
          stationName: p.stationName,
          stationCode: p.stationCode,
          division: p.division || "Nagpur",
          zone: p.zone || "CR",
          category: p.cat || getPmCat(p.lastScore),
          riskLevel: p.risk || getPmRisk(p),
          assessmentStatus: p.approvalStatus,
          lastScore: isUnassessed ? null : p.lastScore,
          safetyScore: isUnassessed ? null : p.safetyScore,
          totalAssessments: isUnassessed ? 0 : p.totalAssessments,
          lastAssessedDate: isUnassessed ? "No Assessment Taken" : (p.lastAssessDate || p.lastAssessedDate || p.doj || "2026-03-28"),
          monitoringStatus: deactivatedUserIds.has(p.hrmsId) ? "Deactivated" : (p.monitoringStatus || "Active")
        };
      }),
      ...stationMastersDirectory.map((sm, idx) => {
        const smHrmsId = sm.hrmsId || sm.id || `SM_${1001 + idx}`;
        const isUnassessed = sm.approvalStatus === "Pending First Assessment" || sm.status === "Pending First Assessment";
        return {
          hrmsId: smHrmsId,
          name: sm.name,
          gender: sm.gender || "Male",
          age: sm.age || 42,
          doj: sm.doj || "2010-05-15",
          basePay: sm.basePay || "₹56,000",
          designation: "Station Master",
          stationName: sm.stationName,
          stationCode: sm.stationCode,
          division: sm.division,
          zone: sm.zone || "CR",
          category: sm.cat || "A",
          riskLevel: sm.riskLevel || sm.risk || "Low",
          assessmentStatus: sm.approvalStatus || "Approved",
          lastScore: isUnassessed ? null : (sm.lastScore || sm.score || 0),
          safetyScore: isUnassessed ? null : (sm.safetyScore || 0),
          totalAssessments: isUnassessed ? 0 : (sm.totalAssessments || 0),
          lastAssessedDate: isUnassessed ? "No Assessment Taken" : (sm.lastAssessedDate || sm.lastAssessDate || sm.doj || null),
          monitoringStatus: deactivatedUserIds.has(smHrmsId) ? "Deactivated" : (sm.monitoringStatus || "Active")
        };
      }),
      ...trafficInspectors.map((ti, idx) => {
        const isUnassessed = ti.status === "Pending First Assessment" || ti.approvalStatus === "Pending First Assessment";
        return {
          hrmsId: ti.employeeId,
          name: ti.name,
          gender: "Male",
          age: 48,
          doj: "2006-11-20",
          basePay: "₹68,000",
          designation: "Traffic Inspector",
          stationName: ti.stationName || ti.station || "Division HQ",
          stationCode: ti.stationCode || "HQ",
          division: ti.division || "Nagpur",
          zone: ti.zone || "CR",
          category: ti.cat || ti.category || "A",
          riskLevel: ti.risk || ti.riskLevel || "Low",
          assessmentStatus: ti.status || ti.approvalStatus || "Approved",
          lastScore: isUnassessed ? null : (ti.lastScore || ti.score || 88),
          safetyScore: isUnassessed ? null : 95,
          totalAssessments: isUnassessed ? 0 : (ti.totalAssessments || 8),
          lastAssessedDate: isUnassessed ? "No Assessment Taken" : (ti.lastDate || ti.doj || "2026-03-15"),
          monitoringStatus: deactivatedUserIds.has(ti.employeeId) ? "Deactivated" : (ti.monitoringStatus || "Active")
        };
      })
    ];


    // Unique filter options computed dynamically
    const uniqueDesignations = ["All", "Pointsman", "Station Master", "Traffic Inspector"];
    const uniqueStations = ["All", ...Array.from(new Set(allEmployees.map(e => e.stationName)))];
    const uniqueDivisions = ["All", "Nagpur", "Pune", "Mumbai"];
    const uniqueZones = ["All", "CR"];
    const uniqueCategories = ["All", "A", "B", "C", "D", "Senior TI", "TI", "Assistant TI"];
    const uniqueRisks = ["All", "Low", "Medium", "High"];
    const uniqueStatuses = ["All", "Approved", "Pending", "Rejected"];
    const uniqueMonitorings = ["All", "Active", "On Duty", "Off Duty", "Absent", "Deactivated"];

    // Filter math logic
    const filteredEmployees = allEmployees.filter(emp => {
      const q = empSearchText.trim().toLowerCase();
      const matchesSearch = !q || emp.name.toLowerCase().includes(q) || emp.hrmsId.toLowerCase().includes(q);

      const matchesDesignation = empDesignationFilter === "All" || emp.designation === empDesignationFilter;
      const matchesStation = empStationFilter === "All" || emp.stationName === empStationFilter;
      const matchesDivision = empDivisionFilter === "All" || emp.division === empDivisionFilter;
      const matchesZone = empZoneFilter === "All" || emp.zone === empZoneFilter;
      const matchesCategory = empCategoryFilter === "All" || emp.category === empCategoryFilter;
      const matchesRisk = empRiskFilter === "All" || emp.riskLevel === empRiskFilter;
      const matchesStatus = empStatusFilter === "All" || emp.assessmentStatus === empStatusFilter;
      const matchesMonitoring = empMonitoringFilter === "All" || emp.monitoringStatus === empMonitoringFilter;

      return matchesSearch && matchesDesignation && matchesStation && matchesDivision && matchesZone && matchesCategory && matchesRisk && matchesStatus && matchesMonitoring;
    });

    // Summary calculations
    const totalCount = filteredEmployees.length;
    const activeCount = filteredEmployees.filter(e => e.monitoringStatus === "Active" || e.monitoringStatus === "On Duty").length;
    const approvedCount = filteredEmployees.filter(e => e.assessmentStatus === "Approved").length;
    const pendingCount = filteredEmployees.filter(e => e.assessmentStatus === "Pending").length;
    const highRiskCount = filteredEmployees.filter(e => e.riskLevel === "High").length;

    // Sorting
    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
      if (a[empSortConfig.key] < b[empSortConfig.key]) {
        return empSortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[empSortConfig.key] > b[empSortConfig.key]) {
        return empSortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    const requestSort = (key) => {
      let direction = 'ascending';
      if (empSortConfig.key === key && empSortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      setEmpSortConfig({ key, direction });
    };

    // Pagination
    const itemsPerPage = 8;
    const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
    const paginatedEmployees = sortedEmployees.slice(
      (empCurrentPage - 1) * itemsPerPage,
      empCurrentPage * itemsPerPage
    );

    const handleActionClick = (emp) => {
      if (emp.designation === "Pointsman") {
        const pmObj = aomPointsmen.find(p => p.hrmsId === emp.hrmsId);
        setSelectedPointsmanForMonitoring(pmObj);
      } else {
        const mockPmObj = {
          id: emp.hrmsId,
          hrmsId: emp.hrmsId,
          name: emp.name,
          gender: emp.gender || "Male",
          age: emp.age || 40,
          doj: emp.doj || "2015-01-01",
          basePay: emp.basePay || "₹45,000",
          lastScore: emp.lastScore,
          safetyScore: emp.safetyScore || 90,
          totalAssessments: emp.totalAssessments || 10,
          incidents: 0,
          approvalStatus: emp.assessmentStatus,
          monitoringStatus: emp.monitoringStatus,
          stationCode: emp.stationCode,
          stationName: emp.stationName
        };
        setSelectedPointsmanForMonitoring(mockPmObj);
      }
    };

    const handleToggleDeactivate = (hrmsId) => {
      setDeactivatedUserIds(prev => {
        const next = new Set(prev);
        if (next.has(hrmsId)) {
          next.delete(hrmsId);
        } else {
          next.add(hrmsId);
        }
        return next;
      });
    };

    const handleShiftEmployeeClick = (row) => {
      const target = empShiftDrafts[row.hrmsId];
      if (!target) return;

      if (row.designation === "Pointsman") {
        const targetStationObj = stations.find(s => s.stationCode === target);
        const targetStationName = targetStationObj ? targetStationObj.stationName : target;
        if (window.confirm(`Are you sure you want to shift Pointsman ${row.name} from ${row.stationName} to ${targetStationName}?`)) {
          setAomPointsmen(prev => prev.map(p => {
            if (p.hrmsId === row.hrmsId) {
              return {
                ...p,
                stationCode: target,
                stationName: targetStationName
              };
            }
            return p;
          }));
          setEmpShiftDrafts(prev => {
            const next = { ...prev };
            delete next[row.hrmsId];
            return next;
          });
          alert(`Successfully shifted Pointsman ${row.name} to ${targetStationName}`);
        }
      } else if (row.designation === "Station Master") {
        handleShiftStationMaster(row.name, target);
        setEmpShiftDrafts(prev => {
          const next = { ...prev };
          delete next[row.hrmsId];
          return next;
        });
      } else if (row.designation === "Traffic Inspector") {
        const ti = trafficInspectors.find(t => t.employeeId === row.hrmsId);
        if (ti) {
          setTrafficInspectors((prev) =>
            prev.map((r) =>
              r.employeeId === row.hrmsId
                ? {
                  ...r,
                  jurisdiction: target,
                  division: target
                }
                : r
            )
          );
          setTiNotice("TI jurisdiction updated successfully.");
          setEmpShiftDrafts(prev => {
            const next = { ...prev };
            delete next[row.hrmsId];
            return next;
          });
          alert(`Successfully shifted Traffic Inspector ${row.name} to ${target} Division`);
        }
      }
    };

    const handleResetFilters = () => {
      setEmpSearchText("");
      setEmpDesignationFilter("All");
      setEmpStationFilter("All");
      setEmpDivisionFilter("All");
      setEmpZoneFilter("All");
      setEmpCategoryFilter("All");
      setEmpRiskFilter("All");
      setEmpStatusFilter("All");
      setEmpMonitoringFilter("All");
      setEmpCurrentPage(1);
    };

    return (
      <div className="user-management-page">
        {selectedPointsmanForMonitoring ? (
          renderPointsmanMonitoringDetail(selectedPointsmanForMonitoring)
        ) : (
          <>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Employee Management</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
                  Unified railway workforce intelligence & real-time monitoring console
                </p>
              </div>
              <button
                type="button"
                className="sm2-monitor-btn"
                onClick={handleResetFilters}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                Reset Filters
              </button>
            </div>

            {/* KPI Cards */}
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "20px", marginTop: "20px" }}>
              <div className="metric-card" onClick={() => { setEmpDesignationFilter("All"); setEmpRiskFilter("All"); setEmpStatusFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.15)"; e.currentTarget.style.borderColor = "#93c5fd"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Employees</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>{totalCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpStatusFilter("Active"); setEmpRiskFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.15)"; e.currentTarget.style.borderColor = "#93c5fd"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Active / On Duty</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#3b82f6" }}>{activeCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpStatusFilter("Approved"); setEmpRiskFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(22,163,74,0.15)"; e.currentTarget.style.borderColor = "#86efac"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Approved Staff</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#16a34a" }}>{approvedCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpStatusFilter("Pending"); setEmpRiskFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(161,98,7,0.15)"; e.currentTarget.style.borderColor = "#fde047"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fef08a", color: "#a16207", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Pending Approvals</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#a16207" }}>{pendingCount}</h3>
                </div>
              </div>
              <div className="metric-card" onClick={() => { setEmpRiskFilter("High"); setEmpStatusFilter("All"); setEmpDesignationFilter("All"); setEmpSearchText(""); setEmpCurrentPage(1); }} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(220,38,38,0.15)"; e.currentTarget.style.borderColor = "#fca5a5"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>High Risk Staff</span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#dc2626" }}>{highRiskCount}</h3>
                </div>
              </div>
            </div>

            {/* ADVANCED FILTERS CARD */}
            <div className="chart-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", color: "#334155", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🔍 Advanced Intelligence Filters
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                {/* Search */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Search Name / HRMS ID</label>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
                    <input
                      type="text"
                      value={empSearchText}
                      onChange={(e) => { setEmpSearchText(e.target.value); setEmpCurrentPage(1); }}
                      placeholder="Type query..."
                      style={{ width: "100%", padding: "6px 10px 6px 30px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                    />
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Designation</label>
                  <select
                    value={empDesignationFilter}
                    onChange={(e) => { setEmpDesignationFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueDesignations.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Station */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Station</label>
                  <select
                    value={empStationFilter}
                    onChange={(e) => { setEmpStationFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueStations.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Division */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Division</label>
                  <select
                    value={empDivisionFilter}
                    onChange={(e) => { setEmpDivisionFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueDivisions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Zone */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Zone</label>
                  <select
                    value={empZoneFilter}
                    onChange={(e) => { setEmpZoneFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueZones.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Category</label>
                  <select
                    value={empCategoryFilter}
                    onChange={(e) => { setEmpCategoryFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueCategories.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Risk Level */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Risk Level</label>
                  <select
                    value={empRiskFilter}
                    onChange={(e) => { setEmpRiskFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueRisks.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Assessment Status */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Assessment Status</label>
                  <select
                    value={empStatusFilter}
                    onChange={(e) => { setEmpStatusFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Monitoring Status */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Monitoring Status</label>
                  <select
                    value={empMonitoringFilter}
                    onChange={(e) => { setEmpMonitoringFilter(e.target.value); setEmpCurrentPage(1); }}
                    style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                  >
                    {uniqueMonitorings.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* DATA TABLE */}
            <div className="users-list-container" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div className="users-table-wrapper" style={{ overflowX: "auto", maxHeight: "550px", overflowY: "auto", position: "relative" }}>
                <table className="users-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "1400px" }}>
                  <thead>
                    <tr style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)",
                      borderBottom: "2px solid #cbd5e1",
                      textAlign: "left",
                      color: "#475569",
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("name")}>
                        Employee Name {empSortConfig.key === "name" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("hrmsId")}>
                        HRMS ID {empSortConfig.key === "hrmsId" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("designation")}>
                        Designation {empSortConfig.key === "designation" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("stationName")}>
                        Station {empSortConfig.key === "stationName" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("division")}>
                        Division {empSortConfig.key === "division" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("zone")}>
                        Zone {empSortConfig.key === "zone" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("category")}>
                        Category {empSortConfig.key === "category" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("riskLevel")}>
                        Risk Level {empSortConfig.key === "riskLevel" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("assessmentStatus")}>
                        Assessment {empSortConfig.key === "assessmentStatus" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("lastScore")}>
                        Score {empSortConfig.key === "lastScore" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px" }}>Assessed Date</th>
                      <th style={{ padding: "14px 10px", cursor: "pointer" }} onClick={() => requestSort("monitoringStatus")}>
                        Monitoring {empSortConfig.key === "monitoringStatus" && (empSortConfig.direction === "ascending" ? "▲" : "▼")}
                      </th>
                      <th style={{ padding: "14px 10px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="13" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                          No employees matched the query filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedEmployees.map((row, idx) => {
                        const riskColor = row.riskLevel === "High" ? "#ef4444" : row.riskLevel === "Medium" ? "#ea580c" : "#16a34a";
                        const riskBg = row.riskLevel === "High" ? "#fef2f2" : row.riskLevel === "Medium" ? "#fff7ed" : "#dcfce7";

                        const statusColor = row.assessmentStatus === "Approved" ? "#16a34a" : row.assessmentStatus === "Pending" ? "#d97706" : "#ef4444";
                        const statusBg = row.assessmentStatus === "Approved" ? "#dcfce7" : row.assessmentStatus === "Pending" ? "#fef3c7" : "#fee2e2";

                        const isDeactivated = deactivatedUserIds.has(row.hrmsId);
                        const displayMonStatus = isDeactivated ? "Deactivated" : row.monitoringStatus;

                        const monColor = displayMonStatus === "Active" ? "#16a34a" :
                          displayMonStatus === "On Duty" ? "#d97706" :
                            displayMonStatus === "Off Duty" ? "#475569" :
                              displayMonStatus === "Deactivated" ? "#64748b" : "#dc2626";
                        const monBg = displayMonStatus === "Active" ? "#dcfce7" :
                          displayMonStatus === "On Duty" ? "#fef3c7" :
                            displayMonStatus === "Off Duty" ? "#f1f5f9" :
                              displayMonStatus === "Deactivated" ? "#f1f5f9" : "#fee2e2";

                        const draftShift = empShiftDrafts[row.hrmsId] || "";

                        return (
                          <tr key={row.hrmsId} style={{ borderBottom: "1px solid #e2e8f0", fontSize: "13px" }}>
                            <td style={{ padding: "12px 10px", fontWeight: "700", color: "#0f172a" }}>{row.name}</td>
                            <td style={{ padding: "12px 10px", color: "#64748b", fontWeight: "600" }}>{row.hrmsId}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "650",
                                color: "#334155"
                              }}>{row.designation}</span>
                            </td>
                            <td style={{ padding: "12px 10px", fontWeight: "600", color: "#334155" }}>{row.stationName}</td>
                            <td style={{ padding: "12px 10px", color: "#475569" }}>{row.division}</td>
                            <td style={{ padding: "12px 10px", color: "#475569" }}>{row.zone}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontWeight: "700", fontSize: "11px" }}>
                                {row.category}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: riskBg, color: riskColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px" }}>
                                {row.riskLevel}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: statusBg, color: statusColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px" }}>
                                {row.assessmentStatus}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px", fontWeight: "700", color: "#0f172a" }}>{row.lastScore}/100</td>
                            <td style={{ padding: "12px 10px", color: "#64748b" }}>{row.lastAssessedDate}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{ background: monBg, color: monColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px" }}>
                                {displayMonStatus}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => handleActionClick(row)}
                                  style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                                >
                                  Profile
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDeactivate(row.hrmsId)}
                                  style={{
                                    background: isDeactivated ? "#f0fdf4" : "#fee2e2",
                                    color: isDeactivated ? "#16a34a" : "#dc2626",
                                    border: isDeactivated ? "1px solid #bbf7d0" : "1px solid #fecaca",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                  }}
                                >
                                  {isDeactivated ? "Activate" : "Deactivate"}
                                </button>
                                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                  <select
                                    value={draftShift}
                                    onChange={(e) => setEmpShiftDrafts(prev => ({ ...prev, [row.hrmsId]: e.target.value }))}
                                    style={{
                                      padding: "3px 6px",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      background: "#ffffff",
                                      maxWidth: "110px",
                                      color: "#334155"
                                    }}
                                  >
                                    <option value="">Shift to...</option>
                                    {row.designation === "Pointsman" || row.designation === "Station Master" ? (
                                      stations
                                        .filter(s => s.stationCode !== row.stationCode)
                                        .map(s => (
                                          <option key={s.stationCode} value={s.stationCode}>
                                            {s.stationCode} ({s.stationName})
                                          </option>
                                        ))
                                    ) : (
                                      ["Nagpur", "Pune", "Mumbai", "Solapur"]
                                        .filter(div => div !== row.division)
                                        .map(div => (
                                          <option key={div} value={div}>
                                            {div} Div
                                          </option>
                                        ))
                                    )}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={!draftShift}
                                    onClick={() => handleShiftEmployeeClick(row)}
                                    style={{
                                      background: draftShift ? "#2563eb" : "#f1f5f9",
                                      color: draftShift ? "#ffffff" : "#94a3b8",
                                      border: draftShift ? "1px solid #2563eb" : "1px solid #cbd5e1",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      fontWeight: "700",
                                      cursor: draftShift ? "pointer" : "default"
                                    }}
                                  >
                                    Shift
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "0 8px" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                    Showing {(empCurrentPage - 1) * itemsPerPage + 1} to {Math.min(empCurrentPage * itemsPerPage, sortedEmployees.length)} of {sortedEmployees.length} employees
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      disabled={empCurrentPage === 1}
                      onClick={() => setEmpCurrentPage(prev => Math.max(prev - 1, 1))}
                      style={{ padding: "4px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#ffffff", fontSize: "12px", cursor: empCurrentPage === 1 ? "default" : "pointer", opacity: empCurrentPage === 1 ? 0.5 : 1 }}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEmpCurrentPage(i + 1)}
                        style={{
                          padding: "4px 10px",
                          border: empCurrentPage === i + 1 ? "1px solid #2563eb" : "1px solid #cbd5e1",
                          borderRadius: "4px",
                          background: empCurrentPage === i + 1 ? "#2563eb" : "#ffffff",
                          color: empCurrentPage === i + 1 ? "#ffffff" : "#0f172a",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={empCurrentPage === totalPages}
                      onClick={() => setEmpCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      style={{ padding: "4px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#ffffff", fontSize: "12px", cursor: empCurrentPage === totalPages ? "default" : "pointer", opacity: empCurrentPage === totalPages ? 0.5 : 1 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const handleExportCSV = () => {
    const headers = ["HRMS ID", "Employee Name", "Designation", "Assessment Status", "Score", "Grade", "Last Assessed"];
    const csvRows = filteredReportRows.map(row => [
      `"${row.hrmsId || ""}"`,
      `"${row.name || ""}"`,
      `"${row.designation || ""}"`,
      `"${row.assessmentStatus || ""}"`,
      `"${row.score || ""}"`,
      `"${row.grade || ""}"`,
      `"${row.lastAssessed || ""}"`
    ]);
    const csvContent = [headers.join(","), ...csvRows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AOM_Employee_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Helper: reset role filters when switching roles
  const resetRoleFilters = () => {
    setRoleFilterName("");
    setRoleFilterStation("All");
    setRoleFilterDivision("All");
    setRoleFilterCat("All");
    setRoleFilterRisk("All");
    setSelectedRoleEmployee(null);
    setTiAssessmentFormOpen(null);
  };

  // ── Reusable role directory renderer (SA-style)
  const renderAomRole = (roleKey, title) => {
    // If a profile detail is being viewed
    if (selectedRoleEmployee && selectedRoleEmployee._roleKey === roleKey) {
      const s = selectedRoleEmployee;

      // Real-time calculation of assessment history for this Pointsman
      const myAssessments = (allDbAssessments || []).filter(a => a.employee?.hrms_id === s.hrmsId);
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
        : (s.lastScore ? `${s.lastScore}/100` : "—");

      const displayDate = lastAssessDateVal 
        ? lastAssessDateVal 
        : (s.lastAssessedDate && s.lastAssessedDate !== "No Assessment Taken" ? s.lastAssessedDate : "No Assessment Taken");

      const formatMonthYear = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      };

      const pmAssessments = (allDbAssessments || [])
        .filter(a => a.employee?.hrms_id === s.hrmsId && a.TEST_ATTEMPT?.[0]?.obtained_marks != null)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      let scoreData = [];
      if (pmAssessments.length > 0) {
        scoreData = pmAssessments.map(a => ({
          month: formatMonthYear(a.assessment_date || a.created_at),
          score: a.TEST_ATTEMPT[0].obtained_marks,
          date: (a.assessment_date || a.created_at ? new Date(a.assessment_date || a.created_at).toISOString().slice(0, 10) : "")
        }));
      } else {
        const baseScore = s.lastScore;
        if (baseScore) {
          scoreData = MONTHLY_TREND.map((m, i) => ({ month: m.month, score: Math.max(50, baseScore - 10 + i * 2) }));
        }
      }

      const roleLabel = { pointsmen: "Pointsman", sm: "Station Master", ss: "Station Superintendent", tm: "Train Manager", ti: "Traffic Inspector" }[roleKey] || title;
      return (
        <div className="sdom-fade">
          <div style={{ marginBottom: 24 }}>
            <button className="sdom-back-btn" onClick={() => setSelectedRoleEmployee(null)}>
              <ArrowLeft size={16} /> Back to List
            </button>
          </div>
          <div className="sdom-station-header" style={{ marginBottom: 24 }}>
            <div className="sdom-station-header-meta">
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Profile</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{roleLabel} &bull; {s.stationName} &bull; {s.zone || "Central Railway"}</div>
              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <span className={`sdom-badge ${{ A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger" }[s.category] || "sdom-badge-neutral"}`}>{s.category}</span>
                <span className={`sdom-badge ${{ Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" }[s.riskLevel] || "sdom-badge-neutral"}`}>{s.riskLevel}</span>
                <span className={`sdom-badge ${{ Approved: "sdom-badge-success", Pending: "sdom-badge-warning", Rejected: "sdom-badge-danger" }[s.assessmentStatus] || "sdom-badge-neutral"}`}>{s.assessmentStatus}</span>
              </div>
            </div>
            <div className="sdom-station-header-stats">
              <div className="sdom-station-header-stat"><span className="val">{s.category === "Untested" ? "Not Given Test" : displayScore}</span><span className="lbl">Latest Score</span></div>
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
              <div className="sdom-station-header-stat"><span className="val">{s.contactNumber || "—"}</span><span className="lbl">Contact</span></div>
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
              <div className="sdom-station-header-stat"><span className="val">{displayDate}</span><span className="lbl">Last Assessment</span></div>
            </div>
          </div>
          <div className="sdom-row-2">
            <div className="sdom-chart-card">
              <div className="sdom-chart-title" style={{ marginBottom: 16 }}>Personal &amp; Professional Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 15, paddingBottom: 20 }}>
                {[
                  ["HRMS ID", s.hrmsId],
                  ["Designation", roleLabel],
                  ["Mobile Number", s.contactNumber || "N/A"],
                  ["Email ID", s.emailId || `${s.hrmsId?.toLowerCase()}@rail.in`],
                  ["Account Status", s.monitoringStatus || "Active"],
                  ["Zone", s.zone || "Central Railway"],
                  ["Division", s.division || "Nagpur"],
                  ["Station", s.stationName],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Operational Specifications */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                  Operational Profile Specifications
                </h4>

                {s.role === "pointsmen" && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Reporting Station Master:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.reportingSm || "S. Deshmukh (SM)"}</div></div>
                    <div><strong>Assigned Shift:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.shift || "Morning Shift (06:00 - 14:00)"}</div></div>
                    <div><strong>Work Location Setup:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.workLocation || "Yard Area"}</div></div>
                  </div>
                )}

                {(s.role === "sm" || s.role === "ss") && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Operational Station:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.smStation || s.stationName || "N/A"}</div></div>
                    <div><strong>Operational Division:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.smDivision || s.division || "Nagpur"}</div></div>
                    <div><strong>Operational Zone:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.smZone || s.zone || "Central Railway"}</div></div>
                  </div>
                )}

                {s.role === "tm" && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Crew Depot:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.workLocation || "Nagpur Depot"}</div></div>
                    <div><strong>Assigned Shift:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.shift || "Goods Train Beat"}</div></div>
                    <div><strong>Assigned Section Beats:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.reportingSm || "NGP-BSL Section"}</div></div>
                  </div>
                )}
              </div>
            </div>
            <div className="sdom-chart-card">
              <div className="sdom-chart-title">Score Trend</div>
              <div className="sdom-chart-subtitle">Assessment score progression</div>
              <div style={{ height: 300, display: "flex", flexDirection: "column", justifyContent: "center", width: "100%" }}>
                {scoreData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={11} />
                      <YAxis domain={[0, 100]} fontSize={11} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: "center", color: "#64748b", fontSize: "0.95rem", fontStyle: "italic" }}>
                    No Assessment Records Found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // TI Assessment fill form
    if (roleKey === "ti" && tiAssessmentFormOpen) {
      const tiEmployee = allEmployees.find(e => e.hrmsId === tiAssessmentFormOpen && e.role === "ti");
      const answers = tiAssessmentAnswers[tiAssessmentFormOpen] || {};
      const totalMarks = assessmentCriteria.reduce((t, c) => t + c.marks, 0);
      const scored = assessmentCriteria.reduce((t, c) => t + (answers[c.key] === "yes" ? c.marks : 0), 0);
      return (
        <div className="sdom-fade">
          <div style={{ marginBottom: 24 }}>
            <button className="sdom-back-btn" onClick={() => setTiAssessmentFormOpen(null)}>
              <ArrowLeft size={16} /> Back to Traffic Inspectors
            </button>
          </div>
          <div className="sdom-station-header" style={{ marginBottom: 24 }}>
            <div className="sdom-station-header-meta">
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase" }}>Traffic Inspector Assessment</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 4 }}>{tiEmployee?.name || tiAssessmentFormOpen}</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>HRMS: {tiAssessmentFormOpen} &bull; Division: {tiEmployee?.division || "–"}</div>
            </div>
            <div className="sdom-station-header-stats">
              <div className="sdom-station-header-stat"><span className="val">{scored}/{totalMarks}</span><span className="lbl">Current Score</span></div>
            </div>
          </div>
          <div className="sdom-chart-card">
            <div className="sdom-chart-title" style={{ marginBottom: 20 }}>Safety & Competency Assessment — Yes / No Checklist</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {assessmentCriteria.map((c) => (
                <div key={c.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "14px 18px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{c.label}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>Max Marks: {c.marks}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setTiAssessmentAnswers(prev => ({ ...prev, [tiAssessmentFormOpen]: { ...prev[tiAssessmentFormOpen], [c.key]: "yes" } }))}
                      style={{
                        padding: "8px 20px", borderRadius: 6, border: "2px solid", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                        borderColor: answers[c.key] === "yes" ? "#16a34a" : "#d1d5db",
                        background: answers[c.key] === "yes" ? "#dcfce7" : "#ffffff",
                        color: answers[c.key] === "yes" ? "#15803d" : "#6b7280"
                      }}
                    >✓ Yes</button>
                    <button
                      type="button"
                      onClick={() => setTiAssessmentAnswers(prev => ({ ...prev, [tiAssessmentFormOpen]: { ...prev[tiAssessmentFormOpen], [c.key]: "no" } }))}
                      style={{
                        padding: "8px 20px", borderRadius: 6, border: "2px solid", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                        borderColor: answers[c.key] === "no" ? "#dc2626" : "#d1d5db",
                        background: answers[c.key] === "no" ? "#fee2e2" : "#ffffff",
                        color: answers[c.key] === "no" ? "#b91c1c" : "#6b7280"
                      }}
                    >✗ No</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Score: {scored} / {totalMarks} — Grade: {scored >= 90 ? "A" : scored >= 70 ? "B" : "C"}</div>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="sdom-btn-outline" onClick={() => setTiAssessmentFormOpen(null)}>Cancel</button>
                <button className="sdom-btn-primary" onClick={() => {
                  const grade = scored >= 90 ? "A" : scored >= 70 ? "B" : "C";
                  alert(`Assessment submitted for ${tiEmployee?.name || tiAssessmentFormOpen}.\nScore: ${scored}/${totalMarks} — Grade: ${grade}`);
                  setTiActivatedAssessments(prev => ({ ...prev, [tiAssessmentFormOpen]: "submitted" }));
                  setTiAssessmentFormOpen(null);
                }}>Submit Assessment</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const filtered = allEmployees.filter(e =>
      e.role === roleKey &&
      (roleFilterStation === "All" || e.stationName === roleFilterStation) &&
      (roleFilterDivision === "All" || e.division === roleFilterDivision) &&
      (roleFilterCat === "All" || e.category === roleFilterCat) &&
      (roleFilterRisk === "All" || e.riskLevel === roleFilterRisk) &&
      (!roleFilterName || e.name.toLowerCase().includes(roleFilterName.toLowerCase()) || e.hrmsId.toLowerCase().includes(roleFilterName.toLowerCase()))
    );

    const stationOpts = ["All", ...Array.from(new Set(allEmployees.filter(e => e.role === roleKey).map(e => e.stationName)))];
    const divisionOpts = ["All", ...Array.from(new Set(allEmployees.filter(e => e.role === roleKey).map(e => e.division)))];

    return (
      <div className="sdom-fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 className="sdom-page-title">{title} Management</h1>
            <p className="sdom-page-subtitle">Search, filter and manage all {title.toLowerCase()}s in the division.</p>
          </div>
          {(roleKey === "pointsmen" || roleKey === "sm" || roleKey === "ss" || roleKey === "tm" || roleKey === "ti") && (
            <button className="sdom-btn-primary" onClick={
              roleKey === "pointsmen" ? openPmAdd :
                roleKey === "sm" ? openSmAdd :
                  roleKey === "ss" ? openSsAdd :
                    roleKey === "tm" ? openTmAdd : openTiAdd
            }>
              <Plus size={16} /> Add New {title}
            </button>
          )}
        </div>

        {/* Filters - matching SuperAdmin style */}
        <div className="sdom-filter-bar">
          <div className="sdom-filter-field" style={{ minWidth: 200 }}>
            <label>Name / ID</label>
            <input value={roleFilterName} onChange={e => setRoleFilterName(e.target.value)} placeholder="Search..." />
          </div>
          <div className="sdom-filter-field">
            <label>Station</label>
            <select value={roleFilterStation} onChange={e => setRoleFilterStation(e.target.value)}>
              {stationOpts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>{roleKey === "ti" ? "TI Area" : "Division"}</label>
            <select value={roleFilterDivision} onChange={e => setRoleFilterDivision(e.target.value)}>
              {divisionOpts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>Category</label>
            <select value={roleFilterCat} onChange={e => setRoleFilterCat(e.target.value)}>
              <option>All</option><option>A</option><option>B</option><option>C</option><option>D</option><option>Untested</option>
            </select>
          </div>
          <div className="sdom-filter-field">
            <label>Risk Level</label>
            <select value={roleFilterRisk} onChange={e => setRoleFilterRisk(e.target.value)}>
              <option>All</option><option>Low</option><option>Medium</option><option>High</option><option>Untested</option>
            </select>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: "#1e293b" }}>{filtered.length} staff found</span>
          </div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>{roleKey === "ti" ? "Emp ID" : "HRMS ID"}</th>
                  <th>Station</th>
                  <th>{roleKey === "ti" ? "TI Area" : "Division"}</th>
                  <th>Category</th>
                  <th>Risk</th>
                  <th>Last Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>No records found</td></tr>
                )}
                {filtered.map(s => {
                  const isPending = s.assessmentStatus === "Pending";
                  const tiActivated = tiActivatedAssessments[s.hrmsId];

                  const renderCategoryBadge = (cat) => {
                    const bgMap = { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" };
                    const fgMap = { A: "#15803d", B: "#1d4ed8", C: "#b45309", D: "#b91c1c" };

                    if (roleKey === "ti") {
                      return (
                        <span style={{
                          background: bgMap[cat] || "#f1f5f9",
                          color: fgMap[cat] || "#475569",
                          border: `1px solid ${fgMap[cat] || "#cbd5e1"}`,
                          width: "26px",
                          height: "26px",
                          borderRadius: "50%",
                          fontWeight: "700",
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center"
                        }}>
                          {cat}
                        </span>
                      );
                    }

                    return (
                      <span style={{
                        background: bgMap[cat] || "#f1f5f9",
                        color: fgMap[cat] || "#475569",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "12px",
                        display: "inline-block",
                        minWidth: "24px",
                        textAlign: "center"
                      }}>
                        {cat}
                      </span>
                    );
                  };

                  const renderRiskBadge = (risk) => {
                    const bgMap = { Low: "#dcfce7", Medium: "#fff7ed", High: "#fee2e2" };
                    const fgMap = { Low: "#16a34a", Medium: "#ea580c", High: "#dc2626" };
                    return (
                      <span style={{
                        background: bgMap[risk] || "#f1f5f9",
                        color: fgMap[risk] || "#475569",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        display: "inline-block"
                      }}>
                        {risk}
                      </span>
                    );
                  };

                  const renderStatusBadge = (status) => {
                    const bgMap = { Approved: "#dcfce7", Completed: "#dcfce7", Pending: "#fff7ed", "In Progress": "#fef08a", Rejected: "#fee2e2" };
                    const fgMap = { Approved: "#16a34a", Completed: "#16a34a", Pending: "#ea580c", "In Progress": "#ca8a04", Rejected: "#dc2626" };
                    const text = status === "Completed" ? "APPROVED" : status.toUpperCase();
                    return (
                      <span style={{
                        background: bgMap[status] || "#f1f5f9",
                        color: fgMap[status] || "#475569",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "11px",
                        display: "inline-block"
                      }}>
                        {text}
                      </span>
                    );
                  };

                  return (
                    <tr key={s.hrmsId}>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.hrmsId}</td>
                      <td>{s.stationName}</td>
                      <td>{s.division}</td>
                      <td>{renderCategoryBadge(s.category)}</td>
                      <td>{renderRiskBadge(s.riskLevel)}</td>
                      <td style={{ fontWeight: 700 }}>{s.category === "Untested" ? "Not Given Test" : (s.lastScore || "–")}</td>
                      <td>{renderStatusBadge(s.assessmentStatus)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          {/* View Profile */}
                          <button className="sdom-btn-outline" style={{ padding: "5px 10px", fontSize: "0.8rem" }}
                            onClick={() => setSelectedRoleEmployee({ ...s, _roleKey: roleKey })}>
                            View
                          </button>



                          {/* Edit */}
                          {roleKey === "ti" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => openTiEdit(s)}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : roleKey === "pointsmen" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const pmObj = aomPointsmen.find(pm => pm.hrmsId === s.hrmsId);
                              if (pmObj) openPmEdit(pmObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : roleKey === "sm" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const smObj = aomStationMasters.find(sm => (sm.hrmsId || sm.id) === s.hrmsId);
                              if (smObj) openSmEdit(smObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : roleKey === "ss" ? (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const ssObj = aomSuperintendents.find(ss => ss.employeeId === s.hrmsId);
                              if (ssObj) openSsEdit(ssObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          ) : (
                            <button className="sdom-icon-btn" title="Edit" onClick={() => {
                              const tmObj = aomTrainManagers.find(tm => tm.employeeId === s.hrmsId);
                              if (tmObj) openTmEdit(tmObj);
                            }}>
                              <Edit size={15} color="#2563eb" />
                            </button>
                          )}

                          {/* Shift */}
                          {roleKey === "ti" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const dest = window.prompt(`Enter new Division to shift ${s.name} (e.g. Pune, Mumbai, Delhi):`);
                              if (dest) {
                                if (window.confirm(`Shift ${s.name} to ${dest} Division?`)) {
                                  setTrafficInspectors(prev => prev.map(t => t.employeeId === s.hrmsId ? { ...t, division: dest, jurisdiction: dest } : t));
                                  alert(`${s.name} shifted to ${dest} Division successfully.`);
                                }
                              }
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : roleKey === "pointsmen" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const pmObj = aomPointsmen.find(pm => pm.hrmsId === s.hrmsId);
                              if (pmObj) openPmShift(pmObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : roleKey === "sm" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const smObj = aomStationMasters.find(sm => (sm.hrmsId || sm.id) === s.hrmsId);
                              if (smObj) openSmShift(smObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : roleKey === "ss" ? (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const ssObj = aomSuperintendents.find(ss => ss.employeeId === s.hrmsId);
                              if (ssObj) openSsShift(ssObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          ) : (
                            <button className="sdom-icon-btn" title="Transfer to Another Station" onClick={() => {
                              const tmObj = aomTrainManagers.find(tm => tm.employeeId === s.hrmsId);
                              if (tmObj) openTmShift(tmObj);
                            }}>
                              <ArrowRightLeft size={15} color="#d97706" />
                            </button>
                          )}

                          {/* Remove */}
                          {roleKey === "ti" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeTi(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : roleKey === "pointsmen" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removePm(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : roleKey === "sm" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeSm(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : roleKey === "ss" ? (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeSs(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          ) : (
                            <button className="sdom-icon-btn" title="Remove" onClick={() => removeTm(s.hrmsId)}>
                              <Trash2 size={15} color="#dc2626" />
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
  };

  // Super Admin Stations Replication Mappers & Helpers
  const isStationMatch = (stationA, stationB) => {
    if (!stationA || !stationB) return false;
    const a = stationA.toLowerCase().trim();
    const b = stationB.toLowerCase().trim();
    if (a === b) return true;
    const clean = s => s.replace(/\s+/g, '').replace(/junction|central|main|town|jn|station/gi, '');
    return clean(a) === clean(b) || clean(a).includes(clean(b)) || clean(b).includes(clean(a));
  };

  const unifiedStaff = useMemo(() => {
    return allEmployees.map(u => {
      const isUnassessed = u.assessmentStatus === "Pending First Assessment";
      return {
        id: u.hrmsId,
        name: u.name,
        station: u.stationName,
        role: u.role,
        cat: u.category || "A",
        risk: u.riskLevel || "Low",
        score: isUnassessed ? null : (u.lastScore || 80),
        status: u.assessmentStatus || "Approved",
        contact: u.contactNumber || "+91 99000 11000",
        email: u.emailId || `${u.hrmsId?.toLowerCase()}@rail.in`,
        lastDate: isUnassessed ? "No Assessment Taken" : (u.lastAssessedDate || "2026-03-10"),
        reportingAom: "P. K. Verma (Sr. DOM)",
        jurisdiction: u.jurisdiction,
        linkedStations: u.linkedStations
      };
    });
  }, [allEmployees]);

  const unifiedStations = useMemo(() => {
    const dataSource = (stations && stations.length > 0) ? stations : DASHBOARD_96_STATIONS;
    return dataSource.map(st => {
      const stName = st.name || st.stationName;
      const stCode = st.code || st.stationCode;
      const stStaff = unifiedStaff.filter(s => isStationMatch(s.station, stName));
      const pmCount = stStaff.filter(s => s.role === "pointsmen").length;
      const smCount = stStaff.filter(s => s.role === "sm").length;
      const safety = st.safety != null ? st.safety : Math.min(100, Math.max(60, 95 - (st.pending || 0)));
      const highRisk = stStaff.filter(s => s.risk === "High").length;
      return {
        id: st.id || st.stationId,
        name: stName,
        code: stCode,
        ti: st.ti || "Not Assigned",
        smCount: smCount || st.smCount || 5,
        pmCount: pmCount || st.pmCount || 20,
        score: st.score || st.avgScore || 80,
        avgScore: st.score || st.avgScore || 80,
        safety,
        highRisk: highRisk || st.highRisk || (st.riskLevel === "High" ? 4 : st.riskLevel === "Medium" ? 2 : 0),
        pending: st.pending || 0,
        completed: Math.max(0, (pmCount || st.pmCount || 20) - (st.pending || 0)),
        stationName: stName,
        stationCode: stCode,
        division: st.division || "Nagpur",
        zone: st.zone || "CR",
        category: st.category || "A",
        riskLevel: st.riskLevel || (highRisk > 3 ? "High" : highRisk > 1 ? "Medium" : "Low"),
        assessmentStatus: st.assessmentStatus || (st.pending > 0 ? "Pending" : "Completed"),
        lastUpdatedDate: st.lastUpdatedDate || new Date().toISOString().split('T')[0],
        stationClass: st.stationClass || "Class B",
        stationType: st.stationType || "Junction",
        signalingType: st.signalingType || "Route Relay Interlocking (RRI)",
        platforms: st.platforms || 3,
        tracks: st.runningLines || st.tracks || 5,
        dailyFootfall: st.dailyFootfall || 15000,
        latitude: st.latitude || "21.1500° N",
        longitude: st.longitude || "79.0900° E",
        contactNumber: st.contactNumber || "+91-712-2560158",
        emailId: st.emailId || `station.${(stCode || st.id || "NGP").toLowerCase().split('_')[0]}@cr.railnet.gov.in`,
        lineConfig: st.lineConfig || "Double Line",
        electrified: st.electrified || "Electrified AC 25kV",
        address: st.address || "",
        district: st.district || "",
        state: st.state || "",
        status: st.status || "Active"
      };
    });
  }, [stations, DASHBOARD_96_STATIONS, unifiedStaff]);

  const ROLE_MAP = {
    pointsmen: "Pointsman",
    sm: "Station Master",
    ss: "Station Superintendent",
    tm: "Train Manager",
    ti: "Traffic Inspector"
  };


  function riskBadge(r) {
    const map = { Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" };
    return <span className={`sdom-badge ${map[r] || "sdom-badge-neutral"}`}>{r}</span>;
  }
  function catBadge(c) {
    const map = { A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger" };
    return <span className={`sdom-badge ${map[c] || "sdom-badge-neutral"}`}>{c}</span>;
  }
  function statusBadge(s) {
    const map = { Approved: "sdom-badge-success", Pending: "sdom-badge-warning", Rejected: "sdom-badge-danger", Overdue: "sdom-badge-danger" };
    return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{s}</span>;
  }

  const handleAddStation = async () => {
    if (!newStName || !newStCode) return;
    const newSt = {
      id: "ST_" + Date.now(),
      stationName: newStName,
      stationCode: newStCode.toUpperCase(),
      division: newStDivision,
      zone: newStZone,
      category: newStCategory,
      riskLevel: "Low",
      assessmentStatus: "Approved",
      stationClass: newStClass,
      stationType: newStType,
      signalingType: newStSignaling,
      platforms: parseInt(newStPlatforms) || 1,
      tracks: parseInt(newStTracks) || 1,
      dailyFootfall: parseInt(newStDailyFootfall) || 5000,
      latitude: newStLatitude || "21.1500° N",
      longitude: newStLongitude || "79.0900° E",
      contactNumber: newStContactNumber || "+91-712-2560158",
      emailId: newStEmailId || `station.${newStCode.toLowerCase().trim()}@cr.railnet.gov.in`,
      lineConfig: newStLineConfig,
      electrified: newStElectrified
    };
    try {
      await saDataService.saveStation(newSt, "add");
      setShowAddStation(false);
      await fetchLiveDatabaseData();
    } catch (err) {
      alert("Error saving station: " + err.message);
    }
  };

  function renderStaffDetail(s) {
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
            } else {
              setView(null);
            }
          }}><ArrowLeft size={16} /> Back to List</button>
        </div>

        <div className="sdom-station-header" style={{ marginBottom: 24 }}>
          <div className="sdom-station-header-meta">
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Profile</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
            <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{ROLE_MAP[s.role] || s.role} &bull; {s.station} &bull; {s.zone || "Central Railway"}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              {catBadge(s.cat)}
              {riskBadge(s.risk)}
              {statusBadge(s.status)}
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
            <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>Personal & Professional Details</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', paddingBottom: '20px' }}>
              {[
                ["Employee ID / HRMS ID", s.id],
                ["Designation", ROLE_MAP[s.role] || s.role],
                ["Mobile Number", s.contact || "N/A"],
                ["Email ID", s.email || `${s.id?.toLowerCase()}@rail.in`],
                ["Account Status", s.status || "Active"],
                ["Current Zone", s.zone || "Central Railway"],
                ["Current Division", s.division || "Nagpur"],
                ["Current Station Placement", s.station],
                ["Reporting Officer", s.reportingAom || "P. K. Verma (Sr. DOM)"]
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="sdom-chart-card">
            <div className="sdom-chart-title">Score Trend</div>
            <div className="sdom-chart-subtitle">Monthly performance tracking for this employee</div>
            <div style={{ height: 300, display: "flex", flexDirection: "column", justifyContent: "center", width: "100%" }}>
              {scoreData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis domain={[0, 100]} fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", color: "#64748b", fontSize: "0.95rem", fontStyle: "italic" }}>
                  No Assessment Records Found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStationDetail(st) {
    return (
      <SAStationDetail
        st={st}
        staff={unifiedStaff}
        closeView={() => setView(null)}
        setView={setView}
      />
    );
  }

  const renderStations = () => {
    if (view?.type === "staffDetail") return renderStaffDetail(view.data);
    if (view?.type === "stationDetail") return renderStationDetail(view.data);
    return (
      <SAStationDirectory
        stations={unifiedStations}
        staff={unifiedStaff}
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
        openView={(type, data) => setView({ type, data })}
      />
    );
  };

  const fetchLiveDatabaseData = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const u = await saDataService.fetchUsers();
      const st = await saDataService.fetchStations(u);

      setStations(st);

      const mapped = u.map(x => {
        const isUntested = x.cat === "Untested";
        return {
          ...x,
          hrmsId: x.id,
          employeeId: x.id,
          user_id: x.user_id,
          name: x.name,
          lastScore: isUntested ? null : x.score,
          safetyScore: isUntested ? null : (x.safetyScore || 0),
          doj: x.lastDate,
          stationName: x.station,
          stationCode: st.find(s => s.name === x.station)?.code || "NGP",
          approvalStatus: isUntested ? "Pending" : x.status,
          monitoringStatus: "Active",
          contactNumber: x.contact,
          contact: x.contact,
          emailId: x.email,
          email: x.email,
          pfNumber: x.pfNumber || "—",
          designation: ROLE_MAP[x.role] || x.role,
          role: x.role,
          division: x.division,
          zone: x.zone,
          cat: x.cat,
          risk: x.risk,
          riskLevel: x.risk,
          workLocation: x.workLocation,
          reportingSm: x.reportingSm,
          shift: x.shift
        };
      });

      setAomPointsmen(mapped.filter(x => x.role === "pointsmen"));
      setAomStationMasters(mapped.filter(x => x.role === "sm"));
      setAomSuperintendents(mapped.filter(x => x.role === "ss"));
      setAomTrainManagers(mapped.filter(x => x.role === "tm"));
      setTrafficInspectors(mapped.filter(x => x.role === "ti"));
      setUsers(mapped);

      // Fetch assessments
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
              STATION (station_name, station_code, DIVISION (division_name))
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

        const updatedMapped = mapped.map(userObj => {
          const userAssessments = assessList.filter(a => a.employee?.hrms_id === userObj.hrmsId);
          const activeAssessments = userAssessments.filter(a => ["Approved", "Completed", "EVALUATED", "Submitted"].includes(a.status));
          const totalActive = activeAssessments.length;

          if (totalActive > 0) {
            const latestAssess = [...activeAssessments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            const score = latestAssess?.TEST_ATTEMPT?.[0]?.obtained_marks;
            const cat = latestAssess?.TEST_ATTEMPT?.[0]?.category || userObj.cat || "A";
            const isApproved = latestAssess.status !== "Submitted";
            const statusStr = isApproved ? "Approved" : "Submitted";
            const percentage = latestAssess?.TEST_ATTEMPT?.[0]?.percentage ?? (score ? Math.round((score / 25) * 100) : 0);
            return {
              ...userObj,
              totalAssessments: userAssessments.length,
              approvalStatus: statusStr,
              status: statusStr,
              cat: cat,
              category: cat,
              risk: cat === "D" ? "High" : (percentage >= 80 ? "Low" : percentage >= 60 ? "Medium" : "High"),
              riskLevel: cat === "D" ? "High" : (percentage >= 80 ? "Low" : percentage >= 60 ? "Medium" : "High"),
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
              riskLevel: cat === "D" ? "High" : cat === "C" ? "Medium" : "Low",
              score: null,
              lastScore: null
            };
          }
        });

        setAomPointsmen(updatedMapped.filter(x => x.role === "pointsmen"));
        setAomStationMasters(updatedMapped.filter(x => x.role === "sm"));
        setAomSuperintendents(updatedMapped.filter(x => x.role === "ss"));
        setAomTrainManagers(updatedMapped.filter(x => x.role === "tm"));
        setTrafficInspectors(updatedMapped.filter(x => x.role === "ti"));
        setUsers(updatedMapped);
        // Map SM assessments
        const sms = (assessList || []).filter(a => a.assessment_type === "Station Master Assessment");
        const smMapped = sms.map(a => {
          const score = a.TEST_ATTEMPT?.[0]?.obtained_marks || 0;
          const answers = a.TEST_ATTEMPT?.[0]?.answers || {};
          let parsedAnswers = answers;
          if (typeof parsedAnswers === "string") {
            try { parsedAnswers = JSON.parse(parsedAnswers); } catch (e) { }
          }
          const subDate = a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : "";
          const storedSections = parsedAnswers.sections || [];
          const mcqScore = parsedAnswers.mcqScore !== undefined ? parsedAnswers.mcqScore : (parsedAnswers.knowledgeMarks !== undefined ? parsedAnswers.knowledgeMarks : 0);
          const isAlc = parsedAnswers.alcoholicStatus === "Alcoholic";
          const cat = isAlc ? "D" : (a.TEST_ATTEMPT?.[0]?.category || "A");
          const isOnlineExam = a.TEST_ATTEMPT?.[0]?.total_marks === 25;

          let sections = [];
          if (storedSections.length > 0) {
            sections = storedSections.map(s => ({
              title: s.title || s.label || "",
              score: s.marks !== undefined ? s.marks : (s.score || 0),
              max: s.outOf !== undefined ? s.outOf : (s.max || 0),
              marks: s.marks !== undefined ? s.marks : (s.score || 0),
              outOf: s.outOf !== undefined ? s.outOf : (s.max || 0)
            }));
            const hasMcq = sections.some(s => s.title.includes("MCQ") || s.title.includes("Written Exam") || s.title.includes("Knowledge"));
            if (!hasMcq) {
              sections.unshift({
                title: "Knowledge of Rules (MCQ)",
                score: Number(mcqScore) || 0,
                max: 25,
                marks: Number(mcqScore) || 0,
                outOf: 25
              });
            }
          } else {
            // Proportional fallback if it's a raw MCQ attempt or missing checklist data
            const isRawAttempt = Array.isArray(parsedAnswers) || (!parsedAnswers.alertness && !parsedAnswers.sections);
            if (isRawAttempt && a.TEST_ATTEMPT?.[0]?.total_marks !== 25 && score > 0) {
              const s1 = Math.round(score * 0.25);
              const s2 = Math.round(score * 0.25);
              const s3 = Math.round(score * 0.15);
              const s4 = Math.round(score * 0.15);
              const s5 = Math.round(score * 0.10);
              const s6 = Math.max(0, score - (s1 + s2 + s3 + s4 + s5));

              sections = [
                { title: "Knowledge of Rules (MCQ)", score: s1, max: 25, marks: s1, outOf: 25 },
                { title: "Alertness and Observation of Rules", score: s2, max: 25, marks: s2, outOf: 25 },
                { title: "Safety Record", score: s3, max: 15, marks: s3, outOf: 15 },
                { title: "Leadership and Management", score: s4, max: 15, marks: s4, outOf: 15 },
                { title: "Discipline", score: s5, max: 10, marks: s5, outOf: 10 },
                { title: "Appearance and Neatness", score: s6, max: 10, marks: s6, outOf: 10 }
              ];
            } else {
              // Fallback proportional
              sections = [
                { title: "Knowledge of Rules (MCQ)", score: Math.round(score * 0.25), max: 25, marks: Math.round(score * 0.25), outOf: 25 },
                { title: "Alertness and Observation of Rules", score: Math.round(score * 0.25), max: 25, marks: Math.round(score * 0.25), outOf: 25 },
                { title: "Safety Record", score: Math.round(score * 0.15), max: 15, marks: Math.round(score * 0.15), outOf: 15 },
                { title: "Leadership and Management", score: Math.round(score * 0.15), max: 15, marks: Math.round(score * 0.15), outOf: 15 },
                { title: "Discipline", score: Math.round(score * 0.10), max: 10, marks: Math.round(score * 0.10), outOf: 10 },
                { title: "Appearance and Neatness", score: Math.round(score * 0.10), max: 10, marks: Math.round(score * 0.10), outOf: 10 }
              ];
            }
          }

          return {
            id: a.assessment_id,
            name: a.employee?.full_name || "",
            hrmsId: a.employee?.hrms_id || "",
            station: a.employee?.EMPLOYEE_PROFILE?.STATION?.station_name || "—",
            submissionDate: subDate,
            status: a.status === 'Pending' ? 'Submitted' : a.status,
            score: score,
            category: cat,
            isOnlineExam: isOnlineExam,
            pmeStatus: parsedAnswers.pmeStatus || "Fit",
            refStatus: parsedAnswers.refStatus || "Cleared",
            remarks: parsedAnswers.remarks || "",
            alcoholicStatus: parsedAnswers.alcoholicStatus || "",
            sections,
            tiAnswers: {
              knowledgeOfRules: parsedAnswers.knowledgeOfRules || [],
              alertness: parsedAnswers.alertness || [],
              safetyRecord: parsedAnswers.safetyRecord || [],
              leadership: parsedAnswers.leadership || [],
              discipline: parsedAnswers.discipline || [],
              appearance: parsedAnswers.appearance || []
            },
            aomRemarks: a.APPROVAL?.remarks || "",
            auditTrail: a.APPROVAL ? [{ action: "Reviewed", by: a.APPROVAL.USERS?.full_name || "AOM", date: a.APPROVAL.approval_date ? new Date(a.APPROVAL.approval_date).toISOString().slice(0, 10) : "", remark: a.APPROVAL.remarks }] : []
          };
        });
        setAomSMList(smMapped);

        // Map TM assessments
        const tms = (assessList || []).filter(a => a.assessment_type === "Train Manager Assessment" || a.assessment_type === "TM Assessment");
        const tmMapped = tms.map(a => {
          const score = a.TEST_ATTEMPT?.[0]?.obtained_marks || 0;
          const subDate = a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : "";
          const answers = a.TEST_ATTEMPT?.[0]?.answers || {};

          let parsedAnswers = answers;
          if (typeof parsedAnswers === "string") {
            try { parsedAnswers = JSON.parse(parsedAnswers); } catch (e) { }
          }

          const isOnlineExam = a.TEST_ATTEMPT?.[0]?.total_marks === 25;
          const isAlc = parsedAnswers.alcoholicStatus === "Alcoholic";
          const cat = isAlc ? "D" : (a.TEST_ATTEMPT?.[0]?.category || "A");

          let sections = [];
          if (parsedAnswers && parsedAnswers.sections && parsedAnswers.sections.length > 0) {
            sections = parsedAnswers.sections.map(s => ({
              title: s.title || s.label || "",
              score: s.marks !== undefined ? s.marks : (s.score || 0),
              max: s.outOf !== undefined ? s.outOf : (s.max || 0),
              marks: s.marks !== undefined ? s.marks : (s.score || 0),
              outOf: s.outOf !== undefined ? s.outOf : (s.max || 0)
            }));
          } else if (isOnlineExam && Array.isArray(parsedAnswers)) {
            let s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0;
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
            sections = [
              { title: "Signal Rules", score: s1, max: 5, marks: s1, outOf: 5 },
              { title: "Track Handling", score: s2, max: 5, marks: s2, outOf: 5 },
              { title: "Communication", score: s3, max: 5, marks: s3, outOf: 5 },
              { title: "Safety Response", score: s4, max: 5, marks: s4, outOf: 5 },
              { title: "Operational Judgement", score: s5, max: 5, marks: s5, outOf: 5 }
            ];
          } else {
            // Proportional fallback if it's a raw MCQ attempt or missing checklist data
            const isRawAttempt = Array.isArray(parsedAnswers) || (!parsedAnswers.trainSafety && !parsedAnswers.sections);
            const mcqScore = Math.min(
              parseInt(parsedAnswers.knowledgeMarks || parsedAnswers.mcqScore) ||
              (a.TEST_ATTEMPT?.[0]?.total_marks === 25 ? score : Math.round(score * 0.25)) ||
              0,
              25
            );

            if (isRawAttempt && a.TEST_ATTEMPT?.[0]?.total_marks !== 25 && score > 0) {
              const s1 = Math.round(score * 0.15);
              const s2 = Math.round(score * 0.15);
              const s3 = Math.round(score * 0.15);
              const s4 = Math.round(score * 0.15);
              const s5 = Math.round(score * 0.15);
              const s6 = Math.max(0, score - (s1 + s2 + s3 + s4 + s5));

              sections = [
                { title: "Train Safety & Brake Inspection", score: s1, max: 15, marks: s1, outOf: 15 },
                { title: "Signaling & Whistle Compliance", score: s2, max: 15, marks: s2, outOf: 15 },
                { title: "Shunting & Coupling Ops", score: s3, max: 15, marks: s3, outOf: 15 },
                { title: "Train Log & Guard Certificates", score: s4, max: 15, marks: s4, outOf: 15 },
                { title: "Emergency Train Protection", score: s5, max: 15, marks: s5, outOf: 15 },
                { title: "Written Exam (Knowledge)", score: s6, max: 25, marks: s6, outOf: 25 }
              ];
            } else {
              // Compute YN Yes counts
              const countYes = arr => (arr || []).filter(v => v === "Yes").length;
              const s1 = countYes(parsedAnswers.trainSafety) * 3;
              const s2 = countYes(parsedAnswers.signaling) * 3;
              const s3 = countYes(parsedAnswers.shunting) * 3;
              const s4 = countYes(parsedAnswers.documentation) * 3;
              const s5 = countYes(parsedAnswers.emergency) * 3;

              sections = [
                { title: "Train Safety & Brake Inspection", score: s1, max: 15, marks: s1, outOf: 15 },
                { title: "Signaling & Whistle Compliance", score: s2, max: 15, marks: s2, outOf: 15 },
                { title: "Shunting & Coupling Ops", score: s3, max: 15, marks: s3, outOf: 15 },
                { title: "Train Log & Guard Certificates", score: s4, max: 15, marks: s4, outOf: 15 },
                { title: "Emergency Train Protection", score: s5, max: 15, marks: s5, outOf: 15 },
                { title: "Written Exam (Knowledge)", score: mcqScore, max: 25, marks: mcqScore, outOf: 25 }
              ];
            }
          }

          return {
            id: a.assessment_id,
            name: a.employee?.full_name || "",
            hrmsId: a.employee?.hrms_id || "",
            station: a.employee?.EMPLOYEE_PROFILE?.STATION?.station_name || "—",
            submissionDate: subDate,
            status: a.status === 'Pending' ? 'Submitted' : a.status,
            score: score,
            category: cat,
            isOnlineExam: isOnlineExam,
            pmeStatus: parsedAnswers.pmeStatus || "Fit",
            refStatus: parsedAnswers.refStatus || "Cleared",
            remarks: parsedAnswers.remarks || "",
            alcoholicStatus: parsedAnswers.alcoholicStatus || "",
            sections,
            tiAnswers: {
              trainSafety: parsedAnswers.trainSafety || [],
              signaling: parsedAnswers.signaling || [],
              shunting: parsedAnswers.shunting || [],
              documentation: parsedAnswers.documentation || [],
              emergency: parsedAnswers.emergency || []
            },
            aomRemarks: a.APPROVAL?.remarks || "",
            auditTrail: a.APPROVAL ? [{ action: "Reviewed", by: a.APPROVAL.USERS?.full_name || "AOM", date: a.APPROVAL.approval_date ? new Date(a.APPROVAL.approval_date).toISOString().slice(0, 10) : "", remark: a.APPROVAL.remarks }] : []
          };
        });
        setAomTMList(tmMapped);

        // Map SS assessments
        const sss = (assessList || []).filter(a => a.assessment_type === "Station Superintendent Assessment" || a.assessment_type === "SS Assessment");
        const ssMapped = sss.map(a => {
          const score = a.TEST_ATTEMPT?.[0]?.obtained_marks || 0;
          const subDate = a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : "";
          const answers = a.TEST_ATTEMPT?.[0]?.answers || {};

          let parsedAnswers = answers;
          if (typeof parsedAnswers === "string") {
            try { parsedAnswers = JSON.parse(parsedAnswers); } catch (e) { }
          }

          const isAlc = parsedAnswers.alcoholicStatus === "Alcoholic";
          const cat = isAlc ? "D" : (a.TEST_ATTEMPT?.[0]?.category || "A");
          const isOnlineExam = a.TEST_ATTEMPT?.[0]?.total_marks === 25;

          let sections = [];
          if (parsedAnswers && parsedAnswers.sections && parsedAnswers.sections.length > 0) {
            sections = parsedAnswers.sections.map(s => ({
              title: s.title || s.label || "",
              score: s.marks !== undefined ? s.marks : (s.score || 0),
              max: s.outOf !== undefined ? s.outOf : (s.max || 0),
              marks: s.marks !== undefined ? s.marks : (s.score || 0),
              outOf: s.outOf !== undefined ? s.outOf : (s.max || 0)
            }));
          } else {
            // Proportional fallback if it's a raw MCQ attempt or missing checklist data
            const isRawAttempt = Array.isArray(parsedAnswers) || (!parsedAnswers.stationOps && !parsedAnswers.sections);
            const mcqScore = Math.min(
              parseInt(parsedAnswers.knowledgeMarks || parsedAnswers.mcqScore) ||
              (a.TEST_ATTEMPT?.[0]?.total_marks === 25 ? score : Math.round(score * 0.25)) ||
              0,
              25
            );

            if (isRawAttempt && a.TEST_ATTEMPT?.[0]?.total_marks !== 25 && score > 0) {
              const s1 = Math.round(score * 0.20);
              const s2 = Math.round(score * 0.16);
              const s3 = Math.round(score * 0.12);
              const s4 = Math.round(score * 0.20);
              const s5 = Math.round(score * 0.12);
              const s6 = Math.max(0, score - (s1 + s2 + s3 + s4 + s5));

              sections = [
                { title: "Station Operations & Supervision", score: s1, max: 25, marks: s1, outOf: 25 },
                { title: "Staff Management & Discipline", score: s2, max: 20, marks: s2, outOf: 20 },
                { title: "Records & Documentation", score: s3, max: 15, marks: s3, outOf: 15 },
                { title: "Safety Compliance & Emergency", score: s4, max: 25, marks: s4, outOf: 25 },
                { title: "Infrastructure & Asset Maintenance", score: s5, max: 15, marks: s5, outOf: 15 },
                { title: "Written Exam (Knowledge)", score: s6, max: 25, marks: s6, outOf: 25 }
              ];
            } else {
              // Compute YN Yes counts
              const countYes = arr => (arr || []).filter(v => v === "Yes").length;

              const s1 = countYes(parsedAnswers.stationOps) * 5;
              const s2 = countYes(parsedAnswers.staffMgmt) * 4;
              const s3 = countYes(parsedAnswers.records) * 3;
              const s4 = countYes(parsedAnswers.safety) * 5;
              const s5 = countYes(parsedAnswers.infra) * 3;

              sections = [
                { title: "Station Operations & Supervision", score: s1, max: 25, marks: s1, outOf: 25 },
                { title: "Staff Management & Discipline", score: s2, max: 20, marks: s2, outOf: 20 },
                { title: "Records & Documentation", score: s3, max: 15, marks: s3, outOf: 15 },
                { title: "Safety Compliance & Emergency", score: s4, max: 25, marks: s4, outOf: 25 },
                { title: "Infrastructure & Asset Maintenance", score: s5, max: 15, marks: s5, outOf: 15 },
                { title: "Written Exam (Knowledge)", score: mcqScore, max: 25, marks: mcqScore, outOf: 25 }
              ];
            }
          }

          return {
            id: a.assessment_id,
            name: a.employee?.full_name || "",
            hrmsId: a.employee?.hrms_id || "",
            station: a.employee?.EMPLOYEE_PROFILE?.STATION?.station_name || "—",
            submissionDate: subDate,
            status: a.status === 'Pending' ? 'Submitted' : a.status,
            score: score,
            category: cat,
            isOnlineExam: isOnlineExam,
            pmeStatus: parsedAnswers.pmeStatus || "Fit",
            refStatus: parsedAnswers.refStatus || "Cleared",
            remarks: parsedAnswers.remarks || "",
            alcoholicStatus: parsedAnswers.alcoholicStatus || "",
            sections,
            tiAnswers: {
              stationOps: parsedAnswers.stationOps || [],
              staffMgmt: parsedAnswers.staffMgmt || [],
              records: parsedAnswers.records || [],
              safety: parsedAnswers.safety || [],
              infra: parsedAnswers.infra || []
            },
            aomRemarks: a.APPROVAL?.remarks || "",
            auditTrail: a.APPROVAL ? [{ action: "Approved", by: a.APPROVAL.USERS?.full_name || "AOM", date: new Date(a.APPROVAL.approval_date).toISOString().slice(0, 10), remark: a.APPROVAL.remarks }] : []
          };
        });
        setAomSSList(ssMapped);

        // Helper to resolve role name consistently
        const resolveRoleDisplayName = (dbRole) => {
          const lower = (dbRole || "").toLowerCase().trim();
          if (lower === "sm" || lower === "station master") return "Station Master";
          if (lower === "tm" || lower === "train manager") return "Train Manager";
          if (lower === "ss" || lower === "station superintendent") return "Station Superintendent";
          if (lower === "pointsmen" || lower === "pointsman") return "Pointsman";
          return "Traffic Inspector";
        };

        // Map pending/submitted assessments for AOM Console
        const pendingMapped = (assessList || []).filter(a => a.status === "Pending" || a.status === "Submitted" || a.status === "AVAILABLE").map(a => {
          const roleName = resolveRoleDisplayName(a.employee?.ROLE?.role_name);
          const divName = a.employee?.EMPLOYEE_PROFILE?.STATION?.DIVISION?.division_name || "Nagpur";
          const hasAttempt = a.TEST_ATTEMPT && a.TEST_ATTEMPT.length > 0;
          // quizMarks: use obtained_marks from DB TEST_ATTEMPT — the real source of truth
          const quizMarks = hasAttempt ? (a.TEST_ATTEMPT[0].obtained_marks ?? null) : null;
          // If there's already a test attempt, treat this as submitted regardless of ASSESSMENT.status
          const isSubmitted = a.status === 'Submitted' || hasAttempt;
          return {
            id: a.assessment_id,
            employeeId: a.employee_id,
            hrmsId: a.employee?.hrms_id || a.employee_id,
            title: `${roleName} - ${a.employee?.hrms_id || a.employee_id}`,
            statusLabel: isSubmitted ? "Awaiting AOM Grading" : "Pending Approval",
            assessedByLine: `Assessed by: ${a.conducted_by_user?.full_name || "AOM"} - on ${a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}`,
            employeeLine: `Employee: ${a.employee?.full_name || ""} | Division: ${divName}`,
            // If exam has been attempted, actionType = 'approval' so AOM sees "Submitted" not "Exam Sent"
            actionType: isSubmitted ? "approval" : "exam_sent",
            quizMarks: quizMarks
          };
        });
        setPendingAssessments(pendingMapped);

        // Map approved assessments for AOM Console (status is 'Approved')
        const approvedMapped = (assessList || []).filter(a => a.status === "Approved").map(a => {
          const roleName = resolveRoleDisplayName(a.employee?.ROLE?.role_name);
          const score = a.TEST_ATTEMPT?.[0]?.obtained_marks || 0;
          const cat = a.TEST_ATTEMPT?.[0]?.category || "A";
          const answers = a.TEST_ATTEMPT?.[0]?.answers;
          let parsedAnswers = {};
          if (answers) {
            try {
              parsedAnswers = typeof answers === "string" ? JSON.parse(answers) : answers;
            } catch (e) {}
          }
          const mcqScore = parsedAnswers?.mcqScore !== undefined ? parsedAnswers.mcqScore : (parsedAnswers?.knowledgeMarks !== undefined ? parsedAnswers.knowledgeMarks : null);
          const calculatedMcq = mcqScore !== null ? Number(mcqScore) : Math.round(score * 0.25);
          return {
            id: a.assessment_id,
            employeeId: a.employee_id,
            hrmsId: a.employee?.hrms_id || a.employee_id,
            title: `${roleName} - ${a.employee?.hrms_id || a.employee_id}`,
            detail: `Approved by: AOM - on ${a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}`,
            score: `Score: ${score}/100 - Grade: ${cat}`,
            quizMarks: calculatedMcq,
            answers: parsedAnswers
          };
        });
        setApprovedAssessments(approvedMapped);

        // Map reportRows from assessList
        const reportsMapped = (assessList || []).map(a => {
          const roleName = resolveRoleDisplayName(a.employee?.ROLE?.role_name);
          const score = a.TEST_ATTEMPT?.[0]?.obtained_marks || 0;
          const cat = a.TEST_ATTEMPT?.[0]?.category || "A";
          return {
            id: a.assessment_id,
            hrmsId: a.employee?.hrms_id || "",
            name: a.employee?.full_name || "",
            designation: roleName,
            assessmentStatus: a.status === 'Pending' ? 'Pending Approval' : a.status,
            score: String(score),
            grade: cat,
            lastAssessed: a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : ""
          };
        });
        setReportRows(reportsMapped);
      }
    } catch (err) {
      console.error("Failed to load AOM live data:", err);
    }
  };

  useEffect(() => {
    fetchLiveDatabaseData();
    const interval = setInterval(() => {
      fetchLiveDatabaseData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return {
    activePage,
    setActivePage,
    pmModal,
    setPmModal,
    pmF,
    setPmF,
    openPmAdd,
    openPmEdit,
    openPmShift,
    savePmModal,
    removePm,
    openSmAdd,
    openSmEdit,
    openSmShift,
    saveSmModal,
    removeSm,
    openTiAdd,
    openTiEdit,
    removeTi,
    saveTiModal,
    openSsAdd,
    openSsEdit,
    openSsShift,
    saveSsModal,
    removeSs,
    openTmAdd,
    openTmEdit,
    openTmShift,
    saveTmModal,
    removeTm,
    showAddUserForm,
    setShowAddUserForm,
    selectedPeriod,
    setSelectedPeriod,
    aomCatColor,
    aomCurrentList,
    aomSelectedItem,
    aomFilteredList,
    aomOpenReview,
    aomUpdateSec,
    aomFinalize,
    aomApprovalTab,
    setAomApprovalTab,
    aomReviewTab,
    setAomReviewTab,
    aomReviewSearch,
    setAomReviewSearch,
    aomReviewStation,
    setAomReviewStation,
    aomSelectedId,
    setAomSelectedId,
    aomEditSections,
    aomAomRemarks,
    setAomAomRemarks,
    aomShowAudit,
    setAomShowAudit,
    aomRejectMode,
    setAomRejectMode,
    aomApprovalNotice,
    aomAllStations,
    searchStations,
    setSearchStations,
    isChartZoomModalOpen,
    setIsChartZoomModalOpen,
    selectedChartType,
    setSelectedChartType,
    zoomPopupPage,
    setZoomPopupPage,
    zoomPopupSearch,
    setZoomPopupSearch,
    zoomPopupZone,
    setZoomPopupZone,
    zoomPopupDivision,
    setZoomPopupDivision,
    zoomPopupStationName,
    setZoomPopupStationName,
    zoomPopupStationCode,
    setZoomPopupStationCode,
    zoomPopupCategory,
    setZoomPopupCategory,
    zoomPopupRisk,
    setZoomPopupRisk,
    zoomPopupStatus,
    setZoomPopupStatus,
    zoomPopupStartDate,
    setZoomPopupStartDate,
    zoomPopupEndDate,
    setZoomPopupEndDate,
    userFormData,
    setUserFormData,
    formErrors,
    setFormErrors,
    users,
    setUsers,
    editingUserId,
    setEditingUserId,
    pendingFilters,
    setPendingFilters,
    appliedFilters,
    setAppliedFilters,
    tableSearch,
    setTableSearch,
    currentPage,
    setCurrentPage,
    stations,
    setStations,
    stationFormData,
    setStationFormData,
    stationFormErrors,
    setStationFormErrors,
    pendingStationFilters,
    setPendingStationFilters,
    appliedStationFilters,
    setAppliedStationFilters,
    stationSearch,
    setStationSearch,
    stationMasterSearch,
    setStationMasterSearch,
    stationCurrentPage,
    setStationCurrentPage,
    selectedUserProfile,
    setSelectedUserProfile,
    selectedSMProfile,
    setSelectedSMProfile,
    userShiftDrafts,
    setUserShiftDrafts,
    view,
    setView,
    stF,
    setStF,
    newStName,
    setNewStName,
    newStCode,
    setNewStCode,
    newStTi,
    setNewStTi,
    newStDivision,
    setNewStDivision,
    newStZone,
    setNewStZone,
    newStCategory,
    setNewStCategory,
    newStClass,
    setNewStClass,
    newStType,
    setNewStType,
    newStSignaling,
    setNewStSignaling,
    newStPlatforms,
    setNewStPlatforms,
    newStTracks,
    setNewStTracks,
    newStDailyFootfall,
    setNewStDailyFootfall,
    newStLatitude,
    setNewStLatitude,
    newStLongitude,
    setNewStLongitude,
    newStContactNumber,
    setNewStContactNumber,
    newStEmailId,
    setNewStEmailId,
    newStLineConfig,
    setNewStLineConfig,
    newStElectrified,
    setNewStElectrified,
    showAddStation,
    setShowAddStation,
    selectedSMForPointsmen,
    setSelectedSMForPointsmen,
    selectedPointsmanForMonitoring,
    setSelectedPointsmanForMonitoring,
    pointsmanSearchText,
    setPointsmanSearchText,
    pointsmanRiskFilter,
    setPointsmanRiskFilter,
    pointsmanStatusFilter,
    setPointsmanStatusFilter,
    handleChartClick,
    handlePieClick,
    aomPointsmen,
    setAomPointsmen,
    aomStationMasters,
    setAomStationMasters,
    smModal,
    setSmModal,
    ssModal,
    setSsModal,
    tmModal,
    setTmModal,
    tiModal,
    setTiModal,
    getPmCat,
    getPmRisk,
    handleTiViewClick,
    handleStationMasterClick,
    stationDetailId,
    setStationDetailId,
    isStationEditMode,
    setIsStationEditMode,
    tiSearch,
    setTiSearch,
    trafficInspectors,
    setTrafficInspectors,
    tiFormData,
    setTiFormData,
    tiFormErrors,
    setTiFormErrors,
    tiAddMode,
    setTiAddMode,
    tiHrmsSearch,
    setTiHrmsSearch,
    tiNotice,
    setTiNotice,
    selectedTiId,
    setSelectedTiId,
    tiLinkTargetId,
    setTiLinkTargetId,
    tiLinkDraft,
    setTiLinkDraft,
    tiShiftDrafts,
    setTiShiftDrafts,
    smShiftDrafts,
    setSmShiftDrafts,
    selectedTIForStationMasters,
    setSelectedTIForStationMasters,
    pendingAssessments,
    setPendingAssessments,
    approvedAssessments,
    setApprovedAssessments,
    reportRows,
    setReportRows,
    reportSearchQuery,
    setReportSearchQuery,
    reportDesignation,
    setReportDesignation,
    repF,
    setRepF,
    repApplied,
    setRepApplied,
    selectedReportUserId,
    setSelectedReportUserId,
    assessmentActionNotice,
    setAssessmentActionNotice,
    assessmentRoleTab,
    setAssessmentRoleTab,
    openAssessmentId,
    setOpenAssessmentId,
    answersByAssessment,
    setAnswersByAssessment,
    expandedCriterionKey,
    setExpandedCriterionKey,
    assessSearch,
    setAssessSearch,
    assessStation,
    setAssessStation,
    assessStatus,
    setAssessStatus,
    assessDate,
    setAssessDate,
    aomSettings,
    setAomSettings,
    settingsNotice,
    setSettingsNotice,
    empSearchText,
    setEmpSearchText,
    empDesignationFilter,
    setEmpDesignationFilter,
    empStationFilter,
    setEmpStationFilter,
    empDivisionFilter,
    setEmpDivisionFilter,
    empZoneFilter,
    setEmpZoneFilter,
    empCategoryFilter,
    setEmpCategoryFilter,
    empRiskFilter,
    setEmpRiskFilter,
    empStatusFilter,
    setEmpStatusFilter,
    empMonitoringFilter,
    setEmpMonitoringFilter,
    empSortConfig,
    setEmpSortConfig,
    empCurrentPage,
    setEmpCurrentPage,
    deactivatedUserIds,
    setDeactivatedUserIds,
    empShiftDrafts,
    setEmpShiftDrafts,
    roleFilterName,
    setRoleFilterName,
    roleFilterStation,
    setRoleFilterStation,
    roleFilterDivision,
    setRoleFilterDivision,
    roleFilterCat,
    setRoleFilterCat,
    roleFilterRisk,
    setRoleFilterRisk,
    selectedRoleEmployee,
    setSelectedRoleEmployee,
    roleShiftDrafts,
    setRoleShiftDrafts,
    tiActivatedAssessments,
    setTiActivatedAssessments,
    tiAssessmentFormOpen,
    setTiAssessmentFormOpen,
    tiAssessmentAnswers,
    setTiAssessmentAnswers,
    aomSuperintendents,
    setAomSuperintendents,
    aomTrainManagers,
    setAomTrainManagers,
    allEmployees,
    pageSize,
    stationPageSize,
    todayIso,
    extractDesignation,
    resolveAssessmentTab,
    buildPrefilledAnswers,
    getTiSectionScore,
    calculateAssessmentScore,
    countAnsweredCriteria,
    computeScoreAndGrade,
    buildAssessmentTableMeta,
    handleViewAssessmentDetails,
    handleAssignAssessment,
    handleApproveAssessment,
    handleRejectAssessment,
    handleStartAssessment,
    handleOpenAssessmentForm,
    getTiRosterList,
    openTiForm,
    handleAnswerChange,
    handleSelectAllYes,
    handleApproveAllInSelectedOption,
    toggleCriterion,
    handleViewReport,
    handleAssessReport,
    handleSettingsToggle,
    handleSettingsSelect,
    handleSaveSettings,
    filteredReportRows,
    handleSidebarClick,
    handleStationSubPage,
    handleUserFormChange,
    handleFilterChange,
    validateUserForm,
    handleSubmitUser,
    handleEditUser,
    handleDeleteUser,
    handleFilterSubmit,
    filteredUsers,
    totalPages,
    pagedUsers,
    goToPrevPage,
    goToNextPage,
    handleStationFormChange,
    handleStationStatusToggle,
    validateStationForm,
    handleAddStationSubmit,
    handleResetStationForm,
    handleStationFilterChange,
    handleApplyStationFilter,
    filteredStations,
    stationTotalPages,
    pagedStations,
    goToPrevStationPage,
    goToNextStationPage,
    openStationView,
    handleUpdateStation,
    handleDeleteStation,
    handleTiFormChange,
    validateTiForm,
    handleAddTiByForm,
    matchedTiByHrms,
    handleAddTiByHrms,
    handleRemoveTi,
    handleOpenTiProfile,
    handleOpenLinkTi,
    toggleMultiValue,
    handleSaveTiLinks,
    handleShiftTi,
    filteredTrafficInspectors,
    selectedTiProfile,
    linkTargetTi,
    stationLinkOptions,
    smLinkOptions,
    handleExportCSV,
    resetRoleFilters,
    isStationMatch,
    unifiedStaff,
    unifiedStations,
    ROLE_MAP,
    riskBadge,
    catBadge,
    statusBadge,
    handleAddStation,
    stationMastersDirectory,
    filteredStationMasters,
    handleShiftStationMaster,
    handleDeleteStationMaster,
    renderCategoryBadge,
    renderEmployeeManagement,
    renderStations,
    renderAomRole,
    renderPointsmanMonitoringDetail,
    renderStationFormFields,
    renderChartZoomModal,
    renderPmModal,
    renderSmModal,
    renderSsModal,
    renderTmModal,
    renderTiModal,
    renderAddStationModal,
    aomSMList,
    aomSSList,
    aomTMList,
    aomGetCat,
    logAomPmeRecord,
    allDbAssessments,
    selectedCategory,
    setSelectedCategory,
    selectedHrmsIds,
    setSelectedHrmsIds,
    viewUpcomingOnly,
    setViewUpcomingOnly,
    sendBatchExamAccessAOM,
    updateEmployeeScheduleAOM
  };
}
