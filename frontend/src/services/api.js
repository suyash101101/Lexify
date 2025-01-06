// services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// HAI (Human-AI Interaction) endpoints
const startHAISimulation = async (caseId) => {
  const response = await apiClient.post('/api/hai/start-simulation', {
    case_id: caseId
  });
  return response.data;
};

const processHAIInput = async (data) => {
  const response = await apiClient.post('/api/hai/process-input', data);
  return response.data;
};

const getConversationHistory = async () => {
  const response = await apiClient.get('/api/hai/conversation-history');
  return response.data;
};

const getCaseDetails = async (caseId) => {
  const response = await apiClient.get(`/api/hai/get-case-details/${caseId}`);
  return response.data;
};

const getCaseState = async (caseId) => {
  const response = await apiClient.get(`/api/hai/case-state/${caseId}`);
  return response.data;
};

const getCaseDetailsById = async (caseId) => {
  const response = await apiClient.get(`/api/cases/${caseId}`);
  return response.data;
};

const endCase = async (caseId) => {
  const response = await apiClient.delete(`/api/hai/end-case/${caseId}`);
  return response.data;
};

export {
  startHAISimulation,
  processHAIInput,
  getCaseState,
  endCase,
  getConversationHistory,
  getCaseDetails,
  getCaseDetailsById
};
