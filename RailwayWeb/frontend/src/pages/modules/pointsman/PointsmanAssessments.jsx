import React from "react";
import { ShieldCheck, Clock } from "lucide-react";
import { getCategory, getCategoryBg, getCategoryColor } from "../../../constants";
import { testQuestions } from "../../../data/mockPointsmanData";
import { PointsmanScorecardPage } from "./PointsmanScorecardPage";
import { useLanguage } from "../../../contexts/LanguageContext";

export function PointsmanAssessments({
  myAssessSelected,
  setMyAssessSelected,
  performanceSummaryText,
  testAssigned,
  pmMcqTest,
  startTestAttempt,
  history,
  formatQuarterPeriod,
  employeeId
}) {
  const { t } = useLanguage();

  const latestApprovedAttempt = history.find(h => ["Approved", "Completed"].includes(h.approvalStatus));
  const hasUnapproved = history.some(h => ["Submitted", "Pending"].includes(h.approvalStatus));

  /* Scorecard detail view */
  if (myAssessSelected) {
    return (
      <PointsmanScorecardPage
        selectedRecord={myAssessSelected}
        setScreenMode={() => setMyAssessSelected(null)}
        performanceSummaryText={performanceSummaryText}
      />
    );
  }

  const isTestActivated = localStorage.getItem("pm_test_activated_" + employeeId) === "true";
  const testActive = testAssigned === "Assigned" && (!pmMcqTest || !pmMcqTest.completed);

  /* History list */
  return (
    <section className="sm2-card">
      {/* MCQ Assessment Assignment Banner */}
      {testActive ? (
        !isTestActivated ? (
          <div style={{
            background: "#f8fafc",
            border: "2px dashed #cbd5e1",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            display: "flex",
            gap: 16,
            alignItems: "start"
          }}>
            <div style={{
              background: "#e2e8f0",
              borderRadius: 50,
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <span style={{ fontSize: 20 }}>🔒</span>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#475569" }}>
                {t("Competency Exam Locked")}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>
                {t("Your periodic safety and competency evaluation is locked. Please request your Station Master to activate your test so you can attempt it.")}
              </p>
            </div>
          </div>
        ) : (
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
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#ea580c" }}>
                  ⚠️ {t("Pending Competency Assessment")}
                </h3>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#9a3412", lineHeight: 1.4 }}>
                  {t("Your supervisor (Station Master) has scheduled a periodic safety & competency assessment for you. You must complete the 25-question MCQ exam.")}
                </p>
                <button
                  onClick={startTestAttempt}
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
                  {t("Start 25 MCQ Online Assessment")}
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        <div style={{
          background: "#f0fdf4",
          border: "1.5px solid #bbf7d0",
          borderRadius: 12,
          padding: 18,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 14
        }}>
          <ShieldCheck size={24} color="#16a34a" />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 2px", fontSize: 14.5, fontWeight: 700, color: "#14532d" }}>
              {t("All assessments are up to date. No pending test available.")}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>
              {t("Your periodic safety and competency evaluation is currently active and compliant.")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12, textAlign: "right" }}>
            <div>
              <span style={{ color: "#166534", display: "block" }}>{t("Last Exam Score")}</span>
              <strong style={{ color: "#14532d", fontSize: 13 }}>
                {latestApprovedAttempt
                  ? `${latestApprovedAttempt.totalScore}/${latestApprovedAttempt.isOnlineExam ? 25 : 100}`
                  : (hasUnapproved ? t("Awaiting Approval") : "—")}
              </strong>
            </div>
            <div style={{ borderLeft: "1px solid #bbf7d0", paddingLeft: 16 }}>
              <span style={{ color: "#166534", display: "block" }}>{t("Next Due Date")}</span>
              <strong style={{ color: "#14532d", fontSize: 13 }}>
                {(() => {
                  if (!latestApprovedAttempt) return hasUnapproved ? t("Pending Evaluation") : t("Not Scheduled");
                  const pct = latestApprovedAttempt.isOnlineExam ? (latestApprovedAttempt.totalScore / 25) * 100 : latestApprovedAttempt.totalScore;
                  const cat = latestApprovedAttempt.category || getCategory(pct);
                  let m = 6;
                  if (cat === "C") m = 3;
                  if (cat === "D") m = 1;
                  const d = new Date(latestApprovedAttempt.date);
                  d.setMonth(d.getMonth() + m);
                  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                })()}
              </strong>
            </div>
          </div>
        </div>
      )}

      <div className="sm2-card-hdr"><h2>{t("My Assessment History (by SM)")}</h2></div>
      <p className="sm2-subtitle">{t("All assessments conducted by the Station Master for your record. Click any row to view the detailed scorecard.")}</p>

      {/* Summary strip */}
      <div className="sm2-myassess-summary">
        <div className="sm2-report-mini">
          <label>{t("Total Assessments")}</label>
          <strong>{history.length}</strong>
        </div>
        <div className="sm2-report-mini">
          <label>{t("Latest Score")}</label>
          <strong>
            {latestApprovedAttempt
              ? `${latestApprovedAttempt.totalScore}/${latestApprovedAttempt.isOnlineExam ? 25 : 100}`
              : (hasUnapproved ? t("Awaiting Approval") : "—")}
          </strong>
        </div>
        <div className="sm2-report-mini">
          <label>{t("Average SM Score")}</label>
          <strong>{
            (() => {
              const regs = history.filter(h => !h.isOnlineExam && ["Approved", "Completed"].includes(h.approvalStatus));
              return regs.length ? `${Math.round(regs.reduce((s, a) => s + a.totalScore, 0) / regs.length)}/100` : "—";
            })()
          }</strong>
        </div>
        <div className="sm2-report-mini">
          <label>{t("Latest Assessment")}</label>
          {latestApprovedAttempt ? (
            <strong style={{ color: getCategoryColor(latestApprovedAttempt.category || getCategory(latestApprovedAttempt.isOnlineExam ? (latestApprovedAttempt.totalScore / 25) * 100 : latestApprovedAttempt.totalScore)) }}>
              {latestApprovedAttempt.isOnlineExam
                ? t("Online CBT")
                : `${t("Category")} ${latestApprovedAttempt.category || getCategory(latestApprovedAttempt.totalScore)}`}
            </strong>
          ) : (
            <strong style={{ color: "#64748b" }}>
              {hasUnapproved ? t("Awaiting Approval") : t("Untested")}
            </strong>
          )}
        </div>
      </div>

      {/* List */}
      <div className="sm2-myassess-list">
        <div className="sm2-myassess-head">
          {["Period", "Date", "Score Scale", "Category", "Assessed By", "Status", ""].map(h =>
            <span key={h}>{t(h)}</span>)}
        </div>
        {history.map(sc => {
          const isApproved = ["Approved", "Completed"].includes(sc.approvalStatus);
          const cat = isApproved ? (sc.category || getCategory(sc.isOnlineExam ? (sc.totalScore / 25) * 100 : sc.totalScore)) : "—";
          const outOf = sc.isOnlineExam ? 25 : 100;
          const scoreDisplay = isApproved ? `${sc.totalScore}/${outOf}` : "—";
          return (
            <button
              key={sc.id}
              className="sm2-myassess-row"
              onClick={() => isApproved && setMyAssessSelected(sc)}
              style={{ cursor: isApproved ? "pointer" : "default" }}
            >
              <span title={`Cycle: ${sc.assessmentPeriod}\nDuration: ${formatQuarterPeriod(sc.assessmentPeriod)}`}>
                <strong>{formatQuarterPeriod(sc.assessmentPeriod)}</strong>
              </span>
              <span>{sc.date}</span>
              <span><strong>{scoreDisplay}</strong></span>
              <span>
                {isApproved ? (
                  <span className="sm2-badge" style={{ background: getCategoryBg(cat), color: getCategoryColor(cat) }}>
                    {sc.isOnlineExam ? t("CBT Exam") : `${t("Category")} ${cat}`}
                  </span>
                ) : (
                  <span className="sm2-badge" style={{ background: "#fef3c7", color: "#d97706" }}>{t("Evaluation Pending")}</span>
                )}
              </span>
              <span style={{ fontSize: 11, color: "#64748b" }}>{sc.assessedBy || "S. Deshmukh (SM)"}</span>
              <span>
                <span className={`sm2-status-pill sm2-status-${(sc.approvalStatus || "approved").toLowerCase()}`}>{t(sc.approvalStatus || "Approved")}</span>
              </span>
              <span style={{ color: isApproved ? "#2563eb" : "#94a3b8", fontSize: 12, fontWeight: 600 }}>{isApproved ? t("View Form") : "—"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
