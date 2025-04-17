import React, { useState } from 'react';
import { MessageCircle, X, Minimize, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // The URL for the chat assistant
  const chatAssistantUrl = 'https://5001-' + window.location.hostname.replace(/^[^-]+-/, '') + '/chat-ui';
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      <Button 
        onClick={toggleChat}
        className="w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
      
      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`absolute bottom-20 right-0 bg-white rounded-lg shadow-xl transition-all duration-300 ${
            isMinimized ? 'w-72 h-12' : 'w-[380px] h-[520px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-medium">RVRanger Assistant</h3>
            <div className="flex space-x-2">
              <button onClick={toggleMinimize} className="text-white hover:text-gray-200">
                {isMinimized ? <Maximize size={18} /> : <Minimize size={18} />}
              </button>
              <button onClick={toggleChat} className="text-white hover:text-gray-200">
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Chat Content */}
          {!isMinimized && (
            <div className="w-full h-[calc(520px-40px)]">
              <iframe 
                src={chatAssistantUrl}
                className="w-full h-full border-none"
                title="RVRanger Assistant"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;