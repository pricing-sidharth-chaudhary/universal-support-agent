import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get list of all available agents
 * @returns {Promise<{agents: Array, total: number}>}
 */
export const getAgents = async () => {
  const response = await api.get('/api/agents');
  return response.data;
};

/**
 * Get status of a specific agent
 * @param {string} agentId - The agent's ID
 * @returns {Promise<{id: string, name: string, description: string, icon: string, tickets_count: number, is_ready: boolean}>}
 */
export const getAgentStatus = async (agentId) => {
  const response = await api.get(`/api/agents/${agentId}`);
  return response.data;
};

/**
 * Send a chat message to a specific AI agent
 * @param {string} question - The user's question
 * @param {string} agentId - The agent to use
 * @returns {Promise<{answer: string, requires_human: boolean, sources: Array, confidence: number}>}
 */
export const sendMessage = async (question, agentId) => {
  const response = await api.post('/api/chat', { 
    question,
    agent_id: agentId
  });
  return response.data;
};

/**
 * Force reindex an agent's knowledge base
 * @param {string} agentId - The agent's ID
 * @returns {Promise<{success: boolean, message: string, tickets_indexed: number}>}
 */
export const reindexAgent = async (agentId) => {
  const response = await api.post(`/api/agents/${agentId}/reindex`);
  return response.data;
};

/**
 * Get the current status of all agents
 * @returns {Promise<{status: string, total_agents: number, total_tickets: number, agents: Array}>}
 */
export const getStatus = async () => {
  const response = await api.get('/api/status');
  return response.data;
};

export default api;
