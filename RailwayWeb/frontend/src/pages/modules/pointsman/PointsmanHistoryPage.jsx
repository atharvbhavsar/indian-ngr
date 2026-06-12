import React from "react";
import { Search, ArrowUpDown, ClipboardList, Award, TrendingUp, ShieldCheck } from "lucide-react";
import { getCategory, getCategoryBg, getCategoryColor } from "../../../constants";
import { useLanguage } from "../../../contexts/LanguageContext";

export function PointsmanHistoryPage({
  history,
  filteredHistory,
  historyPage, setHistoryPage,
  historyDateSearch, setHistoryDateSearch,
  historySortOrder, setHistorySortOrder,
  openScorecard
}) {
  const { t } = useLanguage();

  // Top summary statistics calculated reactively:
  const approvedHistory = history.filter(h => ["Approved", "Completed"].includes(h.approvalStatus));
  const latestApprovedAttempt = history.find(h => ["Approved", "Completed"].includes(h.approvalStatus));
  const hasUnapproved = history.some(h => ["Submitted", "Pending"].includes(h.approvalStatus));

  const totalAssessments = history.length;
  const latestScore = latestApprovedAttempt ? latestApprovedAttempt.totalScore : null;
  const averageScore = approvedHistory.length
    ? Math.round(approvedHistory.reduce((s, i) => s + (i.isOnlineExam ? (i.totalScore / 25) * 100 : i.totalScore), 0) / approvedHistory.length)
    : 0;
  const latestPct = latestApprovedAttempt ? (latestApprovedAttempt.isOnlineExam ? (latestScore / 25) * 100 : latestScore) : 0;
  const latestCategory = latestApprovedAttempt
    ? (latestApprovedAttempt.category || getCategory(latestPct))
    : (hasUnapproved ? "Awaiting Approval" : "—");

  // Paginated history list
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const currentPage = Math.min(historyPage, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="pm-page-card animate-fade-in">
      <div className="pm-page-header">
        <h2>{t("Periodic Evaluation Archive")}</h2>
      </div>
      <p className="pm-subtitle">{t("Historical ledger of standard Pointsman CBT safety competency trials.")}</p>

      {/* 4 Premium High-Fidelity Analytics Cards (Station Master Alignment) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ background: "#eff6ff", color: "#2563eb", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ClipboardList size={20} />
          </div>
          <div>
            <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("Total Assessments")}</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{totalAssessments} {t("Attempts")}</div>
          </div>
        </div>

        <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ background: "#f0fdf4", color: "#16a34a", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("Latest Score")}</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
              {latestApprovedAttempt ? `${latestScore}/${latestApprovedAttempt.isOnlineExam ? 25 : 100}` : (hasUnapproved ? t("Awaiting Approval") : "—")}
            </div>
          </div>
        </div>

        <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ background: "#fff7ed", color: "#ea580c", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("Average Score")}</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{averageScore}/100</div>
          </div>
        </div>

        <div className="sdom-summary-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ background: getCategoryBg(latestCategory), color: getCategoryColor(latestCategory), width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("Latest Category")}</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: getCategoryColor(latestCategory), marginTop: "2px" }}>
              {latestCategory !== "—" && latestCategory !== "Awaiting Approval" ? `${t("Cat.")} ${latestCategory}` : latestCategory}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Sort Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "20px", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", width: "320px" }}>
          <Search size={15} color="#64748b" />
          <input
            type="text"
            placeholder={t("Search by period (e.g. April 2026)")}
            value={historyDateSearch}
            onChange={e => { setHistoryDateSearch(e.target.value); setHistoryPage(1); }}
            style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", color: "#334155" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px" }}>
          <ArrowUpDown size={14} color="#64748b" />
          <select 
            value={historySortOrder} 
            onChange={e => { setHistorySortOrder(e.target.value); setHistoryPage(1); }}
            style={{ border: "none", outline: "none", fontSize: "13px", color: "#334155", fontWeight: "600", cursor: "pointer" }}
          >
            <option value="date-desc">{t("Newest Attempt First")}</option>
            <option value="date-asc">{t("Oldest Attempt First")}</option>
            <option value="score-desc">{t("Highest Score First")}</option>
            <option value="score-asc">{t("Lowest Score First")}</option>
          </select>
        </div>
      </div>

      {/* Search empty state */}
      {filteredHistory.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 16px", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
          <Search size={36} color="#94a3b8" style={{ marginBottom: "12px" }} />
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#475569", margin: "0 0 6px" }}>{t("No attempts found")}</h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{t("Try clearing your search query or sorting filters.")}</p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("Attempt No.")}</th>
                <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("Period")}</th>
                <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("Assessment Date")}</th>
                <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("Score")}</th>
                <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("Category")}</th>
                <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("Assessed By")}</th>
                <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: "700", color: "#475569" }}>{t("Status")}</th>
                <th style={{ padding: "14px 18px", textAlign: "right", fontWeight: "700", color: "#475569" }}>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.map((record, index) => {
                const absoluteIdx = filteredHistory.length - (startIndex + index);
                const isApproved = ["Approved", "Completed"].includes(record.approvalStatus);
                const cat = isApproved ? (record.category || getCategory(record.isOnlineExam ? (record.totalScore / 25) * 100 : record.totalScore)) : "—";
                const outOf = record.isOnlineExam ? 25 : 100;
                const scoreDisplay = isApproved ? `${record.totalScore} / ${outOf}` : "Awaiting Approval";
                return (
                  <tr key={record.id} className="sdom-table-row-hover" style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}>
                    <td style={{ padding: "14px 18px", fontWeight: "700", color: "#1e3a8a" }}>#{absoluteIdx}</td>
                    <td style={{ padding: "14px 18px", fontWeight: "600", color: "#334155" }}>{t(record.assessmentPeriod)}</td>
                    <td style={{ padding: "14px 18px", color: "#64748b" }}>{record.date}</td>
                    <td style={{ padding: "14px 18px", fontWeight: "800", color: "#0f172a" }}>{scoreDisplay}</td>
                    <td style={{ padding: "14px 18px" }}>
                      {isApproved ? (
                        <span style={{ background: getCategoryBg(cat), color: getCategoryColor(cat), fontWeight: "800", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", textTransform: "uppercase" }}>{t("Cat.")} {cat}</span>
                      ) : (
                        <span style={{ color: "#ea580c", fontSize: "12px", fontWeight: "600" }}>{t("Awaiting Approval")}</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#334155", fontWeight: "500" }}>{t(record.assessedBy || "S. Deshmukh (SM)")}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{
                        background: isApproved ? "#dcfce7" : "#fffbeb",
                        color: isApproved ? "#15803d" : "#b45309",
                        fontWeight: "700",
                        fontSize: "11px",
                        padding: "4px 8px",
                        borderRadius: "20px",
                        textTransform: "uppercase"
                      }}>
                        {t(record.approvalStatus || "Approved")}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button 
                        disabled={!isApproved}
                        onClick={() => isApproved && openScorecard(record)}
                        style={{ 
                          background: isApproved ? "#eff6ff" : "#f1f5f9", 
                          color: isApproved ? "#2563eb" : "#94a3b8", 
                          border: "none", 
                          fontWeight: "700", 
                          padding: "6px 14px", 
                          borderRadius: "6px", 
                          cursor: isApproved ? "pointer" : "not-allowed", 
                          fontSize: "12.5px",
                          transition: "all 0.15s ease" 
                        }}
                      >
                        {isApproved ? t("View Form") : "—"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                {t("Showing")} <b>{startIndex + 1}</b> {t("to")} <b>{Math.min(startIndex + itemsPerPage, filteredHistory.length)}</b> {t("of")} <b>{filteredHistory.length}</b> {t("attempts")}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#ffffff", color: currentPage === 1 ? "#94a3b8" : "#334155", fontWeight: "600", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "12.5px" }}
                >
                  {t("Previous")}
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#ffffff", color: currentPage === totalPages ? "#94a3b8" : "#334155", fontWeight: "600", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "12.5px" }}
                >
                  {t("Next")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
