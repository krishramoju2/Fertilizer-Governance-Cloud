import React from "react";

export default function Home({ setActiveTab }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🌾 FarmAdvisor Pro</h1>

        <p style={styles.subtitle}>
          Welcome to your smart farming dashboard. Use AI-powered tools to analyze,
          predict, and optimize your agricultural decisions.
        </p>

        <div style={styles.grid}>

          <div style={styles.box} onClick={() => setActiveTab("analysis")}>
            <h3>🔬 Analysis</h3>
            <p>Analyze farm conditions and get compatibility insights.</p>
          </div>

          <div style={styles.box} onClick={() => setActiveTab("ml")}>
            <h3>🤖 ML Model</h3>
            <p>Run machine learning predictions for fertilizers.</p>
          </div>

          <div style={styles.box} onClick={() => setActiveTab("analytics")}>
            <h3>📈 Analytics</h3>
            <p>View trends, stats, and historical performance.</p>
          </div>

          <div style={styles.box} onClick={() => setActiveTab("chat")}>
            <h3>💬 Chatbot</h3>
            <p>Ask AI questions and get instant farming advice.</p>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    // 🟠 UNIQUE HOME THEME (warm + premium, different from others)
    background: "linear-gradient(135deg, #fff7ed, #ffedd5)"
  },

  card: {
    width: "900px",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    borderRadius: "18px",
    padding: "40px",
    boxShadow: "0 12px 35px rgba(0,0,0,0.1)",
    border: "1px solid rgba(255,255,255,0.3)"
  },

  title: {
    fontSize: "30px",
    fontWeight: "700",
    marginBottom: "10px",
    color: "#7c2d12"
  },

  subtitle: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "30px",
    lineHeight: "1.5"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px"
  },

  box: {
    background: "rgba(255,255,255,0.7)",
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.05)",
    cursor: "pointer",
    transition: "all 0.3s ease"
  }
};
