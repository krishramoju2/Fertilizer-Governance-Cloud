import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function AuthScreen({ setToken, setCurrentUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [soilTypes, setSoilTypes] = useState([]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    soil_type: "Loamy",
    farm_size: "1",
    location: "",
    primary_crops: []
  });

  useEffect(() => {
    const fetchSoilTypes = async () => {
      try {
        const res = await api.get("/config/soil-types");
        if (res.data.success) setSoilTypes(res.data.data);
      } catch {}
    };
    fetchSoilTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = isLogin ? "/login" : "/register";

      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const res = await api.post(endpoint, payload);

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setCurrentUser(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Auth failed");
    }
  };

return (
  <div style={styles.container}>
    <div style={styles.card}>
      <h2 style={styles.title}>{isLogin ? "Login" : "Register"}</h2>

      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Email"
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />

        {!isLogin && (
          <>
            <input
              style={styles.input}
              placeholder="Name"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <select
              style={styles.input}
              value={formData.soil_type}
              onChange={(e) =>
                setFormData({ ...formData, soil_type: e.target.value })
              }
            >
              {soilTypes.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </>
        )}

        <button style={styles.button}>Submit</button>
      </form>

      <button style={styles.switch} onClick={() => setIsLogin(!isLogin)}>
        Switch to {isLogin ? "Register" : "Login"}
      </button>
    </div>
  </div>
);

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#f5f5f5"
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "10px",
    width: "300px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)"
  },
  title: {
    marginBottom: "20px",
    textAlign: "center"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  input: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },
  button: {
    padding: "10px",
    background: "#1a472a",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  },
  switch: {
    marginTop: "10px",
    background: "none",
    border: "none",
    color: "#007bff",
    cursor: "pointer"
  },
  error: {
    color: "red",
    marginBottom: "10px",
    textAlign: "center"
  }
};
