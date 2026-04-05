import React, { useState } from "react";
import Dashboard from "./pages/Dashboard/Dashboard";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [, setToken] = useState(null);

  return (
    <Dashboard
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      setToken={setToken}
    />
  );
}

export default App;
