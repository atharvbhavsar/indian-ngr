import React from "react";
import { PerformanceTrendChart } from "../../../components/charts/PerformanceTrendChart";
import { useLanguage } from "../../../contexts/LanguageContext";

export function PointsmanProfile({
  history,
  fullName,
  profile,
  latestCategory,
  latestScore,
  latestOutOf,
  employeeId
}) {
  const { language, changeLanguage, t } = useLanguage();

  const personalScoreData = [...history]
    .filter(h => ["Approved", "Completed"].includes(h.approvalStatus))
    .reverse()
    .map(h => ({
      month: h.assessmentPeriod ? h.assessmentPeriod.replace(" 2026", "").replace(" 2025", "") : h.date,
      score: h.totalScore
    }));

  // Derive risk from category: A/B → Low, C → Medium, D → High
  const riskCategory = history.length > 0 ? latestCategory : (profile.currentCategory || profile.category || "A");
  const risk = !riskCategory || riskCategory === "Pending" || riskCategory === "Untested" || riskCategory === "—"
    ? "Untested"
    : riskCategory === "D" ? "High"
    : riskCategory === "C" ? "Medium"
    : "Low";

  return (
    <div className="sdom-fade">
      {/* Hero header */}
      <div className="sdom-station-header" style={{ marginBottom: 24 }}>
        <div className="sdom-station-header-meta">
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("Staff Profile")}</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{fullName}</div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{t(profile.designation)} &bull; {t(profile.stationName)} &bull; {t("Central Railway")}</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            {history.length === 0 ? (
              <>
                <span className={`sdom-badge ${
                  (profile.currentCategory || profile.category || "A") === "D" ? "sdom-badge-danger" : 
                  (profile.currentCategory || profile.category || "A") === "C" ? "sdom-badge-warning" : 
                  "sdom-badge-success"
                }`}>
                  {t("Category")} {profile.currentCategory || profile.category || "A"}
                </span>
                <span className="sdom-badge sdom-badge-warning">
                  {t("Pending First Assessment")}
                </span>
              </>
            ) : (latestCategory === "Pending" || latestCategory === "Awaiting Approval") ? (
              <span className="sdom-badge sdom-badge-warning">{t("Awaiting Approval")}</span>
            ) : latestCategory === "Untested" || !latestCategory || latestCategory === "—" ? (
              <span className="sdom-badge sdom-badge-warning">{t("Untested")}</span>
            ) : (
              <span className={`sdom-badge ${latestCategory === "D" ? "sdom-badge-danger" : latestCategory === "C" ? "sdom-badge-warning" : "sdom-badge-success"}`}>
                {t("Category")} {latestCategory}
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
            <span className="val">{history.length > 0 && latestScore !== null ? (latestScore === "Awaiting Approval" ? t("Awaiting Approval") : `${latestScore}/${latestOutOf}`) : (latestCategory === "Awaiting Approval" ? t("Awaiting Approval") : t("No Assessment Taken"))}</span>
            <span className="lbl">{t("Latest Score")}</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
          <div className="sdom-station-header-stat">
            <span className="val">{profile.mobileNumber}</span>
            <span className="lbl">{t("Contact")}</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
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
              [t("PF Number"), profile.pfNumber || "—"],
              [t("Designation"), t(profile.designation)],
              [t("Mobile Number"), profile.mobileNumber],
              [t("Email ID"), profile.email || `${(employeeId || "").toLowerCase()}@rail.in`],
              [t("Account Status"), t("Active")],
              [t("Current Zone"), t("Central Railway")],
              [t("Current Division"), t("Nagpur")],
              [t("Current Station Placement"), t(profile.stationName)],
              [t("Reporting Officer"), t(profile.reportingOfficer)]
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
              <div style={{ gridColumn: "span 2" }}><strong>{t("PME Status Check")}:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{t(profile.pmeStatus)}</div></div>
              <div style={{ gridColumn: "span 2" }}><strong>{t("Refresher Course Status")}:</strong><div style={{ fontWeight: 700, color: "#0d2c4d", marginTop: 4 }}>{t(profile.refStatus)}</div></div>
              <div style={{ gridColumn: "span 2" }}><strong>{t("Training Clearance")}:</strong><div style={{ fontWeight: 700, color: "#d97706", marginTop: 4 }}>{t(profile.trainingStatus)}</div></div>
            </div>
          </div>

          {/* User Preferences */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
              {t("User Preferences")}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{t("Language Preference")}</label>
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '240px'
                }}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">{t("Score Trend")}</div>
          <div className="sdom-chart-subtitle">{t("Your assessment score progression")}</div>
          <div style={{ height: 300, marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {history.length > 0 ? (
              <PerformanceTrendChart
                data={personalScoreData}
                xAxisKey="month"
                yAxisKey="score"
              />
            ) : (
              <div style={{ color: "#64748b", fontSize: "0.95rem", fontWeight: 600 }}>
                {t("No Assessment Records Found")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
