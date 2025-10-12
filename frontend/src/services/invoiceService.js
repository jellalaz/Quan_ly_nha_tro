import api from './api';

export const invoiceService = {
  getAll: async () => {
    const response = await api.get('/invoices/');
    return response.data;
  },

  getByRentedRoom: async (rrId) => {
    const response = await api.get(`/invoices/rented-room/${rrId}`);
    return response.data;
  },

  getPending: async () => {
    const response = await api.get('/invoices/pending');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (invoiceData) => {
    const response = await api.post('/invoices/', invoiceData);
    return response.data;
  },

  update: async (id, invoiceData) => {
    const response = await api.put(`/invoices/${id}`, invoiceData);
    return response.data;
  },

  pay: async (id) => {
    const response = await api.post(`/invoices/${id}/pay`);
    return response.data;
  }
};
