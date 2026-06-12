import React from "react";
import { Target, Gauge, ShieldCheck, Award, TrendingUp, BarChart2 } from "lucide-react";
import { getCategoryBg, getCategoryColor } from "../../../constants";
import { PerformanceTrendChart } from "../../../components/charts/PerformanceTrendChart";
import { CategoryDistributionChart } from "../../../components/charts/CategoryDistributionChart";
import { useLanguage } from "../../../contexts/LanguageContext";

export function PointsmanDashboard({
  latestScore,
  latestOutOf,
  averageScore,
  latestCategory,
  historyLength,
  trendData,
  pieData
}) {
  const { t } = useLanguage();

  return (
    <div className="pm-dashboard-layout">
      {/* Summary cards */}
      <div className="pm-summary-cards">
        <article className="pm-sum-card">
          <div className="pm-sum-icon" style={{ background: "#eff6ff" }}>
            <Target size={20} color="#2563eb" />
          </div>
          <div>
            <label>{t("Latest Score")}</label>
            <strong>{latestScore !== null ? (latestScore === "Awaiting Approval" ? t("Awaiting Approval") : `${latestScore}/${latestOutOf}`) : "—"}</strong>
          </div>
        </article>

        <article className="pm-sum-card">
          <div className="pm-sum-icon" style={{ background: "#f0fdf4" }}>
            <Gauge size={20} color="#16a34a" />
          </div>
          <div>
            <label>{t("Average Score")}</label>
            <strong>{Math.round(averageScore)}/100</strong>
          </div>
        </article>

        <article className="pm-sum-card">
          <div className="pm-sum-icon" style={{ background: getCategoryBg(latestCategory) }}>
            <ShieldCheck size={20} color={getCategoryColor(latestCategory)} />
          </div>
          <div>
            <label>{t("Current Category")}</label>
            <strong style={{ color: (latestCategory === "Pending" || latestCategory === "Awaiting Approval") ? "#d97706" : getCategoryColor(latestCategory) }}>
              {latestCategory === "Pending" || latestCategory === "Awaiting Approval" ? t(latestCategory) : (latestCategory !== "—" ? `${t("Category")} ${latestCategory}` : "—")}
            </strong>
          </div>
        </article>

        <article className="pm-sum-card">
          <div className="pm-sum-icon" style={{ background: "#fdf4ff" }}>
            <Award size={20} color="#9333ea" />
          </div>
          <div>
            <label>{t("Total Attempts")}</label>
            <strong>{historyLength}</strong>
          </div>
        </article>
      </div>

      <div className="pm-charts-row">
        {/* Performance Trends Chart using Shared Component */}
        <div className="pm-chart-card">
          <div className="pm-chart-header">
            <TrendingUp size={16} />
            <h3>{t("Assessment Performance Trend")}</h3>
          </div>
          {trendData.length === 0 ? (
            <p className="pm-empty-state">{t("No assessment history available yet.")}</p>
          ) : (
            <PerformanceTrendChart
              data={trendData}
              xAxisKey="date"
              yAxisKey="score"
            />
          )}
        </div>

        {/* Category Pie Chart using Shared Component */}
        <div className="pm-chart-card">
          <div className="pm-chart-header">
            <BarChart2 size={16} />
            <h3>{t("Category Grade Distribution")}</h3>
          </div>
          {pieData.length === 0 ? (
            <p className="pm-empty-state">{t("No data.")}</p>
          ) : (
            <CategoryDistributionChart
              data={pieData}
              colors={{
                "A": "#16a34a",
                "B": "#f59e0b",
                "C": "#ef4444",
                "D": "#b91c1c"
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
