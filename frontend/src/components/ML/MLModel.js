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
    <div>
      <h2>ML Model</h2>

      <input
        placeholder="Temperature"
        onChange={(e) =>
          setForm({ ...form, temperature: e.target.value })
        }
      />

      <input
        placeholder="Moisture"
        onChange={(e) =>
          setForm({ ...form, moisture: e.target.value })
        }
      />

      <button onClick={runModel}>Run Model</button>

      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
