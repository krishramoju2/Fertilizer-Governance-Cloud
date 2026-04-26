import React, { useState, useEffect } from "react";
import api from "../../services/api";
import GradientBlinds from "./GradientBlinds";


export default function MLModel() {
  const [form, setForm] = useState({
    temperature: 26,
    moisture: 45,
    soil: "Loamy",
    crop: "Maize",
    fertilizer: "Urea",
    quantity: 30
  });

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

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
    if (isExecuting) return;
    setIsExecuting(true);
    try {
      const res = await api.post("/ml/predict", form);
      if (res.data.success) {
        setResult(res.data.result);
        loadHistory();
      }
    } catch {
      alert("Diagnostic protocol failed");
    } finally {
      setTimeout(() => setIsExecuting(false), 800);
    }
  };

  const handleSlider = (name, val) => {
    setForm(prev => ({ ...prev, [name]: parseFloat(val) }));
  };

  return (
    <div style={styles.container}> 
      <div style={styles.bg}>
        <GradientBlinds
          gradientColors={['#0f172a', '#1e293b']}
          angle={45}
          noise={0.08}
          blindCount={15}
          blindMinWidth={50}
          mixBlendMode="normal"
        />
      </div>

      <div style={styles.consoleChassis}>
        <div style={styles.consoleHeader}>
          <div style={styles.ledIndicator(isExecuting)} />
          <h2 style={styles.consoleTitle}>DIAGNOSTIC CONSOLE v4.0</h2>
          <div style={styles.consoleSerial}>SN: AG-882-QX</div>
        </div>

        <div style={styles.controlsGrid}>
          {/* Numeric Section */}
          <div style={styles.panelSection}>
            <div style={styles.panelLabel}>ENVIRONMENTAL PARAMETERS</div>
            <div style={styles.controlGroup}>
              <label style={styles.label}>TEMP: {form.temperature}°C</label>
              <input 
                type="range" min="10" max="50" 
                value={form.temperature} 
                onChange={(e) => handleSlider('temperature', e.target.value)}
                style={styles.slider}
              />
            </div>
            <div style={styles.controlGroup}>
              <label style={styles.label}>MOISTURE: {form.moisture}%</label>
              <input 
                type="range" min="10" max="90" 
                value={form.moisture} 
                onChange={(e) => handleSlider('moisture', e.target.value)}
                style={styles.slider}
              />
            </div>
            <div style={styles.controlGroup}>
              <label style={styles.label}>DOSAGE: {form.quantity} KG/HA</label>
              <input 
                type="range" min="5" max="100" 
                value={form.quantity} 
                onChange={(e) => handleSlider('quantity', e.target.value)}
                style={styles.slider}
              />
            </div>
          </div>

          {/* Categorical Section */}
          <div style={styles.panelSection}>
            <div style={styles.panelLabel}>SUBSTRATE & CROP MATRIX</div>
            <div style={styles.controlGroup}>
              <label style={styles.label}>SOIL TYPE</label>
              <select style={styles.dialSelect} value={form.soil} onChange={(e) => setForm({...form, soil: e.target.value})}>
                <option>Loamy</option><option>Sandy</option><option>Clayey</option><option>Black</option><option>Red</option>
              </select>
            </div>
            <div style={styles.controlGroup}>
              <label style={styles.label}>CROP CLASS</label>
              <select style={styles.dialSelect} value={form.crop} onChange={(e) => setForm({...form, crop: e.target.value})}>
                <option>Maize</option><option>Wheat</option><option>Paddy</option><option>Cotton</option><option>Sugarcane</option>
              </select>
            </div>
            <div style={styles.controlGroup}>
              <label style={styles.label}>NUTRIENT AGENT</label>
              <select style={styles.dialSelect} value={form.fertilizer} onChange={(e) => setForm({...form, fertilizer: e.target.value})}>
                <option>Urea</option><option>DAP</option><option>NPK</option><option>14-35-14</option><option>28-28</option>
              </select>
            </div>
          </div>
        </div>

        {/* Execution Block */}
        <div style={styles.executionBlock}>
          <div style={styles.switchContainer}>
            <div style={styles.switchLabel}>EXECUTE PROTOCOL</div>
            <label style={styles.toggleSwitch}>
              <input type="checkbox" checked={isExecuting} onChange={runModel} style={{display:'none'}} />
              <span style={styles.switchSlider(isExecuting)}>
                <span style={styles.switchKnob(isExecuting)} />
              </span>
            </label>
          </div>

          {/* HUD Display */}
          <div style={styles.hudDisplay}>
            {result ? (
              <div style={styles.hudContent}>
                <div style={styles.hudRow}>
                  <span style={styles.hudLabel}>PREDICTION:</span>
                  <span style={styles.hudValue}>{result.prediction?.toUpperCase()}</span>
                </div>
                <div style={styles.hudRow}>
                  <span style={styles.hudLabel}>CONFIDENCE:</span>
                  <span style={styles.hudValue}>{result.confidence}%</span>
                </div>
                <div style={styles.hudRow}>
                  <span style={styles.hudLabel}>TRUST_INDEX:</span>
                  <span style={styles.hudValue}>{result.overall_score}</span>
                </div>
              </div>
            ) : (
              <div style={styles.hudPlaceholder}>WAITING FOR INPUT...</div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT LOGS */}
      <div style={styles.logsChassis}>
        <div style={styles.logsTitle}>SYSTEM LOGS: RECENT DIAGNOSTICS</div>
        <div style={styles.logsGrid}>
          {history.slice(0, 4).map((item, i) => (
            <div key={i} style={styles.logCard}>
              <div style={styles.logHeader}>LOG #{item.id?.substring(0, 6) || i}</div>
              <div style={styles.logData}>
                {item.input_data?.Crop_Type || item.input_data?.crop} | {item.result?.prediction || item.result?.Prediction}
              </div>
              <div style={styles.logTimestamp}>{item.timestamp || '02:55:47 UTC'}</div>
            </div>
          ))}
        </div>
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
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box"
  },
  bg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 },
  
  consoleChassis: {
    width: "700px",
    background: "#1e293b",
    border: "4px solid #334155",
    borderRadius: "8px",
    padding: "25px",
    boxShadow: "0 0 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.4)",
    position: "relative",
    zIndex: 1,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
    backgroundSize: "20px 20px"
  },

  consoleHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #475569",
    paddingBottom: "15px",
    marginBottom: "20px"
  },

  ledIndicator: (active) => ({
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: active ? "#ef4444" : "#22c55e",
    boxShadow: active ? "0 0 10px #ef4444" : "0 0 10px #22c55e",
    transition: "0.3s"
  }),

  consoleTitle: { color: "#94a3b8", fontSize: "16px", fontWeight: "900", margin: 0, letterSpacing: "2px" },
  consoleSerial: { color: "#475569", fontSize: "10px", fontFamily: "monospace" },

  controlsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" },
  panelSection: { display: "flex", flexDirection: "column", gap: "15px" },
  panelLabel: { color: "#38bdf8", fontSize: "11px", fontWeight: "800", letterSpacing: "1px", marginBottom: "5px" },

  controlGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { color: "#cbd5e1", fontSize: "12px", fontWeight: "700", fontFamily: "monospace" },

  slider: {
    WebkitAppearance: "none",
    width: "100%",
    height: "4px",
    background: "#334155",
    borderRadius: "2px",
    outline: "none",
    cursor: "pointer"
  },

  dialSelect: {
    background: "#0f172a",
    color: "#38bdf8",
    border: "1px solid #334155",
    padding: "8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
    outline: "none"
  },

  executionBlock: {
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #475569",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  switchContainer: { display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" },
  switchLabel: { color: "#94a3b8", fontSize: "10px", fontWeight: "800" },
  toggleSwitch: { width: "60px", height: "30px", position: "relative", cursor: "pointer" },
  
  switchSlider: (active) => ({
    position: "absolute",
    width: "100%",
    height: "100%",
    background: active ? "#10b981" : "#1e293b",
    borderRadius: "4px",
    border: "2px solid #334155",
    transition: "0.4s"
  }),

  switchKnob: (active) => ({
    position: "absolute",
    left: active ? "30px" : "4px",
    top: "4px",
    width: "18px",
    height: "18px",
    background: "#f8fafc",
    borderRadius: "2px",
    transition: "0.4s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
  }),

  hudDisplay: {
    width: "350px",
    height: "100px",
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: "4px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxShadow: "inset 0 0 15px rgba(56,189,248,0.1)"
  },

  hudPlaceholder: { color: "#1e293b", fontSize: "14px", textAlign: "center", fontFamily: "monospace", letterSpacing: "2px" },
  hudContent: { display: "flex", flexDirection: "column", gap: "8px" },
  hudRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  hudLabel: { color: "#334155", fontSize: "11px", fontWeight: "800" },
  hudValue: { color: "#38bdf8", fontSize: "14px", fontWeight: "900", fontFamily: "monospace", textShadow: "0 0 8px rgba(56,189,248,0.5)" },

  logsChassis: { width: "700px", marginTop: "30px", zIndex: 1 },
  logsTitle: { color: "#475569", fontSize: "12px", fontWeight: "800", marginBottom: "15px", letterSpacing: "2px" },
  logsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" },
  
  logCard: {
    background: "rgba(30,41,59,0.5)",
    border: "1px solid #334155",
    borderRadius: "4px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },
  logHeader: { color: "#38bdf8", fontSize: "9px", fontWeight: "800" },
  logData: { color: "#cbd5e1", fontSize: "11px", fontWeight: "600" },
  logTimestamp: { color: "#475569", fontSize: "8px", fontFamily: "monospace" }
};
