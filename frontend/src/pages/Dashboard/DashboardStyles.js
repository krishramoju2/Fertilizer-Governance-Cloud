
export const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#020617", // Deep Black/Navy
    color: "#f8fafc",
    fontFamily: "'Inter', -apple-system, sans-serif",
    overflow: "hidden"
  },
  sidebar: {
    width: "280px",
    backgroundColor: "#0f172a", // Solid Navy
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    padding: "32px 20px",
    flexShrink: 0,
    zIndex: 100
  },
  sidebarBrand: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "48px",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  sidebarNav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1
  },
  sidebarLink: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: active ? "#fff" : "#94a3b8",
    backgroundColor: active ? "rgba(16, 185, 129, 0.1)" : "transparent",
    border: active ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left",
    width: "100%"
  }),
  sidebarFooter: {
    paddingTop: "24px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)"
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    position: "relative"
  },
  topBar: {
    height: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 40px",
    backgroundColor: "rgba(2, 6, 23, 0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    position: "sticky",
    top: 0,
    zIndex: 90
  },
  pageHeader: {
    padding: "40px 40px 0 40px",
    marginBottom: "32px"
  },
  pageTitle: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#fff",
    letterSpacing: "-0.5px"
  },
  pageSubtitle: {
    fontSize: "16px",
    color: "#64748b",
    marginTop: "4px"
  },
  contentArea: {
    padding: "0 40px 40px 40px"
  },
  
  // High-Density Cards
  card: {
    backgroundColor: "#1e293b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "16px"
  },
  
  // Stats Grid
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
    marginBottom: "32px"
  },
  statCard: {
    backgroundColor: "#1e293b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column"
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#fff",
    marginTop: "8px"
  },
  
  // Data Tables
  tableContainer: {
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#0f172a"
  },
  th: {
    textAlign: "left",
    padding: "16px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.02)"
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#f1f5f9",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
  },

  // Buttons & Inputs
  button: {
    padding: "12px 24px",
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  secondaryButton: {
    padding: "12px 24px",
    backgroundColor: "transparent",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#020617",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease"
  },

  // Result Section
  resultCard: {
    backgroundColor: "#1e293b",
    border: "1px solid #10b981",
    borderRadius: "20px",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  scoreBadge: {
    padding: "8px 16px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: "800",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    color: "#10b981",
    border: "1px solid rgba(16, 185, 129, 0.3)"
  }
};
