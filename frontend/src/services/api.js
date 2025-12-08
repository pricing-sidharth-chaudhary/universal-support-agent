import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Upload support tickets file (CSV or JSON)
 * @param {File} file - The file to upload
 * @returns {Promise<{success: boolean, message: string, tickets_processed: number}>}
 */
export const uploadTickets = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Send a chat message to the AI support agent
 * @param {string} question - The user's question
 * @returns {Promise<{answer: string, requires_human: boolean, sources: Array, confidence: number}>}
 */
export const sendMessage = async (question) => {
  const response = await api.post('/api/chat', { question });
  return response.data;
};

/**
 * Get the current status of the support agent
 * @returns {Promise<{status: string, vector_store_ready: boolean, tickets_count: number}>}
 */
export const getStatus = async () => {
  const response = await api.get('/api/status');
  return response.data;
};

/**
 * Clear all indexed tickets
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const clearTickets = async () => {
  const response = await api.delete('/api/clear');
  return response.data;
};

export default api;

