import api from './api';

export const roomService = {
  getAll: async () => {
    const response = await api.get('/rooms/');
    return response.data;
  },

  getByHouse: async (houseId) => {
    const response = await api.get(`/rooms/house/${houseId}`);
    return response.data;
  },

  getAvailable: async (houseId = null) => {
    const params = houseId ? { house_id: houseId } : {};
    const response = await api.get('/rooms/available', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  create: async (roomData) => {
    const response = await api.post('/rooms/', roomData);
    return response.data;
  },

  update: async (id, roomData) => {
    const response = await api.put(`/rooms/${id}`, roomData);
    return response.data;
  },

  delete: async (id, config) => {
    const response = await api.delete(`/rooms/${id}`, config);
    return response.data;
  }
};
