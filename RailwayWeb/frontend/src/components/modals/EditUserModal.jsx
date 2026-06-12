import React from "react";
import { UserPlus } from "lucide-react";

export default function EditUserModal({
  editingUser,
  setEditingUser,
  saveEditedUser,
  myStations,
  stationMasters = []
}) {
  const [smSearchText, setSmSearchText] = React.useState(editingUser?.reportingSm || "");
  const [showSmDropdown, setShowSmDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    setSmSearchText(editingUser?.reportingSm || "");
  }, [editingUser?.reportingSm]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSmDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editingUser) return null;

  return (
    <div className="sdom-modal-overlay" onClick={e => e.target === e.currentTarget && setEditingUser(null)}>
      <div className="sdom-modal" style={{ width: "900px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
        <form onSubmit={saveEditedUser} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Header inside modal */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
            <div style={{
              background: "linear-gradient(135deg, #0d2c4d 0%, #1e40af 100%)",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(13, 44, 77, 0.2)",
              color: "#ffffff"
            }}>
              <UserPlus size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0d2c4d", letterSpacing: "-0.5px" }}>
                EDIT SYSTEM USER
              </h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                Role-Based Operational Staff Provisioning &amp; Management Console
              </p>
            </div>
          </div>

          {/* Section 1: General & Contact Information */}
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
              1. General &amp; Contact Information
            </h4>
            <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="sdom-modal-field">
                <label>Full Name *</label>
                <input
                  value={editingUser.name || ""}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="Enter full name (e.g. A. K. Sharma)"
                  required
                />
              </div>
              <div className="sdom-modal-field">
                <label>Mobile Number *</label>
                <input
                  value={editingUser.contact || ""}
                  onChange={e => setEditingUser({ ...editingUser, contact: e.target.value })}
                  placeholder="Enter 10-digit mobile number"
                  required
                />
              </div>
              <div className="sdom-modal-field">
                <label>HRMS ID / Employee ID *</label>
                <input
                  value={editingUser.id || ""}
                  disabled
                  style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                />
              </div>
              <div className="sdom-modal-field">
                <label>Email ID *</label>
                <input
                  value={editingUser.email || ""}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="Enter email address (e.g. user@rail.in)"
                  required
                />
              </div>
              <div className="sdom-modal-field">
                <label>PF Number *</label>
                <input
                  value={editingUser.pfNumber || ""}
                  onChange={e => setEditingUser({ ...editingUser, pfNumber: e.target.value })}
                  placeholder="Enter 12-digit PF Number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Designation & Station Placement Setup */}
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
              2. Designation &amp; Station Placement Setup
            </h4>
            <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="sdom-modal-field">
                <label>Role / Designation *</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value, designation: e.target.value })}
                  required
                >
                  <option value="Pointsman">Pointsman</option>
                  <option value="Station Master">Station Master</option>
                  <option value="Station Superintendent">Station Superintendent</option>
                  <option value="Train Manager">Train Manager</option>
                </select>
              </div>
              <div className="sdom-modal-field">
                <label>Station Name *</label>
                <select
                  value={editingUser.station}
                  onChange={e => setEditingUser({ ...editingUser, station: e.target.value })}
                  required
                >
                  {myStations.map(s => <option key={s.id || s.name} value={s.name}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="sdom-modal-field">
                <label>Safety Category *</label>
                <select
                  value={editingUser.category || "Untested"}
                  onChange={e => {
                    const catVal = e.target.value;
                    setEditingUser({ ...editingUser, category: catVal, cat: catVal });
                  }}
                  required
                >
                  <option value="Untested">Untested</option>
                  <option value="A">Category A</option>
                  <option value="B">Category B</option>
                  <option value="C">Category C</option>
                  <option value="D">Category D</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic Role-Based Custom Operational Profile */}
          {(editingUser.role === "Station Master" || editingUser.role === "Station Superintendent") && (
            <div style={{ padding: 18, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, marginBottom: 16 }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                {editingUser.role} Operational Setup
              </h4>
              <div style={{ height: '1px', backgroundColor: '#a7f3d0', marginBottom: '16px' }}></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>Operational Station *</label>
                  <select
                    value={editingUser.smStation || editingUser.station || ""}
                    onChange={e => setEditingUser({ ...editingUser, smStation: e.target.value, station: e.target.value })}
                  >
                    <option value="">Select Operational Station</option>
                    {myStations.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}



          {editingUser.role === "Train Manager" && (
            <div style={{ padding: 18, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10 }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b21a8', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                Train Manager Operational Setup
              </h4>
              <div style={{ height: '1px', backgroundColor: '#e9d5ff', marginBottom: '16px' }}></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>Crew Depot *</label>
                  <select
                    value={editingUser.workLocation || "Nagpur Depot"}
                    onChange={e => setEditingUser({ ...editingUser, workLocation: e.target.value })}
                  >
                    <option value="Nagpur Depot">Nagpur Depot</option>
                    <option value="Pune Depot">Pune Depot</option>
                    <option value="Mumbai Depot">Mumbai Depot</option>
                    <option value="Solapur Depot">Solapur Depot</option>
                    <option value="Bhusawal Depot">Bhusawal Depot</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="sdom-modal-actions" style={{ marginTop: 24 }}>
            <button className="sdom-btn-primary" type="submit" style={{ flex: 1 }}>
              🔒 UPDATE USER ACCOUNT
            </button>
            <button className="sdom-btn-ghost" type="button" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Cancel</button>
          </div>

        </form>
      </div>
    </div>
  );
}
