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
    // Lấy status và URL request để xử lý đặc biệt cho /auth/login
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';

    // 401: Nếu là login thì KHÔNG redirect, để màn hình login hiển thị message lỗi
    if (status === 401) {
      if (requestUrl.includes('/auth/login')) {
        return Promise.reject(error);
      }
      // Các request khác: xóa token và điều hướng về /login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Các lỗi khác: để caller tự hiển thị message phù hợp (giống Houses/Rooms pattern)
    return Promise.reject(error);
  }
);

export default api;
