"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";

export default function ConversationPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ user: string; ai: string }[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Function to send a message to the backend
  async function sendMessage() {
    if (!prompt.trim()) return;
  
    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt_message: prompt }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setMessages([...messages, { user: prompt, ai: data.ai_response }]);
        setPrompt("");
        setConversationId(data.conversation_id); // Update the conversationId
      } else {
        // Handle the case when the backend returns an error
        console.error("Error:", data.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
  

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <div key={index} className="mb-4">
              <p className="text-gray-700 font-medium">You: {msg.user}</p>
              <p className="text-gray-600">AI: {msg.ai}</p>
            </div>
          ))}
        </div>
        <div className="p-4 bg-white border-t">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
