// services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  // HAI specific endpoints
  startHAISimulation: async (caseId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/hai/start-simulation`);
      return response.data;
    } catch (error) {
      console.error('Error starting HAI simulation:', error);
      throw error;
    }
  },

  processHAIInput: async (input, caseId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/hai/process-input`, {
        turn_type: "human",
        input_text: input,
        case_id: caseId
      });
      return response.data;
    } catch (error) {
      console.error('Error processing HAI input:', error);
      throw error;
    }
  },

  getConversationHistory: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/hai/conversation-history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }
};