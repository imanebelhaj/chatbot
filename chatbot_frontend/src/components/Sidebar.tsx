"use client";
import React, { useEffect, useState } from "react";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/";


interface ChatHistoryItem {
  conversation_id: string;
  title: string;
  created_at: string;
}

export default function Sidebar() {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  useEffect(() => {
    // Fetch chat history from your backend API
    async function fetchChatHistory() {
      const response = await fetch(`${API_URL}/history2/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.chat_history) {
        setChatHistory(data.chat_history);
      } else {
        console.error("Failed to load chat history:", data.error);
      }
    }
    fetchChatHistory();
  }, []);

  return (
    <aside className="w-1/4 h-screen p-4 bg-gray-900 text-gray-100">
      <h2 className="text-xl font-semibold mb-4">Chat History</h2>
      <button className="w-full py-2 mb-4 rounded bg-gray-700 hover:bg-gray-600">
        + New Chat
      </button>
      <ul>
        {chatHistory.map((conversation) => (
          <li key={conversation.conversation_id} className="mb-2">
            <a
              href={`/conversation/${conversation.conversation_id}`}
              className="block p-2 rounded hover:bg-gray-700"
            >
              {conversation.title || "Untitled Conversation"}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
