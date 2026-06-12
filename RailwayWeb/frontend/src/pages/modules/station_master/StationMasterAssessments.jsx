import React from 'react';
import { 
  FileBarChart2, ShieldCheck, CheckCircle2, AlertTriangle, PlayCircle, Target, ArrowRight, BookOpen, Clock
} from 'lucide-react';
import { getCat, getCatColor, getCatBg, riskLevel, riskColor, formatQuarterPeriod, getPerformanceSummaryText } from '../../../utils/scoreCalculator';
import { smTestQuestions } from '../../../data/mockStationMasterData';
import { useLanguage } from '../../../contexts/LanguageContext';

export function StationMasterAssessments(props) {
  const { language, t } = useLanguage();
  const {
    myAssessSelected,
    setMyAssessSelected,
    smMcqTest,
    smSelfAssessment,
    testAssigned,
    smAssessmentHistory,
    startTestAttempt,
    smId
  } = props;

  const latestApprovedAssess = (smAssessmentHistory || []).find(h => ["Approved", "Completed"].includes(h.approvalStatus));
  const hasUnapproved = (smAssessmentHistory || []).some(h => ["Submitted", "Pending"].includes(h.approvalStatus));

  /* Scorecard detail view */
  if (myAssessSelected) {
    const sc = myAssessSelected;
    const cat = sc.category || "A";
    const liveTotal = sc.totalScore || 0;
    const performanceSummary = getPerformanceSummaryText(liveTotal, sc.sections, t);

    return (
      <div className="ti2-card animate-fade-in" style={{ padding: "24px", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
        <div className="ti2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}><ShieldCheck size={22} color="#16a34a"/> {t("Detailed Evaluation Scorecard")}</h2>
          <button className="ti2-primary-btn" onClick={() => setMyAssessSelected(null)}>{t("← Return to History")}</button>
        </div>

        <div className="pm-scorecard-hero" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
          <div className="pm-sc-score-circle" style={{ width: "90px", height: "90px", borderRadius: "50%", border: `6px solid ${getCatColor(cat) || "#2563eb"}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexShrink: 0, background: "#fff" }}>
            <strong style={{ fontSize: "24px", color: getCatColor(cat) || "#2563eb", fontWeight: "800" }}>{liveTotal}</strong>
            <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", marginTop: "-2px" }}>/{sc.isOnlineExam ? 25 : 100}</span>
          </div>
          <div>
            <span className="pm-cat-badge-lg" style={{ background: getCatBg(cat), color: getCatColor(cat), display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
              {t("Final Category: Category")} {cat}
            </span>
            <p className="pm-sc-period" style={{ margin: "2px 0", fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>{sc.period ? sc.period.replace(/(Q[1-4])/g, (q) => t(q)) : ""} - {t("Self-Compliance Audit")}</p>
            <p className="pm-sc-date" style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>{t("Attempt Completed:")} {sc.date} &nbsp;·&nbsp; {t("Assessed By:")} {t(sc.assessedBy || "Traffic Inspector")}</p>
          </div>
        </div>

        {/* Dynamic Performance Summary */}
        <div className="pm-performance-summary-box" style={{ background: "#eff6ff", borderLeft: "4px solid #2563eb", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>📊 {t("Official Performance Evaluation Summary")}</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#1e3a8a", lineHeight: "1.5" }}>{t(performanceSummary)}</p>
        </div>

        {/* Competency Module Breakdown */}
        <div className="pm-sc-sections" style={{ marginBottom: "30px" }}>
          <h3 style={{ fontSize: "15px", color: "#0f172a", marginBottom: "16px", fontWeight: "700" }}>{t("Safety Domain Competency Breakdown")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sc.sections.map(s => {
              const spc = Math.round((s.marks / s.outOf) * 100);
              const barColor = spc >= 80 ? "#16a34a" : spc >= 50 ? "#2563eb" : spc >= 26 ? "#d97706" : "#dc2626";
              return (
                <div key={s.title} className="pm-sc-section-row" style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "13px" }}>
                  <span className="pm-sc-section-name" style={{ width: "260px", fontWeight: "600", color: "#334155" }}>{t(s.title)}</span>
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
            <Clock size={16} color="#475569"/>
            <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "700" }}>{t("Complete Assessment Question Review")}</h3>
          </div>
          <p className="pm-subtitle" style={{ fontSize: "12px", color: "#64748b", marginTop: "-10px", marginBottom: "20px" }}>
            {t("Below is the detailed response evaluation for all 25 compulsory questions. Correct responses are highlighted in green; incorrect choices are highlighted in red.")}
          </p>

          <div className="pm-review-questions-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {smTestQuestions.map((q, qIndex) => {
              const selectedOpt = sc.mcqResponses ? sc.mcqResponses[qIndex] : null;
              const isCorrect = selectedOpt === q.answer;

              return (
                <div key={qIndex} className={`pm-review-question-card ${isCorrect ? "correct-card" : "wrong-card"}`}>
                  <div className="pm-rq-header">
                    <span className="pm-rq-number">{t("Question")} {qIndex + 1}</span>
                    {isCorrect ? (
                      <span className="pm-rq-badge success">{t("Correct (+1 Marks)")}</span>
                    ) : (
                      <span className="pm-rq-badge danger">{t("Incorrect (0 Marks)")}</span>
                    )}
                  </div>
                  <h4 className="pm-rq-text">{t(q.text)}</h4>

                  <div className="pm-rq-options-grid">
                    {q.options.map((opt, oIdx) => {
                      const wasSelected = selectedOpt === oIdx;
                      const isOptCorrect = q.answer === oIdx;
                      
                      let optClass = "";
                      if (wasSelected) {
                        optClass = isCorrect ? "opt-selected-correct" : "opt-selected-wrong";
                      } else if (isOptCorrect) {
                        optClass = "opt-correct-unselected";
                      }

                      return (
                        <div key={oIdx} className={`pm-rq-option-item ${optClass}`}>
                          <span className="font-mono opt-prefix">{["A", "B", "C", "D"][oIdx]}</span>
                          <span className="opt-label-text">{t(opt)}</span>
                          {wasSelected && (
                            <span className="opt-user-tag">{isCorrect ? t("✓ Selected") : t("✗ Selected")}</span>
                          )}
                          {!wasSelected && isOptCorrect && (
                            <span className="opt-correct-tag">{t("✓ Correct Key")}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div style={{ marginTop: "16px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", borderLeft: "4px solid #f97316", fontSize: "12.5px", color: "#334155" }}>
                      <strong style={{ color: "#c2410c" }}>{t("💡 Operational Safety Explanation:")} </strong> {t(q.explanation)}
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

  const isActivated = localStorage.getItem(`sm_test_activated_${smId}`) === "true";
  const isCompleted = testAssigned === "Completed" || (smMcqTest && smMcqTest.completed);
  const hasHistory = smAssessmentHistory && smAssessmentHistory.length > 0;

  /* History list */
  return (
    <section className="sm2-card">
      {/* MCQ Assessment Assignment Banner */}
      {isActivated && !isCompleted ? (
          <div style={{
            background:"linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
            border:"1.5px solid #fed7aa",
            borderRadius:12,
            padding:20,
            marginBottom:24,
            boxShadow:"0 4px 6px -1px rgba(0,0,0,0.05)"
          }}>
            <div style={{display:"flex", gap:16, alignItems:"start"}}>
              <div style={{
                background:"#ffedd5",
                borderRadius:50,
                width:42,
                height:42,
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                flexShrink:0
              }}>
                <ShieldCheck size={22} color="#ea580c"/>
              </div>
              <div style={{flex:1}}>
                <h3 style={{margin:"0 0 6px", fontSize:16, fontWeight:700, color:"#c2410c"}}>
                  ⚠️ {t("Pending Competency Assessment")}
                </h3>
                <p style={{margin:"0 0 14px", fontSize:13, color:"#9a3412", lineHeight:1.4}}>
                  {t("Your supervisor (Traffic Inspector) has scheduled a periodic safety & competency assessment for you. You must complete the 25-question MCQ exam.")}
                </p>
                <button
                  onClick={startTestAttempt}
                  style={{
                    background:"#ea580c",
                    color:"#ffffff",
                    border:"none",
                    padding:"10px 20px",
                    borderRadius:8,
                    fontSize:13.5,
                    fontWeight:700,
                    cursor:"pointer",
                    boxShadow:"0 4px 6px rgba(234, 88, 12, 0.2)",
                    display:"flex",
                    alignItems:"center",
                    gap:8
                  }}
                >
                  {t("Start 25 MCQ Online Assessment")}
                </button>
              </div>
            </div>
          </div>
      ) : !isActivated && !hasHistory && !isCompleted ? (
          <div style={{
            background:"#f8fafc",
            border:"2px dashed #cbd5e1",
            borderRadius:12,
            padding:20,
            marginBottom:24,
            boxShadow:"0 4px 6px -1px rgba(0,0,0,0.05)",
            display:"flex",
            gap:16,
            alignItems:"start"
          }}>
            <div style={{
              background:"#e2e8f0",
              borderRadius:50,
              width:42,
              height:42,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              flexShrink:0
            }}>
              <span style={{fontSize: 20}}>🔒</span>
            </div>
            <div style={{flex:1}}>
              <h3 style={{margin:"0 0 6px", fontSize:16, fontWeight:700, color:"#475569"}}>
                {t("Competency Exam Locked")}
              </h3>
              <p style={{margin:0, fontSize:13, color:"#64748b", lineHeight:1.4}}>
                {t("Your periodic safety and competency evaluation is locked. Please request your Traffic Inspector to activate your test so you can attempt it.")}
              </p>
            </div>
          </div>
      ) : (
        <div style={{
          background:"#f0fdf4",
          border:"1.5px solid #bbf7d0",
          borderRadius:12,
          padding:18,
          marginBottom:24,
          display:"flex",
          alignItems:"center",
          gap:14
        }}>
          <ShieldCheck size={24} color="#16a34a"/>
          <div style={{flex:1}}>
            <h3 style={{margin:"0 0 2px", fontSize:14.5, fontWeight:700, color:"#14532d"}}>
              {t("All assessments are up to date. No pending test available.")}
            </h3>
            <p style={{margin:0, fontSize:12, color:"#166534"}}>
              {t("Your periodic safety and competency evaluation is currently active and compliant.")}
            </p>
          </div>
          <div style={{display:"flex", gap:16, fontSize:12, textAlign:"right"}}>
            <div>
              <span style={{color:"#166534", display:"block"}}>{t("Last Exam Score")}</span>
              <strong style={{color:"#14532d", fontSize:13}}>
                {latestApprovedAssess ? `${latestApprovedAssess.sections?.find(s=>s.title.includes("MCQ"))?.marks || latestApprovedAssess.totalScore || 0}/25` : (hasUnapproved ? t("Awaiting Approval") : t("N/A"))}
              </strong>
            </div>
            {latestApprovedAssess && (
              <div style={{borderLeft:"1px solid #bbf7d0", paddingLeft:16}}>
                <span style={{color:"#166534", display:"block"}}>{t("Next Due Date")}</span>
                <strong style={{color:"#14532d", fontSize:14}}>
                  {new Date(new Date(latestApprovedAssess.date).setMonth(new Date(latestApprovedAssess.date).getMonth() + 6)).toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sm2-card-hdr"><h2>{t("My Assessment History (by TI)")}</h2></div>
      <p className="sm2-subtitle">{t("All assessments conducted by the Traffic Inspector for your station. Click any row to view the detailed scorecard.")}</p>

      {smAssessmentHistory.length === 0 ? (
        <div style={{ padding: "40px 20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", textAlign: "center", color: "#64748b", marginTop: "20px" }}>
          <FileBarChart2 size={40} style={{ margin: "0 auto 12px", color: "#94a3b8" }}/>
          <h3 style={{ margin: "0 0 6px", color: "#1e293b", fontSize: "15px", fontWeight: 700 }}>{t("No Assessment Records Available")}</h3>
          <p style={{ margin: 0, fontSize: "13px" }}>{t("You have not completed any evaluations or tests yet.")}</p>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="sm2-myassess-summary">
            <div className="sm2-report-mini">
              <label>{t("Total Assessments")}</label>
              <strong>{smAssessmentHistory.length}</strong>
            </div>
            <div className="sm2-report-mini">
              <label>{t("Latest Score")}</label>
              <strong>{latestApprovedAssess ? `${latestApprovedAssess.totalScore}/${latestApprovedAssess.isOnlineExam ? 25 : 100}` : (hasUnapproved ? t("Awaiting Approval") : "—")}</strong>
            </div>
            <div className="sm2-report-mini">
              <label>{t("Average TI Score")}</label>
              <strong>{
                (() => {
                  const regs = smAssessmentHistory.filter(h => !h.isOnlineExam && ["Approved", "Completed"].includes(h.approvalStatus));
                  return regs.length ? `${Math.round(regs.reduce((s, a) => s + a.totalScore, 0) / regs.length)}/100` : "—";
                })()
              }</strong>
            </div>
            <div className="sm2-report-mini">
              <label>{t("Latest Assessment")}</label>
              <strong style={{color: latestApprovedAssess ? getCatColor(latestApprovedAssess.category) : "#64748b"}}>
                {latestApprovedAssess ? (latestApprovedAssess.isOnlineExam ? t("Online CBT") : `${t("Category")} ${latestApprovedAssess.category}`) : (hasUnapproved ? t("Awaiting Approval") : "—")}
              </strong>
            </div>
          </div>

          {/* List */}
          <div className="sm2-myassess-list">
            <div className="sm2-myassess-head">
              {["Period","Date","Score Scale","Category","Assessed By","Status",""].map(h =>
                <span key={h}>{t(h)}</span>)}
            </div>
            {smAssessmentHistory.map(sc => {
              const isApproved = ["Approved", "Completed"].includes(sc.approvalStatus);
              const cat = isApproved ? sc.category : null;
              const scoreDisplay = isApproved ? `${sc.totalScore}/${sc.isOnlineExam ? 25 : 100}` : "—";
              return (
                <button 
                  key={sc.id} 
                  className="sm2-myassess-row" 
                  onClick={() => isApproved && setMyAssessSelected(sc)}
                  style={{ cursor: isApproved ? "pointer" : "default" }}
                >
                  <span title={`${t("Cycle:")} ${sc.period ? sc.period.replace(/(Q[1-4])/g, (q) => t(q)) : ""}\n${t("Duration:")} ${formatQuarterPeriod(sc.period, t)}`}>
                    <strong>{formatQuarterPeriod(sc.period, t)}</strong>
                  </span>
                  <span>{sc.date}</span>
                  <span><strong>{scoreDisplay}</strong></span>
                  <span>
                    {isApproved ? (
                      <span className="sm2-badge" style={{background:getCatBg(cat),color:getCatColor(cat)}}>
                        {sc.isOnlineExam ? t("CBT Exam") : `${t("Cat.")} ${cat}`}
                      </span>
                    ) : (
                      <span style={{ color: "#ea580c", fontSize: "12px", fontWeight: "600" }}>{t("Awaiting Approval")}</span>
                    )}
                  </span>
                  <span style={{fontSize:11,color:"#64748b"}}>{t(sc.assessedBy)}</span>
                  <span>
                    <span className={`sm2-status-pill sm2-status-${sc.approvalStatus.toLowerCase()}`}>{t(sc.approvalStatus)}</span>
                  </span>
                  <span style={{color: isApproved ? "#2563eb" : "#94a3b8", fontSize:12, fontWeight:600}}>{isApproved ? t("View Form") : "—"}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
