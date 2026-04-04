import React, { useState } from "react";
import Chatbot from "../../components/Chatbot/Chatbot";
import MLModel from "../../components/ML/MLModel";


const Dashboard = ({
  currentUser,
  setToken,
  setCurrentUser,
  message,
  inputs,
  setInputs,
  soilTypes,
  cropTypes,
  fertilizerNames,
  handleAnalyze,
  loading,
  result
}) => {




  const [activeTab, setActiveTab] = useState("analysis");

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1>🌾 FarmAdvisor Pro</h1>

        <div>
          <button onClick={() => setActiveTab("analysis")}>Analysis</button>
          <button onClick={() => setActiveTab("ml")}>ML</button>
          <button onClick={() => setActiveTab("chat")}>Chat</button>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              setToken(null);
              setCurrentUser(null);
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {activeTab === "analysis" && (
        <div style={styles.card}>
          <h2>Farm Input</h2>

          <input
            placeholder="Temperature"
            value={inputs.Temperature}
            onChange={(e) =>
              setInputs({ ...inputs, Temperature: e.target.value })
            }
          />

          <input
            placeholder="Moisture"
            value={inputs.Moisture}
            onChange={(e) =>
              setInputs({ ...inputs, Moisture: e.target.value })
            }
          />

          <select
            value={inputs.Soil_Type}
            onChange={(e) =>
              setInputs({ ...inputs, Soil_Type: e.target.value })
            }
          >
            {soilTypes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select
            value={inputs.Crop_Type}
            onChange={(e) =>
              setInputs({ ...inputs, Crop_Type: e.target.value })
            }
          >
            {cropTypes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={inputs.Fertilizer_Name}
            onChange={(e) =>
              setInputs({
                ...inputs,
                Fertilizer_Name: e.target.value
              })
            }
          >
            {fertilizerNames.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>

          <button onClick={handleAnalyze}>Analyze</button>

          {result && (
            <div>
              <h3>{result.overall_compatibility}</h3>
              <p>{result.overall_score}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "ml" && <MLModel />}
      {activeTab === "chat" && <Chatbot />}
    </div>
  );
};

const styles = {
  app: {
    padding: "20px",
    background: "#f5f5f5",
    minHeight: "100vh"
  },
  header: {
    background: "#1a472a",
    color: "white",
    padding: "15px",
    marginBottom: "20px"
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px"
  }
};

export default Dashboard;
