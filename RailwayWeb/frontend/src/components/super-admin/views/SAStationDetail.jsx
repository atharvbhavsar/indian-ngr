import React from "react";
import { ArrowLeft } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Cell, LabelList, PieChart, Pie, Legend, LineChart, Line, Bar } from "recharts";
import { CAT_COLORS, RISK_COLORS } from "../../../utils/saConstants";
import { catBadge, riskBadge, statusBadge } from "../../../utils/saUtils";

export function SAStationDetail({ st, staff, closeView, setView }) {
  const isStationMatch = (stationA, stationB) => {
    if (!stationA || !stationB) return false;
    const a = stationA.toLowerCase().trim();
    const b = stationB.toLowerCase().trim();
    if (a === b) return true;
    const clean = s => s.replace(/\s+/g, '').replace(/junction|central|main|town|jn|station/gi, '');
    return clean(a) === clean(b) || clean(a).includes(clean(b)) || clean(b).includes(clean(a));
  };

  const stStaff    = staff.filter(s => isStationMatch(s.station, st.name));
  const pmList     = stStaff.filter(s => s.role === "pointsmen" || s.role === "Pointsman");
  const smList     = stStaff.filter(s => s.role === "sm" || s.role === "Station Master");
  const tiPerson = staff.find(s => 
    (s.role === "ti" || s.role === "Traffic Inspector") && 
    ((s.linkedStations || s.jurisdiction || "")
      .split(",")
      .map(x => x.trim().toLowerCase())
      .includes(st.name.toLowerCase()) || 
     (st.assignedTi && (s.id === st.assignedTi || s.user_id === st.assignedTi)))
  ) || { name: st.ti, id: "—", contact: "—", cat: "—" };

  const catCount = ["A","B","C","D"].map(c => ({ cat:`Cat ${c}`, count: stStaff.filter(s=> (s.cat || s.category) === c).length, fill:CAT_COLORS[c] }));
  const riskCount = [
    { name:"Low",    value: stStaff.filter(s=>s.risk==="Low").length,    fill:"#16a34a" },
    { name:"Medium", value: stStaff.filter(s=>s.risk==="Medium").length, fill:"#f59e0b" },
    { name:"High",   value: stStaff.filter(s=>s.risk==="High").length,   fill:"#ef4444" },
  ].filter(r=>r.value>0);

  const monthlyTrendList = [
    { month: "Dec'25" }, { month: "Jan'26" }, { month: "Feb'26" }, { month: "Mar'26" }, { month: "Apr'26" }, { month: "May'26" }
  ];
  const trend = monthlyTrendList.map(m=>({...m, score: st.score || 0, safety: st.safety || 0}));

  return (
    <div className="sdom-fade">
      <div style={{marginBottom:20}}>
        <button className="sdom-back-btn" onClick={closeView}><ArrowLeft size={16}/> Back to Stations</button>
      </div>

      {/* Station Hero */}
      <div className="sdom-station-header">
        <div className="sdom-station-header-meta">
          <div style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.6)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Station Analytics Dashboard</div>
          <div style={{fontSize:"1.9rem",fontWeight:800,marginBottom:4}}>{st.name}</div>
          <div style={{fontSize:"0.9rem",color:"rgba(255,255,255,0.7)"}}>Code: <b>{st.code}</b> &bull; Assigned TI: <b>{st.ti}</b></div>
          <div style={{marginTop:12,display:"flex",gap:10}}>
            <span className="sdom-badge" style={{background:"rgba(255,255,255,0.15)",color:"#fff"}}>{st.smCount} Station Masters</span>
            <span className="sdom-badge" style={{background:"rgba(255,255,255,0.15)",color:"#fff"}}>{st.pmCount} Pointsmen</span>
            <span className={`sdom-badge ${st.highRisk > 4 ? "sdom-badge-red" : "sdom-badge-green"}`}>{st.highRisk} High-Risk</span>
          </div>
        </div>
        <div className="sdom-station-header-stats">
          <div className="sdom-station-header-stat">
            <span className="val">{st.score}</span>
            <span className="lbl">Avg Score</span>
          </div>
          <div style={{width:1,height:60,background:"rgba(255,255,255,0.15)"}}/>
          <div className="sdom-station-header-stat">
            <span className="val">{st.safety}%</span>
            <span className="lbl">Safety</span>
          </div>
          <div style={{width:1,height:60,background:"rgba(255,255,255,0.15)"}}/>
          <div className="sdom-station-header-stat">
            <span className="val">{st.pending}</span>
            <span className="lbl">Pending</span>
          </div>
          <div style={{width:1,height:60,background:"rgba(255,255,255,0.15)"}}/>
          <div className="sdom-station-header-stat">
            <span className="val">{stStaff.length}</span>
            <span className="lbl">Total Staff</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16,marginBottom:24}}>
        {[
          { label:"Total Staff",         val: stStaff.length },
          { label:"Pending Assessments", val: st.pending },
          { label:"Completed",           val: stStaff.filter(s=>s.status==="Approved").length },
          { label:"High-Risk Pointsmen", val: pmList.filter(s=>s.risk==="High").length },
          { label:"Safety Compliance",   val:`${st.safety}%` },
        ].map(c => (
          <div key={c.label} className="sdom-stat-card">
            <div className="sdom-stat-value">{c.val}</div>
            <div className="sdom-stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="sdom-row-2">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Category Distribution</div>
          <div className="sdom-chart-subtitle">A/B/C/D breakdown of staff at this station</div>
          <div style={{height:260}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catCount} barSize={46} margin={{top:16,right:24,left:0,bottom:8}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC"/>
                <XAxis dataKey="cat" fontSize={12} tick={{fill:"#102A43",fontWeight:600}} axisLine={false} tickLine={false}/>
                <YAxis fontSize={11} tick={{fill:"#627D98"}} axisLine={false} tickLine={false}/>
                <RTooltip contentStyle={{fontSize:"0.85rem",borderRadius:6,border:"1px solid #D9E2EC"}} cursor={{fill:"rgba(0,0,0,0.03)"}}/>
                <Bar dataKey="count" radius={[5,5,0,0]}>
                  {catCount.map((d,i)=><Cell key={i} fill={CAT_COLORS[Object.keys(CAT_COLORS)[i]]}/>)}
                  <LabelList dataKey="count" position="top" style={{fontSize:12,fontWeight:700,fill:"#102A43"}}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Risk Distribution</div>
          <div className="sdom-chart-subtitle">Staff risk level breakdown at this station</div>
          <div style={{height:260}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskCount} cx="50%" cy="50%" innerRadius={70} outerRadius={105}
                     dataKey="value" paddingAngle={4}
                     label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}
                     labelLine={false}>
                  {riskCount.map((d,i)=><Cell key={i} fill={RISK_COLORS[d.name]}/>)}
                </Pie>
                <Legend wrapperStyle={{fontSize:"0.82rem"}}/>
                <RTooltip contentStyle={{fontSize:"0.85rem",borderRadius:6,border:"1px solid #D9E2EC"}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="sdom-row-1">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title">Score & Safety Trend (Last 6 Months)</div>
          <div className="sdom-chart-subtitle">Monthly performance tracking for this station</div>
          <div style={{height:260}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{top:10,right:30,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E2EC"/>
                <XAxis dataKey="month" fontSize={12} tick={{fill:"#627D98"}} axisLine={false} tickLine={false}/>
                <YAxis domain={[50,100]} fontSize={11} tick={{fill:"#627D98"}} axisLine={false} tickLine={false}/>
                <RTooltip contentStyle={{fontSize:"0.85rem",borderRadius:6,border:"1px solid #D9E2EC"}}/>
                <Legend wrapperStyle={{fontSize:"0.82rem"}}/>
                <Line type="monotone" dataKey="score" name="Avg Score" stroke="#1E3A5F" strokeWidth={2.5} dot={{r:4,fill:"#1E3A5F"}}/>
                <Line type="monotone" dataKey="safety" name="Safety %" stroke="#2F855A" strokeWidth={2.5} strokeDasharray="5 3" dot={{r:4,fill:"#2F855A"}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Station Masters */}
      <div className="sdom-row-1">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{marginBottom:16}}>Station Masters</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead><tr><th>Name</th><th>HRMS ID</th><th>Category</th><th>Last Score</th><th>Last Assessment</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {smList.length === 0 && <tr><td colSpan={7} style={{textAlign:"center",color:"#94a3b8",padding:24}}>No Station Masters assigned</td></tr>}
                {smList.map(s=>(
                  <tr key={s.id}>
                    <td style={{fontWeight:700}}>{s.name}</td>
                    <td style={{color:"#64748b",fontSize:"0.85rem"}}>{s.id}</td>
                    <td>{catBadge(s.cat)}</td>
                    <td style={{fontWeight:700}}>{s.score ?? "—"}</td>
                    <td>{s.lastDate}</td>
                    <td>{statusBadge(s.status)}</td>
                    <td><button className="sdom-btn-ghost" onClick={()=>setView({ type: "staffDetail", data: s, returnTo: "stationDetail", stationData: st })}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pointsmen */}
      <div className="sdom-row-1">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{marginBottom:16}}>Pointsmen</div>
          <div className="sdom-table-wrap">
            <table className="sdom-table">
              <thead><tr><th>Name</th><th>HRMS ID</th><th>Category</th><th>Risk Level</th><th>Latest Score</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {pmList.length === 0 && <tr><td colSpan={7} style={{textAlign:"center",color:"#94a3b8",padding:24}}>No Pointsmen assigned</td></tr>}
                {pmList.map(s=>(
                  <tr key={s.id}>
                    <td style={{fontWeight:700}}>{s.name}</td>
                    <td style={{color:"#64748b",fontSize:"0.85rem"}}>{s.id}</td>
                    <td>{catBadge(s.cat)}</td>
                    <td>{riskBadge(s.risk)}</td>
                    <td style={{fontWeight:700}}>{s.score ?? "—"}</td>
                    <td>{statusBadge(s.status)}</td>
                    <td><button className="sdom-btn-ghost" onClick={()=>setView({ type: "staffDetail", data: s, returnTo: "stationDetail", stationData: st })}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TI Card */}
      <div className="sdom-row-1">
        <div className="sdom-chart-card">
          <div className="sdom-chart-title" style={{marginBottom:16}}>Assigned Traffic Inspector</div>
          <div className="sdom-ti-card">
            <div>
              <div style={{fontSize:"1.2rem",fontWeight:800,color:"#1e3a5f",marginBottom:4}}>{tiPerson.name}</div>
              <div style={{color:"#4b6a9b",fontSize:"0.9rem",marginBottom:8}}>Traffic Inspector &bull; {st.ti}</div>
              <div style={{display:"flex",gap:16}}>
                <span style={{fontSize:"0.85rem",color:"#64748b"}}><b>ID:</b> {tiPerson.id}</span>
                <span style={{fontSize:"0.85rem",color:"#64748b"}}><b>Contact:</b> {tiPerson.contact}</span>
              </div>
            </div>
            <button 
              className="sdom-btn-outline" 
              disabled={!tiPerson.role}
              style={!tiPerson.role ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              onClick={() => tiPerson.role && setView({ type: "staffDetail", data: tiPerson, returnTo: "stationDetail", stationData: st })}
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
