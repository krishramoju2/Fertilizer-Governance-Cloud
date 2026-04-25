import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { GoogleLogin } from "@react-oauth/google";
import Galaxy from "../../components/Auth/Galaxy";

// Import your 4 images from the same folder (Auth folder)
import agritechImg from "./agritech.png";
import chatbotImg from "./chatbot.png";
import harvestImg from "./harvest.png";
import innovationImg from "./innovation.png";

export default function AuthScreen({ setToken, setCurrentUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [soilTypes, setSoilTypes] = useState(["Loamy", "Sandy", "Clay"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    soil_type: "Loamy",
    farm_size: "1",
    location: "",
    primary_crops: []
  });

  // Reset error when switching between Login/Register
  useEffect(() => {
    setError("");
  }, [isLogin]);

  // Fetch soil types from backend
  useEffect(() => {
    let retries = 0;
    const maxRetries = 3;

    const fetchSoilTypes = async () => {
      try {
        const res = await api.get("/config/soil-types");
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          setSoilTypes(res.data.data);
        } else {
          console.warn("No soil types from API, using fallback");
        }
      } catch (err) {
        console.error("Soil types fetch failed:", err);

        if (retries < maxRetries) {
          retries++;
          setTimeout(fetchSoilTypes, 2000);
        } else {
          console.log("Using fallback soil types after retries exhausted");
        }
      }
    };

    fetchSoilTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/login" : "/register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const res = await api.post(endpoint, payload);

      if (res.data.success) {
        const token = res.data.data?.token || res.data.token;
        const user = res.data.data?.user || res.data.user;

        if (token) {
          localStorage.setItem("token", token);
          setToken(token);
          if (user) setCurrentUser(user);
        } else {
          setError("No token received from server");
        }
      } else {
        setError(res.data.message || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.response?.data?.message || err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/google-login", {
        credential: credentialResponse.credential
      });

      if (response.data.success) {
        const token = response.data.data?.token || response.data.token;
        const user = response.data.data?.user || response.data.user;

        if (token) {
          localStorage.setItem("token", token);
          setToken(token);
          if (user) setCurrentUser(user);
        } else {
          setError("No token received from Google login");
        }
      } else {
        setError(response.data.message || "Google login failed");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again or use email login.");
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      ...formData,
      password: "",
      name: "",
    });
  };

  return (
    <div style={styles.container}>
      {/* Galaxy Animation Background (visible through images) */}
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

      {/* Semi-transparent overlay to make card readable while keeping galaxy visible */}
      <div style={styles.overlay} />

      {/* ===== 4 CORNER IMAGES ===== */}
      {/* Top Left */}
      <div style={styles.cornerImageTL}>
        <img src={agritechImg} alt="Agritech" style={styles.decoImage} />
      </div>

      {/* Top Right */}
      <div style={styles.cornerImageTR}>
        <img src={chatbotImg} alt="Chatbot" style={styles.decoImage} />
      </div>

      {/* Bottom Left */}
      <div style={styles.cornerImageBL}>
        <img src={harvestImg} alt="Harvest" style={styles.decoImage} />
      </div>

      {/* Bottom Right */}
      <div style={styles.cornerImageBR}>
        <img src={innovationImg} alt="Innovation" style={styles.decoImage} />
      </div>

      {/* Login/Register Card */}
      <div style={styles.card}>
        <h2 style={styles.title}>{isLogin ? "Login" : "Register"}</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          {!isLogin && (
            <>
              <input
                style={styles.input}
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <select
                style={styles.input}
                value={formData.soil_type}
                onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                required
              >
                {soilTypes && soilTypes.length > 0 ? (
                  soilTypes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Loading soil types...</option>
                )}
              </select>
            </>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Processing..." : (isLogin ? "Login" : "Register")}
          </button>
        </form>

        <div style={styles.divider}>OR</div>

        <div style={styles.googleWrapper}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
          />
        </div>

        <button style={styles.switch} onClick={switchMode} disabled={loading}>
          Switch to {isLogin ? "Register" : "Login"}
        </button>
      </div>
    </div>
  );
}

// Styles — UPDATED with larger corner images (140px instead of 100px)
const styles = {
  container: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    overflow: "hidden"
  },

  bgLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 0
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at 30% 20%, rgba(26,71,42,0.2), rgba(0,0,0,0.3))",
    zIndex: 1
  },

  // ===== CORNER IMAGE STYLES — SIZE INCREASED TO 140px =====
  cornerImageTL: {
    position: "absolute",
    top: "20px",
    left: "20px",
    zIndex: 2,
    width: "140px",        // Was 100px
    height: "140px",       // Was 100px
    borderRadius: "15px",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(4px)",
    transition: "transform 0.3s ease"
  },

  cornerImageTR: {
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 2,
    width: "140px",        // Was 100px
    height: "140px",       // Was 100px
    borderRadius: "15px",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(4px)",
    transition: "transform 0.3s ease"
  },

  cornerImageBL: {
    position: "absolute",
    bottom: "20px",
    left: "20px",
    zIndex: 2,
    width: "140px",        // Was 100px
    height: "140px",       // Was 100px
    borderRadius: "15px",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(4px)",
    transition: "transform 0.3s ease"
  },

  cornerImageBR: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    zIndex: 2,
    width: "140px",        // Was 100px
    height: "140px",       // Was 100px
    borderRadius: "15px",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(4px)",
    transition: "transform 0.3s ease"
  },

  decoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.85,
    transition: "opacity 0.3s ease, transform 0.3s ease"
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

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s"
  },

  button: {
    padding: "12px",
    background: "linear-gradient(135deg, #2e7d32, #66bb6a)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
    transition: "opacity 0.2s"
  },

  switch: {
    marginTop: "15px",
    background: "none",
    border: "none",
    color: "#2e7d32",
    cursor: "pointer",
    fontWeight: "500"
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

  error: {
    color: "red",
    marginBottom: "10px",
    fontSize: "14px",
    background: "rgba(255,0,0,0.1)",
    padding: "8px",
    borderRadius: "6px"
  }
};

// Add hover effect styles dynamically
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .corner-image:hover {
    transform: scale(1.05);
  }
  .corner-image img:hover {
    opacity: 1;
  }
`;
document.head.appendChild(styleSheet);
