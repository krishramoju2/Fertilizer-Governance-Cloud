import React, { useState } from "react";
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

  const runModel = async () => {
    try {
      const res = await api.post("/ml/predict", form);
      if (res.data.success) {
        setResult(res.data.result);
      }
    } catch {
      alert("Prediction failed");
    }
  };

  return (
    <div style={styles.container}>
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

        {result && (
          <div style={styles.result}>
            <h3>Result</h3>
            <p><strong>Prediction:</strong> {result.prediction || "N/A"}</p>
            <p><strong>Confidence:</strong> {result.confidence || "N/A"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    display: "flex",
    justifyContent: "center"
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
  }
};
