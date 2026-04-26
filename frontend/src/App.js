import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard/Dashboard";
import AuthScreen from "./pages/Auth/AuthScreen";
import api from "./services/api";

function App() {
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on app start
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    console.log("🔍 Saved token exists:", !!savedToken);
    
    // ✅ Reset currentUser if no token exists
    if (!savedToken) {
      console.log("🔍 No token found, resetting currentUser");
      setCurrentUser(null);
      setLoading(false);
      return;
    }
    
    setToken(savedToken);
  }, []);

  // Fetch user when token is set
  useEffect(() => {
    if (!token) {
      console.log("🔍 No token, skipping user fetch");
      // ✅ Ensure currentUser is null when token is null
      if (currentUser) {
        setCurrentUser(null);
      }
      return;
    }

    console.log("🔍 Token found, fetching current user...");
    
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/me");
        console.log("🔍 /me response:", response.data);
        
        if (response.data.success) {
          console.log("✅ User loaded:", response.data.user.email);
          setCurrentUser(response.data.user);
        } else {
          console.error("❌ Invalid token response");
          localStorage.removeItem("token");
          setToken(null);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("❌ Failed to fetch user:", error);
        localStorage.removeItem("token");
        setToken(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        fontSize: "18px",
        color: "#1a472a"
      }}>
        🌾 Loading FarmAdvisor...
      </div>
    );
  }

  // ✅ Show AuthScreen if NO token OR NO currentUser
  if (!token || !currentUser) {
    console.log("🔍 No token or user, showing AuthScreen. Token:", !!token, "User:", !!currentUser);
    return (
      <AuthScreen
        setToken={setToken}
        setCurrentUser={setCurrentUser}
      />
    );
  }

  // ✅ Only show Dashboard when we have BOTH token AND currentUser
  console.log("✅ User authenticated, showing Dashboard");
  return (
    <Dashboard
      token={token}
      setToken={setToken}
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
    />
  );
}

export default App;
