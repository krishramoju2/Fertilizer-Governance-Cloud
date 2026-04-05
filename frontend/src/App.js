import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard/Dashboard";
import AuthScreen from "./pages/Auth/AuthScreen";

function App() {
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Load token from localStorage on app start
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // 🔑 AUTH FLOW CONTROL
  if (!token) {
    return (
      <AuthScreen
        setToken={setToken}
        setCurrentUser={setCurrentUser}
      />
    );
  }

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
