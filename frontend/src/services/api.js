import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v2';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error?.config?.message;

    if (message) {
      const detail = error?.response?.data?.detail || error?.response?.data?.message || 'Đã có lỗi xảy ra!';
      message.error(detail);
    } else {
      console.log('API Error Interceptor:', error);
      console.log('Error response:', error?.response);
      console.log('Error data:', error?.response?.data);

      const status = error?.response?.status;
      console.log('Status:', status);

      // Only handle 401 for logout
      if (status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
