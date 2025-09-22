import api from './api.js';

// Get all users with pagination and filtering
export const getUsers = async (params = {}) => {
    try {
        const response = await api.get('/users', { params });
        return response.data;
    } catch (error) {
        console.error('Get users error:', error);
        throw error;
    }
};

// Get user by ID
export const getUserById = async (id) => {
    try {
        const response = await api.get(`/users/${id}`);
        return response.data;
    } catch (error) {
        console.error('Get user by ID error:', error);
        throw error;
    }
};

// Create new user
export const createUser = async (userData) => {
    try {
        const response = await api.post('/users', userData);
        return response.data;
    } catch (error) {
        console.error('Create user error:', error);
        throw error;
    }
};

// Update user
export const updateUser = async (id, userData) => {
    try {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    } catch (error) {
        console.error('Update user error:', error);
        throw error;
    }
};

// Delete user
export const deleteUser = async (id) => {
    try {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    } catch (error) {
        console.error('Delete user error:', error);
        throw error;
    }
};

// Update user status (active/inactive)
export const updateUserStatus = async (id, isActive) => {
    try {
        const response = await api.patch(`/users/${id}/status`, { isActive });
        return response.data;
    } catch (error) {
        console.error('Update user status error:', error);
        throw error;
    }
};

// Get user roles for dropdown
export const getUserRoles = () => {
    return [
        { value: 'admin', label: 'Admin' },
        { value: 'editor', label: 'Editor' },
        { value: 'reader', label: 'Reader' }
    ];
};

// Get user status options for dropdown
export const getUserStatusOptions = () => {
    return [
        { value: '', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
    ];
};