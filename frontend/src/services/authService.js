import api from './api';

export const authService = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      
      // Fetch and store user info
      const userResponse = await api.get('/users/me');
      localStorage.setItem('user_info', JSON.stringify(userResponse.data));
    }
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    localStorage.setItem('user_info', JSON.stringify(response.data));
    return response.data;
  },

  getUserInfo: () => {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  getUserRole: () => {
    const userInfo = authService.getUserInfo();
    return userInfo?.role?.authority || null;
  },

  isAdmin: () => {
    return authService.getUserRole() === 'admin';
  },

  isOwner: () => {
    return authService.getUserRole() === 'owner';
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  }
};
