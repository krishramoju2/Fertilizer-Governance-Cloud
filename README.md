

1. **User Authentication** - Register and login with JWT based authentication
2. **Farm Profile** - Save soil type, farm size, location, primary crops.
3. **Fertilizer Analysis** - Input temperature, moisture, soil type, crop , and     fertilizer quantity to get:
    --> Compatibility Status
    --> Overall Score
    --> Temperature and moisture suitability range
    --> Soil Compatibility
    --> Quantity Recommendation
    --> Actionable suggestions
4. **Analysis History** - View last 20 anayses with corp, fertilizer, status, and score.
5. **PDF Report**- Download a PDF summary of any analysis.
6. **Admin Features**
    --> Manage Dropdowns : Add or remove soil types, crop types, and fertilizer 
        changes reflect immediately for all users.
    --> User Analytics : View any user's analytics
7. **Admin Credentials:**
email - admin@farm.com
password - admin123
8. **Chatbot**
The FarmAdvisor Chatbot is an intelligent assistant designed to help farmers make better decisions about crop selection and fertilizer usage. It understands both natural language (e.g., “hot weather with low moisture”) and structured inputs (like temperature, moisture, and soil type) to provide practical, easy-to-understand recommendations. The chatbot analyzes farm conditions and suggests improvements to maximize crop yield and efficiency.
9. **Hyperparameter Tuning (Model Optimization)**
a) **n_estimators**
Number of trees in the forest.
More trees → better accuracy (usually), but slower performance.
b) **max_depth**
Maximum depth of each decision tree.
Lower values prevent overfitting, while higher values allow more complex learning.
c) **min_samples_split**
Minimum number of data points needed to split a node into two.
Higher value → fewer splits → simpler model.
d) **min_samples_leaf**
Minimum number of data points allowed in a final node (leaf).
Higher value → smoother and more stable predictions.

10. **Pickle-Based Data Storage Module**
This module uses Python’s pickle mechanism to store and load preprocessed datasets efficiently. Instead of reading data from CSV files every time the system runs, the dataset is serialized and saved as a .pkl file. This significantly reduces loading time and improves application performance.

11. **LangChain Integration (Smart Input Processing)**
The system integrates LangChain to build a structured and intelligent data processing pipeline for the chatbot. Using a sequence of modular steps, user input is cleaned, semantically interpreted, and converted into structured parameters such as temperature, moisture, soil type, crop, and fertilizer details. This enables the chatbot to understand both natural language inputs (e.g., “hot weather with low moisture”) and numeric inputs efficiently. 

12. **Google Authentication**
In the system provides a fast and secure way for users to access the platform using their existing Google accounts. Instead of manually registering with an email and password, users can sign in through Google OAuth, which returns a credential token (JWT) on the frontend. This token is sent to the backend, where it is decoded to extract user information such as email and name. The backend then generates its own JWT to manage the user session securely. This approach eliminates the need for password storage, reduces security risks, and enables automatic user registration for first-time logins. It also improves user experience by simplifying the login process while maintaining secure communication between frontend and backend using token-based authentication.

13. **Integration of ReactBits for Advanced UI Components**
The frontend incorporates ReactBits, a collection of modern and reusable UI components, to enhance the visual experience and interactivity of the application. Features such as animated backgrounds (e.g., Silk effect), infinite scrolling menus, and dynamic card layouts are implemented using ReactBits to create a smooth and engaging interface. These components improve usability by providing intuitive navigation and visually appealing transitions, making the platform more accessible and enjoyable for users. The use of ReactBits also promotes modular design, allowing easy scalability and consistent styling across the application.



**Chatbot Sample Test Cases**

a)Temperature 30, moisture 60, soil loamy, crop wheat, urea 40 kg ; 
b)Temp 25°C and moisture 50%, growing maize with NPK 30 kg ; 
c)28°C, 45% moisture, sandy soil, rice crop, using DAP 35 kg ; 

d)It is hot with high moisture, I am growing rice in clayey soil using urea ; 
e)Weather is cool and low moisture, crop is wheat, fertilizer DAP 25 kg ; 
f)Warm climate, medium moisture, maize crop with NPK fertilizer ; 










import React from "react";
import { motion } from "framer-motion";
import Silk from "./Silk";

import InfiniteMenu from "./InfiniteMenu"; 

export default function Home({ setActiveTab }) {
  
  const menuItems = [
    {
      title: "🔬 Analysis",
      description: "Analyze soil, weather, and environmental conditions to determine crop compatibility and optimize farming strategies.",
      onClick: () => setActiveTab("analysis")
    },
    {
      title: "🤖 ML Model",
      description: "Use machine learning to predict the best fertilizers based on soil nutrients, crop type, and environmental factors.",
      onClick: () => setActiveTab("ml")
    },
    {
      title: "📈 Analytics",
      description: "View historical data, performance trends, and insights to improve long-term agricultural productivity.",
      onClick: () => setActiveTab("analytics")
    },
    {
      title: "💬 Chatbot",
      description: "Interact with AI to get real-time farming advice, troubleshooting, and recommendations.",
      onClick: () => setActiveTab("chat")
    }
  ];
    
  
  return (
      <div style={{ ...styles.container, position: "relative" }}>  
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
        <InfiniteMenu items={menuItems} />
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
    background: "rgba(255,255,255,0.75)",
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
    marginTop: "60px",
    position: "relative",
    zIndex: 1,
    minHeight: "560px",
    height: "70vh",
    maxHeight: "720px",
    borderRadius: "18px",
    overflow: "hidden",
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


















