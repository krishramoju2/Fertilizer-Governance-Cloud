import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
  };  // 🧠 Intelligent Tip Engine
  const getPersonalizedTip = () => {
    if (!history || history.length === 0) return "Start testing your soil to see personalized farming advice here!";
    const recent = history.slice(0, 20);
    const highMoisture = recent.filter(h => (h.input_data?.Moisture || 0) > 55).length;
    const highTemp = recent.filter(h => (h.input_data?.Temperature || 0) > 32).length;
    const lowCompatibility = recent.filter(h => (h.result?.overall_score || 0) < 60).length;

    if (highMoisture > 8) return "ALERT: Your soil is consistently too wet (High Moisture). Consider clearing drainage channels or using raised beds to prevent root rot.";
    if (highTemp > 8) return "CLIMATE TIP: High temperature trends detected. We recommend morning-only irrigation and using straw mulch to keep the soil cool.";
    if (lowCompatibility > 5) return "STRATEGY CHANGE: Many recent tests show low compatibility. We suggest switching to a more balanced fertilizer like NPK 17-17-17 for better results.";
    
    return "STABLE GROWTH: Your recent farm tests show optimal conditions. Maintain your current schedule for a healthy harvest!";
  };

  // Scroll Navigation Logic
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 360]);
  
  // High-Impact Cinematic Transforms (Multi-axis movement)
  const bgShift = useTransform(scrollYProgress, [0, 1], ["#020617", "#064e3b"]); // From Navy to Deep Forest
  const yNode0 = useTransform(scrollYProgress, [0, 1], [0, -1200]);
  const yNode1 = useTransform(scrollYProgress, [0, 1], [0, -2500]);
  const yNode2 = useTransform(scrollYProgress, [0, 1], [0, -3500]);
  const yNode3 = useTransform(scrollYProgress, [0, 1], [0, -1800]);
  const yNode4 = useTransform(scrollYProgress, [0, 1], [0, -800]);
  const yNode5 = useTransform(scrollYProgress, [0, 1], [0, -5000]); // Ultra-fast foreground
  const yNode6 = useTransform(scrollYProgress, [0, 1], [0, -1500]);
  const yNode7 = useTransform(scrollYProgress, [0, 1], [0, -3200]);
  const yNode8 = useTransform(scrollYProgress, [0, 1], [0, -1000]);
  const yNode9 = useTransform(scrollYProgress, [0, 1], [0, -4200]);

  // Train Specific Cinematic Transforms
  const trainY = useTransform(scrollYProgress, [0, 1], ["0vh", "90vh"]);
  const trainWobble = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, 2, -2, 2, -2, 0]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const sections = ['menu', 'analysis', 'ml', 'analytics', 'chat'];
      const currentScroll = scrollRef.current.scrollTop;
      
      sections.forEach(id => {
        const element = document.getElementById(`section-${id}`);
        if (element) {
          const offset = element.offsetTop - 150;
          if (currentScroll >= offset && currentScroll < offset + element.offsetHeight) {
            setActiveTab(id);
          }
        }
      });
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(`section-${id}`);
    if (element && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  const renderTrain = () => {
    return (
      <motion.div 
        style={{ 
          y: trainY, 
          x: trainWobble,
          position: "fixed", 
          right: "120px", 
          top: "150px", 
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          pointerEvents: "none"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          {/* Steam Particles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ y: [-10, -40], x: [0, (i % 2 === 0 ? 15 : -15)], opacity: [0.8, 0], scale: [0.5, 2.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
              style={{ width: "16px", height: "16px", background: "#fff", borderRadius: "50%", filter: "blur(4px)" }}
            />
          ))}
          {/* Bigger Engine - High Contrast Silver/White */}
          <div style={{ width: "42px", height: "54px", background: "#f8fafc", borderRadius: "8px 8px 4px 4px", position: "relative", boxShadow: "0 0 30px rgba(255, 255, 255, 0.5), 0 4px 15px rgba(0,0,0,0.5)" }}>
            <div style={{ position: "absolute", top: "8px", left: "8px", width: "26px", height: "18px", background: "rgba(0,0,0,0.6)", borderRadius: "3px" }} />
            <div style={{ position: "absolute", bottom: "-4px", left: "-4px", width: "50px", height: "10px", background: "#10b981", borderRadius: "100px" }} />
          </div>
          {/* Bigger Cars - High Contrast Emerald */}
          <div style={{ width: "34px", height: "38px", background: "#10b981", borderRadius: "4px", border: "2px solid #fff", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }} />
          <div style={{ width: "34px", height: "38px", background: "#10b981", borderRadius: "4px", border: "2px solid #fff", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }} />
        </div>
        
        {/* The Track (Locked in viewport behind the train) */}
        <div style={{ 
          position: "absolute", 
          right: "26px", 
          top: "-200vh", 
          bottom: "-200vh", 
          width: "4px", 
          background: "rgba(16, 185, 129, 0.1)", 
          zIndex: -1, 
          borderLeft: "1px dashed rgba(16, 185, 129, 0.3)",
          borderRight: "1px dashed rgba(16, 185, 129, 0.3)"
        }} />
      </motion.div>
    );
  };

  const renderParallax = () => {
    const nodes = [
      { top: "5%", left: "5%", size: "600px", color: "rgba(16, 185, 129, 0.12)", blur: "120px", y: yNode0 },
      { top: "12%", left: "65%", size: "450px", color: "rgba(59, 130, 246, 0.1)", blur: "90px", y: yNode1 },
      { top: "22%", left: "0%", size: "250px", color: "rgba(16, 185, 129, 0.25)", blur: "30px", y: yNode2, rotate: true },
      { top: "32%", left: "75%", size: "350px", color: "rgba(59, 130, 246, 0.15)", blur: "60px", y: yNode3 },
      { top: "42%", left: "10%", size: "700px", color: "rgba(16, 185, 129, 0.08)", blur: "150px", y: yNode4 },
      { top: "52%", left: "55%", size: "200px", color: "rgba(16, 185, 129, 0.3)", blur: "15px", y: yNode5, rotate: true },
      { top: "62%", left: "80%", size: "550px", color: "rgba(59, 130, 246, 0.12)", blur: "100px", y: yNode6 },
      { top: "72%", left: "5%", size: "400px", color: "rgba(16, 185, 129, 0.2)", blur: "40px", y: yNode7 },
      { top: "82%", left: "70%", size: "650px", color: "rgba(59, 130, 246, 0.07)", blur: "130px", y: yNode8 },
      { top: "90%", left: "15%", size: "280px", color: "rgba(16, 185, 129, 0.25)", blur: "25px", y: yNode9, rotate: true },
    ];

    return (
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
        {nodes.map((node, i) => {
          const rotation = node.rotate ? rotate1 : 0;
          return (
            <motion.div
              key={i}
              animate={node.rotate ? { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] } : {}}
              transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut" }}
              style={{
                y: node.y,
                rotate: rotation,
                position: "absolute",
                top: node.top,
                left: node.left,
                width: node.size,
                height: node.size,
                borderRadius: node.rotate ? "30% 70% 70% 30% / 30% 30% 70% 70%" : "50%",
                background: node.color,
                filter: `blur(${node.blur})`,
                border: node.rotate ? `4px solid ${node.color.replace('0.', '0.5')}` : "none",
                boxShadow: `0 0 100px ${node.color.replace('0.', '0.15')}`,
                opacity: 0.9
              }}
            />
          );
        })}
        
        {/* Extreme Bioluminescent Spark Field */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`p-${i}`}
            animate={{ 
              y: [0, -80, 0], 
              x: [0, 30, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.8, 1]
            }}
            transition={{ duration: 2 + (i % 5), repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: `${(i * 3.3) % 100}%`,
              left: `${(i * 19) % 100}%`,
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 25px #10b981, 0 0 50px rgba(16, 185, 129, 0.6)",
              zIndex: 1
            }}
          />
        ))}
      </div>
    );
  };

  const renderSidebar = () => {
    const links = [
      { id: 'menu', label: 'Farm Home' },
      { id: 'analysis', label: 'Test Soil & Fertilizer' },
      { id: 'ml', label: 'Smart Predictions' },
      { id: 'analytics', label: 'Farm Reports' },
      { id: 'chat', label: 'Ask AI Expert' }
    ];

    return (
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <div style={{ width: "32px", height: "32px", background: "#10b981", borderRadius: "8px", display: "grid", placeItems: "center", fontSize: "14px", fontWeight: "900", color: "#fff" }}>AP</div>
          <span>Advisor Pro</span>
        </div>
        <nav style={styles.sidebarNav}>
          {links.map(link => (
            <button key={link.id} onClick={() => scrollToSection(link.id)} style={styles.sidebarLink(activeTab === link.id)}>
              {link.label}
            </button>
          ))}
          {currentUser?.is_admin && (
            <button onClick={() => scrollToSection('admin')} style={styles.sidebarLink(activeTab === 'admin')}>
              Admin Console
            </button>
          )}
        </nav>
        <div style={styles.sidebarFooter}>
          <button style={{ ...styles.secondaryButton, width: "100%", textAlign: "left", color: "#f87171", border: "none" }} onClick={handleSignOut}>
             Sign Out
          </button>
        </div>
      </aside>
    );
  };

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
      
      {/* Global Sticky Train - Progress Tracker */}
      {renderTrain()}

      <motion.div 
        style={{ ...styles.mainContent, position: "relative", flex: 1, overflowY: "auto", backgroundColor: bgShift }} 
        ref={scrollRef}
      >
        {/* The Parallax Field - Spans entire scrollable height */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
          {renderParallax()}
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {renderTopBar()}

          <div style={styles.contentArea}>
            {message.text && (
              <div style={{ position: "sticky", top: "20px", zIndex: 1000, marginBottom: "32px", padding: "16px", borderRadius: "12px", background: message.type === 'error' ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)", color: message.type === 'error' ? "#f87171" : "#4ade80", border: `1px solid ${message.type === 'error' ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}`, fontWeight: "600", fontSize: "14px" }}>
                {message.text}
              </div>
            )}

            {/* ==================== SECTION: HOME ==================== */}
            <section id="section-menu" style={{ minHeight: "130vh", paddingBottom: "200px" }}>
              <h1 style={styles.pageTitle}>Welcome to Your Farm Dashboard</h1>
              <p style={styles.pageSubtitle}>See how your farm is performing today.</p>
              <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "32px" }}>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}><span style={styles.statLabel}>Total Analyses</span><span style={styles.statValue}>{history.length}</span></div>
                  <div style={styles.statCard}><span style={styles.statLabel}>Fertilizer Match</span><span style={styles.statValue}>{analytics?.compatibility_rate || 0}%</span></div>
                  <div style={styles.statCard}><span style={styles.statLabel}>Expected Growth</span><span style={styles.statValue}>{analytics?.average_score || 0}%</span></div>
                  <div style={styles.statCard}><span style={styles.statLabel}>System Status</span><span style={styles.statValue}>Healthy</span></div>
                </div>
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Recent Activity Log</h3>
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Date</th>
                          <th style={styles.th}>Crop Choice</th>
                          <th style={styles.th}>Soil Type</th>
                          <th style={styles.th}>Result</th>
                          <th style={styles.th}>Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.slice(0, 5).map((item, i) => (
                          <tr key={i}>
                            <td style={styles.td}>{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}</td>
                            <td style={td_style(item)}>{item.input_data?.Crop_Type}</td>
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
            </section>

            {/* ==================== SECTION: TEST ==================== */}
            <section id="section-analysis" style={{ minHeight: "130vh", paddingBottom: "200px" }}>
              <h1 style={styles.pageTitle}>Check Your Fertilizer</h1>
              <p style={styles.pageSubtitle}>Fill in your details to see if your fertilizer is right for your soil.</p>
              <div style={{ marginTop: "40px", display: "grid", gridTemplateColumns: "1fr 400px", gap: "32px" }}>
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Enter Farm Details</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Temperature (°C)</label><input type="number" style={styles.input} value={inputs.Temperature} onChange={(e) => setInputs({ ...inputs, Temperature: e.target.value })} /></div>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Moisture (%)</label><input type="number" style={styles.input} value={inputs.Moisture} onChange={(e) => setInputs({ ...inputs, Moisture: e.target.value })} /></div>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Select Soil Type</label><select style={styles.input} value={inputs.Soil_Type} onChange={(e) => setInputs({ ...inputs, Soil_Type: e.target.value })}>{soilTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Select Crop Type</label><select style={styles.input} value={inputs.Crop_Type} onChange={(e) => setInputs({ ...inputs, Crop_Type: e.target.value })}>{cropTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Select Fertilizer</label><select style={styles.input} value={inputs.Fertilizer_Name} onChange={(e) => setInputs({ ...inputs, Fertilizer_Name: e.target.value })}>{fertilizerNames.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Quantity (kg/ha)</label><input type="number" style={styles.input} value={inputs.Fertilizer_Quantity} onChange={(e) => setInputs({ ...inputs, Fertilizer_Quantity: e.target.value })} /></div>
                  </div>
                  <button style={{ ...styles.button, marginTop: "32px", width: "100%" }} onClick={handleAnalyze} disabled={loading}>{loading ? "Checking..." : "Check Compatibility"}</button>
                </div>

                <div>
                  {result ? (
                    <div style={styles.resultCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Final Result</h3>
                        <span style={styles.scoreBadge}>{result.overall_score}% Accuracy</span>
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
                      <div style={{ fontSize: "14px", color: "#10b981", fontWeight: "800", marginBottom: "16px" }}>SYSTEM IDLE</div>
                      <p style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>Run a test to see results here.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ==================== SECTION: ML ==================== */}
            <section id="section-ml" style={{ minHeight: "130vh", paddingBottom: "200px" }}>
              <h1 style={styles.pageTitle}>AI Farming Advice</h1>
              <p style={styles.pageSubtitle}>Get the best advice on what to plant next for better yields.</p>
              <div style={{ marginTop: "40px", ...styles.card }}>
                <MLModel />
              </div>
            </section>

            {/* ==================== SECTION: REPORTS ==================== */}
            <section id="section-analytics" style={{ minHeight: "130vh", paddingBottom: "200px" }}>
              <h1 style={styles.pageTitle}>Your Farm Reports</h1>
              <p style={styles.pageSubtitle}>Summary of all your past tests and farm health.</p>
              <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "32px" }}>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}><span style={styles.statLabel}>Total Tests Done</span><span style={styles.statValue}>{analytics?.total_analyses ?? 0}</span></div>
                  <div style={styles.statCard}><span style={styles.statLabel}>Success Rate</span><span style={styles.statValue}>{analytics?.compatibility_rate ?? 0}%</span></div>
                  <div style={styles.statCard}><span style={styles.statLabel}>Average Farm Score</span><span style={styles.statValue}>{analytics?.average_score ?? 0}%</span></div>
                </div>
                
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Farm Intelligence Summary</h3>
                  <div style={{ padding: "24px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
                     <p style={{ color: "#10b981", fontWeight: "900", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Personalized Advice (Last 20 Sessions)</p>
                     <p style={{ color: "#f1f5f9", fontWeight: "600", fontSize: "18px", lineHeight: "1.6", margin: 0 }}>
                       {getPersonalizedTip()}
                     </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================== SECTION: CHAT ==================== */}
            <section id="section-chat" style={{ minHeight: "130vh", paddingBottom: "200px" }}>
              <h1 style={styles.pageTitle}>Talk to AI Farm Expert</h1>
              <p style={styles.pageSubtitle}>Ask any question about farming or fertilizers.</p>
              <div style={{ marginTop: "40px" }}>
                <Chatbot />
              </div>
            </section>

            {/* ==================== SECTION: ADMIN ==================== */}
            {currentUser?.is_admin && (
              <section id="section-admin" style={{ minHeight: "130vh", paddingBottom: "200px" }}>
                <h1 style={styles.pageTitle}>Admin Console</h1>
                <p style={styles.pageSubtitle}>Manage users and farm settings.</p>
                <div style={{ marginTop: "40px", ...styles.card }}>
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
                              <tr>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Access</th>
                                <th style={styles.th}>Intel</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((u, i) => (
                                <tr key={i} style={{ background: selectedUserId === u._id ? "rgba(16, 185, 129, 0.05)" : "transparent" }}>
                                  <td style={styles.td}>{u.name}</td>
                                  <td style={styles.td}>{u.email}</td>
                                  <td style={styles.td}>{u.is_admin ? 'Admin' : 'User'}</td>
                                  <td style={styles.td}><button style={{ color: "#10b981", background: "none", border: "none", fontWeight: "800", cursor: "pointer" }} onClick={() => handleSelectUser(u._id)}>VIEW</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                       </div>
                       {selectedUserId && (
                         <div style={{ ...styles.card, background: "rgba(255,255,255,0.02)" }}>
                            <h4 style={{ ...styles.cardTitle, fontSize: "14px" }}>User Intelligence</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              <div style={{ fontSize: "12px" }}><span style={{ color: "#64748b" }}>Compatibility:</span> {userAnalytics?.compatibility_rate || 0}%</div>
                              <div style={{ fontSize: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px", fontWeight: "700" }}>Recent History</div>
                              {userHistory.slice(0, 3).map((h, i) => (
                                <div key={i} style={{ fontSize: "11px", padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "4px" }}>
                                  {h.crop_type} - {h.score}%
                                </div>
                              ))}
                            </div>
                         </div>
                       )}
                     </div>
                   ) : (
                     <div>
                       <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                         <input 
                           style={styles.input} 
                           placeholder={`Enter new ${adminManageType} record...`} 
                           value={newItem} 
                           onChange={(e) => setNewItem(e.target.value)} 
                         />
                         <button style={styles.button} onClick={handleAddItem}>Add Record</button>
                       </div>
                       <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                          {(adminManageType === 'soil' ? soilTypes : adminManageType === 'crop' ? cropTypes : fertilizerNames).map(item => (
                            <div key={item} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", borderRadius: "100px", fontSize: "12px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "8px" }}>
                              {item}
                              <button onClick={() => handleRemoveItem(item)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "800" }}>×</button>
                            </div>
                          ))}
                       </div>
                     </div>
                   )}
                </div>
              </section>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const td_style = (item) => ({
  padding: "16px",
  fontSize: "14px",
  color: (item.result?.overall_score || 0) > 70 ? "#10b981" : (item.result?.overall_score || 0) > 40 ? "#fbbf24" : "#f87171",
  fontWeight: "700",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
});

export default Dashboard;


