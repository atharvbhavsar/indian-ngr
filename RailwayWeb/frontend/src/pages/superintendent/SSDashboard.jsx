import React from 'react';
import { Target, Gauge, ShieldCheck, Award, TrendingUp, BarChart2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getCategoryColor, getCategoryBg } from '../../utils/ssUtils';

const PIE_COLORS = { A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#dc2626" };

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#ffffff", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <p style={{ margin: 0, fontWeight: 700, color: "#1e293b", fontSize: "12px" }}>Category {payload[0].name}</p>
        <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "11px" }}>{payload[0].payload.count} Assessments ({payload[0].value}%)</p>
      </div>
    );
  }
  return null;
};

export default function SSDashboard({
  setActiveNav,
  latestScore,
  averageScore,
  latestCategory,
  history,
  trendData,
  pieData,
  performanceSummaryText
}) {
  return (
    <div className="pm-dashboard-layout">
      {/* Summary cards */}
      <div className="pm-summary-cards">
        <article className="pm-sum-card" onClick={() => setActiveNav("myAssessment")} style={{ cursor: "pointer" }}>
          <div className="pm-sum-icon" style={{ background: "#eff6ff" }}>
            <Target size={20} color="#2563eb" />
          </div>
          <div>
            <label>Latest Score</label>
            <strong>{latestScore !== null ? (latestScore === "Awaiting Approval" || String(latestScore).includes("/") ? latestScore : `${latestScore}/100`) : "—"}</strong>
          </div>
        </article>

        <article className="pm-sum-card" onClick={() => setActiveNav("myAssessment")} style={{ cursor: "pointer" }}>
          <div className="pm-sum-icon" style={{ background: "#f0fdf4" }}>
            <Gauge size={20} color="#16a34a" />
          </div>
          <div>
            <label>Average Score</label>
            <strong>{averageScore}/100</strong>
          </div>
        </article>

        <article className="pm-sum-card" onClick={() => setActiveNav("myAssessment")} style={{ cursor: "pointer" }}>
          <div className="pm-sum-icon" style={{ background: getCategoryBg(latestCategory) }}>
            <ShieldCheck size={20} color={getCategoryColor(latestCategory)} />
          </div>
          <div>
            <label>Current Category</label>
            <strong style={{ color: getCategoryColor(latestCategory) }}>
              {latestCategory !== "—" ? (latestCategory.includes("Awaiting") ? latestCategory : `Category ${latestCategory}`) : "—"}
            </strong>
          </div>
        </article>

        <article className="pm-sum-card" onClick={() => setActiveNav("myAssessment")} style={{ cursor: "pointer" }}>
          <div className="pm-sum-icon" style={{ background: "#fdf4ff" }}>
            <Award size={20} color="#9333ea" />
          </div>
          <div>
            <label>Total Attempts</label>
            <strong>{history.length}</strong>
          </div>
        </article>
      </div>

      <div className="pm-charts-row">
        {/* Performance Trends Chart */}
        <div className="pm-chart-card">
          <div className="pm-chart-header">
            <TrendingUp size={16} />
            <h3>Assessment Performance Trend</h3>
          </div>
          {trendData.length === 0 ? (
            <p className="pm-empty-state">No assessments completed yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }}
                  formatter={(v) => [`${v}/100`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#2563eb", strokeWidth: 0 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="pm-chart-card">
          <div className="pm-chart-header">
            <BarChart2 size={16} />
            <h3>Category Grade Distribution</h3>
          </div>
          {pieData.length === 0 ? (
            <p className="pm-empty-state">No assessment data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
