import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { GoogleLogin } from "@react-oauth/google";
import Galaxy from "../../components/Auth/Galaxy";

// Import your 4 images from the same folder (Auth folder)
import agritechImg from "./agritech.png";
import chatbotImg from "./chatbot.png";
import harvestImg from "./harvest.png";
import innovationImg from "./innovation.png";

export default function AuthScreen({ setToken, setCurrentUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [soilTypes, setSoilTypes] = useState(["Loamy", "Sandy", "Clay"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    soil_type: "Loamy",
    farm_size: "1",
    location: "",
    primary_crops: []
  });

  // Reset error when switching between Login/Register
  useEffect(() => {
    setError("");
  }, [isLogin]);

  // Fetch soil types from backend
  useEffect(() => {
    let retries = 0;
    const maxRetries = 3;

