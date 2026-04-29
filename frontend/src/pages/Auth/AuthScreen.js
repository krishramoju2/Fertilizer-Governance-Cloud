import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { GoogleLogin } from "@react-oauth/google";

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
      <div style={styles.loginCard}>
        <div style={styles.brandSection}>
          <div style={styles.logo}>
            <div style={{ width: "40px", height: "40px", background: "#10b981", borderRadius: "10px", margin: "0 auto", display: "grid", placeItems: "center", color: "#fff", fontWeight: "900", fontSize: "20px" }}>
              AP
            </div>
          </div>
          <h1 style={styles.brandName}>FarmAdvisor <span style={{ color: "#10b981" }}>Pro</span></h1>
          <p style={styles.brandTagline}>Enterprise Governance Cloud</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Corporate Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Access Key</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Soil Specification</label>
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
              </div>
            </>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Request Access")}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.line} />
          <span style={styles.dividerText}>OR CONTINUE WITH</span>
          <div style={styles.line} />
        </div>

        <div style={styles.googleWrapper}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="outline"
            shape="rectangular"
            width="100%"
          />
        </div>

        <p style={styles.footerText}>
          {isLogin ? "New to the platform?" : "Already have access?"}
          <button style={styles.switchButton} onClick={switchMode} disabled={loading}>
            {isLogin ? "Request an Account" : "Sign In Here"}
          </button>
        </p>
      </div>

      <p style={styles.legalText}>
        © 2026 FarmAdvisor Pro. Strategic Governance Node. Secure & Confidential.
      </p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617",
    padding: "20px",
    fontFamily: "'Inter', sans-serif"
  },
  loginCard: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#0f172a",
    padding: "48px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
  },
  brandSection: {
    textAlign: "center",
    marginBottom: "40px"
  },
  logo: {
    marginBottom: "16px"
  },
  brandName: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#fff",
    margin: 0,
    letterSpacing: "-0.5px"
  },
  brandTagline: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600",
    marginTop: "4px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#020617",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box"
  },
  button: {
    marginTop: "12px",
    padding: "14px",
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background 0.2s ease"
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    margin: "32px 0"
  },
  line: {
    flex: 1,
    height: "1px",
    backgroundColor: "rgba(255, 255, 255, 0.1)"
  },
  dividerText: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#475569",
    letterSpacing: "1px"
  },
  googleWrapper: {
    width: "100%",
    marginBottom: "32px"
  },
  footerText: {
    textAlign: "center",
    fontSize: "14px",
    color: "#64748b",
    margin: 0
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#10b981",
    fontWeight: "700",
    cursor: "pointer",
    marginLeft: "8px",
    padding: 0
  },
  error: {
    padding: "12px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    color: "#f87171",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "24px",
    textAlign: "center"
  },
  legalText: {
    marginTop: "48px",
    fontSize: "11px",
    color: "#475569",
    fontWeight: "600",
    letterSpacing: "0.5px"
  }
};
