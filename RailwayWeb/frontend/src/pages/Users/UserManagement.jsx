import React from "react";
import { UserPlus, UserCheck, Trash2, Edit } from "lucide-react";
import { DASHBOARD_96_STATIONS, userTypeOptions, departmentOptions, designationOptions, reportingOfficerOptions } from "../../constants/aomMockData";

export default function UserManagement(props) {
  const { 
    userFormData, handleUserFormChange, userFormErrors, handleSaveUser, 
    handleEditUser, handleDeleteUser, mockUsersList 
  } = props;

        const uniqueStationsList = Array.from(new Set(DASHBOARD_96_STATIONS.map(s => s.stationName))).sort();
        
        return (
          <div className="user-management-page">
            <div className="add-user-title-wrap" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
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
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0d2c4d", letterSpacing: "-0.5px" }}>ADD NEW SYSTEM USER</h2>
                <p className="subtitle-text" style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                  Role-Based Operational Staff Provisioning & Management Console
                </p>
              </div>
            </div>

            <div className="form-container structured-form-card">
              <form onSubmit={handleSubmitUser} className="user-form">
                
                {/* Field Group 1: General & Contact Info */}
                <div className="form-section-header">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                    1. General & Contact Information
                  </h4>
                  <div className="section-divider" style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
                </div>
                
                <div className="add-user-grid">
                  <div className="add-user-col">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="employeeName"
                        value={userFormData.employeeName}
                        onChange={handleUserFormChange}
                        placeholder="Enter full name (e.g. A. K. Sharma)"
                        className={formErrors.employeeName ? "error" : ""}
                      />
                      {formErrors.employeeName && <span className="error-text">{formErrors.employeeName}</span>}
                    </div>

                    <div className="form-group">
                      <label>HRMS ID / Employee ID *</label>
                      <input
                        type="text"
                        name="hrmsId"
                        value={userFormData.hrmsId}
                        onChange={handleUserFormChange}
                        placeholder="Enter unique ID (e.g. PM_8820)"
                        className={formErrors.hrmsId ? "error" : ""}
                      />
                      {formErrors.hrmsId && <span className="error-text">{formErrors.hrmsId}</span>}
                    </div>
                  </div>

                  <div className="add-user-col">
                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <input
                        type="text"
                        name="mobileNo"
                        value={userFormData.mobileNo}
                        onChange={handleUserFormChange}
                        placeholder="Enter 10-digit mobile number"
                        className={formErrors.mobileNo ? "error" : ""}
                      />
                      {formErrors.mobileNo && <span className="error-text">{formErrors.mobileNo}</span>}
                    </div>

                    <div className="form-group">
                      <label>Email ID *</label>
                      <input
                        type="email"
                        name="emailId"
                        value={userFormData.emailId}
                        onChange={handleUserFormChange}
                        placeholder="Enter email address (e.g. user@rail.in)"
                        className={formErrors.emailId ? "error" : ""}
                      />
                      {formErrors.emailId && <span className="error-text">{formErrors.emailId}</span>}
                    </div>
                  </div>
                </div>

                {/* Field Group 2: Designation & Station Placement */}
                <div className="form-section-header" style={{ marginTop: '24px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                    2. Designation & Station Placement Setup
                  </h4>
                  <div className="section-divider" style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>
                </div>

                <div className="add-user-grid">
                  <div className="add-user-col">
                    <div className="form-group">
                      <label>Role / Designation *</label>
                      <select
                        name="designation"
                        value={userFormData.designation}
                        onChange={handleUserFormChange}
                        className={formErrors.designation ? "error" : ""}
                      >
                        <option value="">Select Role</option>
                        {designationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {formErrors.designation && <span className="error-text">{formErrors.designation}</span>}
                    </div>

                    <div className="form-group">
                      <label>Railway Zone *</label>
                      <select
                        name="zone"
                        value={userFormData.zone}
                        onChange={handleUserFormChange}
                        className={formErrors.zone ? "error" : ""}
                      >
                        <option value="">Select Zone</option>
                        {stationZoneOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {formErrors.zone && <span className="error-text">{formErrors.zone}</span>}
                    </div>

                    <div className="form-group">
                      <label>Safety Category *</label>
                      <select
                        name="category"
                        value={userFormData.category || "Untested"}
                        onChange={handleUserFormChange}
                      >
                        <option value="Untested">Untested</option>
                        <option value="A">Category A</option>
                        <option value="B">Category B</option>
                        <option value="C">Category C</option>
                        <option value="D">Category D</option>
                      </select>
                    </div>
                  </div>

                  <div className="add-user-col">
                    <div className="form-group">
                      <label>Division *</label>
                      <select
                        name="division"
                        value={userFormData.division}
                        onChange={handleUserFormChange}
                        className={formErrors.division ? "error" : ""}
                      >
                        <option value="">Select Division</option>
                        {stationDivisionOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {formErrors.division && <span className="error-text">{formErrors.division}</span>}
                    </div>

                    <div className="form-group">
                      <label>Station Name *</label>
                      <select
                        name="stationName"
                        value={userFormData.stationName}
                        onChange={handleUserFormChange}
                        className={formErrors.stationName ? "error" : ""}
                      >
                        <option value="">Select Station</option>
                        {uniqueStationsList.map((station) => (
                          <option key={station} value={station}>
                            {station}
                          </option>
                        ))}
                      </select>
                      {formErrors.stationName && <span className="error-text">{formErrors.stationName}</span>}
                    </div>
                  </div>
                </div>

                {/* Field Group 3: Dynamic Role-Based Custom Operational Profile */}
                {userFormData.designation === "Pointsman" && (
                  <div className="role-specific-section pointsman-box animate-fade-in" style={{ marginTop: '24px', padding: '18px', background: '#f0f7ff', border: '1px solid #c2e0ff', borderRadius: '10px' }}>
                    <div className="form-section-header">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                        Pointsman Operational Setup
                      </h4>
                      <div className="section-divider" style={{ height: '1px', backgroundColor: '#c2e0ff', marginBottom: '16px' }}></div>
                    </div>
                    <div className="add-user-grid">
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Reporting Station Master *</label>
                          <input
                            type="text"
                            name="reportingSm"
                            value={userFormData.reportingSm}
                            onChange={handleUserFormChange}
                            placeholder="Station Master Name"
                            className={formErrors.reportingSm ? "error" : ""}
                          />
                          {formErrors.reportingSm && <span className="error-text">{formErrors.reportingSm}</span>}
                        </div>
                        <div className="form-group">
                          <label>Work Location Setup *</label>
                          <select
                            name="workLocation"
                            value={userFormData.workLocation}
                            onChange={handleUserFormChange}
                            className={formErrors.workLocation ? "error" : ""}
                          >
                            <option value="">Select Location</option>
                            <option value="Yard">Yard Area</option>
                            <option value="Cabin A">Cabin A</option>
                            <option value="Cabin B">Cabin B</option>
                            <option value="Platform Area">Platform Area</option>
                            <option value="Level Crossing Gate">Level Crossing Gate</option>
                          </select>
                          {formErrors.workLocation && <span className="error-text">{formErrors.workLocation}</span>}
                        </div>
                      </div>
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Assigned Shift *</label>
                          <select
                            name="shift"
                            value={userFormData.shift}
                            onChange={handleUserFormChange}
                            className={formErrors.shift ? "error" : ""}
                          >
                            <option value="">Select Shift</option>
                            <option value="Morning Shift (06:00 - 14:00)">Morning Shift (06:00 - 14:00)</option>
                            <option value="Evening Shift (14:00 - 22:00)">Evening Shift (14:00 - 22:00)</option>
                            <option value="Night Shift (22:00 - 06:00)">Night Shift (22:00 - 06:00)</option>
                            <option value="General Shift (09:00 - 18:00)">General Shift (09:00 - 18:00)</option>
                          </select>
                          {formErrors.shift && <span className="error-text">{formErrors.shift}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {userFormData.designation === "Station Master" && (
                  <div className="role-specific-section sm-box animate-fade-in" style={{ marginTop: '24px', padding: '18px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px' }}>
                    <div className="form-section-header">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                        Station Master Operational Setup
                      </h4>
                      <div className="section-divider" style={{ height: '1px', backgroundColor: '#a7f3d0', marginBottom: '16px' }}></div>
                    </div>
                    <div className="add-user-grid">
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Operational Station *</label>
                          <select
                            name="smStation"
                            value={userFormData.smStation}
                            onChange={handleUserFormChange}
                            className={formErrors.smStation ? "error" : ""}
                          >
                            <option value="">Select Operational Station</option>
                            {uniqueStationsList.map((station) => (
                              <option key={station} value={station}>
                                {station}
                              </option>
                            ))}
                          </select>
                          {formErrors.smStation && <span className="error-text">{formErrors.smStation}</span>}
                        </div>
                        <div className="form-group">
                          <label>Operational Zone *</label>
                          <select
                            name="smZone"
                            value={userFormData.smZone}
                            onChange={handleUserFormChange}
                            className={formErrors.smZone ? "error" : ""}
                          >
                            <option value="">Select Zone</option>
                            {stationZoneOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {formErrors.smZone && <span className="error-text">{formErrors.smZone}</span>}
                        </div>
                      </div>
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Operational Division *</label>
                          <select
                            name="smDivision"
                            value={userFormData.smDivision}
                            onChange={handleUserFormChange}
                            className={formErrors.smDivision ? "error" : ""}
                          >
                            <option value="">Select Division</option>
                            {stationDivisionOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {formErrors.smDivision && <span className="error-text">{formErrors.smDivision}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {userFormData.designation === "Traffic Inspector" && (
                  <div className="role-specific-section ti-box animate-fade-in" style={{ marginTop: '24px', padding: '18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px' }}>
                    <div className="form-section-header">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>
                        Traffic Inspector Operational Setup
                      </h4>
                      <div className="section-divider" style={{ height: '1px', backgroundColor: '#fde68a', marginBottom: '16px' }}></div>
                    </div>
                    <div className="add-user-grid">
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Jurisdiction Division *</label>
                          <input
                            type="text"
                            name="jurisdiction"
                            value={userFormData.jurisdiction}
                            onChange={handleUserFormChange}
                            placeholder="Enter Jurisdiction (e.g. Nagpur Division)"
                            className={formErrors.jurisdiction ? "error" : ""}
                          />
                          {formErrors.jurisdiction && <span className="error-text">{formErrors.jurisdiction}</span>}
                        </div>
                        <div className="form-group">
                          <label>Reporting AOM *</label>
                          <select
                            name="reportingAom"
                            value={userFormData.reportingAom}
                            onChange={handleUserFormChange}
                            className={formErrors.reportingAom ? "error" : ""}
                          >
                            <option value="">Select AOM</option>
                            <option value="A. K. Sinha (AOM/G)">A. K. Sinha (AOM/G)</option>
                            <option value="M. K. Nair (AOM/Safety)">M. K. Nair (AOM/Safety)</option>
                            <option value="R. S. Prasad (AOM/Chg)">R. S. Prasad (AOM/Chg)</option>
                            <option value="P. K. Verma (Sr. DOM)">P. K. Verma (Sr. DOM)</option>
                          </select>
                          {formErrors.reportingAom && <span className="error-text">{formErrors.reportingAom}</span>}
                        </div>
                      </div>
                      <div className="add-user-col">
                        <div className="form-group">
                          <label>Linked Stations under supervision *</label>
                          <input
                            type="text"
                            name="linkedStations"
                            value={userFormData.linkedStations}
                            onChange={handleUserFormChange}
                            placeholder="E.g. Nagpur Main, Wardha Jn, Sewagram"
                            className={formErrors.linkedStations ? "error" : ""}
                          />
                          {formErrors.linkedStations && <span className="error-text">{formErrors.linkedStations}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="add-user-actions" style={{ marginTop: '24px' }}>
                  <button type="submit" className="submit-btn" style={{ padding: '12px 36px', fontSize: '14px' }}>
                    {editingUserId ? "🔒 UPDATE USER ACCOUNT" : "👤 ADD USER ACCOUNT"}
                  </button>
                </div>
              </form>
            </div>

            <div className="users-filter-section chart-card">
              <form className="filter-grid" onSubmit={handleFilterSubmit}>
                <div className="form-group">
                  <label>Mobile No</label>
                  <input
                    type="text"
                    name="mobileNo"
                    value={pendingFilters.mobileNo}
                    onChange={handleFilterChange}
                    placeholder="Filter by mobile"
                  />
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <select name="designation" value={pendingFilters.designation} onChange={handleFilterChange}>
                    <option value="">All Designations</option>
                    {designationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>HRMS ID</label>
                  <input
                    type="text"
                    name="hrmsId"
                    value={pendingFilters.hrmsId}
                    onChange={handleFilterChange}
                    placeholder="Filter by HRMS ID"
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select name="department" value={pendingFilters.department} onChange={handleFilterChange}>
                    <option value="">All Departments</option>
                    {departmentOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>User Type</label>
                  <select name="userType" value={pendingFilters.userType} onChange={handleFilterChange}>
                    <option value="">All User Types</option>
                    {userTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-submit-wrap">
                  <button type="submit" className="submit-btn">Search / Submit</button>
                </div>
              </form>
            </div>

            <div className="users-list-container">
              <div className="users-table-toolbar">
                <h3>System User Directory</h3>
                <input
                  type="text"
                  className="users-table-search"
                  placeholder="Search users..."
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="users-table-wrapper">
                <div className="users-table users-table-wide" style={{ minWidth: '1280px' }}>
                  <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '60px 1.8fr 1.2fr 1.8fr 1.5fr 1.2fr 3fr' }}>
                    <div>Sr No</div>
                    <div>Employee Profile</div>
                    <div>Designation</div>
                    <div>Appointed</div>
                    <div>Contact Info</div>
                    <div>Account Status</div>
                    <div style={{ textAlign: 'center' }}>Actions</div>
                  </div>

                  {pagedUsers.length === 0 ? (
                    <div className="table-empty-state">No user accounts match criteria.</div>
                  ) : (
                    pagedUsers.map((row, idx) => (
                      <div key={row.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '60px 1.8fr 1.2fr 1.8fr 1.5fr 1.2fr 3fr', alignItems: 'center' }}>
                        <div>{(currentPage - 1) * pageSize + idx + 1}</div>
                        <div>
                          <button
                            type="button"
                            className="ti-name-link"
                            onClick={() => setSelectedUserProfile(row)}
                            style={{ display: 'block', textDecoration: 'underline', color: '#0d2c4d', fontSize: '13px', fontWeight: '800' }}
                          >
                            {row.employeeName}
                          </button>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>HRMS: {row.hrmsId}</span>
                        </div>
                        <div>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', background: row.designation === "Pointsman" ? '#eff6ff' : row.designation === "Station Master" ? '#ecfdf5' : '#fffbeb', color: row.designation === "Pointsman" ? '#1d4ed8' : row.designation === "Station Master" ? '#047857' : '#b45309', fontWeight: '700', fontSize: '11px' }}>
                            {row.designation}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '500' }}>{row.stationName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{row.division} / {row.zone === "Central Railway" ? "CR" : row.zone}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px' }}>{row.mobileNo}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{row.emailId || "No Email"}</div>
                        </div>
                        <div>
                          <button
                            type="button"
                            className={row.status === "Inactive" ? "status-inactive-pill" : "status-active-pill"}
                            onClick={() => {
                              setUsers((prev) =>
                                prev.map((u) =>
                                  u.id === row.id
                                    ? { ...u, status: u.status === "Inactive" ? "Active" : "Inactive" }
                                    : u
                                )
                              );
                            }}
                            style={{ cursor: 'pointer', border: '0', fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}
                          >
                            {row.status || "Active"}
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <button type="button" className="action-btn" onClick={() => setSelectedUserProfile(row)}>
                            Profile
                          </button>
                          
                          <button type="button" className="action-btn action-edit" onClick={() => handleEditUser(row.id)}>
                            Edit
                          </button>

                          <div className="ti-shift-inline" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <select
                              value={userShiftDrafts[row.id] || ""}
                              onChange={(e) =>
                                setUserShiftDrafts((prev) => ({
                                  ...prev,
                                  [row.id]: e.target.value
                                }))
                              }
                              style={{ height: '30px', border: '1px solid #d1dce8', borderRadius: '6px', fontSize: '11px', padding: '0 4px', background: '#fff' }}
                            >
                              <option value="">Shift Div...</option>
                              {stationDivisionOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => {
                                const newDiv = userShiftDrafts[row.id];
                                if (!newDiv) {
                                  alert("Please select a division to shift.");
                                  return;
                                }
                                setUsers((prev) =>
                                  prev.map((u) =>
                                    u.id === row.id
                                      ? {
                                          ...u,
                                          division: newDiv,
                                          smDivision: newDiv,
                                          jurisdiction: newDiv + " Division"
                                        }
                                      : u
                                  )
                                );
                                alert(`Successfully shifted ${row.employeeName} to ${newDiv} Division.`);
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px' }}
                            >
                              <ArrowRightLeft size={12} />
                              Shift
                            </button>
                          </div>

                          <button type="button" className="action-btn action-delete" onClick={() => handleDeleteUser(row.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="table-pagination-wrap">
                <button type="button" className="pagination-btn" onClick={goToPrevPage} disabled={currentPage === 1}>
                  Prev
                </button>
                <span className="pagination-text">
                  Page {currentPage} of {totalPages}
                </span>
                <button type="button" className="pagination-btn" onClick={goToNextPage} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            </div>

            {/* Premium User Profile View Detail Card */}
            {selectedUserProfile && (
              <div className="chart-card ti-profile-card animate-fade-in" style={{ marginTop: '20px', borderTop: '4px solid #0d2c4d', backgroundColor: '#fcfdfe' }}>
                <div className="ti-profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0d2c4d', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: '800', fontSize: '16px' }}>
                      {selectedUserProfile.employeeName?.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '800', color: '#0d2c4d' }}>
                        {selectedUserProfile.employeeName}
                      </h3>
                      <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>HRMS ID: {selectedUserProfile.hrmsId} | Department: {selectedUserProfile.department || "Operations"}</p>
                    </div>
                  </div>
                  <button type="button" className="action-btn" onClick={() => setSelectedUserProfile(null)} style={{ background: '#64748b', color: '#fff' }}>
                    Close Profile
                  </button>
                </div>

                <div className="ti-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '15px 0' }}>
                  <div><strong>Designation:</strong> <span style={{ color: '#1d4ed8', fontWeight: '700' }}>{selectedUserProfile.designation}</span></div>
                  <div><strong>Mobile No:</strong> {selectedUserProfile.mobileNo || selectedUserProfile.contact || "N/A"}</div>
                  <div><strong>Email ID:</strong> {selectedUserProfile.emailId || selectedUserProfile.email || "N/A"}</div>
                  <div><strong>PF Number:</strong> {selectedUserProfile.pfNumber || "N/A"}</div>
                  <div><strong>Account Status:</strong> <span style={{ color: selectedUserProfile.status === "Inactive" ? '#ef4444' : '#10b981', fontWeight: '700' }}>{selectedUserProfile.status || "Active"}</span></div>
                  
                  <div><strong>Current Zone:</strong> {selectedUserProfile.zone || "N/A"}</div>
                  <div><strong>Current Division:</strong> {selectedUserProfile.division || "N/A"}</div>
                  <div><strong>Current Station:</strong> {selectedUserProfile.stationName || "N/A"}</div>
                  <div><strong>Reporting Officer:</strong> {selectedUserProfile.reportingOfficer || "N/A"}</div>
                </div>

                {/* Role Specific details */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>Operational Profile Specifications</h4>
                  
                  {selectedUserProfile.designation === "Pointsman" && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13px' }}>
                      <div><strong>Reporting Station Master:</strong> {selectedUserProfile.reportingSm || "N/A"}</div>
                      <div><strong>Assigned Shift:</strong> {selectedUserProfile.shift || "N/A"}</div>
                      <div><strong>Work Location Setup:</strong> {selectedUserProfile.workLocation || "N/A"}</div>
                    </div>
                  )}

                  {selectedUserProfile.designation === "Station Master" && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13px' }}>
                      <div><strong>Operational Station:</strong> {selectedUserProfile.smStation || selectedUserProfile.stationName || "N/A"}</div>
                      <div><strong>Operational Division:</strong> {selectedUserProfile.smDivision || selectedUserProfile.division || "N/A"}</div>
                      <div><strong>Operational Zone:</strong> {selectedUserProfile.smZone || selectedUserProfile.zone || "N/A"}</div>
                    </div>
                  )}

                  {selectedUserProfile.designation === "Traffic Inspector" && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13px' }}>
                      <div><strong>Jurisdiction Division:</strong> {selectedUserProfile.jurisdiction || "N/A"}</div>
                      <div><strong>Reporting AOM Officer:</strong> {selectedUserProfile.reportingAom || "N/A"}</div>
                      <div style={{ gridColumn: 'span 3', marginTop: '5px' }}><strong>Linked Stations under supervision:</strong> {selectedUserProfile.linkedStations || "N/A"}</div>
                    </div>
                  )}

                  {!["Pointsman", "Station Master", "Traffic Inspector"].includes(selectedUserProfile.designation) && (
                    <span style={{ fontSize: '13px', color: '#64748b' }}>No dynamic operational specifications required for this designation.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
}
