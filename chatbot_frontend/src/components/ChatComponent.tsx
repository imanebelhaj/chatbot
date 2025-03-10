import { useState, useEffect } from "react";
import axios from "axios";

const ChatComponent = () => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [userMessage, setUserMessage] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");

  // Load conversation from local storage if it exists
  useEffect(() => {
    const savedConversationId = localStorage.getItem("conversation_id");
    if (savedConversationId) {
      setConversationId(savedConversationId);
      // Fetch the chat history for this conversation
      fetchChatHistory(savedConversationId);
    }
  }, []);

  const fetchChatHistory = async (conversationId: string) => {
    try {
      const response = await axios.post("/api/chat-history", { conversationId });
      setChatHistory(response.data.chatHistory);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const response = await axios.post("/api/new-chat");
      const newConversationId = response.data.conversation_id;
      setConversationId(newConversationId);
      localStorage.setItem("conversation_id", newConversationId); // Save to localStorage
      fetchChatHistory(newConversationId); // Fetch new chat history
    } catch (error) {
      console.error("Error creating new conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!conversationId || !userMessage) return;
    
    try {
      const response = await axios.post("/api/send-message", {
        conversationId,
        prompt_message: userMessage,
      });
      const newAiResponse = response.data.ai_response;
      setAiResponse(newAiResponse);

      // Update chat history locally
      setChatHistory([...chatHistory, { user_message: userMessage, ai_response: newAiResponse }]);
      setUserMessage(""); // Reset input field
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div>
      <button onClick={handleNewConversation}>New Chat</button>

      <div>
        {chatHistory.map((message, index) => (
          <div key={index}>
            <p><strong>User:</strong> {message.user_message}</p>
            <p><strong>AI:</strong> {message.ai_response}</p>
          </div>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Type your message"
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatComponent;
