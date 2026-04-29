import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { GoogleLogin } from "@react-oauth/google";

// Placeholder for the corporate hero image - User should update this path if needed
const heroImg = "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=2070";

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

  useEffect(() => {
    setError("");
  }, [isLogin]);

  useEffect(() => {
    const fetchSoilTypes = async () => {
      try {
        const res = await api.get("/config/soil-types");
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          setSoilTypes(res.data.data);
        }
      } catch (err) {
        console.error("Soil types fetch failed:", err);
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
    setFormData({ ...formData, password: "", name: "" });
  };

  return (
    <div style={styles.container}>
      {/* Hero Background with mesh overlay */}
      <div style={styles.heroBg}>
        <div style={styles.meshOverlay} />
      </div>

      <div style={styles.content}>
        <div style={styles.leftSide}>
          <h1 style={styles.brandTitle}>FarmAdvisor <span style={{color: '#4ade80'}}>Pro</span></h1>
          <p style={styles.brandSubtitle}>
            Precision Governance for Sustainable Agriculture. <br />
            Empowering farmers with data-driven decision intelligence.
          </p>
          <div style={styles.statsContainer}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>98%</span>
              <span style={styles.statLabel}>Prediction Accuracy</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>10k+</span>
              <span style={styles.statLabel}>Farmers Empowered</span>
            </div>
          </div>
        </div>

        <div style={styles.rightSide}>
          <div style={styles.card}>
            <h2 style={styles.title}>{isLogin ? "Welcome Back" : "Join the Network"}</h2>
            <p style={styles.subtitle}>{isLogin ? "Access your strategic dashboard" : "Register your farm for precision insights"}</p>

            {error && <p style={styles.error}>{error}</p>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                style={styles.input}
                type="email"
                placeholder="Corporate Email Address"
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
                    placeholder="Full Professional Name"
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
                    {soilTypes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </>
              )}

              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Processing..." : (isLogin ? "Sign In" : "Get Started")}
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerLine}></span>
              <span style={styles.dividerText}>SECURE ACCESS</span>
              <span style={styles.dividerLine}></span>
            </div>

            <div style={styles.googleWrapper}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="filled_blue"
                shape="pill"
              />
            </div>

            <p style={styles.switchText}>
              {isLogin ? "Don't have an account?" : "Already part of the network?"}
              <button style={styles.switchButton} onClick={switchMode} disabled={loading}>
                {isLogin ? "Request Access" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
      
      <footer style={styles.footer}>
        © 2026 FarmAdvisor Governance Cloud. All Rights Reserved. Confidential & Proprietary.
      </footer>
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#020617",
    color: "#f8fafc",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden"
  },
  heroBg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage: `url(${heroImg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    zIndex: 0,
    opacity: 0.6
  },
  meshOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "radial-gradient(circle at 20% 30%, rgba(2, 6, 23, 0.4), rgba(2, 6, 23, 0.95))",
    zIndex: 1
  },
  content: {
    position: "relative",
    zIndex: 2,
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 10%",
    gap: "50px"
  },
  leftSide: {
    maxWidth: "500px"
  },
  brandTitle: {
    fontSize: "56px",
    fontWeight: "900",
    marginBottom: "20px",
    letterSpacing: "-2px"
  },
  brandSubtitle: {
    fontSize: "20px",
    color: "#94a3b8",
    lineHeight: "1.6",
    marginBottom: "40px"
  },
  statsContainer: {
    display: "flex",
    gap: "40px"
  },
  statItem: {
    display: "flex",
    flexDirection: "column"
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#4ade80"
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  rightSide: {
    width: "400px"
  },
  card: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    padding: "48px",
    borderRadius: "24px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    textAlign: "center"
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    marginBottom: "8px",
    color: "#fff"
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "32px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  input: {
    padding: "16px 20px",
    borderRadius: "12px",
    background: "rgba(2, 6, 23, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s ease"
  },
  button: {
    padding: "16px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "8px",
    transition: "all 0.3s ease",
    boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)"
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "32px 0",
    gap: "10px"
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255, 255, 255, 0.1)"
  },
  dividerText: {
    fontSize: "10px",
    color: "#64748b",
    fontWeight: "800",
    letterSpacing: "2px"
  },
  googleWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px"
  },
  switchText: {
    fontSize: "14px",
    color: "#94a3b8"
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#4ade80",
    cursor: "pointer",
    fontWeight: "700",
    marginLeft: "8px",
    padding: 0
  },
  error: {
    color: "#f87171",
    background: "rgba(248, 113, 113, 0.1)",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
    border: "1px solid rgba(248, 113, 113, 0.2)"
  },
  footer: {
    padding: "32px",
    textAlign: "center",
    fontSize: "12px",
    color: "#475569",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)"
  }
};
