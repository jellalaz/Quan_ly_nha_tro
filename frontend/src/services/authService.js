import api from './api';

export const authService = {
    login: async(email, password) => {
        // Use URLSearchParams for application/x-www-form-urlencoded as required by FastAPI OAuth2
        const formData = new URLSearchParams();
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

    register: async(userData) => {
        const response = await api.post('/users/register', userData);
        return response.data;
    },

    updateProfile: async(updateData) => {
        const response = await api.put('/users/me', updateData);
        // Refresh cache
        const updatedUser = response.data;
        localStorage.setItem('user_info', JSON.stringify(updatedUser));
        return updatedUser;
    },

    // Đổi mật khẩu người dùng hiện tại
    changePassword: async(oldPassword, newPassword) => {
        const response = await api.post('/users/me/change-password', {
            old_password: oldPassword,
            new_password: newPassword,
        });
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
    },

    getCurrentUser: async() => {
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

    isOwner: () => {
        return authService.getUserRole() === 'owner';
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    }
};

// Provide default export for modules that import default
export default authService;
