import React from "react";

export function riskBadge(r) {
  const map = { Low:"sdom-badge-success", Medium:"sdom-badge-warning", High:"sdom-badge-danger" };
  return <span className={`sdom-badge ${map[r] || "sdom-badge-neutral"}`}>{r}</span>;
}

export function catBadge(c) {
  const map = { A:"sdom-badge-success", B:"sdom-badge-info", C:"sdom-badge-warning", D:"sdom-badge-danger" };
  return <span className={`sdom-badge ${map[c] || "sdom-badge-neutral"}`}>{c}</span>;
}

export function statusBadge(s) {
  const map = { Approved:"sdom-badge-success", Pending:"sdom-badge-warning", "Pending First Assessment":"sdom-badge-warning", Rejected:"sdom-badge-danger", Overdue:"sdom-badge-danger" };
  return <span className={`sdom-badge ${map[s] || "sdom-badge-neutral"}`}>{s}</span>;
}

export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="sdom-section-title">{children}</div>
      {sub && <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: -10 }}>{sub}</div>}
    </div>
  );
}
