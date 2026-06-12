import React from 'react';
import { 
  Users, AlertTriangle, CheckCircle, Clock, Search, Filter, Calendar, X, Download, ArrowLeft, ArrowRight,
  TrendingUp, Activity, FileText, Lock, Plus, RefreshCw, Paperclip, Trash2, ShieldCheck, Gauge, Award, Target,
  ShieldAlert
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList } from 'recharts';
import { getCat, getCatColor, getCatBg, riskLevel, riskColor } from '../../../utils/scoreCalculator';
import { CustomTooltip } from '../../../components/charts/CustomTooltip';
import { useLanguage } from '../../../contexts/LanguageContext';

export function StationMasterDashboard(props) {
  const { t } = useLanguage();
  const {
    stats, pieData, lowPerformers,
    fullscreenChart, setFullscreenChart,
    fsSearch, setFsSearch,
    fsCategory, setFsCategory,
    fsRisk, setFsRisk,
    fsStartDate, setFsStartDate,
    fsEndDate, setFsEndDate,
    filteredFsPointsmen, dynamicMonthlyTrend,
    pmAssessmentHistory, pointsmen,
    smId, drafts, viewingStaff, setViewingStaff, setActiveTab, openPmDetail,
    user, stationSms = [], assignedTi = null, counsellingQueue = []
  } = props;

  // palettes
  const CAT_COLORS  = { A: "#1E3A5F", B: "#2B6CB0", C: "#D69E2E", D: "#C53030" };
  const RISK_COLORS = { Low: "#2F855A", Medium: "#D69E2E", High: "#C53030" };

  const tiSmListStr = localStorage.getItem("ti_sm_list");
  const smListState = tiSmListStr ? JSON.parse(tiSmListStr) : [];
  const myAssess = smListState.find(s => s.hrmsId === smId);
  const hasAssignedExam = myAssess && myAssess.status === "Exam Sent";

  // Dynamic Station parameters
  // Dynamic Station parameters
  const testedPointsmen = pointsmen.filter(p => p.cat && p.cat !== "Untested" && p.lastScore > 0);
  const avgScore = testedPointsmen.length ? Math.round(testedPointsmen.reduce((s, p) => s + (p.lastScore || 0), 0) / testedPointsmen.length) : 0;
  const testedForSafety = pointsmen.filter(p => p.cat && p.cat !== "Untested" && p.safetyScore !== null && p.safetyScore !== undefined);
  const safetyVal = testedForSafety.length ? Math.round(testedForSafety.reduce((s, p) => s + (p.safetyScore || 0), 0) / testedForSafety.length) : 0;

  const myStationObj = {
    name: user?.station || "No Station Assigned",
    code: user?.station ? user.station.slice(0, 3).toUpperCase() : "—",
    ti: assignedTi ? assignedTi.name : "No TI Assigned",
    smCount: stationSms.length || 1,
    pmCount: pointsmen.length,
    score: avgScore,
    safety: safetyVal,
    highRisk: pointsmen.filter(p => riskLevel(p) === "High").length,
    pending: pointsmen.filter(p => p.approvalStatus === "Pending").length
  };

  // calculate category distribution dynamically from pointsmen!
  const catCount = ["A", "B", "C", "D"].map(c => ({
    cat: `${t("Category")} ${c}`,
    count: pointsmen.filter(p => p.cat === c).length,
    fill: CAT_COLORS[c]
  }));

  // calculate risk distribution dynamically!
  const riskCount = [
    { name: t("Low"),    value: pointsmen.filter(p => riskLevel(p) === "Low").length,    fill: RISK_COLORS.Low },
    { name: t("Medium"), value: pointsmen.filter(p => riskLevel(p) === "Medium").length, fill: RISK_COLORS.Medium },
    { name: t("High"),   value: pointsmen.filter(p => riskLevel(p) === "High").length,   fill: RISK_COLORS.High },
  ].filter(r => r.value > 0);

  return (
    <div className="sdom-fade">

      {/* Station Hero */}
      <div className="sdom-station-header" style={{ marginBottom: "24px" }}>
        <div className="sdom-station-header-meta">
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("Station Analytics Dashboard")}</div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800, marginBottom: 4 }}>{t(myStationObj.name)}</div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{t("Code:")} <b>{myStationObj.code}</b> &bull; {t("Assigned TI:")} <b>{t(myStationObj.ti)}</b></div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <span className="sdom-badge" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>{myStationObj.smCount} {t("Station Masters")}</span>
            <span className="sdom-badge" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>{myStationObj.pmCount} {t("Pointsmen")}</span>
            <span className={`sdom-badge ${myStationObj.highRisk > 4 ? "sdom-badge-red" : "sdom-badge-green"}`}>{myStationObj.highRisk} {t("High-Risk")}</span>
          </div>
        </div>
        <div className="sdom-station-header-stats">
          <div className="sdom-station-header-stat">
            <span className="val">{myStationObj.score > 0 ? `${myStationObj.score}/100` : "—"}</span>
            <span className="lbl">{t("Avg Score")}</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }}/>
          <div className="sdom-station-header-stat">
            <span className="val">{myStationObj.safety > 0 ? `${myStationObj.safety}/100` : "—"}</span>
            <span className="lbl">{t("Safety")}</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }}/>
          <div className="sdom-station-header-stat">
            <span className="val">{myStationObj.pending}</span>
            <span className="lbl">{t("Pending")}</span>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.15)" }}/>
          <div className="sdom-station-header-stat">
            <span className="val">{myStationObj.smCount + pointsmen.length}</span>
            <span className="lbl">{t("Total Staff")}</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: t("Total Station Staff"),   val: myStationObj.smCount + pointsmen.length },
          { label: t("Pending First Assessment"), val: pointsmen.filter(p => p.approvalStatus === "Pending First Assessment" || p.totalAssessments === 0).length },
          { label: t("Not Attempted Employees"),  val: pointsmen.filter(p => p.totalAssessments === 0).length },
          { label: t("Assessment Due Employees"), val: pointsmen.filter(p => p.approvalStatus === "Pending" || p.pmeStatus === "Due" || p.refStatus === "Due").length },
          { label: t("Pending Approvals"),   val: myStationObj.pending },
          { label: t("Completed Evaluations"), val: pointsmen.length - pointsmen.filter(p => p.totalAssessments === 0).length },
          { label: t("High-Risk Pointsmen"),   val: myStationObj.highRisk },
          { label: t("Safety Compliance"),     val: myStationObj.safety > 0 ? `${myStationObj.safety}/100` : "—" },
        ].map(c => (
          <div key={c.label} className="sdom-stat-card">
            <div className="sdom-stat-value">{c.val}</div>
            <div className="sdom-stat-label">{c.label}</div>
          </div>
        ))}
      </div>



      {/* Charts */}
      <div className="sdom-row-2" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">{t("Category Distribution")}</div>
          <div className="sdom-chart-subtitle">{t("A/B/C/D breakdown of pointsmen at")} {t(myStationObj.name)}</div>
          <div style={{ height: 260 }}>
            {pointsmen.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catCount} barSize={46} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC"/>
                  <XAxis dataKey="cat" fontSize={12} tick={{ fill: "#102A43", fontWeight: 600 }} axisLine={false} tickLine={false}/>
                  <YAxis fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }} cursor={{ fill: "rgba(0,0,0,0.03)" }}/>
                  <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                    {catCount.map((d, i) => <Cell key={i} fill={CAT_COLORS[Object.keys(CAT_COLORS)[i]]}/>)}
                    <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#102A43" }}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "0.9rem" }}>
                {t("No pointsmen data available")}
              </div>
            )}
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">{t("Risk Distribution")}</div>
          <div className="sdom-chart-subtitle">{t("Pointsmen risk level breakdown at")} {t(myStationObj.name)}</div>
          <div style={{ height: 260 }}>
            {riskCount.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskCount} cx="50%" cy="50%" innerRadius={70} outerRadius={105}
                       dataKey="value" paddingAngle={4}
                       label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                       labelLine={false}>
                    {riskCount.map((d, i) => <Cell key={i} fill={RISK_COLORS[d.name]}/>)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: "0.82rem" }}/>
                  <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "0.9rem" }}>
                {t("No risk profile data available")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">{t("Score & Safety Trend (Last 6 Months)")}</div>
          <div className="sdom-chart-subtitle">{t("Monthly performance tracking for")} {t(myStationObj.name)}</div>
          <div style={{ height: 260 }}>
            {dynamicMonthlyTrend && dynamicMonthlyTrend.some(t => t.avgScore > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicMonthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC"/>
                  <XAxis dataKey="month" fontSize={12} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0, 100]} fontSize={11} tick={{ fill: "#627D98" }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ fontSize: "0.85rem", borderRadius: 6, border: "1px solid #D9E2EC" }}/>
                  <Legend wrapperStyle={{ fontSize: "0.82rem" }}/>
                  <Line type="monotone" dataKey="avgScore" name={t("Avg Score")} stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4, fill: "#1E3A5F" }}/>
                  <Line type="monotone" dataKey="safetyAvg" name={t("Safety Score")} stroke="#2F855A" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 4, fill: "#2F855A" }}/>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "0.9rem" }}>
                {t("No historical trend data available (Untested)")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Station Masters */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>{t("Station Masters")}</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>{t("Name")}</th>
                  <th>{t("HRMS ID")}</th>
                  <th>{t("Category")}</th>
                  <th>{t("Last Score")}</th>
                  <th>{t("Last Assessment")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Action")}</th>
                </tr>
              </thead>
              <tbody>
                {stationSms.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.name}</td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{s.hrmsId}</td>
                    <td>
                      {s.cat === "Untested" ? (
                        <span className="sdom-badge sdom-badge-warning">{t("Untested")}</span>
                      ) : (
                        <span className="sdom-badge sdom-badge-success">{t("Category")} {s.cat}</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{s.score > 0 ? `${s.score}/100` : "—"}</td>
                    <td>{s.lastDate}</td>
                    <td>
                      <span className="sdom-badge sdom-badge-success">{t(s.status)}</span>
                    </td>
                    <td>
                      <button className="sdom-btn-ghost" onClick={() => setViewingStaff({ ...s, reportingAom: "P. K. Verma (Sr. DOM)" })}>{t("View Details")}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pointsmen */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>{t("Pointsmen")}</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead>
                <tr>
                  <th>{t("Name")}</th>
                  <th>{t("HRMS ID")}</th>
                  <th>{t("Category")}</th>
                  <th>{t("Risk Level")}</th>
                  <th>{t("Latest Score")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Action")}</th>
                </tr>
              </thead>
              <tbody>
                {pointsmen.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                      {t("No pointsmen assigned to this station.")}
                    </td>
                  </tr>
                ) : (
                  pointsmen.map(p => {
                    const cat = p.cat || "Untested";
                    const risk = riskLevel(p);
                    const isPendingFirst = p.approvalStatus === "Pending First Assessment" || p.totalAssessments === 0;
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700 }}>{p.name}</td>
                        <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{p.hrmsId}</td>
                        <td>
                          {cat === "Untested" ? (
                            <span className="sdom-badge sdom-badge-neutral">{t("Untested")}</span>
                          ) : (
                            <span className={`sdom-badge ${cat === "A" ? "sdom-badge-success" : cat === "B" ? "sdom-badge-info" : cat === "C" ? "sdom-badge-warning" : "sdom-badge-danger"}`}>{cat}</span>
                          )}
                        </td>
                        <td>
                          {risk === "Untested" ? (
                            <span className="sdom-badge sdom-badge-neutral">{t("Untested")}</span>
                          ) : (
                            <span className={`sdom-badge ${risk === "Low" ? "sdom-badge-success" : risk === "Medium" ? "sdom-badge-warning" : "sdom-badge-danger"}`}>{t(risk)}</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 700 }}>{isPendingFirst ? t("No Assessment Taken") : (p.lastScore > 0 ? `${p.lastScore}/100` : "—")}</td>
                        <td>
                          <span className={`sdom-badge ${p.approvalStatus === "Approved" ? "sdom-badge-success" : (p.approvalStatus === "Pending" || p.approvalStatus === "Pending First Assessment") ? "sdom-badge-warning" : "sdom-badge-danger"}`}>{t(p.approvalStatus)}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button className="sdom-btn-ghost" onClick={() => setViewingStaff({ ...p, reportingAom: user?.name || "Station Master", email: p.email || `${p.hrmsId.toLowerCase()}@rail.in`, role: "pointsmen" })}>{t("Profile")}</button>
                            <button className="sdom-btn-ghost" style={{ color: "#2563eb" }} onClick={() => { openPmDetail(p); setActiveTab("pointsmen"); }}>{t("Monitor")}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TI Card */}
      <div className="sdom-row-1" style={{ marginBottom: "24px" }}>
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{ marginBottom: 16 }}>{t("Assigned Traffic Inspector")}</div>
          {assignedTi ? (
            <div className="sdom-ti-card">
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e3a5f", marginBottom: 4 }}>{assignedTi.name}</div>
                <div style={{ color: "#4b6a9b", fontSize: "0.9rem", marginBottom: 8 }}>{t("Traffic Inspector")} &bull; {t(myStationObj.name)}</div>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}><b>{t("ID:")}</b> {assignedTi.id}</span>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}><b>{t("Contact:")}</b> {assignedTi.contact}</span>
                </div>
              </div>
              <button className="sdom-btn-outline" onClick={() => setViewingStaff({ ...assignedTi, hrmsId: assignedTi.id, role: "ti", reportingAom: "P. K. Verma (Sr. DOM)" })}>{t("View Profile")}</button>
            </div>
          ) : (
            <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1", color: "#64748b", textAlign: "center" }}>
              {t("No Traffic Inspector assigned to this station.")}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Staff Profile Modal */}
      {viewingStaff && (
        <div className="sdom-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setViewingStaff(null)}>
          <div className="sdom-modal" style={{ width: "650px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0B1F3A" }}>{t("Detailed Staff Card")}</h3>
              <button type="button" onClick={() => setViewingStaff(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
            </div>

            <div className="sdom-station-header" style={{ marginBottom: "20px", padding: "16px" }}>
              <div className="sdom-station-header-meta">
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{t("Staff Profile")}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 2 }}>{viewingStaff.name}</div>
                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>{t(viewingStaff.role === "sm" || viewingStaff.role === "Station Master" ? "Station Master" : viewingStaff.role === "ti" || viewingStaff.role === "Traffic Inspector" ? "Traffic Inspector" : "Pointsman")} &bull; {viewingStaff.hrmsId || viewingStaff.id}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
              {(() => {
                const fields = [
                  [t("Employee ID / HRMS ID"), viewingStaff.hrmsId || viewingStaff.id],
                  [t("Designation"), t(viewingStaff.role === "sm" || viewingStaff.role === "Station Master" ? "Station Master" : viewingStaff.role === "ti" || viewingStaff.role === "Traffic Inspector" ? "Traffic Inspector" : "Pointsman")],
                  [t("Contact Number"), viewingStaff.contact || viewingStaff.mobile || "—"],
                  [t("Email ID"), viewingStaff.email || `${(viewingStaff.hrmsId || viewingStaff.id).toLowerCase()}@rail.in`],
                  [t("Current Station Placement"), t(viewingStaff.station || user?.station || "—")],
                  [t("Reporting Officer"), t(viewingStaff.reportingAom || user?.name || "—")],
                  [t("Operational Zone"), t(viewingStaff.zone || "Central Railway")],
                  [t("Operational Division"), t(viewingStaff.division || "Nagpur")]
                ];
                const isPm = viewingStaff.role === "pointsmen" || viewingStaff.role === "Pointsman" || viewingStaff.role === "pointsman";
                if (isPm) {
                  const isPendingFirst = viewingStaff.approvalStatus === "Pending First Assessment" || viewingStaff.totalAssessments === 0;
                  fields.push([t("Category"), viewingStaff.cat || viewingStaff.category || "—"]);
                  fields.push([t("Assessment Status"), t(viewingStaff.approvalStatus || "Pending First Assessment")]);
                  fields.push([
                    t("Latest Score"),
                    isPendingFirst ? t("No Assessment Taken") : (viewingStaff.lastScore > 0 ? `${viewingStaff.lastScore}/100` : "—")
                  ]);
                }
                return fields.map(([lbl, val]) => (
                  <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.85rem" }}>{val}</div>
                  </div>
                ));
              })()}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="sdom-btn-primary" onClick={() => setViewingStaff(null)}>{t("Close Profile")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
