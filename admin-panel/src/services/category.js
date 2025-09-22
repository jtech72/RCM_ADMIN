import api from './api.js';

const categoryService = {
    // Get all categories
    getCategories: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.includeInactive) queryParams.append('includeInactive', params.includeInactive);
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.search) queryParams.append('search', params.search);
            
            const response = await api.get(`/categories?${queryParams.toString()}`);
            return {
                success: true,
                data: response.data.data,
                pagination: response.data.pagination
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch categories'
            };
        }
    },

    // Create new category
    createCategory: async (categoryData) => {
        try {
            const response = await api.post('/categories', categoryData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create category'
            };
        }
    },

    // Update category
    updateCategory: async (id, categoryData) => {
        try {
            const response = await api.put(`/categories/${id}`, categoryData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update category'
            };
        }
    },

    // Delete category
    deleteCategory: async (id, reassignTo = null) => {
        try {
            const response = await api.delete(`/categories/${id}`, {
                data: { reassignTo }
            });
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete category'
            };
        }
    },

    // Get category statistics
    getCategoryStats: async () => {
        try {
            const response = await api.get('/categories/stats');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch category statistics'
            };
        }
    },

    // Validate category name
    validateCategory: async (name) => {
        try {
            const response = await api.post('/categories/validate', { name });
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to validate category'
            };
        }
    }
};

export default categoryService;