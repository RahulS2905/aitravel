// client/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create a reusable instance
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Export specific functions
export const generateTrip = async (data) => {
    try {
        const response = await apiClient.post('/generate-plan', data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Network Error');
    }
};

export const saveTrip = async (tripData) => {
    try {
        const response = await apiClient.post('/save-trip', tripData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getMyTrips = async () => {
    try {
        const response = await apiClient.get('/my-trips');
        return response.data;
    } catch (error) {
        throw error;
    }
};