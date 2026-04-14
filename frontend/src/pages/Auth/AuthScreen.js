import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { GoogleLogin } from "@react-oauth/google";
import Galaxy from "../../components/Auth/Galaxy";


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
        localStorage.setItem("token", res.data.data?.token || res.data.token);
        setToken(res.data.data?.token || res.data.token);
        setCurrentUser(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Auth failed");
    }
  };

  return (

      <div style={styles.container}>
        <div style={styles.bgLayer}>
          <Galaxy
            mouseRepulsion
            mouseInteraction
            density={1}
            glowIntensity={0.3}
            saturation={0}
            hueShift={140}
            twinkleIntensity={0.3}
            rotationSpeed={0.1}
            repulsionStrength={2}
            autoCenterRepulsion={0}
            starSpeed={0.5}
            speed={1}
          />
        </div>
    
        <div style={styles.overlay} />
    
        <div style={styles.card}>
    
        <h2 style={styles.title}>{isLogin ? "Login" : "Register"}</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          {!isLogin && (
            <>
              <input
                style={styles.input}
                placeholder="Name"
                value={formData.name}
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
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </>
          )}

          <button type="submit" style={styles.button}>
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

                
        
                {/* GOOGLE LOGIN */}
        <div style={styles.divider}>OR</div>
        
        <div style={styles.googleWrapper}>
          <GoogleLogin
            onSuccess={async (res) => {
              try {
                const response = await api.post("/google-login", {
                  credential: res.credential
                });
        
                if (response.data.success) {
                  localStorage.setItem("token", response.data.token);
                  setToken(response.data.token);
                  setCurrentUser(response.data.user);
                }
              } catch {
                setError("Google login failed");
              }
            }}
            onError={() => setError("Google login failed")}
          />
        </div>
                    



        <button
          style={styles.switch}
          onClick={() => setIsLogin(!isLogin)}
        >
          Switch to {isLogin ? "Register" : "Login"}
        </button>
          
      </div>
    </div>
  );
} // ✅ THIS WAS MISSING

/* ✅ STYLES OUTSIDE COMPONENT */
const styles = {
  container: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    overflow: "hidden"
  },


  overlay: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at 30% 20%, rgba(26,71,42,0.25), rgba(0,0,0,0.45))",
    zIndex: 1
  },
    
  card: {
    position: "relative",
    zIndex: 2,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    padding: "40px",
    borderRadius: "15px",
    width: "350px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.25)",
    textAlign: "center"
  },
  
  title: {
    marginBottom: "20px",
    color: "#1a472a",
    fontSize: "24px",
    fontWeight: "600"
  },

  divider: {
    margin: "18px 0",
    textAlign: "center",
    color: "#777",
    fontSize: "13px",
    fontWeight: "500"
  },
  
  googleWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "10px"
  },

  
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px"
  },
  
  button: {
    padding: "12px",
    background: "linear-gradient(135deg, #2e7d32, #66bb6a)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px"
  },
  switch: {
    marginTop: "15px",
    background: "none",
    border: "none",
    color: "#2e7d32",
    cursor: "pointer",
    fontWeight: "500"
  },

  bgLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 0
  },
  
  error: {
    color: "red",
    marginBottom: "10px"
  }
};
