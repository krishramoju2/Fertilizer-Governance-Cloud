import React, { useState } from "react";
import AuthScreen from "./pages/Auth/AuthScreen";
import Dashboard from "./pages/Dashboard/Dashboard";
import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState(null);

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
