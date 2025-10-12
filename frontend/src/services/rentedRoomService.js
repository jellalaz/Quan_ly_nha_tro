import api from './api';

export const rentedRoomService = {
  getAll: async () => {
    const response = await api.get('/rented-rooms/');
    return response.data;
  },

  getByRoom: async (roomId) => {
    const response = await api.get(`/rented-rooms/room/${roomId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/rented-rooms/${id}`);
    return response.data;
  },

  create: async (rentedRoomData) => {
    const response = await api.post('/rented-rooms/', rentedRoomData);
    return response.data;
  },

  update: async (id, rentedRoomData) => {
    const response = await api.put(`/rented-rooms/${id}`, rentedRoomData);
    return response.data;
  },

  terminate: async (id) => {
    const response = await api.post(`/rented-rooms/${id}/terminate`);
    return response.data;
  }
};
