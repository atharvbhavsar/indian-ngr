import React from 'react';
import { UserCircle2, Clock, ShieldCheck, FileText, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';
import { getCategory } from '../../utils/ssUtils';

export default function SSProfile({
  fullName,
  employeeId,
  stationSuperintendentProfile,
  profileSubTab,
  setProfileSubTab,
  history,
  activityLogs,
  latestCategory,
  latestScore,
  user = {}
}) {
  const { t } = useLanguage();

  // RENDER BODY

  const personalScoreData = [...history].reverse().map(h => ({
    month: h.assessmentPeriod.replace(" 2026", "").replace(" 2025", ""),
    score: h.totalScore
  }));

  // Fallbacks to stationSuperintendentProfile fields for offline/local sandbox consistency
  const fallbackDesignation = user.role || stationSuperintendentProfile.designation;
  const fallbackMobile = user.mobile || user.contact || stationSuperintendentProfile.mobileNumber;
  const fallbackEmail = user.email || `${(employeeId || "").toLowerCase()}@rail.in`;
  const fallbackZone = user.zone || "Central Railway";
  const fallbackDivision = user.division || "Nagpur";
  const fallbackStation = user.station || stationSuperintendentProfile.stationName;
  const fallbackReporting = user.reportingSm || stationSuperintendentProfile.reportingOfficer;
  const fallbackPmeDone = user.pmeDoneDate || user.pmeDate || "2024-10-16";
  const fallbackPmeDue = user.pmeDueDate || "2028-10-15";
  const fallbackRefDone = user.refDoneDate || user.refresherDate || "2024-04-13";
  const fallbackRefDue = user.refDueDate || user.refresherDueDate || "2027-04-12";
  const fallbackTraining = user.refStatus || user.trainingStatus || stationSuperintendentProfile.trainingStatus;

  const latestApproved = (history || []).find(h => ["Approved", "Completed", "Submitted", "Pending"].includes(h.approvalStatus));
  const scoreVal = (user.score !== undefined && user.score !== null && user.score !== 0) ? user.score : (latestApproved?.totalScore || (latestScore && !String(latestScore).includes("—") ? parseInt(latestScore) : null));
  const computedCategory = latestApproved?.category || (scoreVal ? getCategory(scoreVal) : null);
  const category = (user.category && user.category !== "Untested") ? user.category : ((user.cat && user.cat !== "Untested") ? user.cat : ((latestCategory && latestCategory !== "—" && latestCategory !== "Untested" && !latestCategory.includes("Awaiting")) ? latestCategory : (computedCategory || null))) || "Untested";

  // Derive risk from category: A/B → Low, C → Medium, D → High
  const riskCategory = history.length > 0 ? category : (user.category || user.cat || "A");
  const risk = riskCategory === "Untested" ? "Untested" : riskCategory === "D" ? "High" : riskCategory === "C" ? "Medium" : "Low";

  return (
    <div className="sdom-fade">
      {/* Hero header */}
      <div className="sdom-station-header" style={{ marginBottom: 24 }}>
        <div className="sdom-station-header-meta">
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("Staff Profile")}</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{fullName}</div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{t(fallbackDesignation)} &bull; {t(fallbackStation)} &bull; {t(fallbackZone)}</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            {history.length === 0 ? (
              <>
                <span className={`sdom-badge ${
                  (user.category || user.cat || "A") === "D" ? "sdom-badge-danger" : 
                  (user.category || user.cat || "A") === "C" ? "sdom-badge-warning" : 
                  "sdom-badge-success"
                }`}>
                  {t("Category")} {user.category || user.cat || "A"}
                </span>
                <span className="sdom-badge sdom-badge-warning">
                  {t("Pending First Assessment")}
                </span>
              </>
            ) : (!category || category.includes("Awaiting")) ? (
              <span className="sdom-badge sdom-badge-warning">{t("Awaiting Approval")}</span>
            ) : (
              <span className={`sdom-badge ${category === "D" ? "sdom-badge-danger" : category === "C" ? "sdom-badge-warning" : "sdom-badge-success"}`}>
                {t("Category")} {category}
              </span>
            )}
            {risk === "Untested" ? (
              <span className="sdom-badge" style={{ background: "#f3f4f6", color: "#4b5563" }}>{t("Untested")}</span>
            ) : (
              <span className={`sdom-badge ${risk === "High" ? "sdom-badge-danger" : risk === "Medium" ? "sdom-badge-warning" : "sdom-badge-success"}`}>
                {t(risk)} {t("Risk")}
              </span>
            )}
            <span className="sdom-badge sdom-badge-success">{t("Active")}</span>
          </div>
        </div>
        <div className="sdom-station-header-stats">
          <div className="sdom-station-header-stat">
            <span className="val">{history.length > 0 && scoreVal !== null ? `${scoreVal}/100` : t("No Assessment Taken")}</span>
            <span className="lbl">{t("Latest Score")}</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }}/>
          <div className="sdom-station-header-stat">
            <span className="val">{fallbackMobile}</span>
            <span className="lbl">{t("Contact")}</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }}/>
          <div className="sdom-station-header-stat">
            <span className="val">{history.length ? history[0].date : t("No Assessment Taken")}</span>
            <span className="lbl">{t("Last Assessment")}</span>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="sdom-row-2" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>{t("Personal & Professional Details")}</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', paddingBottom: '20px' }}>
            {[
              [t("Employee ID / HRMS ID"), employeeId],
              [t("Designation"), t(fallbackDesignation)],
              [t("Mobile Number"), fallbackMobile],
              [t("Email ID"), fallbackEmail],
              [t("Account Status"), t("Active")],
              [t("Current Zone"), t(fallbackZone)],
              [t("Current Division"), t(fallbackDivision)],
              [t("Current Station Placement"), t(fallbackStation)],
              [t("Reporting Officer"), t(fallbackReporting)]
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
              {t("Operational & Safety Dates")}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', fontSize: '13px' }}>
              <div><strong>{t("PME Last Completed")}:</strong><div style={{fontWeight: 700, color: "#065f46", marginTop: 4}}>{fallbackPmeDone}</div></div>
              <div><strong>{t("PME Next Due")}:</strong><div style={{fontWeight: 700, color: "#991b1b", marginTop: 4}}>{fallbackPmeDue}</div></div>
              <div><strong>{t("Refresher Course Completed")}:</strong><div style={{fontWeight: 700, color: "#0d2c4d", marginTop: 4}}>{fallbackRefDone}</div></div>
              <div><strong>{t("Refresher Course Due")}:</strong><div style={{fontWeight: 700, color: "#0d2c4d", marginTop: 4}}>{fallbackRefDue}</div></div>
              <div style={{ gridColumn: "span 2" }}><strong>{t("Training Clearance")}:</strong><div style={{fontWeight: 700, color: "#d97706", marginTop: 4}}>{t(fallbackTraining)}</div></div>
            </div>
          </div>


        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">{t("Score Trend")}</div>
          <div className="sdom-chart-subtitle">{t("Your assessment score progression")}</div>
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={personalScoreData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="month" fontSize={11}/>
                  <YAxis domain={[40, 100]} fontSize={11}/>
                  <Tooltip/>
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }}/>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                {t("No Assessment Records Found")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
