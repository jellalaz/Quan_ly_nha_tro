import api from './api';

export const aiService = {
  chat: async (request) => {
    const response = await api.post('/ai/chat', request);
    return response.data;
  },

  getRoomRecommendations: async (budget, capacity, district = null) => {
    const response = await api.post('/ai/recommend-rooms', {
      budget,
      capacity,
      district
    });
    return response.data;
  },

  generateRevenueReport: async (startDate, endDate) => {
    const response = await api.post('/ai/generate-revenue-report', {
      start_date: startDate,
      end_date: endDate
    });
    return response.data;
  }
};
