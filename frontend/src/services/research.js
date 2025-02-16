import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const initializeLegalResearch = async (authId = null) => {
    try {
        console.log("Initializing legal research for authId:", authId);
        const response = await axios.post(`${API_BASE_URL}/consultancy/initialize/legal-agent?auth_id=${authId}`);
        console.log(response.data);
        return response.data.session_id;
    } catch (error) {
        console.error('Error initializing legal research:', error);
        throw error;
    }
};

export const sendResearchQuery = async (sessionId, query, contextAnswers = null, authId = null) => {
    try {
        console.log("Sending research query");
        const response = await axios.post(`${API_BASE_URL}/consultancy/${sessionId}/research`, {
            query,
            context: "",
            context_answers: contextAnswers,
            auth_id: authId
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending research query:', error);
        throw error;
    }
};

export const getResearchStatus = async (sessionId, authId) => {
    try {
        console.log("Getting research status");
        const response = await axios.get(`${API_BASE_URL}/consultancy/${sessionId}/research/status?auth_id=${authId}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting research status:', error);
        throw error;
    }
};

export const getUserResearch = async (authId) => {
    try {
        console.log("Fetching user research for:", authId);
        const response = await axios.get(`${API_BASE_URL}/consultancy/research-sessions/${authId}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching user research:', error);
        throw error;
    }
};

export const getResearch = async (sessionId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/consultancy/research/${sessionId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching research:', error);
        throw error;
    }
};

export default {
    initializeLegalResearch,
    sendResearchQuery,
    getResearchStatus,
    getUserResearch,
    getResearch
}; 