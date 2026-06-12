import { useMemo, useState, useEffect } from "react";
import { getCat, riskLevel } from '../../utils/scoreCalculator';
import {
  YN_SECTIONS, defaultAssessForm,
  smTestQuestions, smAssessmentHistory
} from '../../data/mockStationMasterData';
import { saDataService } from '../../services/saDataService';
import { monitoringService } from '../../services/monitoringService';
import { supabase, isSupabaseConfigured, dbService } from "../../supabaseClient";
import { assessmentService } from "../../services/assessmentService";

export function useStationMasterState(user, onLogout) {

  const [activeTab, setActiveTab] = useState("dashboard");
  const [pageMode, setPageMode] = useState("default");
  const [statusMsg, setStatusMsg] = useState("");
  const [pointsmen, setPointsmen] = useState([]);
  const [counsellingQueue, setCounsellingQueue] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [submittedAssessments, setSubmittedAssessments] = useState([]);
  const [selectedPm, setSelectedPm] = useState(null);
  const [assessTarget, setAssessTarget] = useState(null);
  const [assessForm, setAssessForm] = useState(defaultAssessForm);
  const [assessLocked, setAssessLocked] = useState(false);
  const [myAssessSelected, setMyAssessSelected] = useState(null);
  const [pmFilter, setPmFilter] = useState({ search: "", grade: "All", status: "All", risk: "All" });
  const [reportFilter, setReportFilter] = useState({ search: "", grade: "All", risk: "All", sortBy: "date-desc" });
  const [activatedTests, setActivatedTests] = useState(() => {
    const saved = localStorage.getItem("sm_pm_activated_tests");
    return saved ? JSON.parse(saved) : {};
  });
  const [repApplied, setRepApplied] = useState(false);
  const [selectedReportUserId, setSelectedReportUserId] = useState(null);
  const [repF, setRepF] = useState({ search: "", cat: "All", risk: "All" });
  const [viewingStaff, setViewingStaff] = useState(null);

  const [showCategoriesPanel, setShowCategoriesPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchHrms, setSearchHrms] = useState("");
  const [selectedHrmsIds, setSelectedHrmsIds] = useState([]);
  const [allDbAssessments, setAllDbAssessments] = useState([]);

  // Pointsman Replicated Dashboard States & Helpers
  const [pmModal, setPmModal] = useState(null);
  const [pmF, setPmF] = useState({ name: "", station: "All", cat: "All", risk: "All" });
  const [viewingPm, setViewingPm] = useState(null);

  const [stationSms, setStationSms] = useState([]);
  const [assignedTi, setAssignedTi] = useState(null);

  const smName = user?.name || "—";
  const smId = user?.hrmsId || "—";

  const fetchLiveDatabaseData = async () => {
    try {
      const u = await saDataService.fetchUsers();
      const mapped = u.map(x => ({
        ...x,
        hrmsId: x.id,
        cat: x.cat || "Untested",
        risk: x.risk || "Untested",
        score: x.cat === "Untested" ? null : (x.score !== undefined && x.score !== 0 ? parseInt(x.score) : null),
        lastScore: x.cat === "Untested" ? null : (x.score !== undefined && x.score !== 0 ? parseInt(x.score) : null),
        safetyScore: x.cat === "Untested" ? null : (x.safetyScore !== undefined && x.safetyScore !== 0 ? parseInt(x.safetyScore) : null),
        totalAssessments: x.cat === "Untested" ? 0 : (x.totalAssessments || 0),
        approvalStatus: x.cat === "Untested" ? "Pending" : "Approved",
        stationName: x.station,
        doj: x.lastDate || "2026-01-01"
      }));

      const userStation = user?.station || "";
      const filtered = mapped.filter(x => {
        const isPm = x.role === "pointsmen" || x.role === "Pointsman" || x.designation?.toLowerCase().includes("pointsman");
        if (!isPm) return false;
        if (userStation) {
          return (x.station || "").toLowerCase().trim() === userStation.toLowerCase().trim();
        }
        return true;
      });
      // setPointsmen is deferred to supabase load or fallback below to prevent UI flickering

      const sms = mapped.filter(x => {
        const isSm = x.role === "sm" || x.role === "Station Master";
        if (!isSm) return false;
        if (userStation) {
          return (x.station || "").toLowerCase().trim() === userStation.toLowerCase().trim();
        }
        return true;
      });
      setStationSms(sms);

      const ti = mapped.find(x => {
        const isTi = x.role === "ti" || x.role === "Traffic Inspector";
        if (!isTi) return false;
        const rawStations = x.linkedStations || x.jurisdiction || "";
        if (userStation && rawStations && rawStations !== "—") {
          const tiStList = rawStations.split(",").map(s => s.trim().toLowerCase());
          return tiStList.includes(userStation.toLowerCase().trim());
        }
        return false;
      });
      setAssignedTi(ti || null);

      // Fetch all assessments from Supabase
      let dbSubmitted = [];
      if (isSupabaseConfigured) {
        try {
          const { data: assessList } = await supabase
            .from("ASSESSMENT")
            .select(`
              *,
              employee:USERS!employee_id (hrms_id),
              TEST_ATTEMPT (obtained_marks, total_marks, category, answers)
            `);

          if (assessList) {
            setAllDbAssessments(assessList);
            dbSubmitted = assessList
              .filter(a => ["Submitted", "Approved", "Completed", "EVALUATED"].includes(a.status))
              .filter(a => a.employee?.hrms_id && ((a.assessment_type || "").includes("Checklist Evaluation") || (a.assessment_type || "").includes("Pointsman Checklist") || (a.assessment_type || "").includes("Pointsman Evaluation") || (a.assessment_type || "").includes("Competency Assessment")))
              .filter(a => filtered.some(p => p.hrmsId === a.employee.hrms_id))
              .map(a => ({
                pmId: a.employee.hrms_id,
                date: a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : new Date(a.created_at).toISOString().slice(0, 10),
                score: a.TEST_ATTEMPT?.[0]?.obtained_marks || 0,
                totalMarks: a.TEST_ATTEMPT?.[0]?.total_marks || 100,
                status: a.status
              }));
            setSubmittedAssessments(dbSubmitted);

            const updatedPointsmen = filtered.map(p => {
              const pmAssessments = assessList.filter(a => a.employee?.hrms_id === p.hrmsId);
              const approvedAssessments = pmAssessments.filter(a => a.status === 'Approved');
              const totalApproved = approvedAssessments.length;

              if (totalApproved > 0) {
                const latestApproved = [...approvedAssessments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                const score = latestApproved?.TEST_ATTEMPT?.[0]?.obtained_marks;
                const cat = latestApproved?.TEST_ATTEMPT?.[0]?.category || p.cat || "A";
                const lastAssessDate = latestApproved.assessment_date
                  ? new Date(latestApproved.assessment_date).toISOString().slice(0, 10)
                  : new Date(latestApproved.created_at).toISOString().slice(0, 10);
                return {
                  ...p,
                  totalAssessments: pmAssessments.length,
                  approvalStatus: "Approved",
                  status: "Approved",
                  cat: cat,
                  category: cat,
                  risk: cat === "D" ? "High" : (score >= 80 ? "Low" : score >= 60 ? "Medium" : "High"),
                  score: score,
                  lastScore: score,
                  lastAssessDate: lastAssessDate
                };
              } else {
                const cat = p.cat || p.category || "A";
                return {
                  ...p,
                  totalAssessments: pmAssessments.length,
                  approvalStatus: "Pending First Assessment",
                  status: "Pending First Assessment",
                  cat: cat,
                  category: cat,
                  risk: cat === "D" ? "High" : cat === "C" ? "Medium" : "Low",
                  score: null,
                  lastScore: null,
                  lastAssessDate: "No Assessment Taken"
                };
              }
            });
            setPointsmen(updatedPointsmen);

            const updatedDrafts = updatedPointsmen.filter(x => x.cat === "D" || x.cat === "Untested" || x.approvalStatus === "Pending" || x.approvalStatus === "Pending First Assessment");
            setDrafts(updatedDrafts);

            // Also fetch SM's OWN assessment history
            if (user?.userId) {
              const { data: myAssessList } = await supabase
                .from("ASSESSMENT")
                .select(`
                  *,
                  TEST_ATTEMPT (*),
                  APPROVAL (remarks, approval_date, USERS!approved_by (full_name))
                `)
                .eq("employee_id", user.userId)
                .eq("assessment_type", "Station Master Assessment");

              if (myAssessList && myAssessList.length > 0) {
                const mappedHistory = myAssessList.map(a => {
                  const ta = a.TEST_ATTEMPT?.[0];
                  const answers = ta?.answers || {};
                  const isApproved = a.status === "Approved";
                  const isOnlineExam = ta?.total_marks === 25 || (a.assessment_type || "").includes("MCQ") || !isApproved;

                  let sections = answers.sections || [];
                  if (isOnlineExam && sections.length === 0) {
                    sections = [
                      { title: "MCQ Safety & Rule Exam", marks: ta?.obtained_marks || 0, outOf: 25 }
                    ];
                  }

                  return {
                    id: a.assessment_id,
                    date: a.assessment_date ? new Date(a.assessment_date).toISOString().slice(0, 10) : new Date(a.created_at).toISOString().slice(0, 10),
                    period: "Current",
                    assessedBy: isOnlineExam ? "Online Exam" : "Traffic Inspector",
                    totalScore: ta?.obtained_marks || 0,
                    category: ta?.category || "A",
                    approvalStatus: a.status,
                    tiRemarks: answers.remarks || "",
                    sections: sections,
                    isOnlineExam: isOnlineExam
                  };
                });

                // Merge with any locally stored ones not in DB (like current unsubmitted CBT)
                const localStr = localStorage.getItem(`sm_history_${smId}`);
                const localHist = localStr ? JSON.parse(localStr) : [];
                const mergedHist = [...mappedHistory, ...localHist.filter(lh => lh.isOnlineExam && !mappedHistory.some(mh => mh.date === lh.date))];

                setHistory(mergedHist.sort((a, b) => new Date(b.date) - new Date(a.date)));
              }
            }
          }
        } catch (dbErr) {
          console.error("Failed to fetch submitted assessments:", dbErr);
          // Fallback if Supabase fails
          setPointsmen(filtered);
          const initialDrafts = filtered.filter(x => x.cat === "D" || x.cat === "Untested" || x.approvalStatus === "Pending" || x.approvalStatus === "Pending First Assessment");
          setDrafts(initialDrafts);
        }
      } else {
        // Fallback for offline mode
        setPointsmen(filtered);
        const initialDrafts = filtered.filter(x => x.cat === "D" || x.cat === "Untested" || x.approvalStatus === "Pending" || x.approvalStatus === "Pending First Assessment");
        setDrafts(initialDrafts);
      }

      if (isSupabaseConfigured && userStation) {
        try {
          const records = await assessmentService.getCounsellingRecordsByStation(userStation);
          setCounsellingQueue(records || []);
        } catch (counselErr) {
          console.error("Error fetching counselling records for SM:", counselErr);
        }
      }

    } catch (err) {
      console.error("Error fetching live db data:", err);
    }
  };

  useEffect(() => {
    fetchLiveDatabaseData();
    const interval = setInterval(() => {
      fetchLiveDatabaseData();
    }, 4000);
    return () => clearInterval(interval);
  }, [user]);

  const openPmAdd = () => {
    setPmModal({
      mode: "add",
      data: {
        id: `PM_${Date.now().toString().slice(-4)}`,
        hrmsId: `PM_${Date.now().toString().slice(-4)}`,
        name: "",
        role: "Pointsman",
        designation: "Pointsman Grade I",
        station: user?.station || "",
        cat: "Untested",
        lastAssessDate: new Date().toISOString().split('T')[0],
        score: 0,
        lastScore: 0,
        safetyScore: 0,
        totalAssessments: 0,
        pmeStatus: "Fit",
        refStatus: "Cleared",
        contact: "",
        email: "",
        pfNumber: "",
        joiningDate: new Date().toISOString().split('T')[0],
        doj: new Date().toISOString().split('T')[0],
        gender: "Male",
        age: 35,
        basePay: "₹25,000",
        approvalStatus: "Approved",
        reportingSm: user?.name || "",
        workLocation: "Yard",
        shift: "Morning Shift (06:00 - 14:00)",
        password: "",
        confirmPassword: ""
      }
    });
  };

  const openPmEdit = (pm) => {
    setPmModal({
      mode: "edit",
      data: {
        ...pm,
        pmeStatus: pm.pmeStatus || "Fit",
        refStatus: pm.refStatus || "Cleared",
        doj: pm.lastDate || pm.doj || new Date().toISOString().split('T')[0],
        reportingSm: pm.reportingSm || user?.name || "",
        pfNumber: pm.pfNumber || "",
        email: pm.email || ""
      }
    });
  };

  const openPmShift = (pm) => {
    setPmModal({
      mode: "shift",
      data: { ...pm }
    });
  };

  const savePmModal = async () => {
    if (!pmModal.data.name || !pmModal.data.hrmsId) {
      alert("Name and HRMS ID are required.");
      return;
    }
    if (!pmModal.data.pfNumber) {
      alert("PF Number is required.");
      return;
    }
    if (!pmModal.data.email) {
      alert("Email Address is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(pmModal.data.email)) {
      alert("Please enter a valid Email Address.");
      return;
    }
    if (pmModal.mode === "add") {
      if (!pmModal.data.password) {
        alert("Password is required.");
        return;
      }
      if (pmModal.data.password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
      }
    }
    if (!pmModal.data.doj) {
      alert("Joining Date is required.");
      return;
    }
    try {
      const data = pmModal.data;
      const catVal = data.category || data.cat || "Untested";
      const scoreVal = data.score !== undefined ? data.score : (catVal === "A" ? 85 : catVal === "B" ? 70 : catVal === "C" ? 55 : catVal === "D" ? 40 : 70);
      const modalData = {
        id: data.hrmsId || data.employeeId || data.id,
        name: data.name,
        contact: data.contact || data.phone || data.contactNumber,
        email: data.email || data.emailId,
        pfNumber: data.pfNumber,
        role: pmModal.mode === "shift" ? pmModal.role : "Pointsman",
        station: data.stationName || data.station || data.smStation,
        division: data.division || data.smDivision || data.tiArea,
        lastDate: data.doj || data.lastDate,
        score: scoreVal,
        safetyScore: scoreVal,
        cat: catVal,
        reportingSm: data.reportingSm || user?.name || "",
        workLocation: data.workLocation,
        shift: data.shift,
        jurisdiction: data.jurisdiction,
        password: data.password || "",
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
    if (window.confirm("Remove this pointsman?")) {
      try {
        await saDataService.removeUser(id);
        await fetchLiveDatabaseData();
      } catch (err) {
        alert("Error removing: " + err.message);
      }
    }
  };

  // Fullscreen Analytics States
  const [fullscreenChart, setFullscreenChart] = useState(null); // 'monthly' | 'safety' | 'performance' | null
  const [fsStartDate, setFsStartDate] = useState("");
  const [fsEndDate, setFsEndDate] = useState("");
  const [fsCategory, setFsCategory] = useState("All");
  const [fsRisk, setFsRisk] = useState("All");
  const [fsSearch, setFsSearch] = useState("");

  // Reactively Filtered Pointsmen for Fullscreen View
  const filteredFsPointsmen = useMemo(() => {
    return pointsmen.filter(p => {
      const q = fsSearch.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.hrmsId.toLowerCase().includes(q);
      const matchCategory = fsCategory === "All" || getCat(p.lastScore) === fsCategory;
      const matchRisk = fsRisk === "All" || riskLevel(p) === fsRisk;

      const pmHistoryList = [];
      const mostRecentDate = pmHistoryList.length > 0 ? pmHistoryList[0].date : p.doj;
      let matchDate = true;
      if (fsStartDate) matchDate = matchDate && mostRecentDate >= fsStartDate;
      if (fsEndDate) matchDate = matchDate && mostRecentDate <= fsEndDate;

      return matchSearch && matchCategory && matchRisk && matchDate;
    });
  }, [pointsmen, fsSearch, fsCategory, fsRisk, fsStartDate, fsEndDate]);

  // Reactively Recalculated Monthly Trend for Fullscreen View
  const dynamicMonthlyTrend = useMemo(() => {
    const months = [
      { label: "Nov 25", start: "2025-11-01", end: "2025-11-30" },
      { label: "Dec 25", start: "2025-12-01", end: "2025-12-31" },
      { label: "Jan 26", start: "2026-01-01", end: "2026-01-31" },
      { label: "Feb 26", start: "2026-02-01", end: "2026-02-28" },
      { label: "Mar 26", start: "2026-03-01", end: "2026-03-31" }
    ];

    return months.map(m => {
      let totalScore = 0;
      let totalSafety = 0;
      let count = 0;

      filteredFsPointsmen.forEach(p => {
        const pmHistoryList = submittedAssessments.filter(sa => sa.pmId === p.hrmsId);
        const matches = pmHistoryList.filter(h => h.date >= m.start && h.date <= m.end);
        matches.forEach(h => {
          totalScore += h.score;
          totalSafety += p.safetyScore;
          count++;
        });
      });

      return {
        month: m.label,
        assessments: count,
        avgScore: count > 0 ? Math.round(totalScore / count) : 0,
        safetyAvg: count > 0 ? Math.round(totalSafety / count) : 0
      };
    });
  }, [filteredFsPointsmen, submittedAssessments]);

  // History State
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`sm_history_${smId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error reading SM history:", e);
    }
    return smAssessmentHistory || [];
  });

  // MCQ Test State
  const [smMcqTest, setSmMcqTest] = useState(() => {
    const saved = localStorage.getItem(`sm_mcq_test_${smId}`);
    return saved ? JSON.parse(saved) : null;
  });

  // MCQ Test Assignment State — defaults to "Not Assigned" (LOCKED)
  // Only becomes "Assigned" when the TI explicitly sets sm_test_activated_{smId}=true
  const [testAssigned, setTestAssigned] = useState(() => {
    const saved = localStorage.getItem(`sm_test_assigned_${smId}`);
    return saved || "Not Assigned";
  });

  // Poll localStorage every 2 seconds to detect TI activation
  useEffect(() => {
    const syncActivation = () => {
      const activated = localStorage.getItem(`sm_test_activated_${smId}`) === "true";
      const completed = localStorage.getItem(`sm_test_assigned_${smId}`) === "Completed";
      if (completed) return; // already done, no more changes needed
      if (activated) {
        setTestAssigned("Assigned");
        localStorage.setItem(`sm_test_assigned_${smId}`, "Assigned");
      } else {
        const current = localStorage.getItem(`sm_test_assigned_${smId}`);
        if (!current || current === "Not Assigned") {
          setTestAssigned("Not Assigned");
        }
      }
    };
    syncActivation(); // run immediately
    const interval = setInterval(syncActivation, 2000);
    window.addEventListener("storage", syncActivation);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", syncActivation);
    };
  }, [smId]);

  // Read assessment status from database and update local storage/states to unlock automatically
  useEffect(() => {
    async function checkDatabaseAssessment() {
      if (!smId || !isSupabaseConfigured) return;
      try {
        // Resolve the employee's user_id from their HRMS ID
        let resolvedEmployeeId = smId;
        const { data: uData } = await supabase
          .from('USERS')
          .select('user_id')
          .eq('hrms_id', smId)
          .single();
        if (uData?.user_id) {
          resolvedEmployeeId = uData.user_id;
        }

        // Fetch active/pending assessments for this user
        const { data: assessments, error } = await supabase
          .from('ASSESSMENT')
          .select('assessment_id, status, assessment_type, conducted_by')
          .eq('employee_id', resolvedEmployeeId)
          .in('assessment_type', ['Station Master Assessment', 'SM Assessment'])
          .in('status', ['Pending', 'AVAILABLE', 'LOCKED', 'IN_PROGRESS'])
          .order('created_at', { ascending: false })
          .limit(1);

        const activatedTime = Number(localStorage.getItem(`sm_test_activated_time_${smId}`)) || 0;
        const isRecent = Date.now() - activatedTime < 15000; // 15 seconds guard

        if (!error && assessments && assessments.length > 0) {
          const activeAssess = assessments[0];
          if (activeAssess.status === 'Pending' || activeAssess.status === 'AVAILABLE' || activeAssess.status === 'IN_PROGRESS') {
            const currentActivated = localStorage.getItem(`sm_test_activated_${smId}`);
            if (currentActivated !== "true") {
              localStorage.setItem(`sm_test_activated_${smId}`, "true");
              window.dispatchEvent(new Event("storage"));
            }
          } else {
            if (!isRecent) {
              const currentActivated = localStorage.getItem(`sm_test_activated_${smId}`);
              if (currentActivated !== "false") {
                localStorage.setItem(`sm_test_activated_${smId}`, "false");
                window.dispatchEvent(new Event("storage"));
              }
            }
          }
        } else {
          if (!error && assessments && assessments.length === 0) {
            if (!isRecent) {
              const currentActivated = localStorage.getItem(`sm_test_activated_${smId}`);
              if (currentActivated !== "false") {
                localStorage.setItem(`sm_test_activated_${smId}`, "false");
                window.dispatchEvent(new Event("storage"));
              }
            }
          }
        }
      } catch (err) {
        console.error("Error checking database assessment for SM:", err);
      }
    }

    checkDatabaseAssessment();
    const dbInterval = setInterval(checkDatabaseAssessment, 4000);
    return () => clearInterval(dbInterval);
  }, [smId]);

  // Active MCQ Attempt States
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [testResponses, setTestResponses] = useState(() => Array(25).fill(null));

  const startTestAttempt = () => {
    setActiveQIdx(0);
    setTestResponses(Array(25).fill(null));
    setPageMode("takeTest");
  };

  const handleSubmitTestAttempt = async () => {
    const correctCount = testResponses.filter((r, idx) => r === smTestQuestions[idx].answer).length;
    const percentage = Math.round((correctCount / 25) * 100);
    const passStatus = percentage >= 60 ? "PASSED" : "FAILED";
    const today = new Date().toISOString().slice(0, 10);

    // Save to local storage for SM
    const testResult = {
      completed: true,
      correctCount: correctCount,
      responses: [...testResponses],
      submittedDate: today,
      percentage: percentage,
      passStatus: passStatus
    };
    localStorage.setItem(`sm_mcq_test_${smId}`, JSON.stringify(testResult));
    setSmMcqTest(testResult);

    // Update assigned status to 'Completed'
    localStorage.setItem(`sm_test_assigned_${smId}`, "Completed");
    setTestAssigned("Completed");

    // Generate a completed History record representing the Online self-exam
    const record = {
      id: Date.now(),
      date: today,
      period: "Q2 2026",
      assessedBy: "Online Self-Exam",
      totalScore: correctCount,
      category: getCat(percentage),
      approvalStatus: "Completed",
      tiRemarks: `Completed online safety competency assessment. Score: ${percentage}% (${correctCount}/25 correct). Awaiting TI evaluation.`,
      sections: [
        { title: "MCQ Safety & Rule Exam", marks: correctCount, outOf: 25 }
      ],
      mcqResponses: [...testResponses],
      isOnlineExam: true
    };

    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem(`sm_history_${smId}`, JSON.stringify(newHistory));

    // Submit to database under status Submitted
    if (isSupabaseConfigured) {
      const attemptData = {
        employeeId: smId,
        obtainedMarks: correctCount,
        percentage: percentage,
        category: getCat(percentage),
        totalMarks: 25,
        conductedBy: "AOM"
      };

      const answersArray = testResponses.map((selected, idx) => ({
        questionId: idx + 1,
        selectedOption: selected !== null && selected !== undefined ? ["A", "B", "C", "D"][selected] : "A",
        isCorrect: selected === smTestQuestions[idx].answer,
        correctOption: ["A", "B", "C", "D"][smTestQuestions[idx].answer],
        marksObtained: selected === smTestQuestions[idx].answer ? 1 : 0
      }));

      try {
        await dbService.submitTestAttempt(attemptData, answersArray);
      } catch (dbErr) {
        console.error("Database error on SM test attempt submission:", dbErr);
      }
    }

    // Also notify TI list in localStorage!
    let tiSmListStr = localStorage.getItem("ti_sm_list");
    let tiSmList = tiSmListStr ? JSON.parse(tiSmListStr) : null;
    if (tiSmList) {
      tiSmList = tiSmList.map(s => s.hrmsId === smId ? { ...s, status: "Submitted", score: correctCount } : s);
      localStorage.setItem("ti_sm_list", JSON.stringify(tiSmList));
    }

    setPageMode("default");
    setStatusMsg(`Assessment submitted! Score: ${percentage}% (${correctCount}/25). Status: Completed.`);
  };

  /* ─── Derived: stats ─── */
  const stats = useMemo(() => {
    const total = pointsmen.length;
    const pending = drafts.length;
    const completed = submittedAssessments.length;
    const highRisk = pointsmen.filter(p => riskLevel(p) === "High").length;
    const safetyPct = pointsmen.length > 0
      ? Math.round(pointsmen.reduce((s, p) => s + (p.safetyScore || 0), 0) / pointsmen.length)
      : 0;
    return { total, pending, completed, highRisk, safetyPct };
  }, [pointsmen, drafts, submittedAssessments]);

  /* ─── Pie: category dist ─── */
  const pieData = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    pointsmen.forEach(p => {
      const c = p.cat;
      if (counts[c] !== undefined) counts[c]++;
    });
    return Object.entries(counts).filter(([, c]) => c > 0)
      .map(([cat, count]) => ({ name: cat, value: count }));
  }, [pointsmen]);

  /* ─── Bottom performers ─── */
  const lowPerformers = useMemo(() =>
    [...pointsmen].filter(p => p.lastScore > 0).sort((a, b) => a.lastScore - b.lastScore).slice(0, 4)
    , [pointsmen]);

  /* ─── Filtered pointsmen list ─── */
  const filteredPm = useMemo(() => {
    return pointsmen.filter(p => {
      const clean = s => s ? s.toLowerCase().trim().replace(/\s+/g, '').replace(/junction|central|main|town|jn|station/gi, '') : '';
      const pmSt = p.station || "";
      const smSt = user?.station || "";
      if (smSt && clean(pmSt) !== clean(smSt) && !clean(pmSt).includes(clean(smSt)) && !clean(smSt).includes(clean(pmSt))) return false;

      if (pmF.name) {
        const s = pmF.name.toLowerCase();
        if (!p.name.toLowerCase().includes(s) && !p.hrmsId.toLowerCase().includes(s)) return false;
      }
      if (pmF.cat !== "All" && p.cat !== pmF.cat) return false;
      if (pmF.risk !== "All" && riskLevel(p) !== pmF.risk) return false;
      return true;
    });
  }, [pointsmen, pmF, user]);

  /* ─── Filtered reports ─── */
  const filteredReports = useMemo(() => {
    let list = pointsmen.filter(p => {
      const q = reportFilter.search.toLowerCase();
      const srch = !q || p.name.toLowerCase().includes(q) || p.hrmsId.toLowerCase().includes(q);
      const grade = reportFilter.grade === "All" || p.cat === reportFilter.grade;
      const risk = reportFilter.risk === "All" || riskLevel(p) === reportFilter.risk;
      return srch && grade && risk;
    });
    if (reportFilter.sortBy === "score-desc") list = [...list].sort((a, b) => b.lastScore - a.lastScore);
    else if (reportFilter.sortBy === "score-asc") list = [...list].sort((a, b) => a.lastScore - b.lastScore);
    return list;
  }, [pointsmen, reportFilter]);

  /* ─── Navigation ─── */
  const switchTab = (tab) => {
    setActiveTab(tab);
    setPageMode("default");
    setStatusMsg("");
    setSelectedReportUserId(null);
    setRepApplied(false);
  };

  /* ─── Open PM detail ─── */
  const openPmDetail = (pm) => {
    setSelectedPm(pm);
    setViewingPm(pm);
    setPageMode("pmDetail");
  };

  /* ─── Open assess form ─── */
  const openAssessForm = (draft) => {
    setAssessTarget(draft);

    // Load MCQ score if it exists in localStorage
    const mcqDataStr = localStorage.getItem(`pm_mcq_test_${draft.hrmsId}`);
    const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;
    const initialMcqMarks = mcqData && mcqData.completed ? String(mcqData.correctCount) : "0";

    setAssessForm({
      ...defaultAssessForm,
      knowledgeMarks: initialMcqMarks
    });
    setAssessLocked(false);
    setPageMode("assessForm");
  };

  /* ─── Yes/No toggle helper ─── */
  const toggleYN = (sectionKey, idx, val) => {
    if (assessLocked) return;
    setAssessForm(prev => {
      const next = [...prev[sectionKey]];
      next[idx] = next[idx] === val ? null : val;
      return { ...prev, [sectionKey]: next };
    });
  };

  /* ─── Live score computer ─── */
  const computeScore = (form) => {
    let total = 0;
    YN_SECTIONS.forEach(s => {
      form[s.key].forEach(v => { if (v === "Yes") total += s.weight; });
    });
    const km = Math.min(parseInt(form.knowledgeMarks) || 0, 25);
    return { ynScore: total, knowledge: km, total: total + km };
  };

  const submitAssessment = async (isDraftParam) => {
    let isDraft = false;
    let pm = assessTarget;
    let scoreObj = computeScore(assessForm);

    if (typeof isDraftParam === "boolean") {
      isDraft = isDraftParam;
    } else if (isDraftParam && typeof isDraftParam === "object") {
      pm = isDraftParam;
    }

    if (!pm) {
      console.error("No Pointsman selected for assessment.");
      return;
    }

    if (!isDraft) {
      let allAnswered = true;
      YN_SECTIONS.forEach(s => {
        if (assessForm[s.key].includes(null) || assessForm[s.key].includes(undefined) || assessForm[s.key].includes("")) {
          allAnswered = false;
        }
      });
      if (
        !allAnswered ||
        !assessForm.alcoholicStatus ||
        !assessForm.pmeStatus ||
        !assessForm.refStatus ||
        !assessForm.automaticTraining ||
        !assessForm.counselling ||
        !assessForm.dateOfAppointment ||
        !assessForm.workingSince ||
        !assessForm.remarks.trim()
      ) {
        alert("Please answer all checklist questions and complete all additional details (Alcoholic Status, PME Status, REF Status, Automatic Training, Counselling, Date of Appointment, Working Since, and Remarks) before submitting.");
        return;
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const scoreVal = scoreObj.total;
    let computedCat = getCat(scoreVal);

    if (assessForm.alcoholicStatus === "Alcoholic") {
      computedCat = "D";
    }

    const updatedPointsmen = pointsmen.map(p => {
      if (p.hrmsId === pm.hrmsId) {
        return {
          ...p,
          lastScore: scoreVal,
          cat: computedCat,
          risk: computedCat === "D" ? "High" : (scoreVal >= 80 ? "Low" : scoreVal >= 60 ? "Medium" : "High"),
          totalAssessments: (p.totalAssessments || 0) + 1,
          lastAssessDate: today
        };
      }
      return p;
    });

    setPointsmen(updatedPointsmen);

    // Save update to Supabase!
    try {
      const dbPm = updatedPointsmen.find(p => p.hrmsId === pm.hrmsId);
      if (dbPm) {
        const modalData = {
          id: dbPm.hrmsId,
          name: dbPm.name,
          contact: dbPm.contact,
          email: dbPm.email,
          role: "Pointsman",
          station: dbPm.station,
          division: dbPm.division,
          lastDate: dbPm.doj,
          score: dbPm.lastScore,
          cat: dbPm.cat,
          reportingSm: dbPm.reportingSm,
          workLocation: dbPm.workLocation,
          shift: dbPm.shift,
          jurisdiction: dbPm.jurisdiction
        };
        await saDataService.saveUser(modalData, "edit");
      }
    } catch (e) {
      console.error("Failed to save submitted assessment to DB:", e);
    }

    // Save to ASSESSMENT and TEST_ATTEMPT table in Supabase
    if (isSupabaseConfigured) {
      try {
        // Resolve Pointsman UUID from their hrmsId
        const { data: pmUser, error: pmErr } = await supabase
          .from("USERS")
          .select("user_id")
          .eq("hrms_id", pm.hrmsId)
          .single();

        if (pmErr || !pmUser) {
          throw new Error(`Failed to resolve Pointsman UUID for HRMS ID ${pm.hrmsId}`);
        }

        // Resolve Station Master UUID
        const { data: smUser } = await supabase
          .from("USERS")
          .select("user_id")
          .eq("hrms_id", smId)
          .single();

        const smUserUuid = smUser?.user_id || user?.userId;

        const assessmentType = "Checklist Evaluation"; // Matches what TI filters for pointsmen!
        const assessmentStatus = isDraft ? "Draft" : "Pending";

        // Check if there is an existing draft/available assessment to update, or insert new
        const { data: existingAssess } = await supabase
          .from("ASSESSMENT")
          .select("assessment_id")
          .eq("employee_id", pmUser.user_id)
          .in("assessment_type", ["Checklist Evaluation", "Pointsman Evaluation", "Pointsman Periodic Assessment"])
          .in("status", ["Draft", "AVAILABLE", "LOCKED", "IN_PROGRESS", "Pending", "Submitted"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let assessmentId = existingAssess?.assessment_id;

        if (assessmentId) {
          await supabase
            .from("ASSESSMENT")
            .update({
              status: assessmentStatus,
              conducted_by: smUserUuid,
              assessment_date: today,
              assessment_type: assessmentType
            })
            .eq("assessment_id", assessmentId);
        } else {
          const { data: newAssess, error: newAssessErr } = await supabase
            .from("ASSESSMENT")
            .insert([{
              employee_id: pmUser.user_id,
              conducted_by: smUserUuid,
              assessment_type: assessmentType,
              status: assessmentStatus,
              assessment_date: today
            }])
            .select()
            .single();

          if (newAssessErr) throw newAssessErr;
          assessmentId = newAssess.assessment_id;
        }

        // Insert or update the TEST_ATTEMPT
        const { data: existingAttempt } = await supabase
          .from("TEST_ATTEMPT")
          .select("attempt_id")
          .eq("assessment_id", assessmentId)
          .maybeSingle();

        if (existingAttempt) {
          await supabase
            .from("TEST_ATTEMPT")
            .update({
              total_marks: 100,
              obtained_marks: scoreVal,
              percentage: scoreVal,
              category: computedCat,
              answers: {
                ...assessForm,
                sections: YN_SECTIONS.map(s => ({
                  title: s.title,
                  marks: (assessForm[s.key] || []).filter(x => x === "Yes").length * s.weight,
                  outOf: s.outOf || (s.criteria.length * s.weight)
                }))
              },
              submitted_at: new Date().toISOString()
            })
            .eq("attempt_id", existingAttempt.attempt_id);
        } else {
          const { error: attemptErr } = await supabase
            .from("TEST_ATTEMPT")
            .insert([{
              assessment_id: assessmentId,
              employee_id: pmUser.user_id,
              total_marks: 100,
              obtained_marks: scoreVal,
              percentage: scoreVal,
              category: computedCat,
              answers: {
                ...assessForm,
                sections: YN_SECTIONS.map(s => ({
                  title: s.title,
                  marks: (assessForm[s.key] || []).filter(x => x === "Yes").length * s.weight,
                  outOf: s.outOf || (s.criteria.length * s.weight)
                }))
              },
              submitted_at: new Date().toISOString()
            }]);

          if (attemptErr) throw attemptErr;
        }

        if (computedCat === "D" && !isDraft) {
          try {
            await assessmentService.triggerCategoryDProtocol(pmUser.user_id, assessmentId, scoreVal, "D", smUserUuid);
          } catch (dErr) {
            console.error("Failed to trigger Category D protocol:", dErr);
          }
        }

        console.log(`Successfully saved assessment and test attempt to Supabase with status ${assessmentStatus}`);
      } catch (err) {
        console.error("Failed to save assessment to database:", err);
      }
    }

    if (!isDraft) {
      setSubmittedAssessments(prev => [...prev, { pmId: pm.hrmsId, date: today, score: scoreVal }]);
      setDrafts(prev => prev.filter(d => d.hrmsId !== pm.hrmsId));
      setStatusMsg(`Assessment submitted successfully for ${pm.name}. Total Score: ${scoreVal}/100.`);
    } else {
      setStatusMsg(`Assessment draft saved for ${pm.name}.`);
    }

    setPageMode("default");
  };

  const sendBatchAssessmentAccess = async (hrmsIds) => {
    if (!hrmsIds || hrmsIds.length === 0) return;
    setStatusMsg("Sending assessment access...");

    try {
      const today = new Date().toISOString().slice(0, 10);

      // Resolve Station Master UUID
      let smUserUuid = user?.userId;
      if (isSupabaseConfigured && (!smUserUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(smUserUuid))) {
        const { data: smUser } = await supabase
          .from("USERS")
          .select("user_id")
          .eq("hrms_id", smId)
          .single();
        smUserUuid = smUser?.user_id || user?.userId;
      }

      for (const hrmsId of hrmsIds) {
        // Find pointsman details
        const pm = pointsmen.find(p => p.hrmsId === hrmsId);
        if (!pm) continue;

        // Set activation state in local storage
        localStorage.setItem(`pm_test_activated_${hrmsId}`, "true");
        localStorage.setItem(`pm_test_activated_time_${hrmsId}`, Date.now().toString());
        localStorage.setItem(`pm_test_assigned_${hrmsId}`, "Assigned");
        localStorage.removeItem(`pm_mcq_test_${hrmsId}`);

        if (isSupabaseConfigured) {
          // Resolve Pointsman UUID from USERS table
          const { data: pmUser, error: pmErr } = await supabase
            .from("USERS")
            .select("user_id")
            .eq("hrms_id", hrmsId)
            .single();

          if (!pmErr && pmUser?.user_id) {
            const pmUserUuid = pmUser.user_id;

            // Check if there is a LOCKED assessment record
            const { data: lockedAssessments } = await supabase
              .from("ASSESSMENT")
              .select("assessment_id")
              .eq("employee_id", pmUserUuid)
              .eq("status", "LOCKED")
              .limit(1);

            if (lockedAssessments && lockedAssessments.length > 0) {
              await supabase
                .from("ASSESSMENT")
                .update({
                  status: "AVAILABLE",
                  conducted_by: smUserUuid,
                  assessment_date: today,
                  assessment_type: "Checklist Evaluation"
                })
                .eq("assessment_id", lockedAssessments[0].assessment_id);
            } else {
              // Insert a new AVAILABLE assessment record
              await supabase.from("ASSESSMENT").insert([{
                employee_id: pmUserUuid,
                conducted_by: smUserUuid,
                assessment_type: "Checklist Evaluation",
                status: "AVAILABLE",
                assessment_date: today
              }]);
            }

            // Create notification for the Pointsman
            await supabase.from("NOTIFICATION").insert([{
              user_id: pmUserUuid,
              title: "Assessment Access Granted",
              message: `Your safety competency assessment has been activated by Station Master ${smName}. You can now attempt the safety exam in your portal.`,
              is_read: false
            }]);
          }
        }
      }

      // Dispatch storage event to sync browser tabs
      window.dispatchEvent(new Event("storage"));

      // Clear selection
      setSelectedHrmsIds([]);

      // Refresh DB data
      await fetchLiveDatabaseData();

      setStatusMsg(`Successfully activated assessment access for ${hrmsIds.length} employee(s).`);
    } catch (err) {
      console.error("Error in batch activation:", err);
      alert("Error sending batch assessment access: " + err.message);
      setStatusMsg("Batch assessment access failed.");
    }
  };

  const updateEmployeeSchedule = async (hrmsId, date, time, reason) => {
    if (!hrmsId || !date) return { success: false, error: "Missing required fields" };
    try {
      const pm = pointsmen.find(p => p.hrmsId === hrmsId);
      if (!pm) throw new Error("Employee not found.");

      const today = new Date().toISOString().slice(0, 10);

      // Resolve SM UUID
      let smUserUuid = user?.userId;
      if (isSupabaseConfigured && (!smUserUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(smUserUuid))) {
        const { data: smUser } = await supabase
          .from("USERS")
          .select("user_id")
          .eq("hrms_id", smId)
          .single();
        smUserUuid = smUser?.user_id || user?.userId;
      }

      if (isSupabaseConfigured) {
        // Resolve Pointsman UUID
        const { data: pmUser, error: pmErr } = await supabase
          .from("USERS")
          .select("user_id")
          .eq("hrms_id", hrmsId)
          .single();

        if (pmErr || !pmUser?.user_id) throw new Error("Could not resolve Pointsman UUID.");
        const pmUserUuid = pmUser.user_id;

        // Check if there is an active assessment
        const { data: activeAssess } = await supabase
          .from("ASSESSMENT")
          .select("assessment_id, due_date, assessment_type")
          .eq("employee_id", pmUserUuid)
          .in("status", ["LOCKED", "AVAILABLE", "IN_PROGRESS", "Pending"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let prevDate = "None";
        let assessmentId = null;

        const assessmentType = `Checklist Evaluation | Time: ${time || "10:00 AM"}`;

        if (activeAssess) {
          prevDate = activeAssess.due_date || "None";
          assessmentId = activeAssess.assessment_id;

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
              employee_id: pmUserUuid,
              conducted_by: smUserUuid,
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
          user_id: smUserUuid,
          action: `Prev: ${prevDate} | New: ${date} ${time || "10:00 AM"} | Reason: ${reason} | Emp: ${hrmsId}`,
          table_name: "ASSESSMENT",
          record_id: assessmentId
        }]);

        // Insert Notification for Pointsman
        await supabase.from("NOTIFICATION").insert([{
          user_id: pmUserUuid,
          title: "Assessment Schedule Modified",
          message: `Your competency assessment schedule has been modified by Station Master ${smName}. New Due Date: ${date} ${time || "10:00 AM"}.`,
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

  const logSmPmeRecord = async (employeeHrmsId, pmeData) => {
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
        setStatusMsg(`PME Record logged successfully for ${employeeHrmsId}.`);
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

  const logSmRefRecord = async (employeeHrmsId, refData) => {
    try {
      const { data: uData, error: uErr } = await supabase
        .from('USERS')
        .select('user_id')
        .eq('hrms_id', employeeHrmsId)
        .single();

      if (uErr || !uData?.user_id) throw new Error("Employee not found in database.");

      const userId = uData.user_id;
      const res = await monitoringService.logRefresherCourse(userId, refData);
      if (res && res.success) {
        setStatusMsg(`REF Course record logged successfully for ${employeeHrmsId}.`);
        await fetchLiveDatabaseData();
        return { success: true };
      } else {
        throw new Error(res?.error || "Failed to log REF record.");
      }
    } catch (err) {
      console.error("Error logging REF record:", err);
      alert("Error logging REF record: " + err.message);
      return { success: false, error: err.message };
    }
  };

  const scheduleCounselling = async (counsellingId, date, time, remarks) => {
    try {
      const res = await assessmentService.updateCounsellingSchedule(counsellingId, date, time, remarks, smId);
      if (res && res.success) {
        setStatusMsg(`Counselling session scheduled successfully.`);
        await fetchLiveDatabaseData();
        return { success: true };
      } else {
        throw new Error(res?.error || "Failed to schedule counselling.");
      }
    } catch (err) {
      console.error("Error scheduling counselling:", err);
      alert("Error scheduling counselling: " + err.message);
      return { success: false, error: err.message };
    }
  };

  const submitCounsellingResult = async (counsellingId, attendance, remarksData) => {
    try {
      const res = await assessmentService.recordCounsellingAttendance(counsellingId, attendance, remarksData);
      if (res && res.success) {
        setStatusMsg(`Counselling session recorded as ${attendance}.`);
        await fetchLiveDatabaseData();
        return { success: true };
      } else {
        throw new Error(res?.error || "Failed to record counselling session.");
      }
    } catch (err) {
      console.error("Error recording counselling session:", err);
      alert("Error recording counselling session: " + err.message);
      return { success: false, error: err.message };
    }
  };

  const submitMonitoringReview = async (employeeHrmsId, reviewData) => {
    try {
      const { data: uData, error: uErr } = await supabase
        .from('USERS')
        .select('user_id')
        .eq('hrms_id', employeeHrmsId)
        .single();

      if (uErr || !uData?.user_id) throw new Error("Employee not found in database.");

      const res = await assessmentService.updateMonitoringRecord(uData.user_id, {
        ...reviewData,
        reviewer: smName
      });
      if (res && res.success) {
        setStatusMsg(`Monitoring review updated successfully.`);
        await fetchLiveDatabaseData();
        return { success: true };
      } else {
        throw new Error(res?.error || "Failed to update monitoring review.");
      }
    } catch (err) {
      console.error("Error updating monitoring review:", err);
      alert("Error updating monitoring review: " + err.message);
      return { success: false, error: err.message };
    }
  };

  return {
    activeTab, setActiveTab,
    pageMode, setPageMode,
    statusMsg, setStatusMsg,
    pointsmen, setPointsmen,
    drafts, setDrafts,
    submittedAssessments, setSubmittedAssessments,
    selectedPm, setSelectedPm,
    assessTarget, setAssessTarget,
    assessForm, setAssessForm,
    assessLocked, setAssessLocked,
    myAssessSelected, setMyAssessSelected,
    pmFilter, setPmFilter,
    reportFilter, setReportFilter,
    activatedTests, setActivatedTests,
    repApplied, setRepApplied,
    selectedReportUserId, setSelectedReportUserId,
    repF, setRepF,
    viewingStaff, setViewingStaff,
    pmModal, setPmModal,
    pmF, setPmF,
    viewingPm, setViewingPm,
    fetchLiveDatabaseData,
    openPmAdd,
    openPmEdit,
    openPmShift,
    savePmModal,
    removePm,
    fullscreenChart, setFullscreenChart,
    fsStartDate, setFsStartDate,
    fsEndDate, setFsEndDate,
    fsCategory, setFsCategory,
    fsRisk, setFsRisk,
    fsSearch, setFsSearch,
    filteredFsPointsmen,
    dynamicMonthlyTrend,
    history, setHistory,
    smMcqTest, setSmMcqTest,
    testAssigned, setTestAssigned,
    activeQIdx, setActiveQIdx,
    testResponses, setTestResponses,
    startTestAttempt,
    handleSubmitTestAttempt,
    stats,
    pieData,
    lowPerformers,
    filteredPm,
    filteredReports,
    switchTab,
    openPmDetail,
    openAssessForm,
    toggleYN,
    computeScore,
    submitAssessment,
    smName,
    smId,
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
    sendBatchAssessmentAccess,
    allDbAssessments, setAllDbAssessments,
    updateEmployeeSchedule
  };
}

