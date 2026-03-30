import React, { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "https://fertilizer-backend-jj59.onrender.com";

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const runModel = async () => {
    try {
      const res = await axios.post(`${API_BASE}/ml/predict`, form);
      setResult(res.data.result);
    } catch (err) {
      setResult({ error: "❌ Failed to run ML model" });
    }
  };

  return (
    <div style={styles.container}>
      <h2>ML Model Analysis</h2>

      <div style={styles.card}>
        <div style={styles.grid}>
          <div>
            <label>Temperature (°C)</label>
            <input
              name="temperature"
              value={form.temperature}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div>
            <label>Moisture (%)</label>
            <input
              name="moisture"
              value={form.moisture}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div>
            <label>Soil Type</label>
            <select name="soil" value={form.soil} onChange={handleChange} style={styles.input}>
              <option>Loamy</option>
              <option>Sandy</option>
              <option>Clay</option>
            </select>
          </div>

          <div>
            <label>Crop Type</label>
            <select name="crop" value={form.crop} onChange={handleChange} style={styles.input}>
              <option>Maize</option>
              <option>Rice</option>
              <option>Wheat</option>
            </select>
          </div>

          <div>
            <label>Fertilizer</label>
            <select name="fertilizer" value={form.fertilizer} onChange={handleChange} style={styles.input}>
              <option>Urea</option>
              <option>DAP</option>
              <option>NPK</option>
            </select>
          </div>

          <div>
            <label>Quantity (kg/ha)</label>
            <input
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        <button style={styles.button} onClick={runModel}>
          🔬 Analyze (ML)
        </button>

        {result && (
          <div style={styles.result}>
            {result.error ? (
              <p>{result.error}</p>
            ) : (
              <>
                <p><b>Result:</b> {result.overall_compatibility}</p>
                <p><b>Score:</b> {result.overall_score}%</p>
                <p>🌡 {result.temperature_status}</p>
                <p>💧 {result.moisture_status}</p>
                <p>🌱 {result.soil_compatibility}</p>
                <p>📦 {result.quantity_status}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px"
  },
  card: {
    background: "#f9f9f9",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginBottom: "20px"
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginTop: "5px"
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer"
  },
  result: {
    marginTop: "20px",
    background: "#fff",
    padding: "15px",
    borderRadius: "8px"
  }
};
