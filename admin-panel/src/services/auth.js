import api from './api';

class AuthService {
    // Login user
    async login(credentials) {
        try {
            // Ensure we send the correct field name to backend
            const loginData = {
                identifier: credentials.identifier || credentials.email,
                password: credentials.password
            };

            const response = await api.post('/auth/login', loginData);
            const { token, user } = response.data.data;

            // Verify user has admin or editor role
            if (!['admin', 'editor'].includes(user.role)) {
                throw new Error('Access denied. Admin or editor role required.');
            }

            // Store token and user data
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify(user));

            return { token, user };
        } catch (error) {
            throw new Error(
                error.response?.data?.error ||
                error.message ||
                'Login failed'
            );
        }
    }

    // Logout user
    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
    }

    // Get current user from localStorage
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('adminUser');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    // Get current token
    getToken() {
        return localStorage.getItem('adminToken');
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getCurrentUser();
        return !!(token && user);
    }

    // Check if user has admin role
    isAdmin() {
        const user = this.getCurrentUser();
        return user?.role === 'admin';
    }

    // Check if user has editor or admin role
    canEdit() {
        const user = this.getCurrentUser();
        return ['admin', 'editor'].includes(user?.role);
    }

    // Verify token validity
    async verifyToken() {
        try {
            const response = await api.get('/auth/verify');
            return response.data.success;
        } catch (error) {
            this.logout();
            return false;
        }
    }
}

export default new AuthService();