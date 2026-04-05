import React, { useState, useEffect } from "react";
import api from "../../services/api";

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
    <div style={styles.container}>
      {/* MAIN CARD */}
      <div style={styles.card}>
        <h2>ML Model Prediction</h2>

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

            // ✅ FIXED FIELD MAPPING
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
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    width: "350px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)"
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#1a472a",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  },
  result: {
    marginTop: "15px",
    padding: "10px",
    background: "#f5f5f5",
    borderRadius: "5px"
  },
  historyItem: {
    padding: "10px",
    marginTop: "10px",
    background: "#f9f9f9",
    borderRadius: "5px"
  }
};
