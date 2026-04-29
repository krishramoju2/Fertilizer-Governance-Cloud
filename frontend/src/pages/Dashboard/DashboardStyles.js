export const styles = {
  app: {
    padding: "30px",
    background: "linear-gradient(135deg, #020617 0%, #064e3b 100%)",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    zIndex: 1,
    color: "#f8fafc"
  },
  silkBackground: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: -1,
    pointerEvents: "none",
    opacity: 0.4
  },

  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    width: "100%",
    minWidth: 0
  },

  description: { fontSize: "14px", color: "#94a3b8", marginTop: "5px", lineHeight: "1.6" },
  fuzzyNameWrap: { minWidth: "150px" },
  fuzzyCountWrap: { minWidth: "96px", display: "flex", justifyContent: "flex-end" },
  analyticsContainer: { display: "flex", flexDirection: "column", gap: "24px" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" },
  title: { 
    fontSize: "26px", 
    fontWeight: "900", 
    letterSpacing: "0.5px",
    background: "linear-gradient(90deg, #4ade80, #3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  welcome: { fontSize: "14px", color: "#94a3b8", letterSpacing: "0.5px" },
  errorMessage: { color: "#ef4444", margin: "10px 0", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" },
  successMessage: { color: "#22c55e", margin: "10px 0", background: "rgba(34, 197, 94, 0.1)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(34, 197, 94, 0.2)" },
  
  resultCard: {
    background: "rgba(15, 23, 42, 0.7)",
    backdropFilter: "blur(20px)",
    padding: "36px",
    borderRadius: "24px",
    marginBottom: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    border: "1px solid rgba(74, 222, 128, 0.2)",
    color: "white",
    position: "relative",
    overflow: "hidden"
  },
  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  resultTitle: { fontSize: "24px", fontWeight: "900", color: "#4ade80", textShadow: "0 0 20px rgba(74,222,128,0.4)" },
  scoreCircle: {
    textAlign: "center",
    background: "radial-gradient(circle at 30% 30%, #4f46e5, #22c55e)",
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 30px rgba(34,197,94,0.4), inset -5px -5px 15px rgba(0,0,0,0.4)",
    border: "2px solid rgba(255,255,255,0.1)"
  },
  scoreNumber: { fontSize: "24px", fontWeight: "900", color: "#fff", lineHeight: 1 },
  scoreLabel: { fontSize: "10px", color: "rgba(255,255,255,0.85)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "1px" },
  resultGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" },
  resultItem: {
    padding: "16px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    transition: "transform 0.3s ease, background 0.3s ease",
    cursor: "default"
  },
  resultLabel: { fontWeight: "700", fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" },
  resultValue: { display: "block", fontWeight: "800", color: "#f8fafc", fontSize: "16px" },
  resultDetail: { fontSize: "12px", color: "#cbd5e1", marginTop: "4px", display: "block" },
  suggestionsBox: { marginTop: "16px", padding: "20px", background: "rgba(34, 197, 94, 0.05)", borderRadius: "16px", border: "1px solid rgba(34, 197, 94, 0.2)", backdropFilter: "blur(10px)" },
  suggestionsTitle: { fontWeight: "800", color: "#4ade80", marginBottom: "12px", display: "block", fontSize: "15px", letterSpacing: "0.5px" },
  suggestion: { fontSize: "14px", color: "#e2e8f0", marginBottom: "8px", lineHeight: "1.6", display: "flex", gap: "8px" },
  pdfButton: {
    marginTop: "20px",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #059669, #10b981)",
    color: "white",
    border: "none",
    cursor: "pointer",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "14px",
    letterSpacing: "0.5px",
    boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
    transition: "all 0.3s ease"
  },
  historyCard: {
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(16px)",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.4)"
  },
  emptyText: { color: "#64748b", fontSize: "15px", textAlign: "center", padding: "30px 0" },
  
  // Admin Styles
  adminContainer: { marginTop: "24px" },
  adminTitle: { fontSize: "24px", fontWeight: "800", color: "#f8fafc", marginBottom: "20px" },
  adminTabs: { display: "flex", gap: "12px", marginBottom: "20px" },
  adminTab: (active) => ({ 
    padding: "10px 20px", 
    background: active ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.05)", 
    color: active ? "white" : "#94a3b8", 
    border: "1px solid rgba(255,255,255,0.1)", 
    borderRadius: "10px", 
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s ease"
  }),
  adminContent: {},
  manageSection: { background: "rgba(15,23,42,0.5)", padding: "24px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)" },
  addItemRow: { display: "flex", gap: "12px", marginBottom: "20px" },
  addButton: { padding: "12px 24px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" },
  itemList: { listStyle: "none", padding: 0 },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", borderRadius: "8px", marginBottom: "8px" },
  removeButton: { background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", transition: "all 0.2s" },
  userSection: {},
  userGrid: { display: "flex", gap: "24px" },
  userList: { width: "35%", maxHeight: "500px", overflowY: "auto", paddingRight: "10px" },
  userCard: (active) => ({ 
    padding: "16px", 
    border: active ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.05)", 
    marginBottom: "12px", 
    borderRadius: "16px", 
    background: active ? "rgba(16,185,129,0.1)" : "rgba(15,23,42,0.6)", 
    cursor: "pointer",
    transition: "all 0.2s"
  }),
  userBadge: { fontSize: "10px", color: "#10b981", background: "rgba(16,185,129,0.15)", padding: "4px 8px", borderRadius: "6px", display: "inline-block", marginTop: "8px", fontWeight: "bold", border: "1px solid rgba(16,185,129,0.3)" },
  userDetails: { flex: 1 },

  summaryCard: {
    background: "linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(2, 6, 23, 0.9))",
    backdropFilter: "blur(20px)",
    padding: "24px",
    borderRadius: "20px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
    textAlign: "left",
    color: "white",
    border: "1px solid rgba(74, 222, 128, 0.15)",
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.3s ease, box-shadow 0.3s ease"
  },
  summaryValue: { fontSize: "32px", fontWeight: "900", color: "#4ade80", display: "block", marginTop: "12px", textShadow: "0 0 15px rgba(74,222,128,0.3)" },
  summaryLabel: { fontSize: "12px", color: "#94a3b8", marginTop: "4px", display: "block", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "700" },
  summaryIcon: { fontSize: "20px", width: "40px", height: "40px", display: "grid", placeItems: "center", borderRadius: "12px", background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" },
  
  card: {
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(20px)",
    padding: "36px",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
  },
  label: { display: "block", marginBottom: "8px", fontWeight: "700", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" },
  nav: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" },
  analyzeButton: {
    marginTop: "30px",
    width: "100%",
    padding: "18px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
    letterSpacing: "1px",
    textTransform: "uppercase"
  },
  main: { marginTop: "24px", position: "relative", zIndex: 2 },

  // AgriCore Stage
  agriCoreStage: {
    perspective: "2000px",
    width: "100%",
    height: "420px", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
    marginTop: "20px"
  },
  sideImageLeft: {
    position: "absolute",
    left: "20px", 
    width: "300px", 
    height: "220px",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 25px 50px rgba(0,0,0,0.6), 0 0 30px rgba(74,222,128,0.15)",
    border: "1px solid rgba(74, 222, 128, 0.3)",
    transform: "rotateY(25deg) translateZ(-50px)", 
    zIndex: 2,
    opacity: 0.85,
    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    filter: "brightness(0.8) contrast(1.2)"
  },
  sideImageRight: {
    position: "absolute",
    right: "20px",
    width: "300px",
    height: "220px",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 25px 50px rgba(0,0,0,0.6), 0 0 30px rgba(74,222,128,0.15)",
    border: "1px solid rgba(74, 222, 128, 0.3)",
    transform: "rotateY(-25deg) translateZ(-50px)",
    zIndex: 2,
    opacity: 0.85,
    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    filter: "brightness(0.8) contrast(1.2)"
  },
  sideImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  agriPlanetContainer: {
    position: "absolute",
    width: "140px",
    height: "140px",
    zIndex: 5,
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  digitalAgriCore: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    background: "radial-gradient(circle at 30% 30%, #4ade80, #10b981, #064e3b, #020617)",
    boxShadow: "0 0 80px rgba(16, 185, 129, 0.5), inset -15px -15px 40px rgba(0,0,0,0.8)",
    position: "relative",
    display: "grid",
    placeItems: "center",
    fontSize: "50px",
    border: "2px solid rgba(16, 185, 129, 0.6)"
  },
  circuitOrbit: {
    position: "absolute",
    width: "340px",
    height: "90px",
    borderRadius: "50%",
    border: "2px dashed rgba(74, 222, 128, 0.4)",
    transform: "rotateX(75deg) rotateY(-10deg)",
    zIndex: 4,
    pointerEvents: "none",
    background: "radial-gradient(ellipse at center, transparent 60%, rgba(74, 222, 128, 0.05) 100%)",
    boxShadow: "0 0 40px rgba(74, 222, 128, 0.1)"
  },
  agriOrbitRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    transformStyle: "preserve-3d",
    transform: "rotateX(75deg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  agriCardContainer: (angle) => ({
    position: "absolute",
    width: "200px",
    height: "130px",
    transformStyle: "preserve-3d",
    transform: `rotateY(${angle}deg) translateZ(260px) rotateY(${-angle}deg) rotateX(-75deg)`,
    transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)"
  }),
  agriCard: {
    width: "100%",
    height: "100%",
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    border: "1px solid rgba(74, 222, 128, 0.4)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.5), inset 0 0 20px rgba(74,222,128,0.1)",
    cursor: "pointer",
    boxSizing: "border-box"
  },
  agriCardTitle: { fontSize: "16px", fontWeight: "900", marginBottom: "8px", color: "#4ade80", letterSpacing: "0.5px" },
  agriCardDesc: { fontSize: "11px", color: "#94a3b8", lineHeight: "1.4", margin: 0 },
  
  cardTitle: { fontSize: "22px", fontWeight: "900", marginBottom: "20px", color: "#f8fafc", letterSpacing: "0.5px" },
  analysisGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
    gap: "32px",
    alignItems: "start"
  },
  inputGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "12px" },
  input: {
    width: "100%",
    padding: "16px 20px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxSizing: "border-box",
    background: "rgba(2, 6, 23, 0.6)",
    color: "#f8fafc",
    boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)"
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
    backgroundColor: "transparent",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  header: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    padding: "24px 32px",
    marginBottom: "32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "24px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.05)",
    position: "relative",
    zIndex: 2
  },
  th: { padding: "16px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: "800", color: "#94a3b8", background: "rgba(2,6,23,0.8)", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" },
  td: { padding: "16px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#e2e8f0", background: "rgba(15,23,42,0.4)" },

  chartCard: {
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(12px)",
    padding: "24px",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.08)",
    flex: 1,
    minWidth: "280px",
    position: "relative",
    overflow: "hidden"
  },
  chartList: { display: "flex", flexDirection: "column", gap: "16px" },
  chartItem: { display: "flex", alignItems: "center", gap: "16px" },
  chartName: { width: "90px", fontSize: "13px", fontWeight: "700", color: "#94a3b8" },
  chartBar: { flex: 1, height: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "5px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.02)" },
  chartFill: { height: "100%", background: "linear-gradient(90deg, #10b981, #3b82f6)", borderRadius: "5px", boxShadow: "0 0 10px rgba(16,185,129,0.5)" },
  chartCount: { width: "35px", fontSize: "13px", fontWeight: "900", color: "#4ade80", textAlign: "right" },

  graphPaper: {
    backgroundImage: `
      linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
    `,
    backgroundSize: "30px 30px",
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px"
  },

  trendContainer: {
    marginTop: "24px",
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(12px)",
    padding: "32px",
    borderRadius: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.08)",
    width: "100%",
    boxSizing: "border-box"
  },
  trendSvg: { width: "100%", height: "220px", overflow: "visible" },
  trendPath: { fill: "none", stroke: "url(#lineGradient)", strokeWidth: 4, strokeLinecap: "round", strokeLinejoin: "round", filter: "drop-shadow(0px 10px 10px rgba(16,185,129,0.4))" },
  trendArea: { fill: "url(#areaGradient)", stroke: "none" },
  
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(2, 6, 23, 0.8)",
    backdropFilter: "blur(20px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  modalContent: {
    background: "linear-gradient(135deg, #0f172a, #020617)",
    width: "100%",
    maxWidth: "1000px",
    maxHeight: "90vh",
    borderRadius: "32px",
    overflowY: "auto",
    position: "relative",
    boxShadow: "0 30px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16,185,129,0.1)",
    padding: "48px",
    border: "1px solid rgba(74, 222, 128, 0.2)",
    color: "#f8fafc"
  },
  modalClose: {
    position: "absolute",
    top: "24px",
    right: "24px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "24px",
    color: "#94a3b8",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
  },
  keynoteHeader: {
    marginBottom: "40px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: "32px"
  },
  keynoteTitle: {
    fontSize: "42px",
    fontWeight: "900",
    background: "linear-gradient(90deg, #4ade80, #3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "12px",
    letterSpacing: "-1px",
    lineHeight: "1.1"
  },
  keynoteSubtitle: {
    fontSize: "16px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    fontWeight: "600"
  },
  keynoteBadge: {
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "1px",
    background: "rgba(16,185,129,0.15)",
    color: "#4ade80",
    border: "1px solid rgba(16,185,129,0.3)"
  },
  keynoteMainGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "48px"
  },
  keynoteSection: {
    background: "rgba(255,255,255,0.02)",
    padding: "32px",
    borderRadius: "24px",
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "inset 0 0 20px rgba(0,0,0,0.2)"
  },
  keynoteSectionTitle: {
    fontSize: "18px",
    fontWeight: "900",
    color: "#e2e8f0",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textTransform: "uppercase",
    letterSpacing: "1.5px"
  },
  keynoteDataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px"
  },
  keynoteParam: {
    padding: "20px",
    borderRadius: "16px",
    background: "rgba(2,6,23,0.5)",
    border: "1px solid rgba(255,255,255,0.03)",
    transition: "transform 0.2s"
  },
  keynoteLabel: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "1px",
    display: "block",
    marginBottom: "8px"
  },
  keynoteValue: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#f8fafc"
  },
  keynoteScoreCard: {
    textAlign: "center",
    padding: "40px",
    borderRadius: "24px",
    background: "radial-gradient(circle at top right, #10b981, #064e3b)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 20px 40px rgba(16,185,129,0.3)",
    position: "relative",
    overflow: "hidden"
  },
  keynoteScoreValue: {
    fontSize: "80px",
    fontWeight: "900",
    lineHeight: "1",
    textShadow: "0 10px 20px rgba(0,0,0,0.3)"
  },
  keynoteScoreLabel: {
    fontSize: "15px",
    opacity: "0.9",
    marginTop: "12px",
    textTransform: "uppercase",
    letterSpacing: "3px",
    fontWeight: "700"
  },
  keynoteSuggestions: {
    marginTop: "32px"
  },
  keynoteSuggestionItem: {
    padding: "16px 20px",
    borderRadius: "16px",
    background: "rgba(16,185,129,0.05)",
    borderLeft: "4px solid #10b981",
    marginBottom: "16px",
    fontSize: "15px",
    color: "#e2e8f0",
    lineHeight: "1.6",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  }
};
