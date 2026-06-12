import React from 'react';
import { ArrowLeft, Edit, ArrowUpDown, FileBarChart2 } from 'lucide-react';
import { catBadge, statusBadge, riskBadge, getCat, getUserRisk } from '../../utils/ssUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ROLE_MAP = {
  pointsmen: "Pointsman",
  Pointsman: "Pointsman",
  sm: "Station Master",
  "Station Master": "Station Master",
  ss: "Station Superintendent",
  "Station Superintendent": "Station Superintendent",
  tm: "Train Manager",
  "Train Manager": "Train Manager",
  ti: "Traffic Inspector",
  "Traffic Inspector": "Traffic Inspector"
};

const MONTHLY_TREND = [
  { month: "Dec'25", score: 81, safety: 80 },
  { month: "Jan'26", score: 83, safety: 82 },
  { month: "Feb'26", score: 85, safety: 85 },
  { month: "Mar'26", score: 87, safety: 88 },
  { month: "Apr'26", score: 89, safety: 91 },
  { month: "May'26", score: 91, safety: 94 }
];

export default function SSStaffDetail({
  s,
  setView,
  handleEditUser,
  setTransferringUser
}) {
  // RENDER BODY

  const computedRisk = getUserRisk(s);
  const isUnassessed = s.totalAssessments === 0 || s.score === null || s.score === undefined || s.status === "Pending First Assessment" || s.approvalStatus === "Pending First Assessment";

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  const pmAssessments = (s.history || [])
    .filter(a => a.score != null)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let scoreData = [];
  if (pmAssessments.length > 0) {
    scoreData = pmAssessments.map(a => ({
      month: formatMonthYear(a.date),
      score: a.score,
      date: a.date
    }));
  } else {
    const baseScore = s.score;
    if (baseScore) {
      scoreData = [
        { month: "Dec'25", score: Math.max(50, baseScore - 6) },
        { month: "Jan'26", score: Math.max(50, baseScore - 4) },
        { month: "Feb'26", score: Math.max(50, baseScore - 2) },
        { month: "Mar'26", score: Math.max(50, baseScore) }
      ];
    }
  }

  return (
    <div className="sdom-fade animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <button className="sdom-back-btn" onClick={() => {
          setView(null);
        }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 700 }}>
          <ArrowLeft size={16} /> Back to List
        </button>
      </div>

      <div className="sdom-station-header" style={{ marginBottom: 24 }}>
        <div className="sdom-station-header-meta">
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Profile</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{ROLE_MAP[s.role] || s.role} &bull; {s.station} &bull; {s.zone || "Central Railway"}</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            {catBadge(s.cat || getCat(s.score))}
            {riskBadge(computedRisk)}
            {statusBadge(s.status || s.approvalStatus || "Active")}
          </div>
        </div>
        <div className="sdom-station-header-stats">
          <div className="sdom-station-header-stat">
            <span className="val">{isUnassessed ? "No Assessment Taken" : (s.score !== null && s.score !== undefined ? `${s.score}%` : "—")}</span>
            <span className="lbl">Latest Score</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
          <div className="sdom-station-header-stat">
            <span className="val">{s.contact || "—"}</span>
            <span className="lbl">Contact</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
          <div className="sdom-station-header-stat">
            <span className="val">{isUnassessed ? "No Assessment Taken" : (s.lastAssessDate || s.lastDate || "—")}</span>
            <span className="lbl">Last Assessment</span>
          </div>
        </div>
      </div>

      <div className="sdom-row-2">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>Personal &amp; Professional Details</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', paddingBottom: '20px' }}>
            {[
              ["Employee ID / HRMS ID", s.id],
              ["PF Number", s.pfNumber || "—"],
              ["Designation", ROLE_MAP[s.role] || s.role],
              ["Mobile Number", s.contact || "N/A"],
              ["Email ID", s.email || `${s.id?.toLowerCase()}@rail.in`],
              ["Account Status", s.status || "Active"],
              ["Current Zone", s.zone || "Central Railway"],
              ["Current Division", s.division || "Nagpur Division"],
              ["Current Station Placement", s.station],
              ["Reporting Officer", s.reportingAom || "TI R. Khan (Safety)"]
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* AOM Parity: Operational Specifications */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
              Operational Profile Specifications
            </h4>

            {(s.role === "Pointsman" || s.role === "pointsmen") && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                <div><strong>Reporting Station Master:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.reportingSm || "S. Deshmukh (SM)"}</div></div>
                <div><strong>Assigned Shift:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.shift || "Morning Shift (06:00 - 14:00)"}</div></div>
                <div><strong>Work Location Setup:</strong><div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: 4 }}>{s.workLocation || "Yard Area"}</div></div>
              </div>
            )}

            {(s.role === "Station Master" || s.role === "sm" || s.role === "Station Superintendent" || s.role === "ss") && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                <div><strong>Operational Station:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.station || "N/A"}</div></div>
                <div><strong>Operational Division:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.division || "Nagpur Division"}</div></div>
                <div><strong>Operational Zone:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.zone || "Central Railway"}</div></div>
              </div>
            )}

            {(s.role === "Train Manager" || s.role === "tm") && (
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
          <div className="sdom-chart-subtitle">Monthly performance tracking for this employee</div>
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
            {scoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis domain={[40, 100]} fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#64748b", fontSize: "0.95rem", fontWeight: 600, fontStyle: "italic" }}>
                No Assessment Records Found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
