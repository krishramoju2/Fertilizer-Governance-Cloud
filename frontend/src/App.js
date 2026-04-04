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

 

  const handleAnalyze = () => {
    console.log("Analyze clicked");
  };


  

  
  
  console.log({
    token,
    message,
    soilTypes,
    cropTypes,
    fertilizerNames,
    loading,
    result,
    history,
    analytics
  });
  
  return (

  <Dashboard
    currentUser={currentUser}
    setToken={setToken}
    setCurrentUser={setCurrentUser}
    message={message}
    inputs={inputs}
    setInputs={setInputs}
    soilTypes={soilTypes}
    cropTypes={cropTypes}
    fertilizerNames={fertilizerNames}
    handleAnalyze={handleAnalyze}
    loading={loading}
    result={result}
  />

    
  );
}

export default App;
