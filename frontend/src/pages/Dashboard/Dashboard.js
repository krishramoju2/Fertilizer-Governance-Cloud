import React, { useState, useEffect, useCallback, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Chatbot from "../../components/Chatbot/Chatbot";
import MLModel from "../../components/ML/MLModel";
import api from "../../services/api";
import FuzzyText from "../../components/Shared/FuzzyText";
import { motion } from "framer-motion";
import Silk from "../../components/Home/Silk";

const styles = {
  app: {
    padding: "30px",
    background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
    position: "relative",
    zIndex: 1
  },

  silkBackground: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 0,
    pointerEvents: "none"
  },

  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },

  description: {
    fontSize: "14px",
    color: "#555",
    marginTop: "5px",
    lineHeight: "1.5"
  },

  fuzzyCanvas: {
    display: "block",
    width: "100%"
  },

  fuzzyNameWrap: {
    minWidth: "150px"
  },

  fuzzyCountWrap: {
    minWidth: "96px",
    display: "flex",
    justifyContent: "flex-end"
  },

  analyticsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px"
  },

  title: {
    fontSize: "22px",
    fontWeight: "700",
    letterSpacing: "0.5px"
  },

  welcome: { fontSize: "14px" },

  errorMessage: { color: "red", margin: "10px 0" },
  successMessage: { color: "green", margin: "10px 0" },

  resultCard: {
    background: "linear-gradient(135deg, #ffffff, #f1f5f9)",
    padding: "20px",
    borderRadius: "14px",
    marginBottom: "20px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.08)"
  },

  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  resultTitle: { fontSize: "18px", fontWeight: "bold" },

  scoreCircle: { textAlign: "center" },
  scoreNumber: { fontSize: "20px", fontWeight: "bold" },
  scoreLabel: { fontSize: "12px" },

  resultGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  resultItem: { padding: "10px", border: "1px solid #eee" },
  resultLabel: { fontWeight: "bold" },
  resultValue: { display: "block" },
  resultDetail: { fontSize: "12px", color: "#777" },

  suggestionsBox: { marginTop: "10px" },
  suggestionsTitle: { fontWeight: "bold" },
  suggestion: { fontSize: "14px" },

  pdfButton: { marginTop: "10px", padding: "10px", background: "#2e7d32", color: "white", border: "none", cursor: "pointer" },

  historyCard: { marginTop: "20px", background: "white", padding: "20px", borderRadius: "10px" },
  emptyText: { color: "#777" },

  adminContainer: { marginTop: "20px" },
  adminTitle: { fontSize: "20px", fontWeight: "bold" },
  adminTabs: { display: "flex", gap: "10px", marginBottom: "10px" },

  adminTab: (active) => ({
    padding: "8px 16px",
    background: active ? "#2e7d32" : "#ccc",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  }),

  adminContent: {},
  manageSection: {},
  addItemRow: { display: "flex", gap: "10px", marginBottom: "10px" },
  addButton: { padding: "8px 16px", background: "#2e7d32", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },

  itemList: { listStyle: "none", padding: 0 },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" },
  removeButton: { background: "red", color: "white", border: "none", borderRadius: "3px", padding: "2px 8px", cursor: "pointer" },

  userSection: {},
  userGrid: { display: "flex", gap: "20px" },
  userList: { width: "30%", maxHeight: "400px", overflowY: "auto" },

  userCard: (active) => ({
    padding: "10px",
    border: "1px solid #ccc",
    marginBottom: "5px",
    borderRadius: "5px",
    background: active ? "#e8f5e9" : "white",
    cursor: "pointer"
  }),

  userBadge: { fontSize: "10px", color: "#fff", background: "#333", padding: "2px 5px", borderRadius: "3px", display: "inline-block", marginTop: "5px" },

  userDetails: { flex: 1 },

  summaryCard: {
    background: "linear-gradient(145deg, rgba(30,64,175,0.92), rgba(15,118,110,0.9))",
    padding: "22px",
    borderRadius: "18px",
    boxShadow: "0 14px 34px rgba(15,23,42,0.22)",
    textAlign: "left",
    color: "white",
    border: "1px solid rgba(255,255,255,0.25)",
    position: "relative",
    overflow: "hidden"
  },

  summaryValue: {
    fontSize: "30px",
    fontWeight: "700",
    color: "#ffffff",
    display: "block",
    marginTop: "10px"
  },

  summaryLabel: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.85)",
    marginTop: "6px",
    display: "block"
  },

  summaryIcon: {
    fontSize: "20px",
    width: "40px",
    height: "40px",
    display: "grid",
    placeItems: "center",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.18)",
    backdropFilter: "blur(6px)"
  },

  chartList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "10px"
  },

  chartItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  chartBar: {
    flex: 1,
    height: "12px",
    background: "rgba(148,163,184,0.25)",
    borderRadius: "999px",
    overflow: "hidden",
    boxShadow: "inset 0 1px 3px rgba(15,23,42,0.18)"
  },

  chartFill: {
    height: "100%",
    background: "linear-gradient(90deg, #14b8a6, #22c55e, #84cc16)",
    borderRadius: "999px",
    boxShadow: "0 0 14px rgba(34,197,94,0.35)"
  },

  chartCard: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(226,232,240,0.9)",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 12px 24px rgba(15,23,42,0.08)"
  },

  chartName: {
    minWidth: "120px",
    fontWeight: "600",
    color: "#1e293b"
  },

  chartCount: {
    minWidth: "72px",
    textAlign: "right",
    fontSize: "12px",
    color: "#334155",
    fontWeight: "600"
  },

  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "500",
    color: "#333"
  },

  nav: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },

  analyzeButton: {
    marginTop: "20px",
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #4f46e5, #22c55e)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 15px rgba(79,70,229,0.3)"
  },

  main: {
    marginTop: "20px"
  },

  homeMenuWall: {
    width: "100%",
    minHeight: "560px",
    height: "auto",
    borderRadius: "18px",
    padding: "20px"
  },

  staticMenuGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "25px",
    width: "100%"
  },

  staticMenuItem: {
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "35px 20px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    border: "1px solid rgba(255,255,255,0.3)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    textAlign: "center",
    minHeight: "200px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },

  staticMenuTitle: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "15px",
    color: "#1a472a"
  },

  staticMenuDesc: {
    fontSize: "14px",
    color: "#555",
    lineHeight: "1.5",
    margin: 0
  },

  card: {
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(10px)",
    padding: "25px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    marginBottom: "20px",
    border: "1px solid rgba(255,255,255,0.3)"
  },

  analysisGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "25px"
  },

  inputGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginTop: "10px"
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
    background: "#fff"
  },

  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#1a472a"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  header: {
    background: "rgba(26, 71, 42, 0.85)",
    backdropFilter: "blur(10px)",
    color: "white",
    padding: "18px 25px",
    marginBottom: "25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "12px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    position: "relative",
    zIndex: 2
  },

  th: {
    padding: "12px",
    textAlign: "left",
    borderBottom: "2px solid #e2e8f0",
    fontWeight: "600",
    color: "#334155"
  },

  td: {
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #f1f5f9"
  }
};

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

  // ✅ FIXED: Removed useCallback to ensure fresh data
  const loadUserData = async () => {
    try {
      console.log("📡 Fetching history and analytics...");
      const [historyRes, analyticsRes] = await Promise.all([
        api.get('/history'),
        api.get('/analytics')
      ]);
      console.log("📜 History API response:", historyRes.data);
      console.log("📊 Analytics API response:", analyticsRes.data);
      
      if (historyRes.data.success) {
        const historyData = historyRes.data.history || [];
        console.log(`✅ Setting history with ${historyData.length} records`);
        setHistory(historyData);
      } else {
        console.warn("History API returned success=false");
      }
      
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics);
      }
    } catch (err) {
      console.error('❌ Error loading user data:', err);
    }
  };

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) setUsers(res.data.users);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, []);

  const loadUserAnalytics = useCallback(async (userId) => {
    try {
      const res = await api.get(`/admin/analytics/${userId}`);
      if (res.data.success) setUserAnalytics(res.data.analytics);
    } catch (err) {
      console.error('Error loading user analytics:', err);
    }
  }, []);

  const loadUserHistory = useCallback(async (userId) => {
    try {
      const res = await api.get(`/admin/history/${userId}`);
      if (res.data.success) setUserHistory(res.data.history);
    } catch (err) {
      console.error('Error loading user history:', err);
    }
  }, []);

  // ✅ FIXED: Removed loadUserData from dependencies
  const hasLoadedInitialData = useRef(false);
  
  useEffect(() => {
    if (!currentUser) {
      console.log("No currentUser, skipping data fetch");
      return;
    }
    
    if (hasLoadedInitialData.current) {
      return;
    }
    
    console.log("CurrentUser loaded, fetching dashboard data...");
    hasLoadedInitialData.current = true;
    
    const loadData = async () => {
      await fetchConfig();
      await loadUserData();
      if (currentUser.is_admin) {
        await loadUsers();
      }
    };
    
    loadData();
  }, [currentUser, fetchConfig, loadUsers]); // ✅ loadUserData removed from deps

  useEffect(() => {
    if (history.length > 0 && !result) {
      const mostRecent = history[0];
      if (mostRecent.result) {
        console.log("Loading most recent result from history:", mostRecent.result);
        setResult(mostRecent.result);
      }
    }
  }, [history, result]);

  // ✅ FIXED: Added await loadUserData
  const handleAnalyze = async () => {
    console.log("🔴 1. Analyze clicked");
    console.log("🔴 2. Inputs being sent:", inputs);
    
    setLoading(true);
    try {
      console.log("🔴 3. Calling /predict...");
      const response = await api.post('/predict', inputs);
      console.log("🔴 4. Response received:", response);
      console.log("🔴 5. Response data:", response.data);
      
      if (response.data.success) {
        console.log("🔴 6. Setting result:", response.data.result);
        setResult(response.data.result);
        showMessage('Analysis completed successfully!');
        
        console.log("🔴 7. Reloading user data...");
        await loadUserData();
        console.log("🔴 8. User data reloaded");
      } else {
        console.log("🔴 9. API returned success=false");
        showMessage(response.data.message || 'Analysis failed', 'error');
      }
    } catch (err) {
      console.log("🔴 10. ERROR caught!");
      console.log("🔴 11. Error:", err);
      console.log("🔴 12. Error response:", err.response);
      showMessage(err.response?.data?.message || 'Analysis failed', 'error');
    } finally {
      setLoading(false);
      console.log("🔴 13. Loading set to false");
    }
  };

  const generatePDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFillColor(26, 71, 42);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('FarmAdvisor Analysis Report', 15, 20);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Farmer: ${currentUser?.name || 'Farmer'}`, 15, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 47);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Input Parameters:', 15, 60);

    autoTable(doc, {
      startY: 65,
      head: [['Parameter', 'Value']],
      body: [
        ['Temperature', `${inputs.Temperature}°C`],
        ['Moisture', `${inputs.Moisture}%`],
        ['Soil Type', inputs.Soil_Type],
        ['Crop Type', inputs.Crop_Type],
        ['Fertilizer', inputs.Fertilizer_Name],
        ['Quantity', `${inputs.Fertilizer_Quantity} kg/ha`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [46, 125, 50] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis Results:', 15, finalY);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Compatibility: ${result.overall_compatibility}`, 20, finalY + 10);
    doc.text(`Overall Score: ${result.overall_score}%`, 20, finalY + 17);
    doc.text(`Temperature: ${result.temperature_status} (${result.temperature_range})`, 20, finalY + 24);
    doc.text(`Moisture: ${result.moisture_status} (${result.moisture_range})`, 20, finalY + 31);
    doc.text(`Soil Compatibility: ${result.soil_compatibility}`, 20, finalY + 38);
    doc.text(`Quantity: ${result.quantity_status}`, 20, finalY + 45);

    if (result.suggestions && result.suggestions.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Suggestions:', 15, finalY + 60);
      doc.setFont('helvetica', 'normal');
      result.suggestions.forEach((s, i) => {
        doc.text(`• ${s}`, 20, finalY + 67 + (i * 7));
      });
    }

    doc.save(`FarmReport_${inputs.Crop_Type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    try {
      let endpoint = '';
      if (adminManageType === 'soil') endpoint = '/admin/config/soil-types';
      else if (adminManageType === 'crop') endpoint = '/admin/config/crop-types';
      else endpoint = '/admin/config/fertilizer-names';

      const res = await api.post(endpoint, { item: newItem });
      if (res.data.success) {
        showMessage('Item added');
        setNewItem('');
        fetchConfig();
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to add', 'error');
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      let endpoint = '';
      if (adminManageType === 'soil') endpoint = `/admin/config/soil-types/${encodeURIComponent(item)}`;
      else if (adminManageType === 'crop') endpoint = `/admin/config/crop-types/${encodeURIComponent(item)}`;
      else endpoint = `/admin/config/fertilizer-names/${encodeURIComponent(item)}`;

      const res = await api.delete(endpoint);
      if (res.data.success) {
        showMessage('Item removed');
        fetchConfig();
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to remove', 'error');
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    loadUserAnalytics(userId);
    loadUserHistory(userId);
  };

  const getNavButtonStyle = (tabName, isLogout = false) => {
    if (isLogout) {
      return {
        padding: "8px 12px",
        background: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer"
      };
    }
    return {
      padding: "8px 14px",
      background: activeTab === tabName
        ? "linear-gradient(135deg, #4f46e5, #22c55e)"
        : "rgba(255,255,255,0.2)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      backdropFilter: "blur(6px)"
    };
  };

  return (
    <div style={styles.app}>
      <div style={styles.silkBackground}>
        <Silk
          speed={3}
          scale={1}
          color="#f59e0b"
          noiseIntensity={1.2}
          rotation={0}
        />
      </div>

      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🌾 FarmAdvisor Pro</h1>
          <p style={styles.welcome}>Welcome, {currentUser?.name || 'Farmer'}!</p>
        </div>
        <nav style={styles.nav}>
          <button style={getNavButtonStyle('menu')} onClick={() => setActiveTab('menu')}>Home</button>
          <button style={getNavButtonStyle('analysis')} onClick={() => setActiveTab('analysis')}>Analysis</button>
          <button style={getNavButtonStyle('ml')} onClick={() => setActiveTab('ml')}>ML Model</button>
          <button style={getNavButtonStyle('analytics')} onClick={() => setActiveTab('analytics')}>Analytics</button>
          {currentUser?.is_admin && <button style={getNavButtonStyle('admin')} onClick={() => setActiveTab('admin')}>Admin</button>}
          <button style={getNavButtonStyle('chat')} onClick={() => setActiveTab('chat')}>Chatbot</button>
          <button style={getNavButtonStyle('', true)} onClick={() => { localStorage.removeItem('token'); setToken(null); setCurrentUser(null); }}>Logout</button>
        </nav>
      </header>

      {message.text && (
        <div style={message.type === 'error' ? styles.errorMessage : styles.successMessage}>
          {message.text}
        </div>
      )}

      <main style={styles.main}>
        {activeTab === "menu" && (
          <div style={styles.homeMenuWall}>
            <div style={styles.staticMenuGrid}>
              <div style={styles.staticMenuItem} onClick={() => setActiveTab("analysis")}>
                <h3 style={styles.staticMenuTitle}>🔬 Analysis</h3>
                <p style={styles.staticMenuDesc}>Analyze soil, weather, and farm conditions to determine crop compatibility and optimize farming strategies.</p>
              </div>
              <div style={styles.staticMenuItem} onClick={() => setActiveTab("ml")}>
                <h3 style={styles.staticMenuTitle}>🤖 ML Model</h3>
                <p style={styles.staticMenuDesc}>Use machine learning to predict the best fertilizers based on soil nutrients, crop type, and environmental factors.</p>
              </div>
              <div style={styles.staticMenuItem} onClick={() => setActiveTab("analytics")}>
                <h3 style={styles.staticMenuTitle}>📈 Analytics</h3>
                <p style={styles.staticMenuDesc}>View historical data, performance trends, and insights to improve long-term agricultural productivity.</p>
              </div>
              <div style={styles.staticMenuItem} onClick={() => setActiveTab("chat")}>
                <h3 style={styles.staticMenuTitle}>💬 Chatbot</h3>
                <p style={styles.staticMenuDesc}>Interact with AI to get real-time farming advice, troubleshooting, and recommendations.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🔬 Farm Analysis</h2>
              <p style={styles.description}>Enter your farm conditions like temperature, moisture, soil type, crop, and fertilizer details. This tool will analyze compatibility and suggest improvements to maximize yield and efficiency.</p>
            </div>

            <div style={styles.analysisGrid}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Farm Inputs</h2>
                <div style={styles.inputGrid}>
                  <div><label style={styles.label}>Temperature (°C)</label>
                    <input type="number" style={styles.input} value={inputs.Temperature} onChange={(e) => setInputs({ ...inputs, Temperature: parseFloat(e.target.value) })} />
                  </div>
                  <div><label style={styles.label}>Moisture (%)</label>
                    <input type="number" style={styles.input} value={inputs.Moisture} onChange={(e) => setInputs({ ...inputs, Moisture: parseFloat(e.target.value) })} />
                  </div>
                  <div><label style={styles.label}>Soil Type</label>
                    <select style={styles.input} value={inputs.Soil_Type} onChange={(e) => setInputs({ ...inputs, Soil_Type: e.target.value })}>
                      {soilTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
                    </select>
                  </div>
                  <div><label style={styles.label}>Crop Type</label>
                    <select style={styles.input} value={inputs.Crop_Type} onChange={(e) => setInputs({ ...inputs, Crop_Type: e.target.value })}>
                      {cropTypes.map((crop) => (<option key={crop} value={crop}>{crop}</option>))}
                    </select>
                  </div>
                  <div><label style={styles.label}>Fertilizer</label>
                    <select style={styles.input} value={inputs.Fertilizer_Name} onChange={(e) => setInputs({ ...inputs, Fertilizer_Name: e.target.value })}>
                      {fertilizerNames.map((fert) => (<option key={fert} value={fert}>{fert}</option>))}
                    </select>
                  </div>
                  <div><label style={styles.label}>Quantity (kg/ha)</label>
                    <input type="number" style={styles.input} value={inputs.Fertilizer_Quantity} onChange={(e) => setInputs({ ...inputs, Fertilizer_Quantity: parseFloat(e.target.value) })} />
                  </div>
                </div>
                <button style={styles.analyzeButton} onClick={handleAnalyze} disabled={loading}>
                  {loading ? "Analyzing..." : "🔬 Analyze"}
                </button>
              </div>

              <div style={styles.rightPanel}>
                {result && (
                  <div style={styles.resultCard}>
                    <div style={styles.resultHeader}>
                      <h2 style={styles.resultTitle}>{result.overall_compatibility}</h2>
                      <div style={styles.scoreCircle}>
                        <span style={styles.scoreNumber}>{result.overall_score}%</span>
                        <span style={styles.scoreLabel}>Overall</span>
                      </div>
                    </div>
                    <div style={styles.resultGrid}>
                      <div style={styles.resultItem}>
                        <span style={styles.resultLabel}>Temperature</span>
                        <span style={styles.resultValue}>{result.temperature_status}</span>
                        <span style={styles.resultDetail}>{result.temperature_range}</span>
                      </div>
                      <div style={styles.resultItem}>
                        <span style={styles.resultLabel}>Moisture</span>
                        <span style={styles.resultValue}>{result.moisture_status}</span>
                        <span style={styles.resultDetail}>{result.moisture_range}</span>
                      </div>
                      <div style={styles.resultItem}>
                        <span style={styles.resultLabel}>Soil</span>
                        <span style={styles.resultValue}>{result.soil_compatibility}</span>
                      </div>
                      <div style={styles.resultItem}>
                        <span style={styles.resultLabel}>Quantity</span>
                        <span style={styles.resultValue}>{result.quantity_status}</span>
                        <span style={styles.resultDetail}>{result.quantity_range}</span>
                      </div>
                    </div>
                    <div style={styles.suggestionsBox}>
                      <h3 style={styles.suggestionsTitle}>💡 Suggestions</h3>
                      {result.suggestions?.map((s, i) => (<p key={i} style={styles.suggestion}>• {s}</p>))}
                    </div>
                    <button style={styles.pdfButton} onClick={generatePDF}>📄 Download PDF Report</button>
                  </div>
                )}

                <div style={styles.historyCard}>
                  <h3 style={styles.cardTitle}>Recent Analyses</h3>
                  {history.length === 0 ? (
                    <p style={styles.emptyText}>No analyses yet. Click "Analyze" to get started.</p>
                  ) : (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Crop</th>
                          <th style={styles.th}>Fertilizer</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.slice().reverse().map((item, i) => {
                          const inputData = item.input_data || item.input || {};
                          const resultData = item.result || {};
                          return (
                            <tr key={i}>
                              <td style={styles.td}>{inputData.Crop_Type || "N/A"}</td>
                              <td style={styles.td}>{inputData.Fertilizer_Name || "N/A"}</td>
                              <td style={styles.td}>{resultData.overall_compatibility || "N/A"}</td>
                              <td style={styles.td}>{resultData.overall_score ? `${resultData.overall_score}%` : "N/A"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'ml' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>ML Model Analysis</h2>
            <MLModel />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={styles.analyticsContainer}>
            {analytics ? (
              <>
                <div style={styles.summaryGrid}>
                  <motion.div style={styles.summaryCard} initial={{ opacity: 0, y: 36, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.55, ease: "easeOut" }} whileHover={{ y: -6, scale: 1.02 }}>
                    <span style={styles.summaryIcon}>📊</span>
                    <FuzzyText fontSize="36px" fontWeight={700} color="#ffffff" baseIntensity={0.12} hoverIntensity={0.34} fuzzRange={20}>{String(analytics.total_analyses)}</FuzzyText>
                    <FuzzyText fontSize="15px" fontWeight={600} color="rgba(255,255,255,0.92)" baseIntensity={0.1} hoverIntensity={0.28} fuzzRange={16}>Total Analyses</FuzzyText>
                  </motion.div>
                  <motion.div style={styles.summaryCard} initial={{ opacity: 0, y: 36, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.65, ease: "easeOut" }} whileHover={{ y: -6, scale: 1.02 }}>
                    <span style={styles.summaryIcon}>✅</span>
                    <FuzzyText fontSize="36px" fontWeight={700} color="#ffffff" baseIntensity={0.12} hoverIntensity={0.34} fuzzRange={20}>{`${analytics.compatibility_rate}%`}</FuzzyText>
                    <FuzzyText fontSize="15px" fontWeight={600} color="rgba(255,255,255,0.92)" baseIntensity={0.1} hoverIntensity={0.28} fuzzRange={16}>Success Rate</FuzzyText>
                  </motion.div>
                  <motion.div style={styles.summaryCard} initial={{ opacity: 0, y: 36, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.75, ease: "easeOut" }} whileHover={{ y: -6, scale: 1.02 }}>
                    <span style={styles.summaryIcon}>🎯</span>
                    <FuzzyText fontSize="36px" fontWeight={700} color="#ffffff" baseIntensity={0.12} hoverIntensity={0.34} fuzzRange={20}>{`${analytics.average_score}%`}</FuzzyText>
                    <FuzzyText fontSize="15px" fontWeight={600} color="rgba(255,255,255,0.92)" baseIntensity={0.1} hoverIntensity={0.28} fuzzRange={16}>Avg Score</FuzzyText>
                  </motion.div>
                </div>

                <motion.div style={styles.chartCard} initial={{ opacity: 0, x: -40, filter: "blur(6px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} transition={{ duration: 0.55, ease: "easeOut" }}>
                  <FuzzyText fontSize="26px" fontWeight={700} color="#1a472a" baseIntensity={0.1} hoverIntensity={0.25} fuzzRange={14}>Crop Distribution</FuzzyText>
                  <div style={styles.chartList}>
                    {Object.entries(analytics.crop_distribution || {}).map(([crop, count]) => (
                      <div key={crop} style={styles.chartItem}>
                        <div style={styles.fuzzyNameWrap}>
                          <FuzzyText fontSize="16px" fontWeight={600} color="#1e293b" baseIntensity={0.08} hoverIntensity={0.2} fuzzRange={10}>{crop}</FuzzyText>
                        </div>
                        <span style={styles.chartBar}>
                          <motion.span style={styles.chartFill} initial={{ width: 0 }} animate={{ width: `${(count / analytics.total_analyses) * 100}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
                        </span>
                        <div style={styles.fuzzyCountWrap}>
                          <FuzzyText fontSize="14px" fontWeight={600} color="#334155" baseIntensity={0.08} hoverIntensity={0.2} fuzzRange={10}>{`${count} times`}</FuzzyText>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div style={styles.chartCard} initial={{ opacity: 0, x: 40, filter: "blur(6px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} transition={{ duration: 0.55, ease: "easeOut" }}>
                  <FuzzyText fontSize="26px" fontWeight={700} color="#1a472a" baseIntensity={0.1} hoverIntensity={0.25} fuzzRange={14}>Fertilizer Usage</FuzzyText>
                  <div style={styles.chartList}>
                    {Object.entries(analytics.fertilizer_distribution || {}).map(([fert, count]) => (
                      <div key={fert} style={styles.chartItem}>
                        <div style={styles.fuzzyNameWrap}>
                          <FuzzyText fontSize="16px" fontWeight={600} color="#1e293b" baseIntensity={0.08} hoverIntensity={0.2} fuzzRange={10}>{fert}</FuzzyText>
                        </div>
                        <span style={styles.chartBar}>
                          <motion.span style={styles.chartFill} initial={{ width: 0 }} animate={{ width: `${(count / analytics.total_analyses) * 100}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
                        </span>
                        <div style={styles.fuzzyCountWrap}>
                          <FuzzyText fontSize="14px" fontWeight={600} color="#334155" baseIntensity={0.08} hoverIntensity={0.2} fuzzRange={10}>{`${count} times`}</FuzzyText>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            ) : (
              <p>Loading analytics...</p>
            )}
          </div>
        )}

        {activeTab === 'admin' && currentUser?.is_admin && (
          <div style={styles.adminContainer}>
            <h2 style={styles.adminTitle}>Admin Panel</h2>
            <div style={styles.adminTabs}>
              <button style={styles.adminTab(adminManageType === 'soil')} onClick={() => setAdminManageType('soil')}>Soil Types</button>
              <button style={styles.adminTab(adminManageType === 'crop')} onClick={() => setAdminManageType('crop')}>Crop Types</button>
              <button style={styles.adminTab(adminManageType === 'fertilizer')} onClick={() => setAdminManageType('fertilizer')}>Fertilizers</button>
              <button style={styles.adminTab(adminManageType === 'users')} onClick={() => setAdminManageType('users')}>Users</button>
            </div>

            <div style={styles.adminContent}>
              {adminManageType === 'soil' && (
                <div style={styles.manageSection}>
                  <h3>Manage Soil Types</h3>
                  <div style={styles.addItemRow}>
                    <input type="text" placeholder="New soil type" value={newItem} onChange={(e) => setNewItem(e.target.value)} style={styles.input} />
                    <button onClick={handleAddItem} style={styles.addButton}>Add</button>
                  </div>
                  <ul style={styles.itemList}>
                    {soilTypes.map(type => (<li key={type} style={styles.listItem}>{type}<button onClick={() => handleRemoveItem(type)} style={styles.removeButton}>×</button></li>))}
                  </ul>
                </div>
              )}

              {adminManageType === 'crop' && (
                <div style={styles.manageSection}>
                  <h3>Manage Crop Types</h3>
                  <div style={styles.addItemRow}>
                    <input type="text" placeholder="New crop type" value={newItem} onChange={(e) => setNewItem(e.target.value)} style={styles.input} />
                    <button onClick={handleAddItem} style={styles.addButton}>Add</button>
                  </div>
                  <ul style={styles.itemList}>
                    {cropTypes.map(crop => (<li key={crop} style={styles.listItem}>{crop}<button onClick={() => handleRemoveItem(crop)} style={styles.removeButton}>×</button></li>))}
                  </ul>
                </div>
              )}

              {adminManageType === 'fertilizer' && (
                <div style={styles.manageSection}>
                  <h3>Manage Fertilizer Names</h3>
                  <div style={styles.addItemRow}>
                    <input type="text" placeholder="New fertilizer" value={newItem} onChange={(e) => setNewItem(e.target.value)} style={styles.input} />
                    <button onClick={handleAddItem} style={styles.addButton}>Add</button>
                  </div>
                  <ul style={styles.itemList}>
                    {fertilizerNames.map(fert => (<li key={fert} style={styles.listItem}>{fert}<button onClick={() => handleRemoveItem(fert)} style={styles.removeButton}>×</button></li>))}
                  </ul>
                </div>
              )}

              {adminManageType === 'users' && (
                <div style={styles.userSection}>
                  <h3>All Users</h3>
                  <div style={styles.userGrid}>
                    <div style={styles.userList}>
                      {users.map(user => (<div key={user._id} style={styles.userCard(selectedUserId === user._id)} onClick={() => handleSelectUser(user._id)}>
                        <strong>{user.name}</strong><div><small>{user.email}</small></div>
                        <span style={styles.userBadge}>{user.is_admin ? 'Admin' : 'User'}</span>
                      </div>))}
                    </div>
                    {selectedUserId && (
                      <div style={styles.userDetails}>
                        <h4>User Analytics</h4>
                        {userAnalytics ? (
                          <>
                            <p>Total Analyses: {userAnalytics.total_analyses}</p>
                            <p>Success Rate: {userAnalytics.compatibility_rate}%</p>
                            <p>Avg Score: {userAnalytics.average_score}%</p>
                            <h5>Recent History</h5>
                            <table style={styles.table}>
                              <thead><tr><th style={styles.th}>Crop</th><th style={styles.th}>Fertilizer</th><th style={styles.th}>Status</th><th style={styles.th}>Score</th></tr></thead>
                              <tbody>
                                {userHistory.map((item, i) => (<tr key={i}><td style={styles.td}>{item.crop_type}</td><td style={styles.td}>{item.fertilizer}</td><td style={styles.td}>{item.compatibility}</td><td style={styles.td}>{item.score}%</td><td>))}
                              </tbody>
                            </table>
                          </>
                        ) : (<p>Select a user to view analytics</p>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Farm Chatbot</h2>
            <Chatbot />
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;


