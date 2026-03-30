import React, { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "https://fertilizer-backend-jj59.onrender.com";

export default function MLModel() {
  const [inputs, setInputs] = useState({
    Temparature: 26,
    Moisture: 45,
    Soil_Type: "Loamy",
    Crop_Type: "Maize",
    Fertilizer_Name: "Urea",
    Fertilizer_Quantity: 30
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/ml/predict`, inputs);
      if (res.data.success) {
        setResult(res.data.result);
      }
    } catch (err) {
      alert("ML Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🤖 ML Model Analysis</h2>

      <input placeholder="Temperature"
        onChange={(e)=>setInputs({...inputs, Temparature:e.target.value})} />

      <input placeholder="Moisture"
        onChange={(e)=>setInputs({...inputs, Moisture:e.target.value})} />

      <input placeholder="Soil"
        onChange={(e)=>setInputs({...inputs, Soil_Type:e.target.value})} />

      <input placeholder="Crop"
        onChange={(e)=>setInputs({...inputs, Crop_Type:e.target.value})} />

      <input placeholder="Fertilizer"
        onChange={(e)=>setInputs({...inputs, Fertilizer_Name:e.target.value})} />

      <input placeholder="Quantity"
        onChange={(e)=>setInputs({...inputs, Fertilizer_Quantity:e.target.value})} />

      <br /><br />

      <button onClick={handleAnalyze}>
        {loading ? "Analyzing..." : "Run ML Model"}
      </button>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>{result.overall_compatibility}</h3>
          <p>Score: {result.overall_score}%</p>
        </div>
      )}
    </div>
  );
}
