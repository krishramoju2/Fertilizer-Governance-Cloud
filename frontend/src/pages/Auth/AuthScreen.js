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
    <div>
      <h2>{isLogin ? "Login" : "Register"}</h2>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />

        {!isLogin && (
          <>
            <input
              placeholder="Name"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <select
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

        <button>Submit</button>
      </form>

      <button onClick={() => setIsLogin(!isLogin)}>
        Switch to {isLogin ? "Register" : "Login"}
      </button>
    </div>
  );
}
