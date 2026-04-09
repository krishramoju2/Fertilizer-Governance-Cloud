import React, { useState, useEffect } from "react";
import api from "../../services/api";
import GradientBlinds from "./GradientBlinds";

export default function MLModel() {
  const [form, setForm] = useState({
    temperature: "",
    moisture: "",
    soil: "Loamy",
    crop: "Maize",
    fertilizer: "Urea",
    quantity: ""
  });

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // LOAD HISTORY
  const loadHistory = async () => {
    try {
      const res = await api.get("/history");
      if (res.data.success) {
        setHistory(res.data.history || []);
      }
    } catch {
      console.log("History load failed");
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const runModel = async () => {
    try {
      const res = await api.post("/ml/predict", form);
      if (res.data.success) {
        setResult(res.data.result);
        loadHistory(); // refresh history
      }
    } catch {
      alert("Prediction failed");
    }
  };

  return (
    <div style={{ ...styles.container, position: "relative", overflow: "hidden" }}> 

      {/* 🔥 Gradient Background */}
      <div style={styles.bg}>
        <GradientBlinds
          gradientColors={['#4f46e5', '#22c55e']}
          angle={0}
          noise={0.2}
          blindCount={12}
          blindMinWidth={60}
          spotlightRadius={0.4}
          spotlightSoftness={1}
          spotlightOpacity={0.8}
          mouseDampening={0.15}
          distortAmount={0.1}
          shineDirection="left"
          mixBlendMode="lighten"
        />
      </div>
      {/* MAIN CARD */}
      <div style={styles.card}>
        <h2 style={{ fontWeight: "700", marginBottom: "10px" }}>
          📊 ML Model Prediction
        </h2>

        {/* 🔥 DESCRIPTION BOX */}
        <div style={styles.infoBox}>
          <p style={styles.description}>
            This section uses a machine learning model to predict fertilizer 
            compatibility based on environmental and crop conditions. 
            It provides intelligent predictions, confidence scores, 
            and model insights to support better decision-making.
          </p>
        </div>

        <input
          style={styles.input}
          placeholder="Temperature"
          value={form.temperature}
          onChange={(e) =>
            setForm({ ...form, temperature: e.target.value })
          }
        />

        <input
          style={styles.input}
          placeholder="Moisture"
          value={form.moisture}
          onChange={(e) =>
            setForm({ ...form, moisture: e.target.value })
          }
        />

        <input
          style={styles.input}
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) =>
            setForm({ ...form, quantity: e.target.value })
          }
        />

        <select
          style={styles.input}
          value={form.soil}
          onChange={(e) =>
            setForm({ ...form, soil: e.target.value })
          }
        >
          <option>Loamy</option>
          <option>Sandy</option>
          <option>Clay</option>
        </select>

        <select
          style={styles.input}
          value={form.crop}
          onChange={(e) =>
            setForm({ ...form, crop: e.target.value })
          }
        >
          <option>Maize</option>
          <option>Wheat</option>
          <option>Rice</option>
        </select>

        <select
          style={styles.input}
          value={form.fertilizer}
          onChange={(e) =>
            setForm({ ...form, fertilizer: e.target.value })
          }
        >
          <option>Urea</option>
          <option>DAP</option>
          <option>NPK</option>
        </select>

        <button style={styles.button} onClick={runModel}>
          Run Model
        </button>

        {/* RESULT */}
        {result && (
          <div style={styles.result}>
            <h3>Result</h3>
            <p><strong>Prediction:</strong> {result.prediction || result.Prediction || "N/A"}</p>
            <p><strong>Confidence:</strong> {result.confidence || result.Confidence || "N/A"}</p>
            <p><strong>Score:</strong> {result.overall_score || result.score || "N/A"}</p>
            <p><strong>Trees:</strong> {result.num_trees || result.trees || "N/A"}</p>
          </div>
        )}
      </div>

      {/* HISTORY */}
      <div style={{ ...styles.card, marginTop: "20px" }}>
        <h3>Recent ML Analyses</h3>

        {history.length === 0 ? (
          <p>No history yet</p>
        ) : (
          history.slice(0, 5).map((item, i) => {
            const input = item.input_data || {};
            const res = item.result || {};

            const temperature = input.temperature || input.Temperature;
            const moisture = input.moisture || input.Moisture;
            const quantity = input.quantity || input.Quantity;
            const crop = input.crop || input.Crop_Type;
            const fertilizer = input.fertilizer || input.Fertilizer_Name;

            const prediction = res.prediction || res.Prediction;
            const confidence = res.confidence || res.Confidence;
            const score = res.overall_score || res.score;
            const trees = res.num_trees || res.trees;

            return (
              <div key={i} style={styles.historyItem}>
                <p>
                  <strong>{crop || "N/A"}</strong> - {fertilizer || "N/A"}
                </p>
                <p>Temp: {temperature || "N/A"}°C</p>
                <p>Moisture: {moisture || "N/A"}%</p>
                <p>Qty: {quantity || "N/A"}</p>
                <p>Prediction: {prediction || "N/A"}</p>
                <p>Confidence: {confidence || "N/A"}</p>
                <p>Score: {score || "N/A"}</p>
                <p>Trees: {trees || "N/A"}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  
  container: {
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
    minHeight: "100vh"
  },
  
  card: {
    background: `
      radial-gradient(circle at 20% 30%, rgba(79,70,229,0.15) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(34,197,94,0.15) 0%, transparent 40%),
      linear-gradient(135deg, #eef2ff, #f8fafc)
    `,
    backdropFilter: "blur(12px)",
    padding: "25px",
    borderRadius: "16px",
    width: "420px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    border: "1px solid rgba(255,255,255,0.3)",
    position: "relative",
    zIndex: 1
  },
  
  infoBox: {
    background: "rgba(34,197,94,0.1)",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "15px",
    border: "1px solid rgba(34,197,94,0.2)"
  },
  
  description: {
    fontSize: "13.5px",
    color: "#444",
    margin: 0,
    lineHeight: "1.4"
  },

  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    background: "#fff"
  },
  
  button: {
    width: "100%",
    padding: "14px",
    marginTop: "10px",
    background: "linear-gradient(135deg, #4f46e5, #22c55e)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 6px 15px rgba(79,70,229,0.3)"
  },

  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0
  },
  
  result: {
    marginTop: "15px",
    padding: "15px",
    background: "rgba(79,70,229,0.08)",
    borderRadius: "10px",
    border: "1px solid rgba(79,70,229,0.2)"
  },
  
  historyItem: {
    padding: "15px",
    marginTop: "12px",
    background: "rgba(255,255,255,0.8)",
    borderRadius: "12px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.05)"
  }
  
};
