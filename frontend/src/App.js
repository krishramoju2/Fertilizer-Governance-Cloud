import React, { useState } from "react";
import Dashboard from "./pages/Dashboard/Dashboard";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);

  return (
    <Dashboard
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      setToken={setToken}
    />
  );
}

export default App;
