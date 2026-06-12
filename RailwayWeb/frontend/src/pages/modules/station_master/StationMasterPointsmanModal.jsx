import React from 'react';
import { UserPlus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

export function StationMasterPointsmanModal(props) {
  const { t } = useLanguage();
  const {
    pmModal,
    setPmModal,
    smProfile,
    savePmModal
  } = props;

  if (!pmModal) return null;
  const isShift = pmModal.mode === "shift";
  return (
    <div className="sdom-modal-overlay" style={{ zIndex: 99999 }} onClick={e => e.target === e.currentTarget && setPmModal(null)}>
      <div className="sdom-modal" style={!isShift ? { width: "900px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" } : { maxHeight: "90vh", overflowY: "auto" }}>

        {!isShift ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                  {pmModal.mode === "edit" ? t("EDIT OPERATIONAL POINTSMAN") : t("ADD NEW OPERATIONAL POINTSMAN")}
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                  {t("Role-Based Operational Staff Provisioning & Management Console")}
                </p>
              </div>
            </div>

            {/* Section 1: General & Contact Information */}
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                {t("1. General & Contact Information")}
              </h4>
              <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>{t("Full Name *")}</label>
                  <input
                    value={pmModal.data.name || ""}
                    onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, name: e.target.value } }))}
                    placeholder={t("Enter full name (e.g. A. K. Sharma)")}
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>{t("Mobile Number *")}</label>
                  <input
                    value={pmModal.data.contact || ""}
                    onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, contact: e.target.value } }))}
                    placeholder={t("Enter 10-digit mobile number")}
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>{t("HRMS ID / Employee ID *")}</label>
                  <input
                    value={pmModal.data.hrmsId || ""}
                    disabled={pmModal.mode === "edit"}
                    onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, hrmsId: e.target.value, id: e.target.value } }))}
                    placeholder={t("Enter unique ID (e.g. PM_8820)")}
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>{t("PF Number *")}</label>
                  <input
                    value={pmModal.data.pfNumber || ""}
                    onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, pfNumber: e.target.value } }))}
                    placeholder={t("Enter unique PF Number")}
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>{t("Email Address *")}</label>
                  <input
                    type="email"
                    value={pmModal.data.email || ""}
                    onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, email: e.target.value } }))}
                    placeholder={t("Enter email address (e.g. user@rail.in)")}
                  />
                </div>
                {pmModal.mode === "add" && (
                  <div className="sdom-modal-field">
                    <label>{t("Password *")}</label>
                    <input
                      type="password"
                      value={pmModal.data.password || ""}
                      onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, password: e.target.value } }))}
                      placeholder={t("Enter initial password")}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Designation & Station Placement Setup */}
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d2c4d', margin: '0 0 10px', fontSize: '15px', fontWeight: '800' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d2c4d', display: 'inline-block' }}></span>
                {t("2. Designation & Station Placement Setup")}
              </h4>
              <div style={{ height: '1px', background: '#d5dfeb', marginBottom: '16px' }}></div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sdom-modal-field">
                  <label>{t("Role / Designation *")}</label>
                  <select value="Pointsman" disabled>
                    <option value="Pointsman">{t("Pointsman")}</option>
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>{t("Station Name *")}</label>
                  <select value={pmModal.data.station || ""} disabled>
                    <option value={smProfile.station}>{t(smProfile.station)}</option>
                  </select>
                </div>
                <div className="sdom-modal-field">
                  <label>{t("Joining Date *")}</label>
                  <input
                    type="date"
                    value={pmModal.data.doj || ""}
                    onChange={e => setPmModal(p => ({ ...p, data: { ...p.data, doj: e.target.value } }))}
                  />
                </div>
                <div className="sdom-modal-field">
                  <label>{t("Safety Category *")}</label>
                  <select
                    value={pmModal.data.category || pmModal.data.cat || "Untested"}
                    onChange={e => {
                      const catVal = e.target.value;
                      setPmModal(p => ({
                        ...p,
                        data: {
                          ...p.data,
                          category: catVal,
                          cat: catVal
                        }
                      }));
                    }}
                    required
                  >
                    <option value="Untested">{t("Untested")}</option>
                    <option value="A">{t("Category A")}</option>
                    <option value="B">{t("Category B")}</option>
                    <option value="C">{t("Category C")}</option>
                    <option value="D">{t("Category D")}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="sdom-modal-title" style={{ marginBottom: 20 }}>{t("Shift Staff Role")}</div>
            <div className="sdom-modal-field">
              <label>{t("Role (Shift to)")}</label>
              <select
                value={pmModal.role || "Pointsman"}
                onChange={e => setPmModal(p => ({ ...p, role: e.target.value }))}
              >
                <option value="Pointsman">{t("Pointsman")}</option>
                <option value="Station Master">{t("Station Master")}</option>
                <option value="Station Superintendent">{t("Station Superintendent")}</option>
                <option value="Train Manager">{t("Train Manager")}</option>
                <option value="Traffic Inspector">{t("Traffic Inspector")}</option>
              </select>
            </div>
          </>
        )}

        <div className="sdom-modal-actions" style={{ marginTop: 24 }}>
          <button className="sdom-btn-primary" style={{ flex: 1 }} onClick={savePmModal}>
            {pmModal.mode === "edit" ? t("🔒 UPDATE POINTSMAN") : isShift ? t("🔄 SHIFT POINTSMAN ROLE") : t("👤 ADD POINTSMAN")}
          </button>
          <button className="sdom-btn-ghost" style={{ flex: 1 }} onClick={() => setPmModal(null)}>{t("Cancel")}</button>
        </div>
      </div>
    </div>
  );
}
