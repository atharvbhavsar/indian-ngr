import React from 'react';
import { UserPlus } from 'lucide-react';

export default function SSModals({
  editingUser,
  setEditingUser,
  saveEditedUser,
  transferringUser,
  setTransferringUser,
  transferStation,
  setTransferStation,
  confirmTransfer,
  myStations,
  showAddUserModal,
  setShowAddUserModal,
  newUserData,
  setNewUserData,
  handleAddUserSubmit
}) {
  const renderEditUserModal = () => (
    <div className="sdom-modal-overlay" onClick={e => e.target === e.currentTarget && setEditingUser(null)}>
      <div className="sdom-modal" style={{ width: "900px", maxWidth: "95vw" }}>
        <form onSubmit={saveEditedUser} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                Role-Based Operational Staff Provisioning & Management Console
              </p>
            </div>
          </div>

          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
              1. General & Contact Information
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
                  placeholder="Enter unique ID" 
                />
              </div>
              <div className="sdom-modal-field">
                <label>Email ID *</label>
                <input 
                  value={editingUser.email || ""} 
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} 
                  placeholder="Enter email address (e.g. user@rail.in)" 
                />
              </div>
              <div className="sdom-modal-field">
                <label>PF Number *</label>
                <input 
                  value={editingUser.pfNumber || ""} 
                  onChange={e => setEditingUser({ ...editingUser, pfNumber: e.target.value })} 
                  placeholder="Enter PF Number" 
                />
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
              2. Designation & Station Placement Setup
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
                  {myStations.map(s => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="sdom-modal-field">
                <label>Safety Category *</label>
                <select
                  value={editingUser.category || editingUser.cat || "Untested"}
                  onChange={e => {
                    const catVal = e.target.value;
                    setEditingUser({
                      ...editingUser,
                      category: catVal,
                      cat: catVal
                    });
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
                    {myStations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
                <div className="sdom-modal-field">
                  <label>Assigned Section Beats *</label>
                  <input 
                    value={editingUser.reportingSm || "NGP-BSL Section"} 
                    onChange={e => setEditingUser({ ...editingUser, reportingSm: e.target.value })} 
                    placeholder="E.g. NGP-BSL, NGP-DURG"
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Assigned Shift *</label>
                  <select 
                    value={editingUser.shift || "Goods Train Beat"} 
                    onChange={e => setEditingUser({ ...editingUser, shift: e.target.value })}
                  >
                    <option value="Mail/Express Beat">Mail/Express Beat</option>
                    <option value="Passenger Beat">Passenger Beat</option>
                    <option value="Goods Train Beat">Goods Train Beat</option>
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

  const renderTransferUserModal = () => (
    <div className="sdom-modal-overlay" onClick={e => e.target === e.currentTarget && setTransferringUser(null)}>
      <div className="sdom-modal" style={{ width: "450px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0d2c4d" }}>Transfer Personnel Deployment</h3>
          <button type="button" onClick={() => setTransferringUser(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>&times;</button>
        </div>

        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0", lineHeight: "1.4" }}>
          Transfer <strong>{transferringUser.name}</strong> from <strong>{transferringUser.station}</strong> to another station section.
        </p>

        <div className="sdom-modal-field">
          <label>Select Deployment Station</label>
          <select value={transferringUser.targetStation} onChange={e=>setTransferringUser({...transferringUser, targetStation: e.target.value})}>
            {myStations.map(st => <option key={st.id} value={st.name}>{st.name}</option>)}
          </select>
        </div>

        <div className="sdom-modal-actions" style={{ marginTop: "24px" }}>
          <button type="button" className="sdom-btn-primary" style={{ flex: 1 }} onClick={confirmTransfer}>Confirm Transfer</button>
          <button type="button" className="sdom-btn-ghost" style={{ flex: 1 }} onClick={() => setTransferringUser(null)}>Cancel</button>
        </div>
      </div>
    </div>
  );

  const renderAddUserModal = () => (
    <div className="sdom-modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddUserModal(false)}>
      <div className="sdom-modal" style={{ width: "900px", maxWidth: "95vw" }}>
        <form onSubmit={handleAddUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                Role-Based Operational Staff Provisioning & Management Console
              </p>
            </div>
          </div>

          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
              1. General & Contact Information
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
                  placeholder="Enter PF Number" 
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
              2. Designation & Station Placement Setup
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
                  {myStations.map(s => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
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
                  value={newUserData.category || newUserData.cat || "Untested"}
                  onChange={e => {
                    const catVal = e.target.value;
                    setNewUserData({
                      ...newUserData,
                      category: catVal,
                      cat: catVal
                    });
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
                    {myStations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
                <div className="sdom-modal-field">
                  <label>Assigned Section Beats *</label>
                  <input 
                    value={newUserData.reportingSm || "NGP-BSL Section"} 
                    onChange={e => setNewUserData({ ...newUserData, reportingSm: e.target.value })} 
                    placeholder="E.g. NGP-BSL, NGP-DURG"
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>Assigned Shift *</label>
                  <select 
                    value={newUserData.shift || "Goods Train Beat"} 
                    onChange={e => setNewUserData({ ...newUserData, shift: e.target.value })}
                  >
                    <option value="Mail/Express Beat">Mail/Express Beat</option>
                    <option value="Passenger Beat">Passenger Beat</option>
                    <option value="Goods Train Beat">Goods Train Beat</option>
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

  return (
    <>
      {editingUser && renderEditUserModal()}
      {transferringUser && renderTransferUserModal()}
      {showAddUserModal && renderAddUserModal()}
    </>
  );
}
