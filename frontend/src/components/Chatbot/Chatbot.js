import Iridescence from "./Iridescence";

import React, { useState } from "react";
import api from "../../services/api";

export default function Chatbot() {
  
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "SYSTEM INITIALIZED. I am the Agri-Governance Diagnostic Assistant. Please provide your environmental parameters or query for technical analysis."
    }
  ]);
  
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage = { sender: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await api.post("/chat", { message: input });
      const { thinking, reply } = res.data;

      // Reveal thinking steps one by one
      if (thinking && thinking.length > 0) {
        for (let i = 0; i < thinking.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 600));
          setMessages(prev => [
            ...prev,
            { sender: "thinking", text: thinking[i] }
          ]);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      setIsThinking(false);

      const botMessage = {
        sender: "bot",
        text: reply
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      setIsThinking(false);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "SYSTEM ERROR: Connection to diagnostic server lost. Re-attempt advised." }
      ]);
    }
  };

  return (
    <div style={{ ...styles.container, position: "relative", overflow: "hidden" }}>
  
    {/* 🔥 Iridescence Background */}
    <div style={styles.bg}>
      <Iridescence 
        color={[0.1, 0.2, 0.3]} 
        speed={0.3} 
        amplitude={0.03} 
        mouseReact={true}
      />
    </div>
          
      <div style={styles.card}>
        <h2 style={{ marginBottom: "5px", fontWeight: "800", color: "#0f172a", fontSize: "20px" }}>
        🛡️ Agri-Governance AI
        </h2>
        <p style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "15px" }}>
          Enterprise Diagnostic Protocol v4.0.2
        </p>

        {/* 🔥 PROFESSIONAL DESCRIPTION BOX */}
        <div style={styles.infoBox}>
          <p style={styles.description}>
            Authorized diagnostic assistant for precision agriculture. This system provides 
            verified governance guidance based on integrated environmental substrates and 
            biochemical compatibility algorithms.
          </p>
        </div>

        <div style={styles.chatBox}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={
                m.sender === "user" ? styles.userMessage : 
                m.sender === "thinking" ? styles.thinkingMessage : 
                styles.botMessage
              }
            >
              {m.text}
            </div>
          ))}
          {isThinking && (
            <div style={styles.botMessage}>
              <div style={styles.thinkingContainer}>
                <span style={styles.thinkingDot}>.</span>
                <span style={{ ...styles.thinkingDot, animationDelay: "0.2s" }}>.</span>
                <span style={{ ...styles.thinkingDot, animationDelay: "0.4s" }}>.</span>
              </div>
            </div>
          )}
        </div>

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            placeholder="Input diagnostic query..."
            onChange={(e) => setInput(e.target.value)}
          />
          <button style={styles.button} onClick={sendMessage}>
            EXECUTE
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  
  container: {
    padding: "10px",
    display: "flex",
    justifyContent: "center",
    background: "transparent",
    minHeight: "auto",
    position: "relative"
  },
  
  card: {
    width: "480px",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #e2e8f0",
    position: "relative",
    zIndex: 1
  },

  infoBox: {
    background: "#f8fafc",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
    borderLeft: "4px solid #0f172a"
  },

  description: {
    fontSize: "13px",
    color: "#334155",
    margin: 0,
    lineHeight: "1.5",
    fontWeight: "500"
  },

  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0
  },

  chatBox: {
    height: "350px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "15px",
    padding: "15px",
    background: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
  },
  
  userMessage: {
    alignSelf: "flex-end",
    background: "#0f172a",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    maxWidth: "80%",
    fontSize: "14px",
    fontWeight: "500"
  },

  botMessage: {
    alignSelf: "flex-start",
    background: "#f1f5f9",
    color: "#0f172a",
    padding: "12px 16px",
    borderRadius: "8px",
    maxWidth: "90%",
    fontSize: "14px",
    whiteSpace: "pre-wrap",
    border: "1px solid #e2e8f0",
    lineHeight: "1.6",
    fontFamily: "'Inter', sans-serif"
  },
  
  thinkingMessage: {
    alignSelf: "flex-start",
    background: "#1e293b",
    color: "#94a3b8",
    padding: "8px 12px",
    borderRadius: "4px",
    maxWidth: "95%",
    fontSize: "12px",
    fontFamily: "'Roboto Mono', monospace",
    borderLeft: "2px solid #38bdf8",
    marginBottom: "2px",
    letterSpacing: "0.3px"
  },

  thinkingContainer: {
    display: "flex",
    gap: "4px",
    alignItems: "center"
  },

  thinkingDot: {
    width: "6px",
    height: "6px",
    background: "#0f172a",
    borderRadius: "50%",
    animation: "pulse 1.4s infinite ease-in-out"
  },
  
  inputRow: {
    display: "flex",
    gap: "10px",
    marginTop: "5px"
  },
  
  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: "14px",
    background: "#f8fafc",
    color: "#0f172a"
  },
  
  button: {
    padding: "12px 24px",
    background: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
    letterSpacing: "1px",
    transition: "0.2s"
  }
};

const pulseKeyframes = `
  @keyframes pulse {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
    40% { transform: scale(1.1); opacity: 1; }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = pulseKeyframes;
  document.head.appendChild(styleSheet);
}
