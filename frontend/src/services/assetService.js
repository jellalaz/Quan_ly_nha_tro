import api from './api';

export const assetService = {
  getByRoom: async (roomId) => {
    const response = await api.get(`/assets/room/${roomId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },

  create: async (assetData) => {
    const response = await api.post('/assets/', assetData);
    return response.data;
  },

  update: async (id, assetData) => {
    const response = await api.put(`/assets/${id}`, assetData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  }
};
