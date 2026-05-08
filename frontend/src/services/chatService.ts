import api from './api';
import { ChatMessage, ChatResponse } from '@/types';

export const chatService = {
  async sendMessage(
    sessionId: string,
    userId: string,
    message: string
  ): Promise<ChatResponse> {
    const response = await api.post('/chat', {
      session_id: sessionId,
      user_id: userId,
      message,
    });
    return response.data;
  },

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await api.get(`/chat/history/${sessionId}`);
    return response.data.messages || [];
  },

  async clearHistory(sessionId: string) {
    await api.delete(`/chat/history/${sessionId}`);
  },
};
