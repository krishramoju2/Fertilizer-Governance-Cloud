import Iridescence from "./Iridescence";

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
          await new Promise(resolve => setTimeout(resolve, 700));
          setMessages(prev => [
            ...prev,
            { sender: "thinking", text: thinking[i] }
          ]);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
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
        { sender: "bot", text: "Error connecting to server. Please try again." }
      ]);
    }
  };

  return (
    <div style={{ ...styles.container, position: "relative", overflow: "hidden" }}>
  
    {/* 🔥 Iridescence Background */}
    <div style={styles.bg}>
      <Iridescence 
        color={[0.5, 0.6, 0.8]} 
        speed={0.4} 
        amplitude={0.05} 
        mouseReact={true}
      />
    </div>
          
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
    padding: "10px",
    display: "flex",
    justifyContent: "center",
    background: "transparent",
    minHeight: "auto",
    position: "relative"
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
    border: "1px solid rgba(255,255,255,0.3)",
    position: "relative",
    zIndex: 1
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

  
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0
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
    maxWidth: "85%",
    fontSize: "14px",
    whiteSpace: "pre-wrap",
    border: "1px solid #e2e8f0"
  },
  
  thinkingMessage: {
    alignSelf: "flex-start",
    background: "rgba(226, 232, 240, 0.4)",
    color: "#64748b",
    padding: "8px 12px",
    borderRadius: "10px",
    maxWidth: "80%",
    fontSize: "12.5px",
    fontStyle: "italic",
    borderLeft: "3px solid #cbd5e1",
    marginBottom: "4px"
  },

  thinkingContainer: {
    display: "flex",
    gap: "4px",
    alignItems: "center"
  },

  thinkingDot: {
    width: "6px",
    height: "6px",
    background: "#64748b",
    borderRadius: "50%",
    animation: "pulse 1.4s infinite ease-in-out"
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
