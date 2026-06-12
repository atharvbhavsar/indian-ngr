import React from "react";
import { UserPlus } from "lucide-react";

export default function AddUserModal({
  showAddUserModal,
  setShowAddUserModal,
  newUserData,
  setNewUserData,
  handleAddUserSubmit,
  myStations,
  stationMasters = []
}) {
  const [smSearchText, setSmSearchText] = React.useState(newUserData.reportingSm || "");
  const [showSmDropdown, setShowSmDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    setSmSearchText(newUserData.reportingSm || "");
  }, [newUserData.reportingSm]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSmDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!showAddUserModal) return null;

  return (
    <div className="sdom-modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddUserModal(false)}>
      <div className="sdom-modal" style={{ width: "900px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
        <form onSubmit={handleAddUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

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
                ADD NEW SYSTEM USER
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
                  value={newUserData.name || ""}
                  onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="Enter full name (e.g. A. K. Sharma)"
                  required
                />
              </div>
              <div className="sdom-modal-field">
                <label>Mobile Number *</label>
                <input
                  value={newUserData.contact || ""}
                  onChange={e => setNewUserData({ ...newUserData, contact: e.target.value })}
                  placeholder="Enter 10-digit mobile number"
                  required
                />
              </div>
              <div className="sdom-modal-field">
                <label>HRMS ID / Employee ID *</label>
                <input
                  value={newUserData.id || ""}
                  onChange={e => setNewUserData({ ...newUserData, id: e.target.value })}
                  placeholder="Enter unique ID (e.g. PM_8820)"
                  required
                />
              </div>
              <div className="sdom-modal-field">
                <label>Email ID *</label>
                <input
                  value={newUserData.email || ""}
                  onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="Enter email address (e.g. user@rail.in)"
                  required
                />
              </div>
              <div className="sdom-modal-field">
                <label>PF Number *</label>
                <input
                  value={newUserData.pfNumber || ""}
                  onChange={e => setNewUserData({ ...newUserData, pfNumber: e.target.value })}
                  placeholder="Enter 12-digit PF Number"
                  required
                />
              </div>
              <div className="sdom-modal-field">
                <label>Password *</label>
                <input
                  type="password"
                  value={newUserData.password || ""}
                  onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Enter initial password"
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
                  value={newUserData.role}
                  onChange={e => {
                    const selectedRole = e.target.value;
                    const defaultDesig = selectedRole === "Pointsman" ? "Pointsman Grade I" : selectedRole;
                    setNewUserData({ ...newUserData, role: selectedRole, designation: defaultDesig });
                  }}
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
                  value={newUserData.station}
                  onChange={e => setNewUserData({ ...newUserData, station: e.target.value })}
                  required
                >
                  {myStations.map(s => <option key={s.id || s.name} value={s.name}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="sdom-modal-field">
                <label>Joining Date *</label>
                <input
                  type="date"
                  value={newUserData.joiningDate || ""}
                  onChange={e => setNewUserData({ ...newUserData, joiningDate: e.target.value })}
                  required
                />
              </div>
              <div className="sdom-modal-field">
                <label>Safety Category *</label>
                <select
                  value={newUserData.category || "Untested"}
                  onChange={e => setNewUserData({ ...newUserData, category: e.target.value })}
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
          {(newUserData.role === "Station Master" || newUserData.role === "Station Superintendent") && (
            <div style={{ padding: 18, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, marginBottom: 16 }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                {newUserData.role} Operational Setup
              </h4>
              <div style={{ height: '1px', backgroundColor: '#a7f3d0', marginBottom: '16px' }}></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>Operational Station *</label>
                  <select
                    value={newUserData.smStation || newUserData.station || ""}
                    onChange={e => setNewUserData({ ...newUserData, smStation: e.target.value, station: e.target.value })}
                  >
                    <option value="">Select Operational Station</option>
                    {myStations.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}



          {newUserData.role === "Train Manager" && (
            <div style={{ padding: 18, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10 }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b21a8', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                Train Manager Operational Setup
              </h4>
              <div style={{ height: '1px', backgroundColor: '#e9d5ff', marginBottom: '16px' }}></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>Crew Depot *</label>
                  <select
                    value={newUserData.workLocation || "Nagpur Depot"}
                    onChange={e => setNewUserData({ ...newUserData, workLocation: e.target.value })}
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
              👤 ADD USER ACCOUNT
            </button>
            <button className="sdom-btn-ghost" type="button" style={{ flex: 1 }} onClick={() => setShowAddUserModal(false)}>Cancel</button>
          </div>

        </form>
      </div>
    </div>
  );
}
