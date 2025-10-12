import api from './api';

export const adminService = {
  // Get overall system statistics
  getStatistics: async () => {
    const response = await api.get('/users/admin/statistics');
    return response.data;
  },

  // Get all houses in system
  getAllHouses: async () => {
    const response = await api.get('/houses/admin/all');
    return response.data;
  },

  // Get all rooms in system
  getAllRooms: async () => {
    const response = await api.get('/rooms/');
    return response.data;
  },

  // Get all invoices in system
  getAllInvoices: async () => {
    const response = await api.get('/invoices/');
    return response.data;
  },

  // Get pending invoices
  getPendingInvoices: async () => {
    const response = await api.get('/invoices/pending');
    return response.data;
  }
};
