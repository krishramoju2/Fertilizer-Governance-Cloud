import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const [soilTypes, setSoilTypes] = useState([]);
const [cropTypes, setCropTypes] = useState([]);
const [fertilizerTypes, setFertilizerTypes] = useState([]);


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
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);

useEffect(() => {
  loadHistory();
  loadConfig();
}, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ SAME BEHAVIOUR AS DECISION TAB
  const runModel = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem("token");
  
        const res = await axios.post(
          `${API_BASE}/ml/predict`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

      if (res.data && res.data.success && res.data.result) {
        setResult(res.data.result);
        await loadHistory();

      } else {
        setResult({ error: "❌ Invalid response from server" });
      }
    } catch (err) {
      setResult({ error: "❌ Failed to run ML model" });
    } finally {
      setLoading(false);
    }
  };


const loadConfig = async () => {
  try {
    const [soilRes, cropRes, fertRes] = await Promise.all([
      axios.get(`${API_BASE}/config/soil-types`),
      axios.get(`${API_BASE}/config/crop-types`),
      axios.get(`${API_BASE}/config/fertilizer-names`)
    ]);

    if (soilRes.data.success) setSoilTypes(soilRes.data.data);
    if (cropRes.data.success) setCropTypes(cropRes.data.data);
    if (fertRes.data.success) setFertilizerTypes(fertRes.data.data);

  } catch (err) {
    console.error("Failed to load config");
  }
};

  
const loadHistory = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(`${API_BASE}/history`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.data && res.data.success) {
      setHistory(res.data.history);
    }
  } catch (err) {
    console.error("Failed to load history");
  }
};
  

  // ✅ SAME PDF STRUCTURE AS ANALYSIS TAB
  const generatePDF = () => {
    if (!result || result.error) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Fertilizer Analysis Report (ML)", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Input Parameter", "Value"]],
      body: [
        ["Temperature (°C)", form.temperature],
        ["Moisture (%)", form.moisture],
        ["Soil Type", form.soil],
        ["Crop Type", form.crop],
        ["Fertilizer", form.fertilizer],
        ["Quantity (kg/ha)", form.quantity]
      ]
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Analysis Result", "Value"]],
      body: [
        ["Compatibility", result.overall_compatibility],
        ["Score", result.overall_score + "%"],
        ["Temperature Status", result.temperature_status],
        ["Moisture Status", result.moisture_status],
        ["Soil Compatibility", result.soil_compatibility],
        ["Quantity Status", result.quantity_status]
      ]
    });

    doc.save("ML_Analysis_Report.pdf");
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
            <select
              name="soil"
              value={form.soil}
              onChange={handleChange}
              style={styles.input}
            >
                
            <select name="soil" value={form.soil} onChange={handleChange} style={styles.input}>
              {soilTypes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}

            </select>
              
            </select>
          </div>

          <div>
            <label>Crop Type</label>
            <select
              name="crop"
              value={form.crop}
              onChange={handleChange}
              style={styles.input}
            >
            <select name="crop" value={form.crop} onChange={handleChange} style={styles.input}>
              {cropTypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

              
            </select>
          </div>

          <div>
            <label>Fertilizer</label>
            <select
              name="fertilizer"
              value={form.fertilizer}
              onChange={handleChange}
              style={styles.input}
            >

            <select name="fertilizer" value={form.fertilizer} onChange={handleChange} style={styles.input}>
              {fertilizerTypes.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

                
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

        <button
          style={styles.button}
          onClick={runModel}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "🔬 Analyze (ML)"}
        </button>

        {result && (
          <div style={styles.result}>
            {result.error ? (
              <p>{result.error}</p>
            ) : (
              <>
                <p><b>Result:</b> {result.overall_compatibility}</p>
                <p><b>Score:</b> {result.overall_score}%</p>
                <p>🌡 Temp: {result.temperature_status}</p>
                <p>💧 Moisture: {result.moisture_status}</p>
                <p>🌱 Soil: {result.soil_compatibility}</p>
                <p>📦 Quantity: {result.quantity_status}</p>

                <button
                  style={{ ...styles.button, marginTop: "10px", background: "#2980b9" }}
                  onClick={generatePDF}
                >
                  📄 Download PDF
                </button>
              </>
            )}
          </div>
        )}
      </div>


      {/* 🔥 ADD HERE */}
      {history.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>Recent Analyses</h3>
      
          {history.slice(0, 5).map((item) => (
            <div key={item.id} style={{
              background: "#fff",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "6px"
            }}>
              <p><b>{item.crop_type}</b> - {item.fertilizer}</p>
              <p>Score: {item.score}%</p>
              <p>Status: {item.compatibility}</p>
            </div>
          ))}
      
        </div>
      )}
          
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
