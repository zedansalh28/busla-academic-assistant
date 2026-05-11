import { useState, useCallback } from 'react';
import { chatService } from '@/services/chatService';
import { ChatMessage } from '@/types';

export const useChat = (sessionId: string | null, userId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId || !userId) {
        setError('Session or user not initialized');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Add user message immediately
        const userMessage: ChatMessage = {
          role: 'user',
          content,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Send to backend and get response
        const response = await chatService.sendMessage(sessionId, userId, content);
        
        // Add assistant message with suggestions and timestamp
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.answer,
          suggestions: response.suggestions,
          sources: response.sources,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        return response;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
        const serverMsg = axiosErr?.response?.data?.error;
        const status = axiosErr?.response?.status;
        let message = err instanceof Error ? err.message : 'Failed to send message';
        if (status === 503 && serverMsg) message = serverMsg;
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessionId, userId]
  );

  const loadHistory = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const history = await chatService.getHistory(sessionId);
      setMessages(history);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load chat history';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const clearHistory = useCallback(async () => {
    if (!sessionId) return;

    try {
      await chatService.clearHistory(sessionId);
      setMessages([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear chat history';
      setError(message);
    }
  }, [sessionId]);

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    loading,
    error,
    clearError,
    sendMessage,
    loadHistory,
    clearHistory,
  };
};
