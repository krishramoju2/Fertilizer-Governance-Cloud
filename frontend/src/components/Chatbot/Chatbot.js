import React, { useState } from "react";
import api from "../../services/api";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { sender: "user", text: input }]);

    try {
      const res = await api.post("/chat", { message: input });

      setMessages(prev => [
        ...prev,
        { sender: "bot", text: res.data.reply }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "Error connecting to server" }
      ]);
    }

    setInput("");
  };

  return (
    <div>
      <h2>Chatbot</h2>

      {messages.map((m, i) => (
        <p key={i}>
          <b>{m.sender}:</b> {m.text}
        </p>
      ))}

      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
