"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; // Assuming you have a useAuth hook to get user info

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/";

interface ChatHistoryItem {
  conversation_id: string;
  title: string;
  created_at: string;
}

interface UserProfile {
  username: string;
  email: string;
  date_joined: string;
}

export default function Sidebar() {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false); // Default expanded on desktop
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth(); // Assuming useAuth provides user info

  useEffect(() => {
    // Fetch user profile from backend
    async function fetchUserProfile() {
      setProfileLoading(true);
      
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setProfileLoading(false);
          return;
        }
        
        const response = await fetch(`${API_URL}/profile/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setUserProfile(data);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }
    
    fetchUserProfile();
  }, []);

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

  // Load sidebar collapsed state from localStorage on initial load
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Save sidebar collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  // Format the creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleConversationSelect = (id: string) => {
    localStorage.setItem('selected_conversation_id', id);
    router.push(`/conversation/${id}`);
    // Close mobile menu after selection
    setIsMobileMenuOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent triggering the conversation selection
    setConversationToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError("Authentication required");
        return;
      }
      
      const response = await fetch(`${API_URL}/conversation_delete/${conversationToDelete}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Remove the deleted conversation from the state
        setChatHistory(prevHistory => 
          prevHistory.filter(convo => convo.conversation_id !== conversationToDelete)
        );
        
        // If we're on the deleted conversation's page, redirect to main conversation page
        if (pathname === `/conversation/${conversationToDelete}`) {
          router.push('/conversation/');
        }
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete conversation");
      }
    } catch (err) {
      setError("Network error. Please try again later.");
      console.error("Failed to delete conversation:", err);
    } finally {
      setShowDeleteModal(false);
      setConversationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setConversationToDelete(null);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Ensure mobile menu state is synced on larger screens
    if (window.innerWidth >= 768) {
      setIsMobileMenuOpen(!isCollapsed);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Keep desktop state in sync when on mobile
    if (window.innerWidth < 768) {
      setIsCollapsed(!isMobileMenuOpen);
    }
  };

  // In Sidebar.jsx, after setting the collapsed state:
useEffect(() => {
  localStorage.setItem('sidebar_collapsed', isCollapsed.toString());
  
  // Dispatch custom event for other components to listen to
  const event = new CustomEvent('sidebarStateChanged', {
    detail: { isCollapsed }
  });
  window.dispatchEvent(event);
}, [isCollapsed]);

  return (
    <>
      {/* Mobile toggle button - only visible on small screens */}
      <button 
        onClick={toggleMobileMenu}
        className="fixed z-40 bottom-4 left-4 md:hidden p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
    
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium mb-4">Delete Conversation</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this conversation? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={handleDeleteCancel} 
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* Sidebar Toggle Button - Visible on desktop */}
      <button 
        onClick={toggleSidebar}
        className={`fixed top-4 left-4 z-30 hidden md:flex items-center justify-center p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transition-all duration-300 ${
          isCollapsed ? 'translate-x-0' : 'translate-x-64'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
          {isCollapsed ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
          )}
        </svg>
      </button>
    
      {/* Sidebar container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-20 w-72 bg-white text-gray-900 transform transition-all duration-300 ease-in-out ${
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        } ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isCollapsed ? 'md:-translate-x-full' : 'md:translate-x-0'
        } flex flex-col h-screen`}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">AI Chat</h1>
            <button
              onClick={toggleMobileMenu} 
              className="p-1 rounded-md hover:bg-gray-200 md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <Link href="/conversation/" passHref>
            <button className="w-full mt-4 py-2.5 px-4 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium transition-colors flex items-center justify-center space-x-2">
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
            scrollbarColor: '#E5E7EB #F3F4F6'
          }}
        >
          <style jsx global>{`
            /* Custom scrollbar for Webkit browsers (Chrome, Safari, etc.) */
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #F3F4F6;
              border-radius: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #E5E7EB;
              border-radius: 8px;
              border: 2px solid #F3F4F6;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: #D1D5DB;
            }
            
            /* For Firefox */
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: #E5E7EB #F3F4F6;
            }
          `}</style>
          
          <div className="px-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-4 px-2 text-gray-500 text-sm">
                <p>{error}</p>
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="text-center py-4 px-2 text-gray-500 text-sm">
                <p>No conversations yet</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {chatHistory.map((conversation) => {
                  const isActive = pathname === `/conversation/${conversation.conversation_id}`;
                  
                  return (
                    <li key={conversation.conversation_id}>
                      <div 
                        className={`flex items-center p-2.5 rounded-md transition-colors ${
                          isActive 
                            ? "bg-gray-200" 
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleConversationSelect(conversation.conversation_id)}
                        >
                          <div className="flex justify-between">
                            <h3 className="text-sm font-medium truncate">
                              {conversation.title || "Untitled Conversation"}
                            </h3>
                            <span className="text-xs text-gray-500 ml-1 flex-shrink-0">
                              {formatDate(conversation.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Delete icon */}
                        <button 
                          onClick={(e) => handleDeleteClick(e, conversation.conversation_id)}
                          className="ml-2 p-1 text-gray-500 hover:text-red-500 hover:bg-gray-200 rounded transition-colors"
                          title="Delete conversation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        
        {/* User section with toggle button */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
              {profileLoading ? '?' : (userProfile?.username?.charAt(0).toUpperCase() || 'U')}
            </div>
            <div className="ml-2">
              <div className="text-sm font-medium">
                {profileLoading ? 'Loading...' : (userProfile?.username || 'User Name')}
              </div>
              <div className="text-xs text-gray-500">Free Plan</div>
            </div>
            
            
          </div>
        </div>
      </aside>
      
      {/* Backdrop for mobile - appears when sidebar is open */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMobileMenu}
      />
    </>
  );
}