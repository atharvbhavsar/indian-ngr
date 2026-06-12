import React, { useMemo } from "react";
import { Building2, Users, UserRound, UserCheck, TrainFront, ShieldCheck } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Legend, Bar } from "recharts";

import { CAT_COLORS } from "../../../utils/saConstants";
import { SummaryCard, ComplianceCard } from "../SACards";
import { StationTable } from "../SATables";
import {
  StationProgressChart, StationScoreChart, RoleDistributionChart,
  CategoryDistributionChart, PerformanceTrendChart
} from "../SACharts";

export function SADashboard({ staff, stations, handleChartClick, handlePieClick }) {
  const stationProgressData = useMemo(() => {
    return stations.map(s => ({
      station: s.name,
      completed: s.pmCount || 0,
      pending: s.pending || 0
    })).slice(0, 15);
  }, [stations]);

  const stationAverageScoreData = useMemo(() => {
    return stations.map(s => ({
      station: s.name,
      avgScore: s.score || 80
    })).slice(0, 15);
  }, [stations]);

  const complianceList = useMemo(() => {
    if (staff.length === 0) {
      return [
        { label: "Overall Safety Compliance", pct: 100, color: "#16a34a" },
        { label: "PME Completion Rate", pct: 100, color: "#2563eb" },
        { label: "REF Completion Rate", pct: 100, color: "#7c3aed" },
        { label: "Incident Reporting Compliance", pct: 100, color: "#0891b2" },
        { label: "Disciplinary Clean Record", pct: 100, color: "#16a34a" },
      ];
    }
    const overallSafety = Math.round((staff.filter(s => s.risk === "Low").length / staff.length) * 100);
    const pmeRate = Math.round((staff.filter(s => s.risk !== "High").length / staff.length) * 100);
    const refRate = Math.round((staff.filter(s => s.score >= 70).length / staff.length) * 100);
    const incidentRate = Math.round((staff.filter(s => s.score >= 60).length / staff.length) * 100);
    const disciplinaryRate = Math.round((staff.filter(s => s.status === "Approved").length / staff.length) * 100);

    return [
      { label: "Overall Safety Compliance", pct: overallSafety, color: "#16a34a" },
      { label: "PME Completion Rate", pct: pmeRate, color: "#2563eb" },
      { label: "REF Completion Rate", pct: refRate, color: "#7c3aed" },
      { label: "Incident Reporting Compliance", pct: incidentRate, color: "#0891b2" },
      { label: "Disciplinary Clean Record", pct: disciplinaryRate, color: "#16a34a" },
    ];
  }, [staff]);

  const assessmentMonthlyList = useMemo(() => {
    if (staff.length === 0) {
      return [
        { month: "Nov", approved: 0, pending: 0, rejected: 0, overdue: 0 },
        { month: "Dec", approved: 0, pending: 0, rejected: 0, overdue: 0 },
        { month: "Jan", approved: 0, pending: 0, rejected: 0, overdue: 0 },
        { month: "Feb", approved: 0, pending: 0, rejected: 0, overdue: 0 },
        { month: "Mar", approved: 0, pending: 0, rejected: 0, overdue: 0 },
        { month: "Apr", approved: 0, pending: 0, rejected: 0, overdue: 0 },
      ];
    }
    const approved = staff.filter(s => s.status === "Approved").length;
    const pending = staff.filter(s => s.status === "Pending").length;
    const rejected = staff.filter(s => s.status === "Rejected").length;
    const overdue = staff.filter(s => s.status === "Overdue" || s.risk === "High").length;

    return [
      { month: "Nov", approved: approved, pending: pending, rejected: rejected, overdue: overdue },
      { month: "Dec", approved: approved, pending: pending, rejected: rejected, overdue: overdue },
      { month: "Jan", approved: approved, pending: pending, rejected: rejected, overdue: overdue },
      { month: "Feb", approved: approved, pending: pending, rejected: rejected, overdue: overdue },
    ];
  }, [staff]);

  const monthlyTrendList = useMemo(() => {
    if (staff.length === 0) {
      return [
        { month: "Dec'25", score: 80, safety: 80 },
        { month: "Jan'26", score: 80, safety: 80 },
        { month: "Feb'26", score: 80, safety: 80 },
        { month: "Mar'26", score: 80, safety: 80 },
        { month: "Apr'26", score: 80, safety: 80 },
        { month: "May'26", score: 80, safety: 80 },
      ];
    }
    const avgScore = Math.round(staff.reduce((acc, curr) => acc + (curr.score || 0), 0) / (staff.filter(s => s.score > 0).length || 1));
    const avgSafety = Math.round(staff.reduce((acc, curr) => acc + (curr.score || 0), 0) / (staff.filter(s => s.score > 0).length || 1));

    return [
      { month: "Dec'25", score: avgScore, safety: avgSafety },
      { month: "Jan'26", score: avgScore, safety: avgSafety },
      { month: "Feb'26", score: avgScore, safety: avgSafety },
      { month: "Mar'26", score: avgScore, safety: avgSafety },
    ];
  }, [staff]);

  const counts = {
    stations:  stations.length,
    pointsmen: staff.filter(s=>s.role==="pointsmen").length,
    sm:        staff.filter(s=>s.role==="sm").length,
    ss:        staff.filter(s=>s.role==="ss").length,
    tm:        staff.filter(s=>s.role==="tm").length,
    ti:        staff.filter(s=>s.role==="ti").length,
  };

  const summaryCards = [
    { id:"stations",  label:"Stations",                count: counts.stations,  sub:"Total in Nagpur Division",   icon:<Building2 size={18}/>,  color:"#1E3A5F" },
    { id:"pointsmen", label:"Pointsmen",               count: counts.pointsmen, sub:"Operational pointsmen",       icon:<Users size={18}/>,      color:"#1E3A5F" },
    { id:"sm",        label:"Station Masters",         count: counts.sm,        sub:"Across all stations",         icon:<UserRound size={18}/>,  color:"#1E3A5F" },
    { id:"ss",        label:"Station Superintendents", count: counts.ss,        sub:"Division supervisors",        icon:<UserCheck size={18}/>,  color:"#1E3A5F" },
    { id:"tm",        label:"Train Managers",          count: counts.tm,        sub:"Active train managers",       icon:<TrainFront size={18}/>, color:"#1E3A5F" },
    { id:"ti",        label:"Traffic Inspectors",      count: counts.ti,        sub:"Jurisdiction coverage",       icon:<ShieldCheck size={18}/>,color:"#1E3A5F" },
  ];

  const roleBar = [
    { role:"Pointsmen",              count: counts.pointsmen },
    { role:"Station Masters",        count: counts.sm },
    { role:"Station Superintendents",count: counts.ss },
    { role:"Train Managers",         count: counts.tm },
    { role:"Traffic Inspectors",     count: counts.ti },
  ];

  const catData = ["A","B","C","D"].map(c => ({
    name: `Cat ${c}`, value: staff.filter(s=>s.cat===c).length, fill: CAT_COLORS[c]
  }));

  const top10    = [...stations].sort((a,b) => b.score - a.score).slice(0,10);
  const bottom10 = [...stations].sort((a,b) => a.score - b.score).slice(0,10);

  const pipeline = useMemo(() => {
    const approved = staff.filter(s => s.status === "Approved").length;
    const pending = staff.filter(s => s.status === "Pending").length;
    const rejected = staff.filter(s => s.status === "Rejected").length;
    const overdue = staff.filter(s => s.status === "Overdue" || s.risk === "High").length;
    const pendingFirst = staff.filter(s => s.status === "Pending First Assessment" || s.totalAssessments === 0).length;
    const notAttempted = staff.filter(s => s.totalAssessments === 0).length;
    const dueCount = staff.filter(s => s.status === "Pending" || s.status === "Overdue" || s.pmeStatus === "Due" || s.refStatus === "Due").length;
    return [
      { label:"Approved", count: approved, dot:"#1E3A5F" },
      { label:"Pending",  count: pending,  dot:"#4A90D9" },
      { label:"Rejected", count: rejected,   dot:"#B83A3A" },
      { label:"Overdue",  count: overdue,   dot:"#5A6B7C" },
      { label:"Pending First Assessment", count: pendingFirst, dot:"#D69E2E" },
      { label:"Not Attempted", count: notAttempted, dot:"#64748b" },
      { label:"Assessment Due", count: dueCount, dot:"#ca8a04" }
    ];
  }, [staff]);

  return (
    <div className="sdom-fade">
      {/* Page header */}
      <h1 className="sdom-page-title">Nagpur Division Command Center</h1>
      <p className="sdom-page-subtitle">Complete strategic overview of the division — staff, performance, safety and assessment pipeline.</p>

      {/* ── Summary Cards ── */}
      <div className="sdom-summary-cards">
        {summaryCards.map(c => <SummaryCard key={c.id} {...c} />)}
      </div>

      {/* ── Station-wise Evaluation Progress & Average Score at the Top ── */}
      <div className="sdom-row-2">
        <StationProgressChart data={stationProgressData} onChartClick={handleChartClick} />
        <StationScoreChart data={stationAverageScoreData} onChartClick={handleChartClick} />
      </div>

      {/* ── Role-wise Distribution ── */}
      <div className="sdom-row-1">
        <RoleDistributionChart data={roleBar} />
      </div>

      {/* ── Category + Safety ── */}
      <div className="sdom-row-2">
        <CategoryDistributionChart data={catData} onPieClick={handlePieClick} />
        <ComplianceCard
          title="Safety Compliance Analytics"
          subtitle="Division-wide compliance across all categories"
          complianceList={complianceList}
        />
      </div>

      {/* ── Score Trend ── */}
      <div className="sdom-row-1">
        <PerformanceTrendChart data={monthlyTrendList} />
      </div>

      {/* ── Station Performance Top/Bottom ── */}
      <div className="sdom-row-2">
        <StationTable
          title="Top 10 Performing Stations"
          subtitle="Sorted by average assessment score"
          stations={top10}
        />
        <StationTable
          title="Bottom 10 — Stations Needing Attention"
          subtitle="Sorted by average assessment score (ascending)"
          stations={bottom10}
        />
      </div>

      {/* ── Assessment Pipeline ── */}
      <div className="sdom-row-1">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Assessment Pipeline</div>
          <div className="sdom-chart-subtitle">Current assessment status and monthly trend</div>
          <div className="sdom-pipeline-row">
            {pipeline.map(p => (
              <div className="sdom-pipeline-card" key={p.label}>
                <div className="sdom-pipeline-dot" style={{background:p.dot}} />
                <div>
                  <div className="sdom-pipeline-lbl">{p.label}</div>
                  <div className="sdom-pipeline-val">{p.count.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 280, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assessmentMonthlyList} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC" />
                <XAxis dataKey="month" fontSize={12} tick={{fill:"#627D98"}} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{fill:"#627D98"}} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{fontSize:"0.85rem",borderRadius:6,border:"1px solid #D9E2EC"}} />
                <Legend wrapperStyle={{fontSize:"0.82rem"}} />
                <Bar dataKey="approved" name="Approved" fill="#1E3A5F" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="pending"  name="Pending"  fill="#4A90D9" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#B83A3A" barSize={12} radius={[2, 2, 0, 0]} />
                <Bar dataKey="overdue"  name="Overdue"  fill="#5A6B7C" barSize={12} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
