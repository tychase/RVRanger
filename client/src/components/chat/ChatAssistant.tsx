import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize, Maximize, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sendChatMessage } from '@/lib/openai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I\'m your RVRanger assistant. How can I help you with luxury RVs today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    // Add user message
    const userMessage = { role: 'user' as const, content: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Send to backend API
      const response = await sendChatMessage(inputMessage);
      
      // Add assistant response
      if (response.reply) {
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          content: response.reply 
        }]);
      } else if (response.error) {
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          content: `Sorry, I encountered an error: ${response.error}` 
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I\'m having trouble connecting right now. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
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
            <div className="flex flex-col h-[calc(520px-40px)]">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}
                  >
                    <div 
                      className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-left mb-4">
                    <div className="inline-block max-w-[80%] rounded-lg px-4 py-2 bg-gray-200 text-gray-800">
                      <div className="flex space-x-2">
                        <div className="animate-bounce">•</div>
                        <div className="animate-bounce delay-75">•</div>
                        <div className="animate-bounce delay-150">•</div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;