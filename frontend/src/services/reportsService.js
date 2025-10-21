import api from './api';

export const reportsService = {
  getSystemOverview: async () => {
    const response = await api.get('/reports/system-overview');
    return response.data;
  },

  getRevenueStats: async (startDate, endDate) => {
    const response = await api.post('/reports/revenue-stats', {
      start_date: startDate,
      end_date: endDate
    });
    return response.data;
  }
};

export default reportsService;