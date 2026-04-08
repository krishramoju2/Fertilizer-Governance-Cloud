

import React, { useState } from "react";
import api from "../../services/api";

export default function Chatbot() {
  
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! I'm your FarmAdvisor AI 🌱 Ask me about crops, fertilizers, or weather conditions."
    }
  ]);
  
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages(prev => [...prev, userMessage]);

    try {
      const res = await api.post("/chat", { message: input });

      const botMessage = {
        sender: "bot",
        text: res.data.reply
      };

      setMessages(prev => [...prev, botMessage]);
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "Error connecting to server" }
      ]);
    }

    setInput("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ marginBottom: "10px", fontWeight: "700" }}>
        🤖 FarmAdvisor AI
        </h2>

        {/* 🔥 NEW DESCRIPTION BOX */}
        <div style={styles.infoBox}>
          <p style={styles.description}>
            Interact with an AI-powered assistant to get instant agricultural guidance. 
            Ask questions about fertilizers, crops, or predictions, and receive 
            quick, intelligent responses to support your decisions.
          </p>
        </div>

        <div style={styles.chatBox}>
              
          {messages.map((m, i) => (
                        
            <div
              key={i}
              style={m.sender === "user" ? styles.userMessage : styles.botMessage}
            >
              {m.text}
            </div>

          ))}

        </div>

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            placeholder="Ask something..."
            onChange={(e) => setInput(e.target.value)}
          />
          <button style={styles.button} onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  
  container: {
    padding: "30px",
    display: "flex",
    justifyContent: "center",
    background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
    minHeight: "100vh"
  },
  
  card: {
    width: "450px",
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(255,255,255,0.3)"
  },

  /* 🔥 NEW STYLES */
  infoBox: {
    background: "rgba(34,197,94,0.1)",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "12px",
    border: "1px solid rgba(34,197,94,0.2)"
  },

  
  description: {
    fontSize: "13.5px",
    color: "#444",
    margin: 0,
    lineHeight: "1.4"
  },

  chatBox: {
    height: "320px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "10px",
    padding: "12px",
    background: "rgba(255,255,255,0.6)",
    borderRadius: "12px",
    border: "1px solid rgba(0,0,0,0.05)"
  },
  
  message: {
    padding: "10px",
    borderRadius: "10px",
    maxWidth: "70%"
  },

  userMessage: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #4f46e5, #22c55e)",
    color: "white",
    padding: "10px 14px",
    borderRadius: "12px",
    maxWidth: "75%",
    fontSize: "14px"
  },

  botMessage: {
    alignSelf: "flex-start",
    background: "#f1f5f9",
    color: "#1e293b",
    padding: "10px 14px",
    borderRadius: "12px",
    maxWidth: "75%",
    fontSize: "14px"
  },
  
  inputRow: {
    display: "flex",
    gap: "10px",
    marginTop: "8px"
  },
  
  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: "14px"
  },
  
  button: {
    padding: "12px 16px",
    background: "linear-gradient(135deg, #22c55e, #4f46e5)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "0.3s"
  }
};
