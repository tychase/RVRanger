"""
Developer Assistant - AI Copilot for RV Ranger

A simple FastAPI service that provides AI assistance for developers 
working on the RV Ranger codebase.
"""

import os
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, Form, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
from openai import OpenAI
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI(title="RV Ranger Developer Assistant", 
              description="AI copilot for RV Ranger developers")

# Create a simple model for chat messages
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    system_prompt: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    
# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Define system prompt
DEFAULT_SYSTEM_PROMPT = """
You are an AI assistant built into this project. Your job is to help the developer 
understand and improve the RV Ranger codebase, especially around features, UI, and API logic.

The RV Ranger is a luxury RV marketplace application with:
- React frontend with search and filtering capabilities
- Node.js backend with API infrastructure
- PostgreSQL database for efficient data management
- RV listing system with detailed metadata and image processing

Be concise but helpful in your responses. Provide code examples when appropriate.
"""

# HTML template for chat UI
CHAT_UI_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>RV Ranger Developer Assistant</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        h1 {
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        
        #chat-container {
            display: flex;
            flex-direction: column;
            height: 70vh;
        }
        
        #chat-log {
            flex-grow: 1;
            overflow-y: auto;
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px 15px;
            border-radius: 6px;
            max-width: 80%;
        }
        
        .user-message {
            background-color: #e1f5fe;
            align-self: flex-end;
            margin-left: auto;
        }
        
        .assistant-message {
            background-color: #f1f1f1;
            align-self: flex-start;
        }
        
        #message-form {
            display: flex;
            gap: 10px;
        }
        
        #message-input {
            flex-grow: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
        }
        
        button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 15px;
            cursor: pointer;
            border-radius: 6px;
        }
        
        button:hover {
            background-color: #45a049;
        }
        
        pre {
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
        
        code {
            font-family: 'Courier New', Courier, monospace;
        }
        
        .thinking {
            color: #888;
            font-style: italic;
        }
    </style>
</head>
<body>
    <h1>RV Ranger Developer Assistant</h1>
    <div id="chat-container">
        <div id="chat-log">
            <div class="message assistant-message">
                Hello! I'm your developer assistant for the RV Ranger project. How can I help you today?
            </div>
        </div>
        <form id="message-form">
            <input type="text" id="message-input" placeholder="Ask about the RV Ranger codebase..." required>
            <button type="submit">Send</button>
        </form>
    </div>
    
    <script>
        const chatLog = document.getElementById('chat-log');
        const messageForm = document.getElementById('message-form');
        const messageInput = document.getElementById('message-input');
        
        // Keep track of conversation history
        let messages = [
            {role: "system", content: `${DEFAULT_SYSTEM_PROMPT}`},
            {role: "assistant", content: "Hello! I'm your developer assistant for the RV Ranger project. How can I help you today?"}
        ];
        
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userMessage = messageInput.value.trim();
            if (!userMessage) return;
            
            // Add user message to chat
            addMessage('user', userMessage);
            messageInput.value = '';
            
            // Add thinking indicator
            const thinkingDiv = document.createElement('div');
            thinkingDiv.className = 'message assistant-message thinking';
            thinkingDiv.textContent = 'Thinking...';
            chatLog.appendChild(thinkingDiv);
            
            // Update messages array
            messages.push({role: "user", content: userMessage});
            
            try {
                // Send to API
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messages: messages
                    }),
                });
                
                if (!response.ok) {
                    throw new Error('API request failed');
                }
                
                const data = await response.json();
                
                // Remove thinking indicator
                chatLog.removeChild(thinkingDiv);
                
                // Add assistant response
                addMessage('assistant', data.response);
                
                // Update messages array
                messages.push({role: "assistant", content: data.response});
                
                // Scroll to bottom
                chatLog.scrollTop = chatLog.scrollHeight;
            } catch (error) {
                console.error('Error:', error);
                chatLog.removeChild(thinkingDiv);
                addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            }
        });
        
        function addMessage(role, content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${role}-message`;
            
            // Process content for markdown-like code formatting
            let formattedContent = content;
            
            // Format code blocks (```code```)
            formattedContent = formattedContent.replace(/```([\s\S]*?)```/g, function(match, code) {
                return `<pre><code>${code}</code></pre>`;
            });
            
            // Format inline code (`code`)
            formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code>$1</code>');
            
            messageDiv.innerHTML = formattedContent;
            chatLog.appendChild(messageDiv);
            chatLog.scrollTop = chatLog.scrollHeight;
        }
    </script>
</body>
</html>
"""

@app.get("/chat-ui", response_class=HTMLResponse)
async def get_chat_ui():
    """Return the HTML page for the chat UI"""
    return HTMLResponse(content=CHAT_UI_HTML)

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a chat request and return an AI response"""
    try:
        # Prepare messages for OpenAI
        openai_messages = []
        
        # Add system prompt
        system_prompt = request.system_prompt if request.system_prompt else DEFAULT_SYSTEM_PROMPT
        openai_messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history
        for msg in request.messages:
            if msg.role != "system":  # Skip any additional system messages
                openai_messages.append({"role": msg.role, "content": msg.content})
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages=openai_messages,
            temperature=0.7,
        )
        
        # Extract and return the assistant's response
        assistant_response = response.choices[0].message.content
        
        return ChatResponse(response=assistant_response)
    
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

if __name__ == "__main__":
    print("Starting RV Ranger Developer Assistant...")
    uvicorn.run("dev_assistant:app", host="0.0.0.0", port=8000, reload=True)