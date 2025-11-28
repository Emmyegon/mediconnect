// src/services/callService.js
import api from './api';

const callService = {
  getCallHistory: async (userId) => {
    try {
      const response = await api.get(`/api/calls/history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching call history:', error);
      throw error;
    }
  },

  // Add more call-related API calls here as needed
};

export default callService;