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
    console.log("Saved token exists:", !!savedToken);
    if (savedToken) {
      setToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user when token is set
  useEffect(() => {
    if (!token) {
      return;
    }

    console.log("Token found, fetching current user...");
    
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/me");
        console.log("/me response:", response.data);
        
        if (response.data.success) {
          setCurrentUser(response.data.user);
        } else {
          console.error("Invalid token response");
          localStorage.removeItem("token");
          setToken(null);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        localStorage.removeItem("token");
        setToken(null);
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
        Loading FarmAdvisor...
      </div>
    );
  }

  // No token or no user — show login screen
  if (!token || !currentUser) {
    console.log("No token or user, showing AuthScreen");
    return (
      <AuthScreen
        setToken={setToken}
        setCurrentUser={setCurrentUser}
      />
    );
  }

  // User is authenticated — show dashboard
  console.log("User authenticated, showing Dashboard");
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
