// services/api.js
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

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
  },
  
  getCaseDetails : async(case_id)=>{
    try{
      const response = await axios.get(`${API_BASE_URL}/api/hai/get-case-details/${case_id}`);
      // console.log(response.data)
      return response.data;
    }catch(error){
      console.error('Error fetching case details:', error);
      throw error;
    }
  },

  getCaseDetailsById : async(case_id)=>{
    try{
      const response = await axios.get(`${API_BASE_URL}/cases/${case_id}`);
      return response.data;
    }catch(error){
      console.error('Error fetching case details:', error);
      throw error;
    }
  }

};
