import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

interface ChatResponse {
  reply: string;
  error?: string;
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  try {
    const response = await axios.post('/api/chat', { message });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    return {
      reply: 'Sorry, there was an error processing your request. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}