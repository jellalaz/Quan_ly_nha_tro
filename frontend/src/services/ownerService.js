import api from './api';

export const ownerService = {
  // Get all owners
  getAll: async () => {
    const response = await api.get('/users/owners');
    return response.data;
  },

  // Get specific owner details
  getById: async (ownerId) => {
    const response = await api.get(`/users/owners/${ownerId}`);
    return response.data;
  },

  // Create new owner account
  create: async (ownerData) => {
    const response = await api.post('/users/owners', ownerData);
    return response.data;
  },

  // Update owner information
  update: async (ownerId, ownerData) => {
    const response = await api.put(`/users/owners/${ownerId}`, ownerData);
    return response.data;
  },

  // Delete owner
  delete: async (ownerId) => {
    const response = await api.delete(`/users/owners/${ownerId}`);
    return response.data;
  },

  // Get houses of a specific owner
  getHouses: async (ownerId) => {
    const response = await api.get(`/houses/owner/${ownerId}`);
    return response.data;
  }
};
