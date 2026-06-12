import React, { useState } from "react";
import { Plus, Edit, ArrowRightLeft, Trash2 } from "lucide-react";
import { TI_OPTS, ROLE_MAP } from "../../../utils/saConstants";
import { catBadge, riskBadge, statusBadge } from "../../../utils/saUtils";

export function SARoleDirectory({ 
  roleKey, 
  title, 
  staff, 
  STATION_OPTS, 
  openAdd, 
  openEdit, 
  openShift, 
  removeStaff, 
  openView 
}) {
  const [roleF, setRoleF] = useState({ name:"", station:"All", ti:"All", cat:"All", risk:"All" });

  const targetRoleName = ROLE_MAP[roleKey] || roleKey;

  const filtered = staff.filter(s =>
    (s.role === targetRoleName || s.role === roleKey) &&
    (roleF.station === "All" || s.station === roleF.station) &&
    (roleF.ti      === "All" || s.ti      === roleF.ti)      &&
    (roleF.cat     === "All" || s.cat     === roleF.cat)     &&
    (roleF.risk    === "All" || s.risk    === roleF.risk)    &&
    (!roleF.name || s.name.toLowerCase().includes(roleF.name.toLowerCase()) ||
                    s.id.toLowerCase().includes(roleF.name.toLowerCase()))
  );

  return (
    <div className="sdom-fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h1 className="sdom-page-title">{title} Management</h1>
          <p className="sdom-page-subtitle">Search, filter and manage all {title.toLowerCase()}s in the division.</p>
        </div>
        <button className="sdom-btn-primary" onClick={() => openAdd(roleKey)}>
          <Plus size={16}/> Add New {title}
        </button>
      </div>

      {/* Filters */}
      <div className="sdom-filter-bar">
        <div className="sdom-filter-field" style={{minWidth:200}}>
          <label>Name / ID</label>
          <input value={roleF.name} onChange={e=>setRoleF(p=>({...p,name:e.target.value}))} placeholder="Search..." />
        </div>
        <div className="sdom-filter-field">
          <label>Station</label>
          <select value={roleF.station} onChange={e=>setRoleF(p=>({...p,station:e.target.value}))}>
            {STATION_OPTS.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="sdom-filter-field">
          <label>TI Area</label>
          <select value={roleF.ti} onChange={e=>setRoleF(p=>({...p,ti:e.target.value}))}>
            {TI_OPTS.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="sdom-filter-field">
          <label>Category</label>
          <select value={roleF.cat} onChange={e=>setRoleF(p=>({...p,cat:e.target.value}))}>
            <option>All</option><option>A</option><option>B</option><option>C</option><option>D</option>
          </select>
        </div>
        <div className="sdom-filter-field">
          <label>Risk Level</label>
          <select value={roleF.risk} onChange={e=>setRoleF(p=>({...p,risk:e.target.value}))}>
            <option>All</option><option>Low</option><option>Medium</option><option>High</option>
          </select>
        </div>
      </div>

      <div className="sdom-chart-card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{fontWeight:700,color:"#1e293b"}}>{filtered.length} staff found</span>
        </div>
        <div className="sdom-table-wrap">
          <table className="sdom-table">
            <thead>
              <tr><th>Name</th><th>Emp ID</th><th>Station</th><th>TI Area</th><th>Category</th><th>Risk</th><th>Last Score</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No records found</td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id}>
                  <td style={{fontWeight:700}}>{s.name}</td>
                  <td style={{color:"#64748b",fontSize:"0.85rem"}}>{s.id}</td>
                  <td>{s.role === 'ti' || s.role === 'Traffic Inspector' ? (s.jurisdiction || 'Various') : s.station}</td>
                  <td>{s.ti}</td>
                  <td>{catBadge(s.cat)}</td>
                  <td>{riskBadge(s.risk)}</td>
                  <td style={{fontWeight:700}}>{s.score ?? "—"}</td>
                  <td>{statusBadge(s.status)}</td>
                  <td>
                    <div style={{display:"flex",gap:8}}>
                      <button className="sdom-btn-outline" style={{padding:"5px 10px",fontSize:"0.8rem"}} onClick={()=>openView("staffDetail",s)}>View</button>
                      <button className="sdom-icon-btn" title="Edit" onClick={()=>openEdit(s)}><Edit size={15} color="#2563eb"/></button>
                      <button className="sdom-icon-btn" title="Shift Role" onClick={()=>openShift(s)}><ArrowRightLeft size={15} color="#d97706"/></button>
                      <button className="sdom-icon-btn" title="Remove" onClick={()=>removeStaff(s.id)}><Trash2 size={15} color="#dc2626"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
