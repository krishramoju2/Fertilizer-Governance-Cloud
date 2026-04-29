import React, { useState, useEffect, useCallback } from "react";
import Chatbot from "../../components/Chatbot/Chatbot";
import MLModel from "../../components/ML/MLModel";
import api from "../../services/api";
import { styles } from "./DashboardStyles";

function Dashboard({ token, setToken, currentUser, setCurrentUser }) {
  const [activeTab, setActiveTab] = useState("menu");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [soilTypes, setSoilTypes] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [fertilizerNames, setFertilizerNames] = useState([]);
  const [inputs, setInputs] = useState({
    Temperature: 26,
    Moisture: 45,
    Soil_Type: 'Loamy',
    Crop_Type: 'Maize',
    Fertilizer_Name: 'Urea',
    Fertilizer_Quantity: 30
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [adminManageType, setAdminManageType] = useState('soil');
  const [newItem, setNewItem] = useState('');

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  useEffect(() => {
    if (currentUser?.farm_details) {
      setInputs(prev => ({
        ...prev,
        Temperature: currentUser.farm_details.temperature || prev.Temperature,
        Moisture: currentUser.farm_details.humidity || prev.Moisture,
        Soil_Type: currentUser.farm_details.soil_type || prev.Soil_Type
      }));
    }
  }, [currentUser]);

  const fetchConfig = useCallback(async () => {
    try {
      const [soilRes, cropRes, fertRes] = await Promise.all([
        api.get('/config/soil-types'),
        api.get('/config/crop-types'),
        api.get('/config/fertilizer-names')
      ]);
      if (soilRes.data.success) setSoilTypes(soilRes.data.data);
      if (cropRes.data.success) setCropTypes(cropRes.data.data);
      if (fertRes.data.success) setFertilizerNames(fertRes.data.data);
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const [historyRes, analyticsRes] = await Promise.all([
        api.get('/history'),
        api.get('/analytics')
      ]);
      if (historyRes.data.success) setHistory(historyRes.data.history);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!currentUser?.is_admin) return;
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) setUsers(res.data.users);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  }, [currentUser]);

  const loadUserAnalytics = useCallback(async (userId) => {
    try {
      const res = await api.get(`/admin/user-analytics/${userId}`);
      if (res.data.success) setUserAnalytics(res.data.analytics);
    } catch (err) {
      console.error('Error loading user analytics:', err);
    }
  }, []);

  const loadUserHistory = useCallback(async (userId) => {
    try {
      const res = await api.get(`/admin/user-history/${userId}`);
      if (res.data.success) setUserHistory(res.data.history);
    } catch (err) {
      console.error('Error loading user history:', err);
    }
  }, []);

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    loadUserAnalytics(userId);
    loadUserHistory(userId);
  };

  useEffect(() => {
    fetchConfig();
    loadUserData();
    loadAdminData();
  }, [fetchConfig, loadUserData, loadAdminData]);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/analyze', inputs);
      if (res.data.success) {
        setResult(res.data.result);
        loadUserData();
        showMessage("Analysis completed successfully");
      } else {
        showMessage(res.data.message || "Analysis failed", "error");
      }
    } catch (err) {
      showMessage("System analysis error", "error");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>FarmAdvisor Pro - Strategic Report</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
            .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 40px; }
            .title { font-size: 28px; font-weight: 800; color: #10b981; margin: 0; }
            .section { margin-bottom: 32px; }
            .section-title { font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            .item { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .label { font-size: 12px; color: #94a3b8; font-weight: 700; }
            .value { font-size: 16px; font-weight: 700; color: #0f172a; display: block; margin-top: 4px; }
            .score-card { background: #0f172a; color: white; padding: 32px; border-radius: 16px; text-align: center; }
            .score-val { font-size: 48px; font-weight: 800; color: #10b981; }
            .suggestions { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 24px; border-radius: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Strategic Agricultural Assessment</h1>
            <p style="color: #64748b; font-weight: 600;">System Reference: ${new Date().getTime()}</p>
          </div>
          <div class="grid">
            <div class="section">
              <div class="section-title">Performance Metrics</div>
              <div class="score-card">
                <div class="score-val">${result.overall_score}%</div>
                <div style="font-weight: 800; margin-top: 8px;">${result.overall_compatibility}</div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Farm Parameters</div>
              <div class="grid" style="grid-template-columns: 1fr;">
                <div class="item"><span class="label">Crop Profile</span><span class="value">${inputs.Crop_Type}</span></div>
                <div class="item"><span class="label">Soil Specification</span><span class="value">${inputs.Soil_Type}</span></div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Strategic Insights</div>
            <div class="suggestions">
              ${result.suggestions.map(s => `<p style="margin-bottom: 12px; font-weight: 600;">• ${s}</p>`).join('')}
            </div>
          </div>
          <footer style="margin-top: 60px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Generated by FarmAdvisor Governance Cloud. Confidential Enterprise Document.
          </footer>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleAddItem = async () => {
    if (!newItem) return;
    try {
      const res = await api.post(`/admin/add-item/${adminManageType}`, { item: newItem });
      if (res.data.success) {
        showMessage(`Record added to ${adminManageType} types`);
        setNewItem('');
        fetchConfig();
      }
    } catch (err) {
      showMessage("Record insertion failed", "error");
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      const res = await api.post(`/admin/remove-item/${adminManageType}`, { item });
      if (res.data.success) {
        showMessage(`Record removed from ${adminManageType} types`);
        fetchConfig();
      }
    } catch (err) {
      showMessage("Record removal failed", "error");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  const renderSidebar = () => (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarBrand}>
        <div style={{ width: "32px", height: "32px", background: "#10b981", borderRadius: "8px", display: "grid", placeItems: "center", fontSize: "18px" }}>🌾</div>
        <span>Advisor Pro</span>
      </div>
      <nav style={styles.sidebarNav}>
        <button style={styles.sidebarLink(activeTab === 'menu')} onClick={() => setActiveTab('menu')}>Operations Overview</button>
        <button style={styles.sidebarLink(activeTab === 'analysis')} onClick={() => setActiveTab('analysis')}>Analysis Engine</button>
        <button style={styles.sidebarLink(activeTab === 'ml')} onClick={() => setActiveTab('ml')}>Predictions</button>
        <button style={styles.sidebarLink(activeTab === 'analytics')} onClick={() => setActiveTab('analytics')}>System Analytics</button>
        {currentUser?.is_admin && <button style={styles.sidebarLink(activeTab === 'admin')} onClick={() => setActiveTab('admin')}>Governance Console</button>}
        <button style={styles.sidebarLink(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>AI Assistant</button>
      </nav>
      <div style={styles.sidebarFooter}>
        <button style={styles.sidebarLink(false)} onClick={handleSignOut}>
          <span style={{ color: "#f87171" }}>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  const renderTopBar = () => (
    <header style={styles.topBar}>
      <div style={{ padding: "8px 16px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "100px", color: "#10b981", fontSize: "11px", fontWeight: "800", letterSpacing: "1px" }}>
        PRIME ENTERPRISE
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "14px", fontWeight: "700", margin: 0, color: "#fff" }}>{currentUser?.name}</p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{currentUser?.email}</p>
        </div>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#10b981", color: "#fff", display: "grid", placeItems: "center", fontWeight: "800" }}>
          {currentUser?.name?.charAt(0)}
        </div>
      </div>
    </header>
  );

  return (
    <div style={styles.app}>
      {renderSidebar()}
      
      <div style={styles.mainContent}>
        {renderTopBar()}

        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>
            {activeTab === 'menu' && "Strategic Overview"}
            {activeTab === 'analysis' && "Analysis Engine"}
            {activeTab === 'ml' && "Predictive Models"}
            {activeTab === 'analytics' && "System Intelligence"}
            {activeTab === 'admin' && "Governance Console"}
            {activeTab === 'chat' && "AI Knowledge Base"}
          </h1>
          <p style={styles.pageSubtitle}>
            {activeTab === 'menu' && "Real-time monitoring of global farm operations and strategic performance."}
            {activeTab === 'analysis' && "Execute deep-soil assessments and environmental compatibility tests."}
            {activeTab === 'ml' && "Forecasting nutrient requirements using advanced predictive models."}
            {activeTab === 'analytics' && "Historical data aggregation and performance benchmarking."}
            {activeTab === 'admin' && "System-wide governance and administrative controls."}
            {activeTab === 'chat' && "Natural language processing assistant for agricultural inquiries."}
          </p>
        </div>

        <div style={styles.contentArea}>
          {message.text && (
            <div style={{ marginBottom: "32px", padding: "16px", borderRadius: "12px", background: message.type === 'error' ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)", color: message.type === 'error' ? "#f87171" : "#4ade80", border: `1px solid ${message.type === 'error' ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}`, fontWeight: "600", fontSize: "14px" }}>
              {message.text}
            </div>
          )}

          {activeTab === 'menu' && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}><span style={styles.statLabel}>Operations Logged</span><span style={styles.statValue}>{history.length}</span></div>
                <div style={styles.statCard}><span style={styles.statLabel}>Mean Compatibility</span><span style={styles.statValue}>{analytics?.compatibility_rate || 0}%</span></div>
                <div style={styles.statCard}><span style={styles.statLabel}>Avg Yield Potential</span><span style={styles.statValue}>{analytics?.average_score || 0}%</span></div>
                <div style={styles.statCard}><span style={styles.statLabel}>System Integrity</span><span style={styles.statValue}>100%</span></div>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Recent Activity Log</h3>
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Timestamp</th>
                        <th style={styles.th}>Crop Profile</th>
                        <th style={styles.th}>Soil Spec</th>
                        <th style={styles.th}>Result</th>
                        <th style={styles.th}>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 10).map((item, i) => (
                        <tr key={i}>
                          <td style={styles.td}>{new Date(item.created_at).toLocaleDateString()}</td>
                          <td style={styles.td}>{item.input_data?.Crop_Type}</td>
                          <td style={styles.td}>{item.input_data?.Soil_Type}</td>
                          <td style={styles.td}>{item.result?.overall_compatibility}</td>
                          <td style={styles.td}>{item.result?.overall_score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "32px" }}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Parameter Specification</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Temperature (°C)</label><input type="number" style={styles.input} value={inputs.Temperature} onChange={(e) => setInputs({ ...inputs, Temperature: e.target.value })} /></div>
                  <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Moisture (%)</label><input type="number" style={styles.input} value={inputs.Moisture} onChange={(e) => setInputs({ ...inputs, Moisture: e.target.value })} /></div>
                  <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Soil Type</label><select style={styles.input} value={inputs.Soil_Type} onChange={(e) => setInputs({ ...inputs, Soil_Type: e.target.value })}>{soilTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Crop Type</label><select style={styles.input} value={inputs.Crop_Type} onChange={(e) => setInputs({ ...inputs, Crop_Type: e.target.value })}>{cropTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Fertilizer</label><select style={styles.input} value={inputs.Fertilizer_Name} onChange={(e) => setInputs({ ...inputs, Fertilizer_Name: e.target.value })}>{fertilizerNames.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Quantity (kg/ha)</label><input type="number" style={styles.input} value={inputs.Fertilizer_Quantity} onChange={(e) => setInputs({ ...inputs, Fertilizer_Quantity: e.target.value })} /></div>
                </div>
                <button style={{ ...styles.button, marginTop: "32px", width: "100%" }} onClick={handleAnalyze} disabled={loading}>{loading ? "Executing Assessment..." : "Run Assessment Engine"}</button>
              </div>

              <div>
                {result ? (
                  <div style={styles.resultCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Assessment Output</h3>
                      <span style={styles.scoreBadge}>{result.overall_score}% Confidence</span>
                    </div>
                    <p style={{ fontSize: "20px", fontWeight: "800", color: "#10b981", margin: 0 }}>{result.overall_compatibility}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {result.suggestions?.map((s, i) => (
                        <div key={i} style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "13px", borderLeft: "4px solid #10b981", fontWeight: "600", color: "#cbd5e1" }}>
                          • {s}
                        </div>
                      ))}
                    </div>
                    <button style={styles.secondaryButton} onClick={() => generatePDF()}>Export Assessment PDF</button>
                  </div>
                ) : (
                  <div style={{ ...styles.card, textAlign: "center", padding: "80px 20px" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔍</div>
                    <p style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>System Idle.<br />Execute analysis to generate strategic data.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ml' && (
            <div style={styles.card}>
              <MLModel />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}><span style={styles.statLabel}>Aggregate Sessions</span><span style={styles.statValue}>{analytics?.total_analyses || 0}</span></div>
                <div style={styles.statCard}><span style={styles.statLabel}>Success Ratio</span><span style={styles.statValue}>{analytics?.compatibility_rate || 0}%</span></div>
                <div style={styles.statCard}><span style={styles.statLabel}>Performance Index</span><span style={styles.statValue}>{analytics?.average_score || 0}%</span></div>
              </div>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Trend Analysis</h3>
                <p style={{ color: "#64748b", fontWeight: "600" }}>Data aggregation suggests a high degree of correlation between moisture levels and final yield potential.</p>
              </div>
            </div>
          )}

          {activeTab === 'admin' && currentUser?.is_admin && (
            <div style={styles.card}>
               <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
                  {['soil', 'crop', 'fertilizer', 'users'].map(type => (
                    <button 
                      key={type} 
                      onClick={() => setAdminManageType(type)}
                      style={{ ...styles.secondaryButton, padding: "10px 16px", fontSize: "12px", backgroundColor: adminManageType === type ? "rgba(16, 185, 129, 0.1)" : "transparent", borderColor: adminManageType === type ? "#10b981" : "rgba(255,255,255,0.1)", color: adminManageType === type ? "#10b981" : "#fff" }}
                    >
                      {type.toUpperCase()} MANAGEMENT
                    </button>
                  ))}
               </div>
               
               {adminManageType === 'users' ? (
                 <div style={{ display: "grid", gridTemplateColumns: selectedUserId ? "1fr 300px" : "1fr", gap: "24px" }}>
                   <div style={styles.tableContainer}>
                      <table style={styles.table}>
                        <thead>
                          <tr><th style={styles.th}>Entity Name</th><th style={styles.th}>Contact Info</th><th style={styles.th}>Access Level</th><th style={styles.th}>Command</th></tr>
                        </thead>
                        <tbody>
                          {users.map((u, i) => (
                            <tr key={i} style={{ background: selectedUserId === u._id ? "rgba(16, 185, 129, 0.05)" : "transparent" }}>
                              <td style={styles.td}>{u.name}</td>
                              <td style={styles.td}>{u.email}</td>
                              <td style={styles.td}>{u.is_admin ? 'Strategic Admin' : 'Premium Partner'}</td>
                              <td style={styles.td}><button style={{ color: "#10b981", background: "none", border: "none", fontWeight: "800", cursor: "pointer", fontSize: "12px" }} onClick={() => handleSelectUser(u._id)}>VIEW INTEL</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                   {selectedUserId && (
                     <div style={{ ...styles.card, background: "rgba(255,255,255,0.02)", padding: "24px" }}>
                       <h4 style={{ ...styles.cardTitle, fontSize: "16px" }}>User Intelligence</h4>
                       <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                         <div style={styles.statCard}>
                           <span style={{ ...styles.statLabel, fontSize: "10px" }}>Total Operations</span>
                           <span style={{ ...styles.statValue, fontSize: "20px" }}>{userAnalytics?.total_analyses || 0}</span>
                         </div>
                         <div style={styles.statCard}>
                           <span style={{ ...styles.statLabel, fontSize: "10px" }}>Avg Score</span>
                           <span style={{ ...styles.statValue, fontSize: "20px" }}>{userAnalytics?.average_score || 0}%</span>
                         </div>
                         <div>
                           <p style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>Recent Activity</p>
                           <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                             {userHistory.slice(0, 3).map((h, i) => (
                               <div key={i} style={{ fontSize: "12px", padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "6px" }}>
                                 <span style={{ color: "#10b981" }}>{h.crop_type}</span> - {h.score}%
                               </div>
                             ))}
                           </div>
                         </div>
                       </div>
                       <button style={{ ...styles.secondaryButton, marginTop: "20px", width: "100%", fontSize: "11px" }} onClick={() => setSelectedUserId(null)}>Close Intel</button>
                     </div>
                   )}
                 </div>
               ) : (
                 <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <input type="text" placeholder={`New ${adminManageType} record`} value={newItem} onChange={(e) => setNewItem(e.target.value)} style={styles.input} />
                      <button onClick={handleAddItem} style={styles.button}>COMMIT</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
                      {(adminManageType === 'soil' ? soilTypes : adminManageType === 'crop' ? cropTypes : fertilizerNames).map(item => (
                        <div key={item} style={{ padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "14px", fontWeight: "600" }}>{item}</span>
                          <button onClick={() => handleRemoveItem(item)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>×</button>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div style={styles.card}>
              <Chatbot />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

