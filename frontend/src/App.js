import React, { useState } from "react";
import Dashboard from "./pages/Dashboard/Dashboard";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [inputs, setInputs] = useState({
    Temperature: "",
    Moisture: "",
    Soil_Type: "",
    Crop_Type: "",
    Fertilizer_Name: ""
  });

  const [soilTypes, setSoilTypes] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [fertilizerNames, setFertilizerNames] = useState([]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState({});

  const [adminManageType, setAdminManageType] = useState("");
  const [newItem, setNewItem] = useState("");

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [userHistory, setUserHistory] = useState([]);

  const handleAnalyze = () => {
    console.log("Analyze clicked");
  };

  const generatePDF = () => {
    console.log("PDF");
  };

  const handleAddItem = () => {};
  const handleRemoveItem = () => {};
  const handleSelectUser = () => {};
  
  console.log({
    token,
    message,
    soilTypes,
    cropTypes,
    fertilizerNames,
    loading,
    result,
    history,
    analytics,
    users,
    selectedUserId,
    userAnalytics,
    userHistory
  });
  
  return (

    
    <Dashboard
    token={token}
    setToken={setToken}
  
    message={message}
    setMessage={setMessage}
  
    soilTypes={soilTypes}
    setSoilTypes={setSoilTypes}
  
    cropTypes={cropTypes}
    setCropTypes={setCropTypes}
  
    fertilizerNames={fertilizerNames}
    setFertilizerNames={setFertilizerNames}
  
    loading={loading}
    setLoading={setLoading}
  
    result={result}
    setResult={setResult}
  
    history={history}
    setHistory={setHistory}
  
    analytics={analytics}
    setAnalytics={setAnalytics}
  
    users={users}
    setUsers={setUsers}
  
    selectedUserId={selectedUserId}
    setSelectedUserId={setSelectedUserId}
  
    userAnalytics={userAnalytics}
    setUserAnalytics={setUserAnalytics}
  
    userHistory={userHistory}
    setUserHistory={setUserHistory}
  />
    
  );
}

export default App;
