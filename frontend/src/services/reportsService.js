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
  },

  searchAvailableRooms: async (filters) => {
    const response = await api.post('/reports/search-rooms', {
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      min_capacity: filters.minCapacity,
      max_capacity: filters.maxCapacity,
      district: filters.district
    });
    return response.data;
  },

  getExpiringContracts: async () => {
    const response = await api.get('/reports/expiring-contracts');
    return response.data;
  },

  generateDetailedReport: async (reportType, startDate, endDate) => {
    const response = await api.post('/reports/generate-report', {
      report_type: reportType,
      start_date: startDate,
      end_date: endDate
    });
    return response.data;
  },

  createMonthlyInvoices: async () => {
    const response = await api.post('/reports/create-monthly-invoices');
    return response.data;
  }
};
