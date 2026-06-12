import React from 'react';
import {
  FileText, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Save, Plus, FileBarChart2, Lock,
  Calendar, Clock, Edit2, Sparkles, Filter, CheckSquare, Square, RefreshCw
} from 'lucide-react';
import { getCat, getCatColor, getCatBg } from '../../../utils/scoreCalculator';
import { YN_SECTIONS } from '../../../data/mockStationMasterData';
import { useLanguage } from '../../../contexts/LanguageContext';

export function StationMasterAssessForm(props) {
  const { t } = useLanguage();
  const {
    pageMode,
    assessTarget,
    assessForm,
    setAssessForm,
    assessLocked,
    setPageMode,
    setActivatedTests,
    toggleYN,
    computeScore,
    submitAssessment,
    drafts,
    openAssessForm,
    submittedAssessments,
    pointsmen,
    showCategoriesPanel,
    setShowCategoriesPanel,
    selectedCategory,
    setSelectedCategory,
    searchHrms,
    setSearchHrms,
    selectedHrmsIds,
    setSelectedHrmsIds,
    sendBatchAssessmentAccess, deactivateAssessmentAccess,
    user,
    allDbAssessments,
    updateEmployeeSchedule,
    counsellingQueue
  } = props;

  const [editingPm, setEditingPm] = React.useState(null);
  const [scheduleDate, setScheduleDate] = React.useState("");
  const [scheduleTime, setScheduleTime] = React.useState("10:00");
  const [scheduleReason, setScheduleReason] = React.useState("");
  const [viewUpcomingOnly, setViewUpcomingOnly] = React.useState(false);

  // Time conversion helpers
  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return "10:00";
    const match = timeStr.match(/^(\d+):(\d+)\s*([AP]M)$/i);
    if (!match) return "10:00";
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
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

  // Helper for schedule logic
  const getPmScheduleDetails = (p) => {
    const cat = p.cat || getCat(p.lastScore || p.score || 0);
    const frequency = cat === "A" || cat === "B" ? t("6 Months") : (cat === "C" ? t("3 Months") : t("1 Month"));

    // Find all assessments for this employee
    const empAssessments = allDbAssessments ? allDbAssessments.filter(a => a.employee?.hrms_id === p.hrmsId) : [];

    // 1. Last Assessment Date
    const pastApproved = empAssessments.filter(a => ["Approved", "Completed", "EVALUATED"].includes(a.status));
    pastApproved.sort((a, b) => new Date(b.assessment_date || b.created_at) - new Date(a.assessment_date || a.created_at));
    const lastAssess = pastApproved[0];
    const lastAssessDate = lastAssess ? (lastAssess.assessment_date || lastAssess.created_at?.slice(0, 10)) : (p.lastAssessDate || p.lastDate || p.doj || t("None"));

    // 2. Next Due Date & Time
    const upcomingAssess = empAssessments.find(a => ["LOCKED", "AVAILABLE", "IN_PROGRESS", "Pending", "Draft", "Scheduled"].includes(a.status) && a.due_date);

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
    } else if (lastAssessDate && lastAssessDate !== t("None") && lastAssessDate !== "None") {
      const lastDateObj = new Date(lastAssessDate);
      if (!isNaN(lastDateObj.getTime())) {
        const monthsToAdd = cat === "A" || cat === "B" ? 6 : (cat === "C" ? 3 : 1);
        lastDateObj.setMonth(lastDateObj.getMonth() + monthsToAdd);
        nextDueDate = lastDateObj.toISOString().slice(0, 10);
      }
    }

    if (!nextDueDate) {
      nextDueDate = t("Not Scheduled");
    }

    // 3. Days Remaining
    let daysRemaining = null;
    if (nextDueDate && nextDueDate !== t("Not Scheduled") && nextDueDate !== "Not Scheduled") {
      const diffTime = new Date(nextDueDate).getTime() - new Date().setHours(0, 0, 0, 0);
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 4. Status Indicator
    let statusText = t("Not Scheduled");
    let statusType = "neutral";

    if (nextDueDate !== t("Not Scheduled") && nextDueDate !== "Not Scheduled" && daysRemaining !== null) {
      if (daysRemaining < 0) {
        statusText = t("Overdue");
        statusType = "danger";
      } else if (daysRemaining === 0) {
        statusText = t("Due Today");
        statusType = "danger";
      } else if (daysRemaining <= 7) {
        statusText = t("Due Soon");
        statusType = "warning";
      } else {
        statusText = t("Upcoming");
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

  const handleSaveSchedule = async () => {
    if (!scheduleDate) {
      alert(t("Please select a date."));
      return;
    }
    if (!scheduleReason.trim()) {
      alert(t("Please enter a reason for scheduling."));
      return;
    }

    try {
      const formattedTime = convertTo12Hour(scheduleTime);
      let successCount = 0;

      if (editingPm === "bulk") {
        for (const hrmsId of selectedHrmsIds) {
          const res = await updateEmployeeSchedule(hrmsId, scheduleDate, formattedTime, scheduleReason);
          if (res && res.success) {
            successCount++;
          }
        }
        setSelectedHrmsIds([]);
        alert(t(`Successfully scheduled assessment for ${successCount} employee(s).`));
      } else if (editingPm) {
        const res = await updateEmployeeSchedule(editingPm.hrmsId, scheduleDate, formattedTime, scheduleReason);
        if (res && res.success) {
          alert(t(`Successfully scheduled assessment for ${editingPm.name}.`));
        }
      }
    } catch (err) {
      console.error("Error scheduling:", err);
      alert(t("An error occurred during scheduling: ") + err.message);
    } finally {
      setEditingPm(null);
      setScheduleDate("");
      setScheduleTime("10:00");
      setScheduleReason("");
      if (props.fetchLiveDatabaseData) {
        await props.fetchLiveDatabaseData();
      }
    }
  };

  if (pageMode === "assessForm" && assessTarget) {
    const dbSubmission = submittedAssessments ? submittedAssessments.find(s => s.pmId === assessTarget.hrmsId) : null;
    const isMcqCompleted = (mcqData && mcqData.completed) || (dbSubmission && ["Submitted", "Approved", "Completed", "EVALUATED"].includes(dbSubmission.status)) || assessTarget.status === "Submitted" || assessTarget.status === "Approved" || assessTarget.status === "Exam Taken";
    const isActivated = localStorage.getItem(`pm_test_activated_${assessTarget.hrmsId}`) === "true";

    const { knowledge, ynTotal, total: liveTotal } = computeScore(assessForm);
    const liveCat = assessForm.alcoholicStatus === "Alcoholic" ? "D" : getCat(liveTotal);

    return (
      <section className="sm2-card">
        <div className="sm2-card-hdr">
          <div>
            <h2>{t("Assessment —")} {assessTarget.name}</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{assessTarget.hrmsId} · {assessTarget.station || assessTarget.stationName || t("N/A")} · {t("Last Assessment:")} {assessTarget.lastDate || assessTarget.lastAssessDate || t("None")}</p>
          </div>
          <button className="sm2-link-btn" onClick={() => setPageMode("default")}>{t("← Back")}</button>
        </div>

        {/* ── Section 1: Knowledge of Rules ── */}
        <div className="sm2-assess-section">
          <div className="sm2-assess-sec-hdr">
            <span className="sm2-assess-sec-num">01</span>
            <div>
              <strong>{t("Knowledge of Rules (MCQ-based)")}</strong>
              <span className="sm2-assess-sec-meta">{t("Auto-calculated from Pointsman MCQ Test")}</span>
            </div>
            <span className="sm2-assess-live-marks">{knowledge} / 25</span>
          </div>

          <div className="sm2-mcq-card-container" style={{ marginTop: 16 }}>
            {isMcqCompleted ? (
              <div className="sm2-mcq-success-card">
                <div className="sm2-mcq-card-header">
                  <div className="sm2-mcq-status">
                    <span className="sm2-status-dot green"></span>
                    <span className="sm2-status-text text-green font-semibold">{t("MCQ Test Completed")}</span>
                  </div>
                  <div className="sm2-mcq-lock-badge">
                    <Lock size={12} />
                    <span>{t("Read-Only (Synced)")}</span>
                  </div>
                </div>

                <div className="sm2-mcq-card-body">
                  <div className="sm2-mcq-score-display">
                    <div className="sm2-mcq-large-score">
                      <strong>{mcqData.correctCount}</strong>
                      <span>/ 25</span>
                    </div>
                    <div className="sm2-mcq-percentage-badge">
                      {mcqData.correctCount}/25 {t("Score")}
                    </div>
                  </div>

                  <div className="sm2-mcq-progress-container">
                    <div className="sm2-mcq-progress-bar">
                      <div
                        className="sm2-mcq-progress-fill"
                        style={{
                          width: `${mcqData.percentage}%`,
                          background: mcqData.percentage >= 80 ? "#16a34a" : mcqData.percentage >= 50 ? "#2563eb" : "#dc2626"
                        }}
                      />
                    </div>
                  </div>

                  <div className="sm2-mcq-meta-grid">
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">{t("Submitted On")}</span>
                      <strong className="sm2-mcq-meta-val">{mcqData.submittedDate}</strong>
                    </div>
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">{t("Assessed Entity")}</span>
                      <strong className="sm2-mcq-meta-val">{assessTarget.name}</strong>
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
                      {isActivated ? t("MCQ Test Active") : t("MCQ Test Locked")}
                    </span>
                  </div>
                  <div className="sm2-mcq-lock-badge">
                    <Lock size={12} />
                    <span>{t("Read-Only")}</span>
                  </div>
                </div>

                <div className="sm2-mcq-card-body pending" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="sm2-mcq-pending-message" style={{ display: "flex", gap: "12px", background: isActivated ? "#fffbeb" : "#fef2f2", border: isActivated ? "1px solid #fef3c7" : "1px solid #fee2e2", padding: "16px", borderRadius: "8px" }}>
                    <AlertTriangle size={24} color={isActivated ? "#d97706" : "#dc2626"} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: 14, color: isActivated ? "#b45309" : "#991b1b" }}>{isActivated ? t("Awaiting Pointsman Attempt") : t("Competency Exam Locked")}</h4>
                      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: isActivated ? "#d97706" : "#dc2626" }}>
                        {isActivated ? (
                          <span>{t("The shunting safety competency trial is active. Request pointsman (")}<strong>{assessTarget.name}</strong>{t(") to log into their portal and attempt the 25 safety questions to automatically sync scores.")}</span>
                        ) : (
                          <span>{t("The pointsman shunting safety MCQ exam is currently locked. You must click the")} <strong>{t("Activate Safety Exam")}</strong> {t("button below to enable the pointsman to log in and attempt the test.")}</span>
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
                          await deactivateAssessmentAccess(assessTarget.hrmsId);
                        } else {
                          await sendBatchAssessmentAccess([assessTarget.hrmsId]);
                        }
                        setActivatedTests(prev => ({ ...prev, [assessTarget.hrmsId]: !isActivated }));
                      }}
                    >
                      {isActivated ? t("Deactivate Safety Competency Exam") : t("Activate Safety Competency Exam")}
                    </button>
                  </div>

                  <div className="sm2-mcq-meta-grid">
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">{t("Assessment Status")}</span>
                      <strong className={`sm2-mcq-meta-val text-${isActivated ? "amber" : "red"}`}>{isActivated ? t("Active & Awaiting Attempt") : t("Locked (Awaiting Activation)")}</strong>
                    </div>
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">{t("Assessed Entity")}</span>
                      <strong className="sm2-mcq-meta-val">{assessTarget.name}</strong>
                    </div>
                    <div className="sm2-mcq-meta-item">
                      <span className="sm2-mcq-meta-label">{t("Total Questions")}</span>
                      <strong className="sm2-mcq-meta-val">{t("25 Questions (1 mark each)")}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sections 2–6: Yes/No blocks ── */}
        {YN_SECTIONS.map((sec, si) => {
          const secScore = assessForm[sec.key].filter(v => v === "Yes").length * sec.weight;
          return (
            <div key={sec.key} className="sm2-assess-section" style={{ opacity: isMcqCompleted ? 1 : 0.6 }}>
              <div className="sm2-assess-sec-hdr">
                <span className="sm2-assess-sec-num">{String(si + 2).padStart(2, "0")}</span>
                <div>
                  <strong>{t(sec.title)}</strong>
                  <span className="sm2-assess-sec-meta">5 {t("criteria")} · {sec.weight} {t("marks each")} · {t("Total")} {sec.outOf}</span>
                </div>
                <span className="sm2-assess-live-marks">{secScore} / {sec.outOf}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "6px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginRight: "auto" }}>{t("Quick Fill:")}</span>
                <button
                  type="button"
                  disabled={!isMcqCompleted || assessLocked}
                  onClick={() => {
                    setAssessForm(prev => ({
                      ...prev,
                      [sec.key]: Array(sec.criteria.length).fill("Yes")
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
                    cursor: (!isMcqCompleted || assessLocked) ? "not-allowed" : "pointer"
                  }}
                >
                  ✓ {t("All Yes")}
                </button>
                <button
                  type="button"
                  disabled={!isMcqCompleted || assessLocked}
                  onClick={() => {
                    setAssessForm(prev => ({
                      ...prev,
                      [sec.key]: Array(sec.criteria.length).fill("No")
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
                    cursor: (!isMcqCompleted || assessLocked) ? "not-allowed" : "pointer"
                  }}
                >
                  ✗ {t("All No")}
                </button>
              </div>
              <div className="sm2-yn-grid">
                {sec.criteria.map((label, idx) => (
                  <div key={idx} className="sm2-yn-row">
                    <span className="sm2-yn-label">{idx + 1}. {t(label)}</span>
                    <div className="sm2-yn-btns">
                      <button
                        type="button" disabled={!isMcqCompleted || assessLocked}
                        className={assessForm[sec.key][idx] === "Yes" ? "sm2-yn-btn sm2-yn-yes active" : "sm2-yn-btn sm2-yn-yes"}
                        onClick={() => toggleYN(sec.key, idx, "Yes")}>
                        {t("Yes")}
                      </button>
                      <button
                        type="button" disabled={!isMcqCompleted || assessLocked}
                        className={assessForm[sec.key][idx] === "No" ? "sm2-yn-btn sm2-yn-no active" : "sm2-yn-btn sm2-yn-no"}
                        onClick={() => toggleYN(sec.key, idx, "No")}>
                        {t("No")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* ── Additional Details ── */}
        <div className="sm2-assess-section" style={{ opacity: isMcqCompleted ? 1 : 0.6 }}>
          <div className="sm2-assess-sec-hdr">
            <span className="sm2-assess-sec-num">07</span>
            <div><strong>{t("Additional Details")}</strong><span className="sm2-assess-sec-meta">{t("Mandatory fields")}</span></div>
          </div>
          <div className="sm2-assess-form" style={{ marginTop: 12 }}>
            <div className="sm2-form-field">
              <label>{t("Alcoholic / Non-Alcoholic *")}</label>
              <select
                disabled={!isMcqCompleted || assessLocked}
                value={assessForm.alcoholicStatus}
                onChange={e => setAssessForm(p => ({ ...p, alcoholicStatus: e.target.value }))}>
                <option value="">{t("Select…")}</option>
                <option value="Non-Alcoholic">{t("Non-Alcoholic")}</option>
                <option value="Alcoholic">{t("Alcoholic")}</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>{t("PME Status")}</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.pmeStatus}
                onChange={e => setAssessForm(p => ({ ...p, pmeStatus: e.target.value }))}>
                <option value="Fit">{t("Fit")}</option>
                <option value="Unfit">{t("Unfit")}</option>
                <option value="Pending">{t("Pending")}</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>{t("REF Status")}</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.refStatus}
                onChange={e => setAssessForm(p => ({ ...p, refStatus: e.target.value }))}>
                <option value="Cleared">{t("Cleared")}</option>
                <option value="Pending">{t("Pending")}</option>
                <option value="Failed">{t("Failed")}</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>{t("Automatic Training")}</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.automaticTraining}
                onChange={e => setAssessForm(p => ({ ...p, automaticTraining: e.target.value }))}>
                <option value="Not Required">{t("Not Required")}</option>
                <option value="Recommended">{t("Recommended")}</option>
                <option value="Mandatory">{t("Mandatory")}</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>{t("Counselling")}</label>
              <select disabled={!isMcqCompleted || assessLocked} value={assessForm.counselling}
                onChange={e => setAssessForm(p => ({ ...p, counselling: e.target.value }))}>
                <option value="Not Required">{t("Not Required")}</option>
                <option value="Recommended">{t("Recommended")}</option>
                <option value="Mandatory">{t("Mandatory")}</option>
              </select>
            </div>
            <div className="sm2-form-field">
              <label>{t("Date of Appointment")}</label>
              <input type="date" disabled={!isMcqCompleted || assessLocked} value={assessForm.dateOfAppointment}
                onChange={e => setAssessForm(p => ({ ...p, dateOfAppointment: e.target.value }))} />
            </div>
            <div className="sm2-form-field">
              <label>{t("Working Since (current grade)")}</label>
              <input type="date" disabled={!isMcqCompleted || assessLocked} value={assessForm.workingSince}
                onChange={e => setAssessForm(p => ({ ...p, workingSince: e.target.value }))} />
            </div>
            <div className="sm2-form-field sm2-form-full">
              <label>{t("Remarks for Traffic Inspector")}</label>
              <textarea rows={3} disabled={!isMcqCompleted || assessLocked} value={assessForm.remarks}
                onChange={e => setAssessForm(p => ({ ...p, remarks: e.target.value }))}
                placeholder={isMcqCompleted ? t("Enter observations, recommendations…") : t("Please wait for Pointsman to complete the MCQ exam...")} />
            </div>
          </div>
        </div>

        {/* ── Live Score Bar ── */}
        <div className="sm2-live-score" style={{ opacity: isMcqCompleted ? 1 : 0.6 }}>
          <div>
            <label>{t("Knowledge (MCQ)")}</label>
            <strong>{knowledge} / 25</strong>
          </div>
          <div>
            <label>{t("Yes/No Sections")}</label>
            <strong>{ynTotal} / 75</strong>
          </div>
          <div>
            <label>{t("Grand Total")}</label>
            <strong style={{ color: getCatColor(liveCat), fontSize: 22 }}>{liveTotal} / 100</strong>
          </div>
          <div>
            <label>{t("Category")}</label>
            <span className="sm2-badge" style={{ background: getCatBg(liveCat), color: getCatColor(liveCat), fontSize: 13, padding: "4px 12px" }}>
              {t("Category")} {liveCat}
            </span>
          </div>
        </div>

        {assessLocked && (
          <div className="sm2-submitted-banner">✓ {t("Assessment submitted for TI approval. Form is now locked.")}</div>
        )}

        {!assessLocked && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
            <div className="sm2-assess-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="sm2-ghost-btn" style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "1px solid #cbd5e1", background: "#fff", cursor: isMcqCompleted ? "pointer" : "not-allowed" }} disabled={!isMcqCompleted} onClick={() => submitAssessment(true)}>{t("Save as Draft")}</button>
              <button className="sm2-primary-btn" style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "700", border: "none", background: isMcqCompleted ? "#2563eb" : "#cbd5e1", color: "#fff", cursor: isMcqCompleted ? "pointer" : "not-allowed" }} disabled={!isMcqCompleted} onClick={() => submitAssessment(false)}>
                {t("Submit for TI Approval")}
              </button>
            </div>
            {!isMcqCompleted && (
              <div style={{ color: "#dc2626", fontSize: "12.5px", fontWeight: "700", textAlign: "center", background: "#fef2f2", border: "1px solid #fee2e2", padding: "10px", borderRadius: "8px" }}>
                ⚠️ {t("MCQ Safety Competency Trial is locked or incomplete. All shunting assessment marks are locked until the Pointsman completes the shunting safety exam.")}
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  // Get all Pointsmen under this Station Master's station
  const stationName = user?.station || "";
  const stationPms = (pointsmen || []).filter(p => {
    const clean = s => s ? s.toLowerCase().trim().replace(/\s+/g, '').replace(/junction|central|main|town|jn|station/gi, '') : '';
    return clean(p.station) === clean(stationName) || clean(p.station).includes(clean(stationName)) || clean(stationName).includes(clean(p.station));
  });

  const getPmCategory = (p) => p.cat || getCat(p.lastScore);

  const countA = stationPms.filter(p => getPmCategory(p) === "A").length;
  const countB = stationPms.filter(p => getPmCategory(p) === "B").length;
  const countC = stationPms.filter(p => getPmCategory(p) === "C").length;
  const countD = stationPms.filter(p => getPmCategory(p) === "D").length;

  const categoriesList = [
    { id: "A", name: t("Category A"), count: countA, color: "#16a34a", bg: "#dcfce7" },
    { id: "B", name: t("Category B"), count: countB, color: "#2563eb", bg: "#dbeafe" },
    { id: "C", name: t("Category C"), count: countC, color: "#d97706", bg: "#fef3c7" },
    { id: "D", name: t("Category D"), count: countD, color: "#dc2626", bg: "#fef2f2" }
  ];

  const categoryPms = selectedCategory
    ? stationPms.filter(p => getPmCategory(p) === selectedCategory)
    : [];

  const searchedCategoryPms = categoryPms.filter(p =>
    !searchHrms || p.hrmsId.toLowerCase().includes(searchHrms.toLowerCase())
  );

  const getPmStatusText = (p) => {
    const mcqDataStr = localStorage.getItem(`pm_mcq_test_${p.hrmsId}`);
    const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;

    const dbSubmission = submittedAssessments ? submittedAssessments.find(s => s.pmId === p.hrmsId) : null;
    const isApproved = dbSubmission && dbSubmission.status === 'Approved';
    const isPending = dbSubmission && dbSubmission.status === 'Pending';
    const isCompleted = mcqData && mcqData.completed;
    const isActivated = localStorage.getItem(`pm_test_activated_${p.hrmsId}`) === "true";

    if (isApproved) return { text: t("Approved"), type: "success" };
    if (isPending) return { text: t("Pending Approval"), type: "info" };
    if (isCompleted) return { text: t("MCQ Completed"), type: "success" };
    if (isActivated) return { text: t("Exam Active"), type: "warning" };
    return { text: t("Exam Locked"), type: "neutral" };
  };

  const isEligibleForActivation = (p) => {
    const status = getPmStatusText(p);
    return status.text !== t("Approved") && status.text !== t("Pending Approval") && status.text !== t("MCQ Completed");
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

  if (showCategoriesPanel) {
    // 1. Calculate General Status Dashboard counts
    const statsSummary = {
      overdue: 0,
      dueToday: 0,
      dueWeek: 0,
      dueMonth: 0,
      totalScheduled: 0
    };

    stationPms.forEach(p => {
      const s = getPmScheduleDetails(p);
      if (s.nextDueDate !== t("Not Scheduled") && s.nextDueDate !== "Not Scheduled" && s.daysRemaining !== null) {
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

    // 2. Calculate Category D Priority Panel stats
    const catDPms = stationPms.filter(p => (p.cat || getCat(p.lastScore || p.score || 0)) === "D");
    const catDStats = {
      due: 0,
      pendingCounselling: 0,
      pendingRetest: 0
    };

    catDPms.forEach(p => {
      const s = getPmScheduleDetails(p);
      if (s.statusText === t("Overdue") || s.statusText === "Overdue" ||
        s.statusText === t("Due Today") || s.statusText === "Due Today" ||
        s.statusText === t("Due Soon") || s.statusText === "Due Soon") {
        catDStats.due++;
      }
      if (s.isCustomScheduled) {
        catDStats.pendingRetest++;
      }
    });

    const pendingCounsellings = counsellingQueue ? counsellingQueue.filter(c => {
      const isMatch = catDPms.some(p => p.hrmsId === c.employeeHrmsId);
      return isMatch && (c.status === "Pending" || c.status === "Scheduled");
    }) : [];
    catDStats.pendingCounselling = pendingCounsellings.length;

    // 3. Table lists and filters
    const searchedCategoryPmsWithSched = searchedCategoryPms.map(p => ({
      ...p,
      sched: getPmScheduleDetails(p)
    }));

    const filteredByUpcoming = viewUpcomingOnly
      ? searchedCategoryPmsWithSched.filter(p => p.sched.nextDueDate !== t("Not Scheduled") && p.sched.nextDueDate !== "Not Scheduled")
      : searchedCategoryPmsWithSched;

    const isAllSelected = eligiblePms.length > 0 && eligiblePms.every(p => selectedHrmsIds.includes(p.hrmsId));

    // Render Modal helper
    const renderScheduleModal = () => {
      if (!editingPm) return null;

      const isBulk = editingPm === "bulk";
      const title = isBulk
        ? `${t("Bulk Schedule Assessments")} (${selectedHrmsIds.length} ${t("employees")})`
        : `${t("Schedule Assessment")} — ${editingPm.name} (${editingPm.hrmsId})`;

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
                  setEditingPm(null);
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
                    {t("Assessment Date")} *
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
                    {t("Time")} *
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
                  {t("Reason / Remarks for Scheduling")} *
                </label>
                <textarea
                  rows={3}
                  placeholder={t("Enter reason (e.g. Periodic assessment, Counselling completed, Retest schedule)...")}
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
                    setEditingPm(null);
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
                  {t("Cancel")}
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
                  {t("Save Schedule")}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <section className="sm2-card">
        <div className="sm2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>{t("Categories Assessment Access")}</h2>
          <button
            className="sm2-primary-btn"
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              border: "none",
              background: "#2563eb",
              color: "#ffffff"
            }}
            onClick={() => {
              setShowCategoriesPanel(false);
              setSelectedCategory(null);
              setSelectedHrmsIds([]);
              setSearchHrms("");
              setViewUpcomingOnly(false);
            }}
          >
            {t("← Back to List")}
          </button>
        </div>
        <p className="sm2-subtitle">{t("Select a category to view employees, search by HRMS ID, schedule tests, and activate assessment access in bulk.")}</p>

        {/* Due Status Dashboard */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "20px" }}>
          <div style={{ background: "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)", border: "1px solid #fca5a5", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("Overdue")}</span>
            <span style={{ fontSize: "22px", fontWeight: "900", color: "#dc2626" }}>{statsSummary.overdue}</span>
          </div>
          <div style={{ background: "linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%)", border: "1px solid #fdbb2d", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#9a3412", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("Due Today")}</span>
            <span style={{ fontSize: "22px", fontWeight: "900", color: "#ea580c" }}>{statsSummary.dueToday}</span>
          </div>
          <div style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fffdf5 100%)", border: "1px solid #fde047", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#854d0e", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("Due in 7 Days")}</span>
            <span style={{ fontSize: "22px", fontWeight: "900", color: "#ca8a04" }}>{statsSummary.dueWeek}</span>
          </div>
          <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)", border: "1px solid #93c5fd", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("Due in 30 Days")}</span>
            <span style={{ fontSize: "22px", fontWeight: "900", color: "#2563eb" }}>{statsSummary.dueMonth}</span>
          </div>
          <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)", border: "1px solid #86efac", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("Total Scheduled")}</span>
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
                  setSearchHrms("");
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
                  {cat.id === "A" || cat.id === "B" ? t("Retest: 6M") : cat.id === "C" ? t("Retest: 3M") : t("Retest: 1M")}
                </span>
              </button>
            );
          })}
        </div>



        {selectedCategory && (
          <div>
            {/* Filter Bar */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "16px", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, minWidth: "300px" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>🔍</span>
                  <input
                    type="text"
                    placeholder={t("Search by HRMS ID...")}
                    value={searchHrms}
                    onChange={e => setSearchHrms(e.target.value)}
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
                  {viewUpcomingOnly ? t("Showing Scheduled Only") : t("Show Scheduled Only")}
                </button>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {selectedHrmsIds.length > 0 && (
                  <>
                    {/* Bulk Schedule Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPm("bulk");
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
                      {t("Schedule Selected")} ({selectedHrmsIds.length})
                    </button>

                    <button
                      className="sm2-primary-btn"
                      onClick={() => sendBatchAssessmentAccess(selectedHrmsIds)}
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
                      {t("Activate Access")} ({selectedHrmsIds.length})
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="sdom-table-wrap">
              <table className="sdom-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        disabled={eligiblePms.length === 0}
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        style={{ cursor: eligiblePms.length > 0 ? "pointer" : "not-allowed" }}
                      />
                    </th>
                    <th>{t("Employee Name")}</th>
                    <th>{t("HRMS ID")}</th>
                    <th>{t("Frequency")}</th>
                    <th>{t("Last Assessment")}</th>
                    <th>{t("Next Assessment Due")}</th>
                    <th>{t("Days Remaining")}</th>
                    <th>{t("Due Status")}</th>
                    <th>{t("Exam Status")}</th>
                    <th style={{ textAlign: "center" }}>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredByUpcoming.map(p => {
                    const status = getPmStatusText(p);
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

                    return (
                      <tr key={p.hrmsId}>
                        <td>
                          <input
                            type="checkbox"
                            disabled={!isEligible}
                            checked={isChecked}
                            onChange={(e) => handleSelectOne(p.hrmsId, e.target.checked)}
                            style={{ cursor: isEligible ? "pointer" : "not-allowed" }}
                          />
                        </td>
                        <td style={{ fontWeight: "600" }}>{p.name}</td>
                        <td style={{ fontFamily: "monospace" }}>{p.hrmsId}</td>
                        <td>{frequency}</td>
                        <td>{lastAssessDate}</td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontWeight: "600" }}>{nextDueDate}</span>
                            {nextDueDate !== t("Not Scheduled") && nextDueDate !== "Not Scheduled" && (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                🕒 {nextDueTime}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: "600", color: daysColor }}>
                          {daysRemaining !== null ? (
                            daysRemaining === 0 ? t("Today") : daysRemaining < 0 ? `${Math.abs(daysRemaining)} ${t("days overdue")}` : `${daysRemaining} ${t("days left")}`
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {nextDueDate !== t("Not Scheduled") && nextDueDate !== "Not Scheduled" ? (
                            <span className={`sdom-badge ${statusClass}`}>
                              {statusText}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <span className={`sdom-badge`} style={{ background: badgeBg, color: badgeColor, border: badgeBorder }}>
                            {status.text}
                          </span>
                        </td>

                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPm(p);
                                if (nextDueDate && nextDueDate !== t("Not Scheduled") && nextDueDate !== "Not Scheduled") {
                                  setScheduleDate(nextDueDate);
                                  setScheduleTime(convertTo24Hour(nextDueTime));
                                } else {
                                  setScheduleDate("");
                                  setScheduleTime("10:00");
                                }
                                setScheduleReason("");
                              }}
                              className="sdom-btn-outline"
                              style={{
                                padding: "4px 10px",
                                fontSize: "11.5px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <Calendar size={12} />
                              {nextDueDate !== t("Not Scheduled") && nextDueDate !== "Not Scheduled" ? t("Reschedule") : t("Schedule")}
                            </button>

                            <button
                              type="button"
                              disabled={status.text === t("Approved") || status.text === t("Pending Approval")}
                              onClick={() => openAssessForm(p)}
                              className="sdom-btn-primary"
                              style={{
                                padding: "4px 10px",
                                fontSize: "11.5px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: (status.text === t("Approved") || status.text === t("Pending Approval")) ? "#cbd5e1" : "var(--brand-secondary)",
                                cursor: (status.text === t("Approved") || status.text === t("Pending Approval")) ? "not-allowed" : "pointer"
                              }}
                            >
                              <FileText size={12} />
                              {t("Open Form")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredByUpcoming.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                        {t("No Pointsmen found in this category matching search filters.")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {renderScheduleModal()}
      </section>
    );
  }

  return (
    <section className="sm2-card">
      <div className="sm2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{t("Assess Pointsman")}</h2>
        <button
          className="sm2-primary-btn"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            border: "none",
            background: "#2563eb",
            color: "#ffffff"
          }}
          onClick={() => setShowCategoriesPanel(true)}
        >
          {t("Categories")}
        </button>
      </div>
      <p className="sm2-subtitle">{t("Pointsmen with pending assessments are listed below. Fill the full structured form and submit for Traffic Inspector approval.")}</p>

      {drafts.length === 0 ? (
        <div className="sm2-empty-state-center">
          <CheckCircle2 size={36} color="#16a34a" />
          <h3>{t("All Assessments Up-to-Date")}</h3>
          <p>{t("No pending assessments at this time.")}</p>
        </div>
      ) : (
        <div className="sm2-assess-list">
          {drafts.map(d => {
            const mcqDataStr = localStorage.getItem(`pm_mcq_test_${d.hrmsId}`);
            const mcqData = mcqDataStr ? JSON.parse(mcqDataStr) : null;

            const dbSubmission = submittedAssessments ? submittedAssessments.find(s => s.pmId === d.hrmsId) : null;
            const isApproved = dbSubmission && dbSubmission.status === 'Approved';
            const isPending = dbSubmission && dbSubmission.status === 'Pending';

            const isCompleted = mcqData && mcqData.completed;
            const isActivated = localStorage.getItem(`pm_test_activated_${d.hrmsId}`) === "true";

            return (
              <div key={d.hrmsId} className="sm2-assess-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e2e8f0", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    {d.name.charAt(0)}
                  </div>
                  <div>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{d.name}</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{t(d.role)} • {d.hrmsId}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {isApproved ? (
                    <span className="sdom-badge sdom-badge-success" style={{ background: "#dcfce7", color: "#166534" }}>
                      {t("Approved")} ({dbSubmission?.score || 0}/100)
                    </span>
                  ) : isPending ? (
                    <span className="sdom-badge sdom-badge-info" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                      {t("Pending Approval")}
                    </span>
                  ) : isCompleted ? (
                    <span className="sdom-badge sdom-badge-success">
                      {t("MCQ Completed")} ({mcqData.correctCount}/25)
                    </span>
                  ) : isActivated ? (
                    <span className="sdom-badge sdom-badge-warning">
                      {t("Exam Active")}
                    </span>
                  ) : (
                    <span className="sdom-badge sdom-badge-neutral" style={{ background: "#f1f5f9", color: "#475569" }}>
                      {t("Exam Locked")}
                    </span>
                  )}

                  <div style={{ display: "flex", gap: "8px" }}>
                    {!isCompleted && !isApproved && !isPending && (
                      <button
                        className="sm2-ghost-btn-sm"
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          border: "1px solid #cbd5e1",
                          background: isActivated ? "#fef2f2" : "#eff6ff",
                          color: isActivated ? "#dc2626" : "#2563eb"
                        }}
                        onClick={() => {
                          if (isActivated) {
                            localStorage.setItem(`pm_test_activated_${d.hrmsId}`, "false");
                          } else {
                            localStorage.setItem(`pm_test_activated_${d.hrmsId}`, "true");
                          }
                          setActivatedTests(prev => ({ ...prev, [d.hrmsId]: !isActivated }));
                        }}
                      >
                        {isActivated ? t("Deactivate Test") : t("Activate Test")}
                      </button>
                    )}

                    <button
                      className="sm2-primary-btn-sm"
                      disabled={isApproved || isPending}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: (isApproved || isPending) ? "not-allowed" : "pointer",
                        background: (isApproved || isPending) ? "#94a3b8" : "#2563eb",
                        color: "#fff",
                        border: "none"
                      }}
                      onClick={() => openAssessForm(d)}
                    >
                      {t("Open Form")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {submittedAssessments.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>{t("Submitted This Session")}</h4>
          {submittedAssessments.map((r, i) => {
            const pmData = drafts ? drafts.find(p => p.hrmsId === r.pmId) : null;
            const name = pmData ? pmData.name : "Pointsman";
            const grade = r.score >= 80 ? "A" : r.score >= 60 ? "B" : r.score >= 50 ? "C" : "D";
            const statusStr = r.status || "Pending";

            return (
              <div key={i} className="sm2-submitted-row">
                <div><strong>{name}</strong><span>{r.pmId}</span></div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="sm2-badge" style={{ background: getCatBg(grade), color: getCatColor(grade) }}>{t("Cat.")} {grade}</span>
                  <strong>{r.score}/{r.totalMarks || 100}</strong>
                  <span className={`sm2-status-pill sm2-status-${statusStr.toLowerCase()}`}>{t(statusStr)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
