import api from './api';

export const aiService = {
  generateRevenueReport: async (startDate, endDate) => {
    const response = await api.post('/ai/generate-revenue-report', {
      start_date: startDate,
      end_date: endDate
    });
    return response.data;
  }
};

export default aiService;