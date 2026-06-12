import React, { useState, useMemo } from "react";
import { ShieldCheck, Clock, ClipboardList, Award, TrendingUp, FileBarChart2, Lock } from "lucide-react";
import { getCategory, getCategoryColor, getCategoryBg, formatQuarterPeriod } from "../../utils/tmUtils";
import { testQuestions, TEST_NAME } from "../../data/mockTMData";
import { dbService, isSupabaseConfigured } from "../../supabaseClient";

export function TMMyAssessment({
  employeeId,
  fullName,
  user = {},
  history = [],
  setHistory,
  logActivity,
  triggerNotification,
  setStatusText
}) {
  const [viewMode, setViewMode] = useState("dashboard"); // "dashboard" | "test"
  
  const [testAssigned, setTestAssigned] = useState(
    localStorage.getItem(`tm_test_assigned_${employeeId}`) || "Assigned"
  );
  
  const [tmMcqTest, setPmMcqTest] = useState(
    JSON.parse(localStorage.getItem(`tm_mcq_test_${employeeId}`)) || null
  );

  const [myAssessSelected, setMyAssessSelected] = useState(null);
  const [tmActiveQIdx, setPmActiveQIdx] = useState(0);
  const [tmTestResponses, setPmTestResponses] = useState(Array(25).fill(null));

  /* ─── Actions ─── */
  const startTestAttempt = () => {
    setPmActiveQIdx(0);
    setPmTestResponses(Array(25).fill(null));
    setViewMode("test");
    logActivity("Assessment", "Periodic assessment test started.");
  };

  const handleSubmitTestAttempt = async () => {
    let correctCount = 0;
    const secMarks = [0, 0, 0, 0, 0];
    
    tmTestResponses.forEach((r, i) => {
      const secIdx = Math.floor(i / 5);
      if (r === testQuestions[i].answer) {
        correctCount++;
        secMarks[secIdx] += 1;
      }
    });

    const percentage = Math.round((correctCount / 25) * 100);
    const passStatus = percentage >= 60 ? "PASSED" : "FAILED";
    const today = new Date().toISOString().slice(0, 10);
    
    const testResult = {
      completed: true,
      correctCount,
      responses: [...tmTestResponses],
      submittedDate: today,
      percentage,
      passStatus
    };
    
    localStorage.setItem(`tm_mcq_test_${employeeId}`, JSON.stringify(testResult));
    setPmMcqTest(testResult);
    localStorage.setItem(`tm_test_assigned_${employeeId}`, "Completed");
    setTestAssigned("Completed");

    const record = {
      id: Date.now(),
      date: today,
      assessmentPeriod: "Q2 2026",
      name: TEST_NAME,
      assessedBy: "Online Self-Exam",
      totalScore: correctCount,
      sections: [
        { title: "Signal Rules",          marks: secMarks[0], outOf: 5 },
        { title: "Track Handling",         marks: secMarks[1], outOf: 5 },
        { title: "Communication",          marks: secMarks[2], outOf: 5 },
        { title: "Safety Response",        marks: secMarks[3], outOf: 5 },
        { title: "Operational Judgement",  marks: secMarks[4], outOf: 5 }
      ],
      responses: [...tmTestResponses],
      approvalStatus: "Completed",
      isOnlineExam: true
    };
    
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem(`tm_history_${employeeId}`, JSON.stringify(newHistory));
    
    if (isSupabaseConfigured) {
      const attemptData = {
        employeeId: employeeId,
        obtainedMarks: correctCount,
        percentage: percentage,
        category: getCategory(correctCount * 4),
        totalMarks: 25,
        conductedBy: employeeId,
        isOnlineExam: true
      };

      const answersArray = tmTestResponses.map((selected, idx) => ({
        questionId: idx + 1,
        selectedOption: selected !== null && selected !== undefined ? ["A", "B", "C", "D"][selected] : "A",
        isCorrect: selected === testQuestions[idx].answer,
        correctOption: ["A", "B", "C", "D"][testQuestions[idx].answer],
        marksObtained: selected === testQuestions[idx].answer ? 1 : 0
      }));

      try {
        await dbService.submitTestAttempt(attemptData, answersArray);
      } catch (e) {
        console.error("Supabase fail:", e);
      }
    }
    
    setViewMode("dashboard");
    setStatusText("Assessment submitted successfully! Awaiting AOM approval.");
    logActivity("Assessment", `Submitted test with score ${correctCount}/25 (${percentage}%)`);
    triggerNotification("success", "Assessment submitted! Awaiting AOM approval.");
  };

  /* ─── Dynamic Performance Summary ─── */
  const performanceSummaryText = useMemo(() => {
    const rec = myAssessSelected;
    if (!rec || !rec.sections || rec.sections.length === 0) return "";
    const { totalScore, sections } = rec;
    const lowestSec = [...sections].sort((a, b) => a.marks - b.marks)[0];
    const highestSec = [...sections].sort((a, b) => b.marks - a.marks)[0];

    let summary = `Assessment score achieved: ${totalScore}/100 (${totalScore >= 80 ? 'Outstanding Competency' : totalScore >= 50 ? 'Satisfactory Operations' : 'Requires Training'}). `;
    summary += `Demonstrated excellent competency in "${highestSec.title}" scoring ${highestSec.marks}/${highestSec.outOf} marks. `;
    if (lowestSec.marks < lowestSec.outOf) {
      summary += `However, low-scoring markers are observed in "${lowestSec.title}" (${lowestSec.marks}/${lowestSec.outOf}). It is highly recommended to study the Station Working Rules (SWR) for block operations and undergo periodic coaching.`;
    } else {
      summary += `Achieved flawless accuracy in all modules. Recommended to maintain this premium standard in daily train manager operations.`;
    }
    return summary;
  }, [myAssessSelected]);

  /* ─── Render Sub-Views ─── */
  
  if (viewMode === "test") {
    const question = testQuestions[tmActiveQIdx];
    const answeredCount = tmTestResponses.filter(r => r !== null && r !== undefined).length;
    const completionRate = Math.round((answeredCount / 25) * 100);
    const unansweredCount = 25 - answeredCount;

    return (
      <div style={{
        position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:999999,
        background:"#f1f5f9", display:"flex", flexDirection:"column",
        height:"100vh", width:"100vw", overflow:"hidden", fontFamily:"'Poppins', sans-serif"
      }}>
        <header style={{
          background:"#1e293b", color:"#ffffff", padding:"16px 24px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          boxShadow:"0 4px 6px -1px rgba(0,0,0,0.1)", height:"70px", flexShrink:0
        }}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <ShieldCheck size={28} color="#ea580c"/>
            <div>
              <h1 style={{fontSize:18, fontWeight:800, margin:0, color:"#ffffff", letterSpacing:"0.5px"}}>
                TRAIN MANAGER CBT COMPETENCY EVALUATION
              </h1>
              <p style={{margin:0, fontSize:11, color:"#94a3b8", fontWeight:500}}>
                Official Railway Safety &amp; Operational Assessment
              </p>
            </div>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:16}}>
            <div style={{background:"#334155", padding:"6px 16px", borderRadius:8, fontSize:13, fontWeight:700, color:"#cbd5e1", border:"1px solid #475569"}}>
              ⚙️ STATUS: <span style={{color:"#ea580c"}}>Active Exam Session</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to abort the exam? Your progress will not be saved.")) {
                  setViewMode("dashboard");
                }
              }}
              style={{padding:"8px 18px", borderRadius:8, fontSize:13, background:"#ef4444", color:"#ffffff", border:"none", fontWeight:700, cursor:"pointer"}}
            >
              Exit Exam
            </button>
          </div>
        </header>

        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", background:"#ffffff", borderBottom:"1.5px solid #e2e8f0", padding:"12px 24px", height:"50px", flexShrink:0, fontSize:13.5, color:"#334155"}}>
          <div>Candidate: <strong style={{color:"#1e3a8a"}}>{fullName}</strong> &nbsp;|&nbsp; HRMS: <strong style={{color:"#1e3a8a"}}>{employeeId}</strong> &nbsp;|&nbsp; Station: <strong>{user?.station || "—"}</strong></div>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <span style={{fontWeight:600}}>Progress: <strong style={{color:"#ea580c"}}>{answeredCount} / 25 Answered</strong> ({completionRate}%)</span>
            <div style={{width:140, height:8, background:"#e2e8f0", borderRadius:4, overflow:"hidden"}}>
              <div style={{width:`${completionRate}%`, height:"100%", background:"#ea580c", borderRadius:4}}/>
            </div>
          </div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 340px", flex:1, overflow:"hidden"}}>
          {/* Left: Question Pane */}
          <div style={{padding:"32px 40px", display:"flex", flexDirection:"column", background:"#f8fafc", overflowY:"auto", height:"100%"}}>
            <div style={{background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:14, padding:36, boxShadow:"0 10px 15px -3px rgba(0,0,0,0.05)", flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", marginBottom:24}}>
              <div>
                <span style={{fontSize:12.5, fontWeight:800, color:"#ea580c", background:"#fff7ed", padding:"6px 14px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.8px"}}>
                  Compulsory Question {tmActiveQIdx + 1} of 25
                </span>
                <h2 style={{fontSize:22, fontWeight:700, color:"#0f172a", marginTop:24, marginBottom:28, lineHeight:1.5}}>{question.text}</h2>
                <div style={{display:"flex", flexDirection:"column", gap:14}}>
                  {question.options.map((opt, oi) => {
                    const isSelected = tmTestResponses[tmActiveQIdx] === oi;
                    return (
                      <label key={oi} style={{display:"flex", alignItems:"center", gap:16, padding:"18px 24px", border:isSelected ? "2.5px solid #ea580c" : "1.5px solid #e2e8f0", borderRadius:12, background:isSelected ? "#fff7ed" : "#ffffff", cursor:"pointer", boxShadow:isSelected ? "0 4px 6px rgba(234,88,12,0.08)" : "none", transition:"all 0.15s ease"}}>
                        <input type="radio" name={`pmq-${tmActiveQIdx}`} checked={isSelected} onChange={() => { const r=[...tmTestResponses]; r[tmActiveQIdx]=oi; setPmTestResponses(r); }} style={{width:20, height:20, accentColor:"#ea580c"}}/>
                        <span style={{fontSize:15, fontWeight:800, color:isSelected?"#c2410c":"#64748b", width:24}}>{["A","B","C","D"][oi]}</span>
                        <span style={{fontSize:15, color:"#1e293b", fontWeight:isSelected?700:500}}>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:12, padding:"16px 24px", boxShadow:"0 4px 6px -1px rgba(0,0,0,0.05)"}}>
              <button disabled={tmActiveQIdx===0} onClick={() => setPmActiveQIdx(p=>Math.max(0,p-1))} style={{padding:"12px 28px", borderRadius:8, fontSize:14, fontWeight:700, background:tmActiveQIdx===0?"#f1f5f9":"#ffffff", color:tmActiveQIdx===0?"#94a3b8":"#334155", border:"1.5px solid #cbd5e1", cursor:tmActiveQIdx===0?"not-allowed":"pointer"}}>← Previous Question</button>
              <div style={{fontSize:14, color:"#64748b"}}>
                {unansweredCount>0 ? <span style={{color:"#b45309",fontWeight:800}}>⚠️ {unansweredCount} question{unansweredCount>1?"s":""} remaining</span> : <span style={{color:"#16a34a",fontWeight:800}}>✓ All 25 answered! You can submit.</span>}
              </div>
              <button disabled={tmActiveQIdx===24} onClick={() => setPmActiveQIdx(p=>Math.min(24,p+1))} style={{padding:"12px 28px", borderRadius:8, fontSize:14, fontWeight:700, background:tmActiveQIdx===24?"#f1f5f9":"#ffffff", color:tmActiveQIdx===24?"#94a3b8":"#334155", border:"1.5px solid #cbd5e1", cursor:tmActiveQIdx===24?"not-allowed":"pointer"}}>Next Question →</button>
            </div>
          </div>

          {/* Right: Navigator Sidebar */}
          <div style={{background:"#ffffff", borderLeft:"1.5px solid #e2e8f0", padding:"24px", display:"flex", flexDirection:"column", gap:20, overflowY:"auto", height:"100%"}}>
            <div style={{textAlign:"center", paddingBottom:16, borderBottom:"1.5px solid #f1f5f9"}}>
              <div style={{width:60, height:60, borderRadius:"50%", background:"#ffedd5", color:"#ea580c", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, margin:"0 auto 10px"}}>{fullName.charAt(0)}</div>
              <h3 style={{fontSize:15, fontWeight:700, color:"#1e293b", margin:0}}>{fullName}</h3>
              <span style={{fontSize:12, color:"#64748b", fontWeight:500}}>HRMS ID: {employeeId}</span>
            </div>
            <h4 style={{fontSize:12, fontWeight:800, color:"#475569", textTransform:"uppercase", letterSpacing:"0.6px", margin:0}}>Question Palette</h4>
            <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, maxHeight:220, overflowY:"auto", paddingRight:4}}>
              {testQuestions.map((q, idx) => {
                const isCurrent = idx===tmActiveQIdx;
                const isAnswered = tmTestResponses[idx]!==null && tmTestResponses[idx]!==undefined;
                let bg="#ffffff", border="1.5px solid #cbd5e1", color="#475569", fw="600";
                if (isCurrent) { bg="#ffedd5"; border="2px solid #ea580c"; color="#c2410c"; fw="800"; }
                else if (isAnswered) { bg="#dcfce7"; border="1.5px solid #86efac"; color="#15803d"; }
                else { bg="#fef3c7"; border="1.5px solid #fde047"; color="#a16207"; }
                return <button key={q.id} onClick={()=>setPmActiveQIdx(idx)} style={{height:40, borderRadius:8, fontSize:13, fontWeight:fw, background:bg, border, color, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>{q.id}</button>;
              })}
            </div>
            <div style={{borderTop:"1.5px solid #f1f5f9", paddingTop:16, fontSize:12, color:"#64748b", display:"flex", flexDirection:"column", gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:16,height:16,background:"#dcfce7",border:"1.5px solid #86efac",borderRadius:4}}/><span>Attempted</span></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:16,height:16,background:"#fef3c7",border:"1.5px solid #fde047",borderRadius:4}}/><span style={{color:"#a16207",fontWeight:600}}>Unattempted</span></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:16,height:16,background:"#ffedd5",border:"2px solid #ea580c",borderRadius:4}}/><span>Current Focus</span></div>
            </div>
            <div style={{marginTop:"auto", paddingTop:20, borderTop:"1.5px solid #f1f5f9"}}>
              <button
                disabled={unansweredCount>0}
                onClick={handleSubmitTestAttempt}
                style={{width:"100%", padding:"14px 16px", borderRadius:10, fontSize:14.5, fontWeight:800, background:unansweredCount>0?"#cbd5e1":"#16a34a", color:unansweredCount>0?"#94a3b8":"#ffffff", border:"none", cursor:unansweredCount>0?"not-allowed":"pointer", boxShadow:unansweredCount>0?"none":"0 4px 12px rgba(22,163,74,0.3)"}}
              >
                Submit Examination
              </button>
              {unansweredCount>0 && <p style={{fontSize:11, color:"#b45309", margin:"8px 0 0", textAlign:"center", fontWeight:600}}>* All 25 questions must be answered before submission ({unansweredCount} remaining)</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (myAssessSelected) {
    const sc = myAssessSelected;
    // Use AOM-approved category from DB if available (after AOM finalization), else compute locally
    const localCat = getCategory(sc.isOnlineExam ? sc.totalScore * 4 : sc.totalScore);
    const cat = (sc.isApproved && sc.dbCategory) ? sc.dbCategory : localCat;
    const liveTotal = sc.totalScore || 0;
    const performanceSummary = performanceSummaryText;

    return (
      <div className="ti2-card animate-fade-in" style={{ padding: "24px", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
        <div className="ti2-card-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}><ShieldCheck size={22} color="#16a34a"/> Detailed Evaluation Scorecard</h2>
          <button className="ti2-primary-btn" onClick={() => setMyAssessSelected(null)}>← Return to History</button>
        </div>

        <div className="pm-scorecard-hero" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
          <div className="pm-sc-score-circle" style={{ width: "90px", height: "90px", borderRadius: "50%", border: `6px solid ${getCategoryColor(cat) || "#2563eb"}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexShrink: 0, background: "#fff" }}>
            <strong style={{ fontSize: "24px", color: getCategoryColor(cat) || "#2563eb", fontWeight: "800" }}>{liveTotal}</strong>
            <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", marginTop: "-2px" }}>/{sc.isOnlineExam ? 25 : 100}</span>
          </div>
          <div>
            <span className="pm-cat-badge-lg" style={{ background: getCategoryBg(cat), color: getCategoryColor(cat), display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
              {sc.isApproved && sc.dbCategory ? `✅ AOM Approved Category: Category ${cat}` : `Final Category: Category ${cat}`}
            </span>
            <p className="pm-sc-period" style={{ margin: "2px 0", fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>{sc.assessmentPeriod} - Self-Compliance Audit</p>
            <p className="pm-sc-date" style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Attempt Completed: {sc.date} &nbsp;·&nbsp; Assessed By: {sc.assessedBy || "Traffic Inspector"}</p>
          </div>
        </div>

        {/* Dynamic Performance Summary */}
        <div className="pm-performance-summary-box" style={{ background: "#eff6ff", borderLeft: "4px solid #2563eb", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>📊 Official Performance Evaluation Summary</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#1e3a8a", lineHeight: "1.5" }}>{performanceSummary || `Assessment score: ${liveTotal}/${sc.isOnlineExam ? 25 : 100}. Periodic evaluation completed.`}</p>
        </div>

        {/* Competency Module Breakdown */}
        <div className="pm-sc-sections" style={{ marginBottom: "30px" }}>
          <h3 style={{ fontSize: "15px", color: "#0f172a", marginBottom: "16px", fontWeight: "700" }}>Safety Domain Competency Breakdown</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {(sc.sections || []).map(s => {
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
        {sc.isOnlineExam && (
          <div className="pm-mcq-review-panel" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
            <div className="pm-chart-header" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={16} color="#475569"/>
              <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "700" }}>Complete Assessment Question Review</h3>
            </div>
            <p className="pm-subtitle" style={{ fontSize: "12.5px", color: "#64748b", marginTop: "-10px", marginBottom: "20px", fontWeight: "500" }}>
              Below is the detailed response evaluation for all 25 compulsory questions.
              <span style={{ display: "block", marginTop: "4px", color: "#1e3a8a", fontWeight: "700" }}>
                🎯 Marking Scheme: +1 for correct response, 0 for incorrect/unattempted response (Maximum Marks: 25).
              </span>
            </p>
            <div className="pm-review-questions-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {testQuestions.map((q, qIndex) => {
                const selectedOpt = sc.responses ? sc.responses[qIndex] : null;
                let selectedOptIdx = null;
                if (selectedOpt !== null && selectedOpt !== undefined) {
                  if (typeof selectedOpt === "number") {
                    selectedOptIdx = selectedOpt;
                  } else if (typeof selectedOpt === "string") {
                    const trimmed = selectedOpt.trim().toUpperCase();
                    if (["A", "B", "C", "D"].includes(trimmed)) {
                      selectedOptIdx = ["A", "B", "C", "D"].indexOf(trimmed);
                    } else if (!isNaN(trimmed)) {
                      selectedOptIdx = parseInt(trimmed, 10);
                    }
                  }
                }
                const isCorrect = selectedOptIdx === q.answer;
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
                    <h4 className="pm-rq-text">{q.text}</h4>

                    {/* Summary of answers */}
                    <div className="pm-rq-answers-summary" style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "600", display: "flex", gap: "20px", background: "#f8fafc", padding: "10px 16px", borderRadius: "8px", border: "1px solid #e2edf8" }}>
                      <span style={{ color: isCorrect ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: "6px" }}>
                        Your Answer: <strong style={{ textDecoration: isCorrect ? "none" : "line-through" }}>{selectedOptIdx !== null ? ["A", "B", "C", "D"][selectedOptIdx] : "None"}</strong>
                      </span>
                      <span style={{ color: "#16a34a" }}>
                        Correct Answer: <strong>{["A", "B", "C", "D"][q.answer]}</strong>
                      </span>
                    </div>

                    <div className="pm-rq-options-grid">
                      {q.options.map((opt, oIdx) => {
                        const wasSelected = selectedOptIdx === oIdx;
                        const isOptCorrect = q.answer === oIdx;
                        let optClass = "";
                        if (wasSelected) optClass = isCorrect ? "opt-selected-correct" : "opt-selected-wrong";
                        else if (isOptCorrect) optClass = "opt-correct-unselected";
                        return (
                          <div key={oIdx} className={`pm-rq-option-item ${optClass}`}>
                            <span className="font-mono opt-prefix">{["A","B","C","D"][oIdx]}</span>
                            <span className="opt-label-text">{opt}</span>
                            {wasSelected && <span className="opt-user-tag">{isCorrect ? "✓ Your Answer" : "✗ Your Answer"}</span>}
                            {!wasSelected && isOptCorrect && <span className="opt-correct-tag">✓ Correct Key</span>}
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
        )}
      </div>
    );
  }

  const isTestActivated = localStorage.getItem("tm_test_activated_" + employeeId) === "true";
  const testActive = isTestActivated && testAssigned === "Assigned" && (!tmMcqTest || !tmMcqTest.completed);

  const latestApprovedAttempt = history.find(h => ["Approved", "Completed"].includes(h.approvalStatus));
  const hasUnapproved = history.some(h => ["Submitted", "Pending"].includes(h.approvalStatus));

  return (
    <section className="sm2-card">
      {/* MCQ Assessment Assignment Banner */}
      {!isTestActivated && (!tmMcqTest || !tmMcqTest.completed) ? (
        <div style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1.5px solid #cbd5e1",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
        }}>
          <div style={{display: "flex", gap: 16, alignItems: "start"}}>
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
              <Lock size={22} color="#64748b"/>
            </div>
            <div style={{flex: 1}}>
              <h3 style={{margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#334155"}}>
                🔒 Competency Assessment Locked
              </h3>
              <p style={{margin: "0 0 14px", fontSize: 13, color: "#475569", lineHeight: 1.4}}>
                Your periodic evaluation is currently locked. Please request your Traffic Inspector (TI) to activate the assessment.
              </p>
              <div style={{
                display: "inline-block",
                background: "#e2e8f0",
                color: "#475569",
                padding: "8px 16px",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600
              }}>
                Locked: Contact Traffic Inspector to activate your assessment
              </div>
            </div>
          </div>
        </div>
      ) : testActive ? (
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
                ⚠️ Pending Competency Assessment
              </h3>
              <p style={{margin:"0 0 14px", fontSize:13, color:"#9a3412", lineHeight:1.4}}>
                Your supervisor (Traffic Inspector) has scheduled a periodic safety &amp; competency assessment for you. You must complete the 25-question MCQ exam.
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
                Start 25 MCQ Online Assessment
              </button>
            </div>
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
              All assessments are up to date. No pending test available.
            </h3>
            <p style={{margin:0, fontSize:12, color:"#166534"}}>
              Your periodic safety and competency evaluation is currently active and compliant.
            </p>
          </div>
          <div style={{display:"flex", gap:16, fontSize:12, textAlign:"right"}}>
            <div>
              <span style={{color:"#166534", display:"block"}}>Last Exam Score</span>
              <strong style={{color:"#14532d", fontSize:13}}>{latestApprovedAttempt ? `${latestApprovedAttempt.totalScore}%` : (hasUnapproved ? "Awaiting Approval" : "—")}</strong>
            </div>
            {latestApprovedAttempt && (
              <div style={{borderLeft:"1px solid #bbf7d0", paddingLeft:16}}>
                <span style={{color:"#166534", display:"block"}}>Next Due Date</span>
                <strong style={{color:"#14532d", fontSize:13}}>
                  {new Date(new Date(latestApprovedAttempt.date).setMonth(new Date(latestApprovedAttempt.date).getMonth() + 6)).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sm2-card-hdr"><h2>My Assessment History</h2></div>
      <p className="sm2-subtitle">All assessments conducted by the Traffic Inspector/Station Supervisor for your record. Click any row to view the detailed scorecard.</p>

      {history.length === 0 ? (
        <div style={{ padding: "40px 20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", textAlign: "center", color: "#64748b", marginTop: "20px" }}>
          <FileBarChart2 size={40} style={{ margin: "0 auto 12px", color: "#94a3b8" }}/>
          <h3 style={{ margin: "0 0 6px", color: "#1e293b", fontSize: "15px", fontWeight: 700 }}>No Assessment Records Available</h3>
          <p style={{ margin: 0, fontSize: "13px" }}>You have not completed any evaluations or tests yet.</p>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="sm2-myassess-summary">
            <div className="sm2-report-mini">
              <label>Total Assessments</label>
              <strong>{history.length}</strong>
            </div>
            <div className="sm2-report-mini">
              <label>Latest Score</label>
              <strong>{latestApprovedAttempt ? `${latestApprovedAttempt.totalScore}/${latestApprovedAttempt.isOnlineExam ? 25 : 100}` : (hasUnapproved ? "Awaiting Approval" : "—")}</strong>
            </div>
            <div className="sm2-report-mini">
              <label>Average TI Score</label>
              <strong>{
                (() => {
                  const regs = history.filter(h => !h.isOnlineExam && ["Approved", "Completed"].includes(h.approvalStatus));
                  return regs.length ? `${Math.round(regs.reduce((s, a) => s + a.totalScore, 0) / regs.length)}/100` : "—";
                })()
              }</strong>
            </div>
            <div className="sm2-report-mini">
              {/* Use AOM-approved category from DB when assessment is approved */}
              {(() => {
                const latest = latestApprovedAttempt;
                if (latest) {
                  const finalCat = latest.dbCategory || latest.category || getCategory(latest.isOnlineExam ? latest.totalScore * 4 : latest.totalScore);
                  return (
                    <>
                      <label>{latest.isApproved ? "AOM Approved Category" : "Latest Assessment"}</label>
                      <strong style={{color: getCategoryColor(finalCat)}}>
                        {latest.isOnlineExam ? "Online CBT" : `Category ${finalCat}`}
                      </strong>
                    </>
                  );
                } else {
                  return (
                    <>
                      <label>Latest Assessment</label>
                      <strong style={{color: "#64748b"}}>
                        {hasUnapproved ? "Awaiting Approval" : "—"}
                      </strong>
                    </>
                  );
                }
              })()}
            </div>
          </div>

          {/* List */}
          <div className="sm2-myassess-list">
            <div className="sm2-myassess-head">
              {["Period","Date","Score Scale","Category","Assessed By","Status",""].map(h =>
                <span key={h}>{h}</span>)}
            </div>
            {history.map(sc => {
              const isApproved = ["Approved", "Completed"].includes(sc.approvalStatus);
              // Use AOM-approved category from DB if available, otherwise calculate locally
              const localCat = getCategory(sc.isOnlineExam ? sc.totalScore * 4 : sc.totalScore);
              const cat = (sc.isApproved && sc.dbCategory) ? sc.dbCategory : localCat;
              // Score display: for TI field evaluation always show out of 100
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
                      <span className="sm2-badge" style={{background:getCategoryBg(cat),color:getCategoryColor(cat)}}>
                        {sc.isOnlineExam ? "CBT Exam" : `Cat. ${cat}`}
                      </span>
                    ) : (
                      <span style={{ color: "#ea580c", fontSize: "12px", fontWeight: "600" }}>Awaiting Approval</span>
                    )}
                  </span>
                  <span style={{fontSize:11,color:"#64748b"}}>{sc.assessedBy || "TI_1001 (Traffic Inspector)"}</span>
                  <span>
                    <span className={`sm2-status-pill sm2-status-${(sc.approvalStatus || "approved").toLowerCase()}`}>{sc.approvalStatus || "Approved"}</span>
                  </span>
                  <span style={{color: isApproved ? "#2563eb" : "#94a3b8", fontSize:12, fontWeight:600}}>{isApproved ? "View Form" : "—"}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
