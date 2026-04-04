import React, { useState } from "react";
import api from "../../services/api";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
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
        <h2>Chat Assistant</h2>

        <div style={styles.chatBox}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.message,
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                background:
                  m.sender === "user" ? "#1a472a" : "#e5e5e5",
                color: m.sender === "user" ? "white" : "black"
              }}
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
    padding: "20px",
    display: "flex",
    justifyContent: "center"
  },
  card: {
    width: "400px",
    background: "white",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column"
  },
  chatBox: {
    height: "300px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "10px",
    padding: "10px",
    background: "#f5f5f5",
    borderRadius: "5px"
  },
  message: {
    padding: "10px",
    borderRadius: "10px",
    maxWidth: "70%"
  },
  inputRow: {
    display: "flex",
    gap: "10px"
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },
  button: {
    padding: "10px 15px",
    background: "#1a472a",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  }
};
