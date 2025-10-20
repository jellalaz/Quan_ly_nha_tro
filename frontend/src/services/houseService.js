import api from './api';

export const houseService = {
  getAll: async () => {
    const response = await api.get('/houses/');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/houses/${id}`);
    return response.data;
  },

  create: async (houseData) => {
    const response = await api.post('/houses/', houseData);
    return response.data;
  },

  update: async (id, houseData) => {
    const response = await api.put(`/houses/${id}`, houseData);
    return response.data;
  },

  delete: async (id, config) => {
    const response = await api.delete(`/houses/${id}`, config);
    return response.data;
  }
};
