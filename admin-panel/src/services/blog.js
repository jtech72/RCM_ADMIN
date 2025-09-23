import api from './api.js';

// Blog API service
const blogService = {
    // Get all blogs with pagination and filters
    getBlogs: async (params = {}) => {
        const queryParams = new URLSearchParams();

        // Add pagination params
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);

        // Add filter params
        if (params.status !== undefined) queryParams.append('status', params.status);
        if (params.category) queryParams.append('category', params.category);
        if (params.search !== undefined) queryParams.append('search', params.search);
        if (params.tags) queryParams.append('tags', params.tags);
        if (params.featured !== undefined) queryParams.append('featured', params.featured);

        // Add sorting params
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await api.get(`/blogs?${queryParams.toString()}`);
        return response.data;
    },

    // Get single blog by ID
    getBlog: async (id) => {
        const response = await api.get(`/blogs/${id}`);
        return response.data;
    },

    // Create new blog
    createBlog: async (blogData) => {
        const response = await api.post('/blogs', blogData);
        return response.data;
    },

    // Update existing blog
    updateBlog: async (id, blogData) => {
        const response = await api.put(`/blogs/${id}`, blogData);
        return response.data;
    },

    // Delete blog
    deleteBlog: async (id) => {
        const response = await api.delete(`/blogs/${id}`);
        return response.data;
    },

    // Update blog status
    updateBlogStatus: async (id, status) => {
        const response = await api.patch(`/blogs/${id}`, { status });
        return response.data;
    },

    // Toggle featured status
    toggleFeatured: async (id, currentFeatured) => {
        const response = await api.patch(`/blogs/${id}`, { featured: !currentFeatured });
        return response.data;
    }
};

export default blogService;