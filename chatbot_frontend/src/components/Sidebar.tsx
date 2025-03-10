"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/";

interface ChatHistoryItem {
  conversation_id: string;
  title: string;
  created_at: string;
}

export default function Sidebar() {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed on mobile
  const pathname = usePathname();

  useEffect(() => {
    // Fetch chat history from your backend API
    async function fetchChatHistory() {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError("Authentication required");
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(`${API_URL}/history2/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (response.ok && data.chat_history) {
          setChatHistory(data.chat_history);
        } else {
          setError(data.error || "Failed to load chat history");
        }
      } catch (err) {
        setError("Network error. Please try again later.");
        console.error("Failed to load chat history:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchChatHistory();
  }, []);

  // Format the creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Mobile toggle button - only visible on small screens */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed z-40 bottom-4 left-4 md:hidden p-3 rounded-full bg-blue-600 text-white shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          {isCollapsed ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          )}
        </svg>
      </button>
    
      {/* Sidebar container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-gray-900 text-gray-100 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isCollapsed ? "-translate-x-full" : "translate-x-0"
        } flex flex-col h-screen`}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">AI Chat</h1>
            <button
              onClick={() => setIsCollapsed(true)} 
              className="p-1 rounded-md hover:bg-gray-800 md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <Link href="/conversation/" passHref>
            <button className="w-full mt-4 py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </button>
          </Link>
        </div>
        
        {/* Chat history section with custom scrolling */}
        <div 
          className="flex-1 overflow-y-auto py-2 custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4B5563 #1F2937'
          }}
        >
          <style jsx global>{`
            /* Custom scrollbar for Webkit browsers (Chrome, Safari, etc.) */
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #1F2937;
              border-radius: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #4B5563;
              border-radius: 8px;
              border: 2px solid #1F2937;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: #6B7280;
            }
            
            /* For Firefox */
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: #4B5563 #1F2937;
            }
          `}</style>
          
          <div className="px-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-4 px-2 text-gray-400 text-sm">
                <p>{error}</p>
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="text-center py-4 px-2 text-gray-400 text-sm">
                <p>No conversations yet</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {chatHistory.map((conversation) => {
                  const isActive = pathname === `/conversation/${conversation.conversation_id}`;
                  
                  return (
                    <li key={conversation.conversation_id}>
                      <Link href={`/conversation/${conversation.conversation_id}`} passHref>
                        <div 
                          className={`flex items-center p-2.5 rounded-md transition-colors ${
                            isActive 
                              ? "bg-gray-700" 
                              : "hover:bg-gray-800"
                          }`}
                        >
                          <div className="mr-3 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <h3 className="text-sm font-medium truncate">
                                {conversation.title || "Untitled Conversation"}
                              </h3>
                              <span className="text-xs text-gray-500 ml-1 flex-shrink-0">
                                {formatDate(conversation.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        
        {/* User section */}
        <div className="p-4 border-t border-gray-800 mt-auto">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              U
            </div>
            <div className="ml-2">
              <div className="text-sm font-medium">User Name</div>
              <div className="text-xs text-gray-500">Free Plan</div>
            </div>
            <button className="ml-auto p-1.5 rounded-md hover:bg-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Backdrop for mobile - appears when sidebar is open */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity duration-300 ${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={() => setIsCollapsed(true)}
      />
    </>
  );
}