"use client";

import { useState, useRef, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Define proper types for our messages with attachment support
type Attachment = {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_category: string;
  uploaded_at: string;
};

interface Message {
  user: string;
  ai: string;
  attachments?: Attachment[];
}

export default function ConversationPage() {
    const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  
  // Get conversation ID from URL if available
  const params = useParams();
  
  // Handle the optional route parameter
  const urlConversationId: string | undefined = Array.isArray(params?.id) 
    ? params.id[0] 
    : params?.id;

    

 // Listen for theme changes from Navbar
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const savedTheme = localStorage.getItem("theme");
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.isDarkMode !== undefined) {
        setIsDarkMode(customEvent.detail.isDarkMode);
      }
    };
    // Check saved theme preference
    const savedTheme = localStorage.getItem("theme");
    setIsDarkMode(savedTheme === "dark");
    
    document.addEventListener('themeChange', handleThemeChange);
    
    return () => {
      document.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

    
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

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Handle file drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    if (event.dataTransfer.files) {
      const newFiles = Array.from(event.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Handle drag events
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Remove a selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Open file browser
  const openFileBrowser = () => {
    fileInputRef.current?.click();
  };

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
        const formattedMessages = (data.messages ?? []).map((msg: { 
          user_message: string; 
          ai_response: string;
          attachments?: Attachment[];
        }) => ({
          user: msg.user_message,
          ai: msg.ai_response,
          // Make sure we're properly mapping the attachments
          attachments: msg.attachments || []
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

  // Helper function to get file category from filename
  function getFileCategory(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'].includes(extension)) {
      return 'document';
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'archive';
    }
    if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
      return 'audio';
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'wmv'].includes(extension)) {
      return 'video';
    }
    
    return 'other';
  }

  // Function to send a message to the backend
  async function sendMessage(e: React.FormEvent | null) {
    if (e) e.preventDefault();
    if ((!prompt.trim() && selectedFiles.length === 0) || isLoading) return;
  
    // Add user message immediately for better UX
    setMessages(prev => [...prev, { 
      user: prompt, 
      ai: "",
      // Create temporary attachments with local URLs
      attachments: selectedFiles.map(file => ({
        id: "temp-" + Math.random().toString(36).substring(2, 9),
        file_name: file.name,
        file_type: file.type,
        file_url: URL.createObjectURL(file),
        file_category: getFileCategory(file.name),
        uploaded_at: new Date().toISOString()
      }))
    }]);
    
    const currentPrompt = prompt;
    const currentFiles = [...selectedFiles];
    
    setPrompt("");
    setSelectedFiles([]);
    setIsLoading(true);
  
    try {
      // Create FormData to send files
      const formData = new FormData();
      formData.append("prompt_message", currentPrompt);
      
      if (conversationId) {
        formData.append("conversation_id", conversationId);
      }
      
      // Append files to formData
      currentFiles.forEach(file => {
        formData.append("files", file);
      });
  
      const response = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Update the last message with AI response and properly handled attachments
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            user: currentPrompt, 
            ai: data.ai_response,
            // Important: keep the attachments received from the server response
            attachments: data.files || [] 
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
            ai: "Sorry, I encountered an error. Please try again.",
            // Keep temporary attachments to show what was attempted to be sent
            attachments: newMessages[newMessages.length - 1].attachments
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
          ai: "Network error. Please check your connection and try again.",
          // Keep temporary attachments to show what was attempted to be sent
          attachments: newMessages[newMessages.length - 1].attachments
        };
        return newMessages;
      });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Render file attachment based on type
  const renderAttachment = (attachment: Attachment) => {
    switch (attachment.file_category) {
      case 'image':
        return (
          <div className="mt-2 relative">
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                <img 
                  src={attachment.file_url} 
                  alt={attachment.file_name} 
                  className="max-h-60 object-contain"
                />
              </a>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{attachment.file_name}</div>
          </div>
        );
      
      case 'video':
        return (
          <div className="mt-2">
            <video 
              controls 
              className="max-w-full rounded-lg border border-gray-200 dark:border-gray-700"
              style={{ maxHeight: '240px' }}
            >
              <source src={attachment.file_url} type={attachment.file_type} />
              Your browser does not support the video tag.
            </video>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{attachment.file_name}</div>
          </div>
        );
      
      case 'audio':
        return (
          <div className="mt-2">
            <audio controls className="w-full">
              <source src={attachment.file_url} type={attachment.file_type} />
              Your browser does not support the audio element.
            </audio>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{attachment.file_name}</div>
          </div>
        );
      
      case 'document':
      case 'archive':
      default:
        return (
          <div className="mt-2">
            <a 
              href={attachment.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{attachment.file_name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {attachment.file_type || "Document"}
                </div>
              </div>
            </a>
          </div>
        );
    }
  };

  return (
    <div className={`flex h-screen ${isDarkMode 
  ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-100 dark-theme' 
  : 'bg-gradient-to-r from-indigo-200 to-blue-300 text-gray-900'
}`}>
    
  
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
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Loading conversation...</p>
            </div>
          </div>
        )}
        
        {/* Empty state - only show when not loading history */}
        {messages.length === 0 && !isLoadingHistory && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className={`${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode 
                ? 'bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent'
              } mb-2`}>Start a conversation</h3>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Type a message or drop files below to begin chatting with our AI assistant.</p>
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
                    <div className={`${isDarkMode 
                      ? 'bg-indigo-800 text-white' 
                      : 'bg-indigo-600 text-white'
                    } px-4 py-3 rounded-2xl rounded-tr-none max-w-md`}>
                      <p>{msg.user}</p>
                      
                      {/* User's file attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((attachment, i) => (
                            <div key={attachment.id || i} className="text-sm">
                              {renderAttachment(attachment)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* AI message */}
                  <div className="flex">
                    <div className={`${isDarkMode 
                      ? 'bg-gray-700 border-gray-600 shadow-sm' 
                      : 'bg-white border-gray-200 shadow-sm'
                    } border px-4 py-3 rounded-2xl rounded-tl-none max-w-md`}>
                      {msg.ai ? (
                        <p className={isDarkMode ? 'text-gray-200 whitespace-pre-wrap' : 'text-gray-700 whitespace-pre-wrap'}>{msg.ai}</p>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
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
        
        {/* File upload preview */}
        {selectedFiles.length > 0 && (
          <div className={`${isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-t'
          } px-4 py-2 md:px-6`}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Selected Files ({selectedFiles.length})</h3>
                <button 
                  onClick={() => setSelectedFiles([])}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className={`relative ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-50 border'
                  } rounded-lg p-2 text-xs flex items-center max-w-xs`}>
                    <div className="truncate mr-6">
                      {file.name}
                    </div>
                    <button 
                      onClick={() => removeFile(index)}
                      className={`absolute right-1 ${isDarkMode 
                        ? 'text-gray-400 hover:text-red-400' 
                        : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Message input */}
        <div 
          className={`${isDarkMode 
            ? 'border-t border-gray-700 bg-gray-800' 
            : 'border-t bg-white'
          } p-4 md:px-6 ${isDragging ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="max-w-4xl mx-auto">
            <form onSubmit={(e) => sendMessage(e)} className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.zip,.rar,.7z,.tar,.gz,.mp3,.wav,.ogg,.flac,.mp4,.mov,.avi,.mkv,.wmv"
              />
              
              <button
                type="button"
                onClick={openFileBrowser}
                className={`p-2.5 rounded-full ${isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200 border-gray-600 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 border-gray-300 hover:bg-gray-50'
                } border focus:outline-none`}
                disabled={isLoading || isLoadingHistory}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className={`flex-1 border ${isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 focus:ring-indigo-400' 
                  : 'border-gray-300 focus:ring-indigo-500'
                } rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent`}
                placeholder={isDragging ? "Drop files here..." : "Type a message or drop files..."}
                disabled={isLoading || isLoadingHistory}
              />
              
              <button
                type="submit"
                disabled={(!prompt.trim() && selectedFiles.length === 0) || isLoading || isLoadingHistory}
                className={`p-2.5 rounded-full text-white focus:outline-none ${
                  (!prompt.trim() && selectedFiles.length === 0) || isLoading || isLoadingHistory
                    ? `${isDarkMode ? 'bg-indigo-500' : 'bg-indigo-400'} cursor-not-allowed` 
                    : `${isDarkMode 
                      ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                    } transform hover:scale-105 transition-all`
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </form>
            
            {/* File drop hint */}
            {isDragging && (
              <div className={`absolute inset-0 ${isDarkMode 
                ? 'bg-blue-900 bg-opacity-50' 
                : 'bg-blue-50 bg-opacity-50'
              } flex items-center justify-center z-10 pointer-events-none`}>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg text-center`}>
                  <div className="text-indigo-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Drop your files here</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Supported formats: images, documents, archives, audio, video</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}