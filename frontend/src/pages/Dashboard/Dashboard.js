import React, { useState } from "react";
import MLModel from "../../components/ML/MLModel";
import Chatbot from "../../components/Chatbot/Chatbot";

export default function Dashboard({ setToken }) {
  const [activeTab, setActiveTab] = useState("ml");

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <button onClick={() => setActiveTab("ml")}>ML Model</button>
      <button onClick={() => setActiveTab("chat")}>Chatbot</button>
      <button onClick={logout}>Logout</button>

      {activeTab === "ml" && <MLModel />}
      {activeTab === "chat" && <Chatbot />}
    </div>
  );
}
