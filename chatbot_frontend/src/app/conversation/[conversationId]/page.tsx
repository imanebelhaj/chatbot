"use client";

import { useState, useRef, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { AuthContext } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/";

// Define proper types for our messages
interface Message {
  user: string;
  ai: string;
}

export default function ConversationPage() {
  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }
  const { isSessionExpired, logout } = authContext;

  // Get conversation ID from URL if available
  const params = useParams();
  
  // Handle the optional route parameter
  const urlConversationId: string | undefined = Array.isArray(params?.id) 
    ? params.id[0] 
    : params?.id;

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation when URL param changes or from local storage
  useEffect(() => {
    const storedConversationId = localStorage.getItem('selected_conversation_id');
    const finalConversationId = urlConversationId || storedConversationId;

    if (finalConversationId) {
      setConversationId(finalConversationId);
      loadConversationHistory(finalConversationId);
    }
  }, [urlConversationId]);

  // Check sidebar state from localStorage and listen for changes
  useEffect(() => {
    const checkSidebarState = () => {
      const savedState = localStorage.getItem('sidebar_collapsed');
      setIsSidebarCollapsed(savedState === 'true');
    };

    // Initial check
    checkSidebarState();

    // Listen for changes to sidebar state
    const handleSidebarStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.isCollapsed !== undefined) {
        setIsSidebarCollapsed(customEvent.detail.isCollapsed);
      } else {
        checkSidebarState();
      }
    };

    window.addEventListener('sidebarStateChanged', handleSidebarStateChange);

    // Cleanup
    return () => {
      window.removeEventListener('sidebarStateChanged', handleSidebarStateChange);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to load conversation history
  async function loadConversationHistory(id: string) {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${API_URL}/chat_history/${id}/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Clear existing messages first
        setMessages([]);
        
        // Transform the message format to match our component's structure
        const formattedMessages = (data.messages ?? []).map((msg: { user_message: string; ai_response: string }) => ({
          user: msg.user_message,
          ai: msg.ai_response,
        }));
        
        // Set the messages
        setMessages(formattedMessages);
      } else {
        console.error("Error loading conversation:", data.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  // Function to send a message to the backend
  async function sendMessage(e: React.FormEvent | null) {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    // Add user message immediately for better UX
    setMessages(prev => [...prev, { user: prompt, ai: "" }]);
    const currentPrompt = prompt;
    setPrompt("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt_message: currentPrompt,
          conversation_id: conversationId // Include conversation_id if continuing an existing conversation
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the last message with AI response
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            user: currentPrompt, 
            ai: data.ai_response 
          };
          return newMessages;
        });
        
        // Set conversation ID if it's a new conversation
        if (!conversationId && data.conversation_id) {
          setConversationId(data.conversation_id);
          // Also store in localStorage for persistence
          localStorage.setItem('selected_conversation_id', data.conversation_id);
        }
      } else {
        // Handle error by updating the last message
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            user: currentPrompt, 
            ai: "Sorry, I encountered an error. Please try again." 
          };
          return newMessages;
        });
        console.error("Error:", data.error || "Unknown error occurred");
      }
    } catch (error) {
      // Handle network error
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          user: currentPrompt, 
          ai: "Network error. Please check your connection and try again." 
        };
        return newMessages;
      });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-r from-indigo-200 to-blue-300 text-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content - adjust width and margin based on sidebar state */}
      <div 
        className={`flex-1 flex flex-col w-full transition-all duration-300 ${
          isSidebarCollapsed ? 'md:ml-0' : 'md:ml-72'
        }`}
      >
        <Navbar />
        
        {/* Loading state */}
        {isLoadingHistory && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500">Loading conversation...</p>
            </div>
          </div>
        )}
        
        {/* Empty state - only show when not loading history */}
        {messages.length === 0 && !isLoadingHistory && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="bg-blue-100 text-blue-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent mb-2">Start a conversation</h3>
              <p className="text-gray-700">Type a message below to begin chatting with our AI assistant.</p>
            </div>
          </div>
        )}
        
        {/* Messages container */}
        {messages.length > 0 && !isLoadingHistory && (
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div key={index} className="space-y-4">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-none max-w-md">
                      <p>{msg.user}</p>
                    </div>
                  </div>
                  
                  {/* AI message */}
                  <div className="flex">
                    <div className="bg-white border border-gray-200 shadow-sm px-4 py-3 rounded-2xl rounded-tl-none max-w-md">
                      {msg.ai ? (
                        <p className="text-gray-700 whitespace-pre-wrap">{msg.ai}</p>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
        
        {/* Message input */}
        <div className="border-t bg-white p-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={(e) => sendMessage(e)} className="flex items-center space-x-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Type a message..."
                disabled={isLoading || isLoadingHistory}
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isLoading || isLoadingHistory}
                className={`p-2.5 rounded-full text-white focus:outline-none ${
                  !prompt.trim() || isLoading || isLoadingHistory
                    ? "bg-indigo-400 cursor-not-allowed" 
                    : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transform hover:scale-105 transition-all"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}