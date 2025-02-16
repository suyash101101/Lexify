import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const initializeConsultation = async (authId = null) => {
    try {
        console.log("Initializing consultation for authId:", authId);
        console.log(`${API_BASE_URL}/consultancy/initialize/consultant?auth_id=${authId}`)
        const response = await axios.post(`${API_BASE_URL}/consultancy/initialize/consultant?auth_id=${authId}`);
        console.log(response.data);
        return response.data.session_id;
    } catch (error) {
        console.error('Error initializing consultation:', error);
        throw error;
    }
};

export const sendConsultQuery = async (sessionId, query, contextAnswers = null, authId = null) => {
    try {
        console.log("Sending consultation query");
        console.log(query)
        console.log(contextAnswers)
        console.log(authId)
        const response = await axios.post(`${API_BASE_URL}/consultancy/${sessionId}/consult`, {
            query,
            context: "",
            context_answers: contextAnswers,
            auth_id: authId
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending consultation query:', error);
        throw error;
    }
};

export const getConsultStatus = async (sessionId) => {
    try {
        console.log("Getting consultation status");
        const response = await axios.get(`${API_BASE_URL}/consultancy/${sessionId}/consult/status`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting consultation status:', error);
        throw error;
    }
};

export const getUserConsultings = async (authId) => {
    try {
        console.log("Fetching user consultings for:", authId);
        const response = await axios.get(`${API_BASE_URL}/consultancy/consultings/${authId}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching user consultings:', error);
        throw error;
    }
};

export const getConsulting = async (sessionId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/consultancy/consulting/${sessionId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching consulting:', error);
        throw error;
    }
};

export default {
    initializeConsultation,
    sendConsultQuery,
    getConsultStatus,
    getUserConsultings,
    getConsulting
};