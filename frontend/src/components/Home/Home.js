import React from "react";
import { motion } from "framer-motion";
import Silk from "./Silk";

import InfiniteMenu from "./InfiniteMenu"; 

export default function Home({ setActiveTab }) {
  
  const menuItems = [
    {
      content: (
        <div style={styles.menuCard}>
          <h3>🔬 Analysis</h3>
          <p>
            Analyze soil, weather, and environmental conditions to determine
            crop compatibility and optimize farming strategies.
          </p>
        </div>
      ),
      onClick: () => setActiveTab("analysis")
    },
    {
      content: (
        <div style={styles.menuCard}>
          <h3>🤖 ML Model</h3>
          <p>
            Use machine learning to predict the best fertilizers based on
            soil nutrients, crop type, and environmental factors.
          </p>
        </div>
      ),
      onClick: () => setActiveTab("ml")
    },
    {
      content: (
        <div style={styles.menuCard}>
          <h3>📈 Analytics</h3>
          <p>
            View historical data, performance trends, and insights to improve
            long-term agricultural productivity.
          </p>
        </div>
      ),
      onClick: () => setActiveTab("analytics")
    },
    {
      content: (
        <div style={styles.menuCard}>
          <h3>💬 Chatbot</h3>
          <p>
            Interact with AI to get real-time farming advice, troubleshooting,
            and recommendations.
          </p>
        </div>
      ),
      onClick: () => setActiveTab("chat")
    },
    {
      content: (
        <div style={styles.menuCard}>
          <h3>🌱 Crop Recommendations</h3>
          <p>
            Get suggestions on which crops to grow based on soil type,
            climate, and seasonal conditions.
          </p>
        </div>
      ),
      onClick: () => setActiveTab("analysis")
    },
    {
      content: (
        <div style={styles.menuCard}>
          <h3>🌦 Weather Insights</h3>
          <p>
            Monitor weather patterns and forecasts to plan irrigation,
            fertilization, and harvesting efficiently.
          </p>
        </div>
      ),
      onClick: () => setActiveTab("analytics")
    }
  ];
  
  
  return (
    <div style={{ ...styles.container, position: "relative", overflow: "hidden" }}>
  
      {/* 🔥 Silk Background */}
      <div style={styles.silkBackground}>
        <Silk 
          speed={3}
          scale={1}
          color="#f59e0b"
          noiseIntensity={1.2}
          rotation={0}
        />
      </div>
            
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        
        {/* HEADER */}
        <h1 style={styles.title}>🌾 FarmAdvisor Pro</h1>
        <p style={styles.subtitle}>
          Welcome to your smart farming dashboard. Use AI-powered tools to analyze,
          predict, and optimize your agricultural decisions.
        </p>

        {/* QUICK STATS */}
        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <h2>⚡ Fast</h2>
            <p>Instant AI-powered analysis</p>
          </div>
          <div style={styles.statBox}>
            <h2>🎯 Accurate</h2>
            <p>Data-driven recommendations</p>
          </div>
          <div style={styles.statBox}>
            <h2>🌱 Smart</h2>
            <p>Optimized farming decisions</p>
          </div>
        </div>

        {/* MAIN GRID */}
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

        {/* EXTRA INFO SECTION */}
        <div style={styles.bottomSection}>
          
          {/* FEATURES */}
          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>🚀 Features</h3>
            <ul style={styles.list}>
              <li>AI-based fertilizer recommendations</li>
              <li>Real-time farm condition analysis</li>
              <li>Historical analytics & insights</li>
              <li>Interactive chatbot assistance</li>
            </ul>
          </div>

          {/* TIPS */}
          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>💡 Farming Tips</h3>
            <ul style={styles.list}>
              <li>Maintain optimal soil moisture levels</li>
              <li>Use correct fertilizer quantities</li>
              <li>Monitor temperature regularly</li>
              <li>Choose crops based on soil type</li>
            </ul>
          </div>

        </div>

      </motion.div>

      <div style={styles.menuSection}>
        <InfiniteMenu items={menuItems} scale={0.9} />
      </div>
            
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflowY: "auto",
    background: "transparent"
  },

  menuCard: {
    background: "rgba(255,255,255,0.85)",
    borderRadius: "14px",
    padding: "20px",
    textAlign: "center",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(0,0,0,0.05)",
    cursor: "pointer",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },

  silkBackground: {
    position: "fixed",   // 🔥 important
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: -1
  },

  card: {
    width: "950px",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    borderRadius: "18px",
    padding: "40px",
    boxShadow: "0 12px 35px rgba(0,0,0,0.1)",
    border: "1px solid rgba(255,255,255,0.3)",
    position: "relative",
    zIndex: 1
  },

  menuSection: {
    width: "100%",
    height: "600px",   // increase from 500
    marginTop: "60px",
    position: "relative",
    zIndex: 1
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
    marginBottom: "25px",
    lineHeight: "1.5"
  },

  /* NEW: STATS */
  statsRow: {
    display: "flex",
    gap: "15px",
    marginBottom: "25px"
  },

  statBox: {
    flex: 1,
    background: "rgba(255,255,255,0.7)",
    padding: "15px",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px solid rgba(0,0,0,0.05)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "25px"
  },

  box: {
    background: "rgba(255,255,255,0.7)",
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.05)",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },

  /* NEW: BOTTOM SECTION */
  bottomSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px"
  },

  infoCard: {
    background: "rgba(255,255,255,0.7)",
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.05)"
  },

  infoTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#7c2d12"
  },

  list: {
    paddingLeft: "18px",
    lineHeight: "1.6",
    fontSize: "14px",
    color: "#444"
  }
};
