import React, { useState, useEffect, useCallback, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Chatbot from "../../components/Chatbot/Chatbot";
import MLModel from "../../components/ML/MLModel";
import api from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
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
    zIndex: -1,
    pointerEvents: "none"
  },

  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
    minWidth: 0
  },

  description: { fontSize: "14px", color: "#555", marginTop: "5px", lineHeight: "1.5" },
  fuzzyNameWrap: { minWidth: "150px" },
  fuzzyCountWrap: { minWidth: "96px", display: "flex", justifyContent: "flex-end" },
  analyticsContainer: { display: "flex", flexDirection: "column", gap: "20px" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px" },
  title: { fontSize: "22px", fontWeight: "700", letterSpacing: "0.5px" },
  welcome: { fontSize: "14px" },
  errorMessage: { color: "red", margin: "10px 0" },
  successMessage: { color: "green", margin: "10px 0" },
  resultCard: {
    background: "linear-gradient(135deg, #ffffff, #f1f5f9)",
    padding: "24px",
    borderRadius: "18px",
    marginBottom: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
    border: "1px solid rgba(226,232,240,0.8)"
  },
  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  resultTitle: { fontSize: "20px", fontWeight: "700", color: "#1a472a" },
  scoreCircle: {
    textAlign: "center",
    background: "linear-gradient(135deg, #4f46e5, #22c55e)",
    borderRadius: "50%",
    width: "70px",
    height: "70px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(79,70,229,0.35)"
  },
  scoreNumber: { fontSize: "20px", fontWeight: "800", color: "#fff", lineHeight: 1 },
  scoreLabel: { fontSize: "10px", color: "rgba(255,255,255,0.85)", marginTop: "2px" },
  resultGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" },
  resultItem: {
    padding: "12px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0"
  },
  resultLabel: { fontWeight: "700", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" },
  resultValue: { display: "block", fontWeight: "600", color: "#1e293b", fontSize: "14px" },
  resultDetail: { fontSize: "11px", color: "#94a3b8", marginTop: "2px", display: "block" },
  suggestionsBox: { marginTop: "12px", padding: "14px", background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", borderRadius: "12px", border: "1px solid #bbf7d0" },
  suggestionsTitle: { fontWeight: "700", color: "#166534", marginBottom: "8px", display: "block" },
  suggestion: { fontSize: "13px", color: "#15803d", marginBottom: "4px", lineHeight: "1.5" },
  pdfButton: {
    marginTop: "14px",
    padding: "10px 18px",
    background: "linear-gradient(135deg, #1a472a, #2e7d32)",
    color: "white",
    border: "none",
    cursor: "pointer",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    boxShadow: "0 4px 12px rgba(26,71,42,0.3)",
    transition: "all 0.2s ease"
  },
  historyCard: {
    background: "rgba(255,255,255,0.92)",
    padding: "22px",
    borderRadius: "18px",
    border: "1px solid rgba(226,232,240,0.8)",
    boxShadow: "0 8px 24px rgba(15,23,42,0.08)"
  },
  emptyText: { color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "20px 0" },
  adminContainer: { marginTop: "20px" },
  adminTitle: { fontSize: "20px", fontWeight: "bold" },
  adminTabs: { display: "flex", gap: "10px", marginBottom: "10px" },
  adminTab: (active) => ({ padding: "8px 16px", background: active ? "#2e7d32" : "#ccc", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }),
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
  userCard: (active) => ({ padding: "10px", border: "1px solid #ccc", marginBottom: "5px", borderRadius: "5px", background: active ? "#e8f5e9" : "white", cursor: "pointer" }),
  userBadge: { fontSize: "10px", color: "#fff", background: "#333", padding: "2px 5px", borderRadius: "3px", display: "inline-block", marginTop: "5px" },
  userDetails: { flex: 1 },
  summaryCard: {
    background: "linear-gradient(145deg, rgba(30,64,175,0.92), rgba(15,118,110,0.9))",
    padding: "16px", // Reduced
    borderRadius: "14px",
    boxShadow: "0 10px 25px rgba(15,23,42,0.15)",
    textAlign: "left",
    color: "white",
    border: "1px solid rgba(255,255,255,0.2)",
    position: "relative",
    overflow: "hidden"
  },
  summaryValue: { fontSize: "24px", fontWeight: "700", color: "#ffffff", display: "block", marginTop: "8px" },
  summaryLabel: { fontSize: "11px", color: "rgba(255,255,255,0.85)", marginTop: "4px", display: "block", textTransform: "uppercase", letterSpacing: "1px" },
  summaryIcon: { fontSize: "16px", width: "32px", height: "32px", display: "grid", placeItems: "center", borderRadius: "10px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" },
  label: { display: "block", marginBottom: "5px", fontWeight: "500", color: "#333" },
  nav: { display: "flex", gap: "10px", flexWrap: "wrap" },
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
  main: { marginTop: "20px", position: "relative", zIndex: 2 },

  agriCoreStage: {
    perspective: "2000px",
    width: "100%",
    height: "380px", // Increased for larger panels
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
    marginTop: "20px"
  },
  sideImageLeft: {
    position: "absolute",
    left: "30px", // Pushed slightly inward
    width: "280px", // Bigger
    height: "190px",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
    border: "2.5px solid rgba(74, 222, 128, 0.4)",
    transform: "rotateY(20deg)", // Softer tilt for better clarity
    zIndex: 2,
    opacity: 0.95,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  sideImageRight: {
    position: "absolute",
    right: "30px",
    width: "280px",
    height: "190px",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
    border: "2.5px solid rgba(74, 222, 128, 0.4)",
    transform: "rotateY(-20deg)",
    zIndex: 2,
    opacity: 0.95,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  sideImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  agriPlanetContainer: {
    position: "absolute",
    width: "120px",
    height: "120px",
    zIndex: 5,
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  digitalAgriCore: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: "radial-gradient(circle at 30% 30%, #4ade80, #166534, #064e3b)",
    boxShadow: "0 0 60px rgba(74, 222, 128, 0.4), inset -12px -12px 30px rgba(0,0,0,0.6)",
    position: "relative",
    display: "grid",
    placeItems: "center",
    fontSize: "40px",
    border: "2px solid rgba(74, 222, 128, 0.5)"
  },
  circuitOrbit: {
    position: "absolute",
    width: "280px",
    height: "70px",
    borderRadius: "50%",
    border: "2px dashed rgba(74, 222, 128, 0.25)",
    transform: "rotateX(78deg) rotateY(-10deg)",
    zIndex: 4,
    pointerEvents: "none",
    background: "radial-gradient(ellipse at center, transparent 60%, rgba(74, 222, 128, 0.03) 100%)"
  },
  agriOrbitRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    transformStyle: "preserve-3d",
    transform: "rotateX(78deg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  agriCardContainer: (angle) => ({
    position: "absolute",
    width: "170px",
    height: "115px",
    transformStyle: "preserve-3d",
    transform: `rotateY(${angle}deg) translateZ(210px) rotateY(${-angle}deg) rotateX(-78deg)`,
    transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)"
  }),
  agriCard: {
    width: "100%",
    height: "100%",
    background: "rgba(255, 255, 255, 0.96)",
    borderRadius: "16px",
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    border: "1px solid rgba(74, 222, 128, 0.3)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
    cursor: "pointer",
    boxSizing: "border-box"
  },
  agriCardTitle: { fontSize: "15px", fontWeight: "800", marginBottom: "5px", color: "#064e3b" },
  agriCardDesc: { fontSize: "10px", color: "#475569", lineHeight: "1.3", margin: 0 },
  cardTitle: { fontSize: "18px", fontWeight: "600", marginBottom: "10px", color: "#1a472a" },
  analysisGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: "25px",
    alignItems: "start"
  },
  inputGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "10px" },
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
  table: {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #e2e8f0",
    backgroundColor: "white"
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
  th: { padding: "12px", textAlign: "left", borderBottom: "2px solid #e2e8f0", borderRight: "1px solid #e2e8f0", fontWeight: "600", color: "#334155", background: "#f8fafc" },
  td: { padding: "12px", textAlign: "left", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0", color: "#1e293b" },

  chartCard: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    flex: 1,
    minWidth: "280px",
    position: "relative",
    overflow: "hidden"
  },
  chartList: { display: "flex", flexDirection: "column", gap: "12px" },
  chartItem: { display: "flex", alignItems: "center", gap: "12px" },
  chartName: { width: "80px", fontSize: "12px", fontWeight: "700", color: "#475569" },
  chartBar: { flex: 1, height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" },
  chartFill: { height: "100%", background: "linear-gradient(90deg, #10b981, #3b82f6)", borderRadius: "4px" },
  chartCount: { width: "30px", fontSize: "12px", fontWeight: "800", color: "#1a472a", textAlign: "right" },

  graphPaper: {
    backgroundImage: `
      linear-gradient(rgba(226, 232, 240, 0.4) 1px, transparent 1px),
      linear-gradient(90deg, rgba(226, 232, 240, 0.4) 1px, transparent 1px)
    `,
    backgroundSize: "20px 20px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1"
  },

  trendContainer: {
    marginTop: "20px",
    background: "#ffffff",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
    border: "1px solid #e2e8f0",
    width: "100%",
    boxSizing: "border-box"
  },
  trendSvg: { width: "100%", height: "180px", overflow: "visible" },
  trendPath: { fill: "none", stroke: "url(#lineGradient)", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" },
  trendArea: { fill: "url(#areaGradient)", stroke: "none" },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(15, 23, 42, 0.4)",
    backdropFilter: "blur(12px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  modalContent: {
    background: "linear-gradient(135deg, #ffffff, #f8fafc)",
    width: "100%",
    maxWidth: "900px",
    maxHeight: "90vh",
    borderRadius: "32px",
    overflowY: "auto",
    position: "relative",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
    padding: "48px",
    border: "1px solid rgba(255, 255, 255, 0.8)"
  },
  modalClose: {
    position: "absolute",
    top: "24px",
    right: "24px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "20px",
    color: "#64748b",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  },
  keynoteHeader: {
    marginBottom: "40px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "24px"
  },
  keynoteTitle: {
    fontSize: "36px",
    fontWeight: "900",
    color: "#1a472a",
    marginBottom: "8px",
    letterSpacing: "-1px",
    lineHeight: "1.1"
  },
  keynoteSubtitle: {
    fontSize: "16px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  keynoteBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  keynoteMainGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "40px"
  },
  keynoteSection: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)"
  },
  keynoteSectionTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#334155",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  keynoteDataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px"
  },
  keynoteParam: {
    padding: "16px",
    borderRadius: "16px",
    background: "#f8fafc",
    border: "1px solid #f1f5f9"
  },
  keynoteLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: "4px"
  },
  keynoteValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b"
  },
  keynoteScoreCard: {
    textAlign: "center",
    padding: "32px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #1a472a, #2e7d32)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 15px 30px rgba(26, 71, 42, 0.25)"
  },
  keynoteScoreValue: {
    fontSize: "64px",
    fontWeight: "900",
    lineHeight: "1"
  },
  keynoteScoreLabel: {
    fontSize: "14px",
    opacity: "0.9",
    marginTop: "8px",
    textTransform: "uppercase",
    letterSpacing: "2px"
  },
  keynoteSuggestions: {
    marginTop: "24px"
  },
  keynoteSuggestionItem: {
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#f0fdf4",
    borderLeft: "4px solid #22c55e",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#166534",
    lineHeight: "1.5"
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
  const [coreRotation, setCoreRotation] = useState(0);
  const [isCoreHovered, setIsCoreHovered] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    let frameId;
    const animate = () => {
      setCoreRotation(prev => prev + (isCoreHovered ? 0.15 : 0.6));
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isCoreHovered]);

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

  const loadUserData = async () => {
    try {
      console.log("📡 LOADING USER DATA...");
      const historyRes = await api.get('/history');
      const analyticsRes = await api.get('/analytics');

      console.log("🔍 HISTORY RESPONSE:", historyRes.data);
      console.log("🔍 ANALYTICS RESPONSE:", analyticsRes.data);

      if (historyRes.data.success && historyRes.data.history) {
        console.log("✅ SETTING HISTORY WITH", historyRes.data.history.length, "RECORDS");
        setHistory([...historyRes.data.history]);
      } else {
        console.log("❌ No history data or history API failed");
      }

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics);
      }
    } catch (err) {
      console.error("❌ Error loading user data:", err);
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

  const hasLoadedInitialData = useRef(false);

  useEffect(() => {
    if (!currentUser) return;
    if (hasLoadedInitialData.current) return;
    hasLoadedInitialData.current = true;
    const loadData = async () => {
      await fetchConfig();
      await loadUserData();
      if (currentUser.is_admin) await loadUsers();
    };
    loadData();
  }, [currentUser, fetchConfig, loadUsers]);

  useEffect(() => {
    if (history.length > 0 && !result) {
      const mostRecent = history[0];
      if (mostRecent.result) setResult(mostRecent.result);
    }
  }, [history, result]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await api.post('/predict', inputs);
      if (response.data.success) {
        setResult(response.data.result);
        showMessage('Analysis completed successfully!');
        await loadUserData();
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Analysis failed', 'error');
    } finally {
      setLoading(false);
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
      result.suggestions.forEach((s, i) => { doc.text(`• ${s}`, 20, finalY + 67 + (i * 7)); });
    }
    doc.save(`FarmReport_${inputs.Crop_Type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    let endpoint = '';
    if (adminManageType === 'soil') endpoint = '/admin/config/soil-types';
    else if (adminManageType === 'crop') endpoint = '/admin/config/crop-types';
    else endpoint = '/admin/config/fertilizer-names';
    try {
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
    let endpoint = '';
    if (adminManageType === 'soil') endpoint = `/admin/config/soil-types/${encodeURIComponent(item)}`;
    else if (adminManageType === 'crop') endpoint = `/admin/config/crop-types/${encodeURIComponent(item)}`;
    else endpoint = `/admin/config/fertilizer-names/${encodeURIComponent(item)}`;
    try {
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
      return { padding: "8px 12px", background: "#e74c3c", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" };
    }
    return {
      padding: "8px 14px",
      background: activeTab === tabName ? "linear-gradient(135deg, #4f46e5, #22c55e)" : "rgba(255,255,255,0.2)",
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
        <Silk speed={3} scale={1} color="#f59e0b" noiseIntensity={1.2} rotation={0} />
      </div>

      <header style={styles.header}>
        <div><h1 style={styles.title}>🌾 FarmAdvisor Pro</h1><p style={styles.welcome}>Welcome, {currentUser?.name || 'Farmer'}!</p></div>
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

      {message.text && <div style={message.type === 'error' ? styles.errorMessage : styles.successMessage}>{message.text}</div>}

      <main style={styles.main}>
        {activeTab === "menu" && (
          <div
            style={styles.agriCoreStage}
            onMouseEnter={() => setIsCoreHovered(true)}
            onMouseLeave={() => setIsCoreHovered(false)}
          >
            {/* Side Images */}
            <motion.div
              style={styles.sideImageLeft}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.05, opacity: 1 }}
            >
              <img src="/agritech_farm.png" alt="Agritech Farm" style={styles.sideImage} />
            </motion.div>

            <motion.div
              style={styles.sideImageRight}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.05, opacity: 1 }}
            >
              <img src="/agritech_drone.png" alt="Agritech Drone" style={styles.sideImage} />
            </motion.div>

            {/* The Holographic Agri-Core */}
            <div style={styles.agriPlanetContainer}>
              <motion.div
                style={styles.digitalAgriCore}
                animate={{ scale: [1, 1.05, 1], rotateZ: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                🌿
              </motion.div>
              <div style={styles.circuitOrbit} />
            </div>

            {/* The Orbiting Cards */}
            <div style={styles.agriOrbitRing}>
              {[
                { id: "analysis", title: "Analysis", icon: "🔬", desc: "Digital soil & weather profiling.", angle: 0 },
                { id: "ml", title: "ML Model", icon: "🤖", desc: "AI-driven nutrient predictions.", angle: 90 },
                { id: "analytics", title: "Analytics", icon: "📈", desc: "Farming performance insights.", angle: 180 },
                { id: "chat", title: "Chatbot", icon: "💬", desc: "Expert AI agricultural advice.", angle: 270 }
              ].map((item) => (
                <div
                  key={item.id}
                  style={styles.agriCardContainer(item.angle + coreRotation)}
                >
                  <motion.div
                    style={styles.agriCard}
                    whileHover={{ scale: 1.1, border: "1.5px solid #4ade80", boxShadow: "0 0 20px rgba(74, 222, 128, 0.2)" }}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <div style={{ fontSize: "26px", marginBottom: "8px" }}>{item.icon}</div>
                    <h3 style={styles.agriCardTitle}>{item.title}</h3>
                    <p style={styles.agriCardDesc}>{item.desc}</p>
                  </motion.div>
                </div>
              ))}
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
                  <div><label style={styles.label}>Temperature (°C)</label><input type="number" style={styles.input} value={inputs.Temperature} onChange={(e) => setInputs({ ...inputs, Temperature: parseFloat(e.target.value) })} /></div>
                  <div><label style={styles.label}>Moisture (%)</label><input type="number" style={styles.input} value={inputs.Moisture} onChange={(e) => setInputs({ ...inputs, Moisture: parseFloat(e.target.value) })} /></div>
                  <div><label style={styles.label}>Soil Type</label><select style={styles.input} value={inputs.Soil_Type} onChange={(e) => setInputs({ ...inputs, Soil_Type: e.target.value })}>{soilTypes.map((type) => (<option key={type} value={type}>{type}</option>))}</select></div>
                  <div><label style={styles.label}>Crop Type</label><select style={styles.input} value={inputs.Crop_Type} onChange={(e) => setInputs({ ...inputs, Crop_Type: e.target.value })}>{cropTypes.map((crop) => (<option key={crop} value={crop}>{crop}</option>))}</select></div>
                  <div><label style={styles.label}>Fertilizer</label><select style={styles.input} value={inputs.Fertilizer_Name} onChange={(e) => setInputs({ ...inputs, Fertilizer_Name: e.target.value })}>{fertilizerNames.map((fert) => (<option key={fert} value={fert}>{fert}</option>))}</select></div>
                  <div><label style={styles.label}>Quantity (kg/ha)</label><input type="number" style={styles.input} value={inputs.Fertilizer_Quantity} onChange={(e) => setInputs({ ...inputs, Fertilizer_Quantity: parseFloat(e.target.value) })} /></div>
                </div>
                <button style={styles.analyzeButton} onClick={handleAnalyze} disabled={loading}>{loading ? "Analyzing..." : "🔬 Analyze"}</button>
              </div>

              <div style={styles.rightPanel}>
                {result ? (
                  <div style={styles.resultCard}>
                    <div style={styles.resultHeader}>
                      <h2 style={styles.resultTitle}>{result.overall_compatibility}</h2>
                      <div style={styles.scoreCircle}><span style={styles.scoreNumber}>{result.overall_score}%</span><span style={styles.scoreLabel}>Overall</span></div>
                    </div>
                    <div style={styles.resultGrid}>
                      <div style={styles.resultItem}><span style={styles.resultLabel}>Temperature</span><span style={styles.resultValue}>{result.temperature_status}</span><span style={styles.resultDetail}>{result.temperature_range}</span></div>
                      <div style={styles.resultItem}><span style={styles.resultLabel}>Moisture</span><span style={styles.resultValue}>{result.moisture_status}</span><span style={styles.resultDetail}>{result.moisture_range}</span></div>
                      <div style={styles.resultItem}><span style={styles.resultLabel}>Soil</span><span style={styles.resultValue}>{result.soil_compatibility}</span></div>
                      <div style={styles.resultItem}><span style={styles.resultLabel}>Quantity</span><span style={styles.resultValue}>{result.quantity_status}</span><span style={styles.resultDetail}>{result.quantity_range}</span></div>
                    </div>
                    <div style={styles.suggestionsBox}><h3 style={styles.suggestionsTitle}>💡 Suggestions</h3>{result.suggestions?.map((s, i) => (<p key={i} style={styles.suggestion}>• {s}</p>))}</div>
                    <button style={styles.pdfButton} onClick={generatePDF}>📄 Download PDF Report</button>
                  </div>
                ) : (
                  <div style={{
                    background: "#eef2ff",
                    border: "2px dashed #818cf8",
                    borderRadius: "18px",
                    padding: "40px 24px",
                    textAlign: "center",
                    minHeight: "200px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <div style={{ fontSize: "52px", marginBottom: "14px" }}>🔬</div>
                    <p style={{ color: "#4338ca", fontWeight: "700", fontSize: "16px", margin: "0 0 8px 0" }}>No Result Yet</p>
                    <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Fill in your farm details on the left and click Analyze.</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              background: "#ffffff",
              border: "2px solid #e2e8f0",
              borderRadius: "18px",
              padding: "24px",
              marginTop: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
            }}>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1a472a", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                📋 Recent Analyses
              </h3>

              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <div style={{ fontSize: "44px", marginBottom: "12px" }}>📭</div>
                  <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>No analyses yet — run your first analysis above!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {history.slice(0, 10).map((item, idx) => {
                    const score = item.result?.overall_score || 0;
                    const compat = item.result?.overall_compatibility || "N/A";
                    const scoreColor = score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
                    const scoreBg = score >= 75 ? "#dcfce7" : score >= 50 ? "#fef9c3" : "#fee2e2";
                    return (
                      <motion.div
                        key={idx}
                        onClick={() => setSelectedAnalysis(item)}
                        whileHover={{ scale: 1.02, x: 5, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 18px",
                          borderRadius: "12px",
                          background: idx % 2 === 0 ? "#f8fafc" : "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span style={{
                            width: "34px", height: "34px", borderRadius: "50%",
                            background: "linear-gradient(135deg, #4f46e5, #22c55e)",
                            color: "white", fontSize: "13px", fontWeight: "700",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                          }}>{idx + 1}</span>
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>
                              🌾 {item.input_data?.Crop_Type || "N/A"}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px" }}>
                              💊 {item.input_data?.Fertilizer_Name || "N/A"} &nbsp;|&nbsp; 🌡️ {item.input_data?.Temperature || "—"}°C &nbsp;|&nbsp; 💧 {item.input_data?.Moisture || "—"}%
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                          <span style={{
                            padding: "4px 12px", borderRadius: "20px",
                            background: scoreBg, color: scoreColor,
                            fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap",
                            border: `1px solid ${scoreColor}30`
                          }}>{compat}</span>
                          <span style={{ fontSize: "18px", fontWeight: "800", color: scoreColor, minWidth: "42px", textAlign: "right" }}>
                            {score}%
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <AnimatePresence>
              {selectedAnalysis && (
                <motion.div
                  style={styles.modalOverlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedAnalysis(null)}
                >
                  <motion.div
                    style={styles.modalContent}
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      style={styles.modalClose}
                      onClick={() => setSelectedAnalysis(null)}
                      whileHover={{ scale: 1.1, background: "#fee2e2", color: "#ef4444" }}
                    >
                      ✕
                    </button>

                    <div style={styles.keynoteHeader}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                        <span style={{ ...styles.keynoteBadge, background: selectedAnalysis.result?.overall_score >= 75 ? "#dcfce7" : "#fee2e2", color: selectedAnalysis.result?.overall_score >= 75 ? "#16a34a" : "#dc2626" }}>
                          {selectedAnalysis.result?.overall_compatibility || "Analysis Result"}
                        </span>
                        <span style={{ fontSize: "14px", color: "#94a3b8" }}>
                          {new Date(selectedAnalysis.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <h2 style={styles.keynoteTitle}>
                        {selectedAnalysis.input_data?.Crop_Type} Crop Analysis
                      </h2>
                      <div style={styles.keynoteSubtitle}>
                        <span>👨‍🌾 {currentUser?.name}</span>
                        <span>|</span>
                        <span>📍 {currentUser?.farm_details?.location || "Primary Farm"}</span>
                      </div>
                    </div>

                    <div style={styles.keynoteMainGrid}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div style={styles.keynoteSection}>
                          <h3 style={styles.keynoteSectionTitle}>📋 Input Parameters</h3>
                          <div style={styles.keynoteDataGrid}>
                            <div style={styles.keynoteParam}>
                              <span style={styles.keynoteLabel}>Soil Type</span>
                              <span style={styles.keynoteValue}>{selectedAnalysis.input_data?.Soil_Type}</span>
                            </div>
                            <div style={styles.keynoteParam}>
                              <span style={styles.keynoteLabel}>Fertilizer</span>
                              <span style={styles.keynoteValue}>{selectedAnalysis.input_data?.Fertilizer_Name}</span>
                            </div>
                            <div style={styles.keynoteParam}>
                              <span style={styles.keynoteLabel}>Temperature</span>
                              <span style={styles.keynoteValue}>{selectedAnalysis.input_data?.Temperature}°C</span>
                            </div>
                            <div style={styles.keynoteParam}>
                              <span style={styles.keynoteLabel}>Moisture</span>
                              <span style={styles.keynoteValue}>{selectedAnalysis.input_data?.Moisture}%</span>
                            </div>
                            <div style={styles.keynoteParam}>
                              <span style={styles.keynoteLabel}>Quantity</span>
                              <span style={styles.keynoteValue}>{selectedAnalysis.input_data?.Fertilizer_Quantity} kg/ha</span>
                            </div>
                          </div>
                        </div>

                        <div style={styles.keynoteSection}>
                          <h3 style={styles.keynoteSectionTitle}>💡 Key Suggestions</h3>
                          <div style={styles.keynoteSuggestions}>
                            {selectedAnalysis.result?.suggestions?.map((s, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={styles.keynoteSuggestionItem}
                              >
                                • {s}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div style={{
                          ...styles.keynoteScoreCard,
                          background: selectedAnalysis.result?.overall_score >= 75
                            ? "linear-gradient(135deg, #166534, #22c55e)"
                            : selectedAnalysis.result?.overall_score >= 50
                              ? "linear-gradient(135deg, #92400e, #f59e0b)"
                              : "linear-gradient(135deg, #991b1b, #ef4444)"
                        }}>
                          <span style={styles.keynoteScoreValue}>{selectedAnalysis.result?.overall_score}%</span>
                          <span style={styles.keynoteScoreLabel}>Overall Compatibility</span>
                        </div>

                        <div style={styles.keynoteSection}>
                          <h3 style={styles.keynoteSectionTitle}>📊 Performance</h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {[
                              { label: "Temperature", status: selectedAnalysis.result?.temperature_status },
                              { label: "Moisture", status: selectedAnalysis.result?.moisture_status },
                              { label: "Soil", status: selectedAnalysis.result?.soil_compatibility },
                              { label: "Quantity", status: selectedAnalysis.result?.quantity_status }
                            ].map((stat, i) => (
                              <div key={i}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>{stat.label}</span>
                                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>{stat.status}</span>
                                </div>
                                <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: stat.status === "Optimal" || stat.status === "Compatible" ? "100%" : stat.status?.includes("Moderate") ? "60%" : "30%" }}
                                    style={{
                                      height: "100%",
                                      background: stat.status === "Optimal" || stat.status === "Compatible" ? "#22c55e" : stat.status?.includes("Moderate") ? "#f59e0b" : "#ef4444"
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          style={{
                            ...styles.pdfButton,
                            width: "100%",
                            padding: "16px",
                            borderRadius: "16px",
                            marginTop: "auto"
                          }}
                          onClick={() => {
                            setInputs(selectedAnalysis.input_data);
                            setResult(selectedAnalysis.result);
                            generatePDF();
                          }}
                        >
                          📄 Download Keynote PDF
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {activeTab === 'ml' && (
          <div style={{ ...styles.card, backdropFilter: "none" }}>
            <h2 style={styles.cardTitle}>ML Model Analysis</h2>
            <MLModel />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={styles.analyticsContainer}>
            {analytics ? (
              <>
                {/* 1. Compact Summary Header */}
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryCard}>
                    <div style={styles.summaryIcon}>📊</div>
                    <span style={styles.summaryValue}>{analytics.total_analyses}</span>
                    <span style={styles.summaryLabel}>Analyses</span>
                  </div>
                  <div style={styles.summaryCard}>
                    <div style={styles.summaryIcon}>✅</div>
                    <span style={styles.summaryValue}>{analytics.compatibility_rate}%</span>
                    <span style={styles.summaryLabel}>Success</span>
                  </div>
                  <div style={styles.summaryCard}>
                    <div style={styles.summaryIcon}>🎯</div>
                    <span style={styles.summaryValue}>{analytics.average_score}%</span>
                    <span style={styles.summaryLabel}>Avg Score</span>
                  </div>
                  <div style={styles.summaryCard}>
                    <div style={styles.summaryIcon}>📅</div>
                    <span style={styles.summaryValue}>{history.length}</span>
                    <span style={styles.summaryLabel}>Sessions</span>
                  </div>
                </div>

                {/* 2. Visual Grid (The Big Charts) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px", marginTop: "10px" }}>

                  {/* CHART 1: Crop Distribution (PIE) */}
                  <div style={{ ...styles.chartCard, ...styles.graphPaper }}>
                    <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#1e293b", fontWeight: "800" }}>CROP DISTRIBUTION MATRIX</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      <svg width="140" height="140" viewBox="0 0 40 40">
                        {(() => {
                          let total = Object.values(analytics.crop_distribution).reduce((a, b) => a + b, 0);
                          let currentAngle = 0;
                          const colors = ["#10b981", "#3b82f6", "#6366f1", "#f59e0b", "#ef4444"];
                          return Object.entries(analytics.crop_distribution).map(([crop, count], idx) => {
                            const percent = (count / total) * 100;
                            const dashArray = `${percent} ${100 - percent}`;
                            const dashOffset = -currentAngle;
                            currentAngle += percent;
                            return (
                              <circle key={crop} r="15.9" cx="20" cy="20" fill="transparent"
                                stroke={colors[idx % colors.length]} strokeWidth="6"
                                strokeDasharray={dashArray} strokeDashoffset={dashOffset}
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div style={{ flex: 1, fontSize: "12px" }}>
                        {Object.entries(analytics.crop_distribution).map(([crop, count], idx) => (
                          <div key={crop} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ color: "#64748b" }}>● {crop}</span>
                            <span style={{ fontWeight: "700" }}>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CHART 2: Fertilizer Pulse (BARS) */}
                  <div style={{ ...styles.chartCard, ...styles.graphPaper }}>
                    <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#1e293b", fontWeight: "800" }}>NUTRIENT PULSE (APPLICATION)</h4>
                    <div style={styles.chartList}>
                      {Object.entries(analytics.fertilizer_distribution).slice(0, 5).map(([fert, count]) => (
                        <div key={fert} style={styles.chartItem}>
                          <div style={styles.chartName}>{fert}</div>
                          <div style={styles.chartBar}>
                            <div style={{ ...styles.chartFill, width: `${(count / analytics.total_analyses) * 100}%` }} />
                          </div>
                          <div style={styles.chartCount}>{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CHART 3: Environmental Correlation (SCATTER) */}
                  <div style={{ ...styles.chartCard, ...styles.graphPaper }}>
                    <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#1e293b", fontWeight: "800" }}>ENVIRONMENTAL CORRELATION (TEMP VS SCORE)</h4>
                    <svg width="100%" height="120" style={{ overflow: "visible" }}>
                      <line x1="0" y1="110" x2="100%" y2="110" stroke="#cbd5e1" strokeWidth="1" />
                      <line x1="10" y1="0" x2="10" y2="110" stroke="#cbd5e1" strokeWidth="1" />
                      {history.slice(0, 15).map((h, i) => {
                        const x = (h.input_data?.temperature || 25) * 2;
                        const y = 110 - (h.result?.overall_score || 0);
                        return <circle key={i} cx={`${(x / 60) * 100}%`} cy={y} r="4" fill="#3b82f6" opacity="0.6" />;
                      })}
                    </svg>
                  </div>

                  {/* CHART 4: Statistical Reliability (BOX PLOT) */}
                  <div style={{ ...styles.chartCard, ...styles.graphPaper }}>
                    <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#1e293b", fontWeight: "800" }}>STATISTICAL RELIABILITY AUDIT</h4>
                    <div style={{ display: "flex", flexDirection: "column", height: "120px", justifyContent: "center", padding: "0 40px" }}>
                      <div style={{ height: "2px", background: "#cbd5e1", position: "relative" }}>
                        <div style={{ position: "absolute", left: "20%", right: "20%", top: "-15px", bottom: "-15px", border: "2px solid #10b981", background: "rgba(16, 185, 129, 0.1)" }} />
                        <div style={{ position: "absolute", left: "50%", top: "-15px", bottom: "-15px", width: "2px", background: "#10b981" }} />
                        <div style={{ position: "absolute", left: "10%", top: "-10px", height: "20px", width: "2px", background: "#64748b" }} />
                        <div style={{ position: "absolute", right: "10%", top: "-10px", height: "20px", width: "2px", background: "#64748b" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "25px", fontSize: "10px", color: "#94a3b8", fontWeight: "800" }}>
                        <span>LOWER_BOUND</span>
                        <span>MEDIAN_TRUST</span>
                        <span>UPPER_BOUND</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Performance Trend (Line Chart) */}
                <div style={{ ...styles.trendContainer, ...styles.graphPaper }}>
                  <h4 style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#1e293b", fontWeight: "800" }}>HISTORICAL PERFORMANCE TREND</h4>
                  <svg style={styles.trendSvg} viewBox="0 0 1000 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M 0 ${160 - (history[0]?.result?.overall_score || 0) * 1.4} ${history.slice(1, 15).map((h, i) => `L ${(i + 1) * 71} ${160 - (h.result?.overall_score || 0) * 1.4}`).join(' ')}`}
                      style={styles.trendPath}
                    />
                    {history.slice(0, 15).map((h, i) => (
                      <circle key={i} cx={i * 71} cy={160 - (h.result?.overall_score || 0) * 1.4} r="4" fill="#ffffff" stroke="#22c55e" strokeWidth="2" />
                    ))}
                  </svg>
                </div>
              </>
            ) : (<p>Loading system analytics...</p>)}
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
              {adminManageType === 'soil' && (<div style={styles.manageSection}><h3>Manage Soil Types</h3><div style={styles.addItemRow}><input type="text" placeholder="New soil type" value={newItem} onChange={(e) => setNewItem(e.target.value)} style={styles.input} /><button onClick={handleAddItem} style={styles.addButton}>Add</button></div><ul style={styles.itemList}>{soilTypes.map(type => (<li key={type} style={styles.listItem}>{type}<button onClick={() => handleRemoveItem(type)} style={styles.removeButton}>×</button></li>))}</ul></div>)}
              {adminManageType === 'crop' && (<div style={styles.manageSection}><h3>Manage Crop Types</h3><div style={styles.addItemRow}><input type="text" placeholder="New crop type" value={newItem} onChange={(e) => setNewItem(e.target.value)} style={styles.input} /><button onClick={handleAddItem} style={styles.addButton}>Add</button></div><ul style={styles.itemList}>{cropTypes.map(crop => (<li key={crop} style={styles.listItem}>{crop}<button onClick={() => handleRemoveItem(crop)} style={styles.removeButton}>×</button></li>))}</ul></div>)}
              {adminManageType === 'fertilizer' && (<div style={styles.manageSection}><h3>Manage Fertilizer Names</h3><div style={styles.addItemRow}><input type="text" placeholder="New fertilizer" value={newItem} onChange={(e) => setNewItem(e.target.value)} style={styles.input} /><button onClick={handleAddItem} style={styles.addButton}>Add</button></div><ul style={styles.itemList}>{fertilizerNames.map(fert => (<li key={fert} style={styles.listItem}>{fert}<button onClick={() => handleRemoveItem(fert)} style={styles.removeButton}>×</button></li>))}</ul></div>)}
              {adminManageType === 'users' && (
                <div style={styles.userSection}>
                  <h3>All Users</h3>
                  <div style={styles.userGrid}>
                    <div style={styles.userList}>{users.map(user => (<div key={user._id} style={styles.userCard(selectedUserId === user._id)} onClick={() => handleSelectUser(user._id)}><strong>{user.name}</strong><div><small>{user.email}</small></div><span style={styles.userBadge}>{user.is_admin ? 'Admin' : 'User'}</span></div>))}</div>
                    {selectedUserId && (
                      <div style={styles.userDetails}>
                        <h4>User Analytics</h4>
                        {userAnalytics ? (<><p>Total Analyses: {userAnalytics.total_analyses}</p><p>Success Rate: {userAnalytics.compatibility_rate}%</p><p>Avg Score: {userAnalytics.average_score}%</p><h5>Recent History</h5><table style={styles.table}><thead><tr><th style={styles.th}>Crop</th><th style={styles.th}>Fertilizer</th><th style={styles.th}>Status</th><th style={styles.th}>Score</th></tr></thead><tbody>{userHistory.map((item, i) => (<tr key={i}><td style={styles.td}>{item.crop_type}</td><td style={styles.td}>{item.fertilizer}</td><td style={styles.td}>{item.compatibility}</td><td style={styles.td}>{item.score}%</td></tr>))}</tbody></table></>) : (<p>Select a user to view analytics</p>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{ ...styles.card, backdropFilter: "none" }}>
            <h2 style={styles.cardTitle}>Farm Chatbot</h2>
            <Chatbot />
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;

