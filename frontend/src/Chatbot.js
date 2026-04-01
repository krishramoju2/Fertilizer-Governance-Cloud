import React, { useState } from "react";
import axios from 'axios';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      sender: "user",
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
        const res = await axios.post("https://fertilizer-backend-jj59.onrender.com/chat", {
          message: input
        });

      const botMessage = {
        sender: "bot",
        text: res.data.reply
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = {
        sender: "bot",
        text: "❌ Error connecting to server"
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error(err);
    }

    setInput("");
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🌾 Farm Chatbot</h2>

      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={
              msg.sender === "user"
                ? styles.userMessage
                : styles.botMessage
            }
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div style={styles.botMessage}>
            ⏳ Thinking...
          </div>
        )}
      </div>

      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Type your query (e.g., wheat, temp 30C, moisture 40)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          style={styles.input}
        />

        <button onClick={sendMessage} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    fontFamily: "Arial, sans-serif"
  },

  title: {
    textAlign: "center"
  },

  chatBox: {
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "10px",
    height: "400px",
    overflowY: "auto",
    marginBottom: "10px",
    backgroundColor: "#f9f9f9"
  },

  userMessage: {
    textAlign: "right",
    margin: "8px",
    padding: "10px",
    backgroundColor: "#d1e7dd",
    borderRadius: "10px",
    display: "inline-block"
  },

  botMessage: {
    textAlign: "left",
    margin: "8px",
    padding: "10px",
    backgroundColor: "#f8d7da",
    borderRadius: "10px",
    display: "inline-block"
  },

  inputContainer: {
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
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#28a745",
    color: "white",
    cursor: "pointer"
  }
};
