import React from "react";
import { ArrowLeft } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Line } from "recharts";
import { ROLE_MAP } from "../../../utils/saConstants";
import { catBadge, riskBadge, statusBadge } from "../../../utils/saUtils";

export function SAStaffDetail({
  staffMember: s,
  view,
  setView,
  closeView
}) {
  const isUnassessed = s.totalAssessments === 0 || s.score === null || s.status === "Pending First Assessment";

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
    <div className="sdom-fade">
      <div style={{ marginBottom: 24 }}>
        <button className="sdom-back-btn" onClick={() => {
          if (view?.returnTo === "stationDetail") {
            setView({ type: "stationDetail", data: view.stationData });
          } else {
            closeView();
          }
        }}><ArrowLeft size={16} /> Back to List</button>
      </div>

      {/* Hero header */}
      <div className="sdom-station-header" style={{ marginBottom: 24 }}>
        <div className="sdom-station-header-meta">
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Profile</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>{s.name}</div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{ROLE_MAP[s.role] || s.role} &bull; {s.role === 'ti' || s.role === 'Traffic Inspector' ? `${s.division || "Various"} Division` : s.station} &bull; {s.zone || "Central Railway"}</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            {catBadge(s.cat)}
            {riskBadge(s.risk)}
            {statusBadge(s.status)}
          </div>
        </div>
        <div className="sdom-station-header-stats">
          <div className="sdom-station-header-stat">
            <span className="val">{isUnassessed ? "No Assessment Taken" : (s.score !== null && s.score !== undefined ? `${s.score}/100` : "—")}</span>
            <span className="lbl">Latest Score</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
          <div className="sdom-station-header-stat">
            <span className="val">{s.contact || "—"}</span>
            <span className="lbl">Contact</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }} />
          <div className="sdom-station-header-stat">
            <span className="val">{isUnassessed ? "No Assessment Taken" : (s.lastDate || "—")}</span>
            <span className="lbl">Last Assessment</span>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: "16px" }}>Personal & Professional Details</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', paddingBottom: '20px' }}>
            {[
              ["Employee ID / HRMS ID", s.id],
              ["PF Number", s.pfNumber || "—"],
              ["Designation", ROLE_MAP[s.role] || s.role],
              ["Mobile Number", s.contact || "N/A"],
              ["Email ID", s.email || `${s.id?.toLowerCase()}@rail.in`],
              ["Account Status", s.status || "Active"],
              ["Current Zone", s.zone || "Central Railway"],
              ["Current Division", s.division || "Nagpur"],
              ["Current Station Placement", s.role === 'ti' || s.role === 'Traffic Inspector' ? (s.jurisdiction || 'Various') : s.station],
              ["Reporting Officer", s.reportingAom || "P. K. Verma (Sr. DOM)"]
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Operational Specifications (styled exactly like AOmModule) */}
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
                <div><strong>Operational Station:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.smStation || s.station || "N/A"}</div></div>
                <div><strong>Operational Division:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.smDivision || s.division || "Nagpur"}</div></div>
                <div><strong>Operational Zone:</strong><div style={{ fontWeight: 700, color: "#065f46", marginTop: 4 }}>{s.smZone || s.zone || "Central Railway"}</div></div>
              </div>
            )}

            {s.role === "ti" && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                <div><strong>Jurisdiction Division:</strong><div style={{ fontWeight: 700, color: "#92400e", marginTop: 4 }}>{s.division || "Nagpur Division"}</div></div>
                <div><strong>Reporting AOM Officer:</strong><div style={{ fontWeight: 700, color: "#92400e", marginTop: 4 }}>{s.reportingAom || "P. K. Verma (Sr. DOM)"}</div></div>
                <div style={{ gridColumn: 'span 3', marginTop: '6px' }}><strong>Linked Stations under supervision:</strong><div style={{ fontWeight: 700, color: "#92400e", marginTop: 4 }}>{s.jurisdiction || "None"}</div></div>
              </div>
            )}

            {s.role === "tm" && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                <div><strong>Crew Depot:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.workLocation || "Nagpur Depot"}</div></div>
                <div><strong>Assigned Section Beats:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.reportingSm || "NGP-BSL Section"}</div></div>
                <div><strong>Assigned Shift Beat Type:</strong><div style={{ fontWeight: 700, color: "#6b21a8", marginTop: 4 }}>{s.shift || "Goods Train Beat"}</div></div>
              </div>
            )}

            {!["pointsmen", "sm", "ss", "ti", "tm"].includes(s.role) && (
              <span style={{ fontSize: '13px', color: '#64748b' }}>No dynamic operational specifications required for this designation.</span>
            )}
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Score Trend</div>
          <div className="sdom-chart-subtitle">Assessment score progression</div>
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
            {scoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <RTooltip />
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
}
