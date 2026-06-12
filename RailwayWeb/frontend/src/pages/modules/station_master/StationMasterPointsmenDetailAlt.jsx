import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCat, riskLevel } from '../../../utils/scoreCalculator';
import { useLanguage } from '../../../contexts/LanguageContext';

export function StationMasterPointsmenDetailAlt(props) {
  const { t } = useLanguage();
  const {
    s,
    setViewingPm,
    smProfile,
    allDbAssessments
  } = props;

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
    : (s.lastScore || s.score ? `${s.lastScore || s.score}/100` : "—");

  const displayDate = lastAssessDateVal 
    ? lastAssessDateVal 
    : (s.lastAssessDate && s.lastAssessDate !== "No Assessment Taken" ? s.lastAssessDate : "No Assessment Taken");

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  const pmAssessments = (allDbAssessments || [])
    .filter(a => a.employee?.hrms_id === s.hrmsId && a.TEST_ATTEMPT?.[0]?.obtained_marks != null)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  let trendScores = [];
  if (pmAssessments.length > 0) {
    trendScores = pmAssessments.map(a => {
      const scoreVal = a.TEST_ATTEMPT?.[0]?.obtained_marks || 0;
      const dateStr = a.assessment_date || a.created_at;
      return {
        month: formatMonthYear(dateStr),
        score: scoreVal,
        date: dateStr ? new Date(dateStr).toISOString().slice(0, 10) : ""
      };
    });
  } else {
    // If they have no database assessments yet, we can check if they are untested.
    // If untested, trendScores should be empty so we show "No assessment history".
    // Otherwise, we can fall back to the mock progression for visual consistency if they have a mock score.
    const baseScore = s.lastScore || s.score;
    if (baseScore) {
      trendScores = [
        { month: "Dec 25", score: Math.max(50, baseScore - 6) },
        { month: "Jan 26", score: Math.max(50, baseScore - 4) },
        { month: "Feb 26", score: Math.max(50, baseScore - 2) },
        { month: "Mar 26", score: Math.max(50, baseScore + 1) },
        { month: "Apr 26", score: Math.max(50, baseScore + 2) },
        { month: "May 26", score: Math.max(50, baseScore) },
      ];
    } else {
      trendScores = [];
    }
  }

  const catMap = { A: "sdom-badge-success", B: "sdom-badge-info", C: "sdom-badge-warning", D: "sdom-badge-danger" };
  const pmRisk = riskLevel(s);
  const riskMap = { Low: "sdom-badge-success", Medium: "sdom-badge-warning", High: "sdom-badge-danger" };
  const catVal = s.cat || "Untested";

  return (
    <div className="sdom-fade">
      <div style={{ marginBottom: 24 }}>
        <button className="sdom-back-btn" onClick={() => setViewingPm(null)}>
          <ArrowLeft size={16} /> {t("Back to List")}
        </button>
      </div>

      {/* Hero header */}
      <div className="sdom-station-header" style={{ marginBottom: 24 }}>
        <div className="sdom-station-header-meta">
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("Staff Profile")}</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{t("Pointsman")} &bull; {t(s.station || smProfile.station)} &bull; {t("Central Railway")}</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <span className={`sdom-badge ${catMap[catVal] || "sdom-badge-neutral"}`}>{t("Category")} {catVal}</span>
            <span className={`sdom-badge ${riskMap[pmRisk] || "sdom-badge-neutral"}`}>{t(pmRisk)} {t("Risk")}</span>
            <span className="sdom-badge sdom-badge-success">{t("Active")}</span>
          </div>
        </div>
        <div className="sdom-station-header-stats">
          <div className="sdom-station-header-stat">
            <span className="val">{displayScore}</span>
            <span className="lbl">{t("Latest Score")}</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
          <div className="sdom-station-header-stat">
            <span className="val">{s.contact || "—"}</span>
            <span className="lbl">{t("Contact")}</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
          <div className="sdom-station-header-stat">
            <span className="val">{displayDate}</span>
            <span className="lbl">{t("Last Assessment")}</span>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>{t("Personal & Professional Details")}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 15, paddingBottom: 20 }}>
            {[
              [t("Employee ID / HRMS ID"), s.hrmsId],
              [t("Designation"), t(s.designation || "Pointsman")],
              [t("PF Number"), s.pfNumber || "—"],
              [t("Mobile Number"), s.contact || "N/A"],
              [t("Email ID"), s.email || `${s.hrmsId?.toLowerCase()}@rail.in`],
              [t("Account Status"), t("Active")],
              [t("Current Zone"), t("Central Railway")],
              [t("Current Division"), t("Nagpur")],
              [t("Current Station Placement"), t(s.station || smProfile.station)],
              [t("Reporting Officer"), t(smProfile.name || "Station Master")]
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Operational Specifications */}
          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0", marginTop: 10 }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#0f172a", fontWeight: 800, borderBottom: "1px solid #cbd5e1", paddingBottom: 6 }}>
              {t("Operational Profile Specifications")}
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontSize: 13 }}>
              <div><strong>{t("Reporting Station Master:")}</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{t(s.reportingSm || smProfile.name)}</div></div>
              <div><strong>{t("Assigned Shift:")}</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{t(s.shift || "Morning Shift (06:00 - 14:00)")}</div></div>
              <div><strong>{t("Work Location Setup:")}</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{t(s.workLocation || "Yard Area")}</div></div>
            </div>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">{t("Score Trend")}</div>
          <div className="sdom-chart-subtitle">{t("Assessment score progression")}</div>
          <div style={{ height: 300, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {trendScores.length === 0 ? (
              <div style={{ textAlign: "center", color: "#64748b", fontSize: "0.95rem", fontStyle: "italic" }}>
                {t("No assessment history available")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendScores}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
