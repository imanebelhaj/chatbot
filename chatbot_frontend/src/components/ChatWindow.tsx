
import React, { useState } from 'react';

const ChatWindow: React.FC = () => {
  const [message, setMessage] = useState('');

  const handleMessageSend = () => {
    // Handle sending message
    console.log('Message Sent:', message);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto bg-white p-4">
        {/* Display chat messages here */}
      </div>
      <div className="flex p-4 bg-gray-800">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="w-full p-2 rounded-l-lg"
        />
        <button
          onClick={handleMessageSend}
          className="bg-blue-500 text-white p-2 rounded-r-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
