import { useState, useCallback } from 'react';
import { sendMessage } from '../services/api';

/**
 * Custom hook for managing agent-aware chat state
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, { ...message, id: Date.now().toString() }]);
  }, []);

  const send = useCallback(async (question, agentId) => {
    if (!question.trim() || !agentId) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: question,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage(question, agentId);

      // Add assistant response
      const assistantMessage = {
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        requiresHuman: response.requires_human,
        sources: response.sources,
        confidence: response.confidence,
      };
      addMessage(assistantMessage);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to get response. Please try again.';
      setError(errorMessage);
      
      // Add error message to chat
      addMessage({
        type: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const clearChat = useCallback((agentName = 'AI assistant') => {
    setMessages([
      {
        id: 'welcome',
        type: 'assistant',
        content: `Hello! I'm your ${agentName}. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    send,
    clearChat,
  };
}
