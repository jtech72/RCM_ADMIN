import api from './api.js';

/**
 * Analytics API service
 * Handles all analytics-related API calls
 */
const analyticsService = {
    /**
     * Get analytics overview data
     * @param {Object} params - Query parameters
     * @param {string} params.startDate - Start date for filtering (ISO string)
     * @param {string} params.endDate - End date for filtering (ISO string)
     * @returns {Promise} Analytics overview data
     */
    getOverview: async (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const response = await api.get(`/analytics/overview?${queryParams.toString()}`);
        return response.data;
    },

    /**
     * Get most popular blogs by views
     * @param {Object} params - Query parameters
     * @param {number} params.limit - Number of blogs to return
     * @param {string} params.startDate - Start date for filtering (ISO string)
     * @param {string} params.endDate - End date for filtering (ISO string)
     * @returns {Promise} Popular blogs data
     */
    getPopularBlogs: async (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.limit) queryParams.append('limit', params.limit);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const response = await api.get(`/analytics/popular-blogs?${queryParams.toString()}`);
        return response.data;
    },

    /**
     * Get most liked blogs
     * @param {Object} params - Query parameters
     * @param {number} params.limit - Number of blogs to return
     * @param {string} params.startDate - Start date for filtering (ISO string)
     * @param {string} params.endDate - End date for filtering (ISO string)
     * @returns {Promise} Most liked blogs data
     */
    getMostLikedBlogs: async (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.limit) queryParams.append('limit', params.limit);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const response = await api.get(`/analytics/liked-blogs?${queryParams.toString()}`);
        return response.data;
    },

    /**
     * Get engagement trends over time
     * @param {Object} params - Query parameters
     * @param {string} params.period - Time period ('day', 'week', 'month')
     * @param {string} params.startDate - Start date for filtering (ISO string)
     * @param {string} params.endDate - End date for filtering (ISO string)
     * @returns {Promise} Engagement trends data
     */
    getEngagementTrends: async (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.period) queryParams.append('period', params.period);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const response = await api.get(`/analytics/engagement-trends?${queryParams.toString()}`);
        return response.data;
    },

    /**
     * Get category performance analytics
     * @param {Object} params - Query parameters
     * @param {string} params.startDate - Start date for filtering (ISO string)
     * @param {string} params.endDate - End date for filtering (ISO string)
     * @returns {Promise} Category performance data
     */
    getCategoryPerformance: async (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const response = await api.get(`/analytics/category-performance?${queryParams.toString()}`);
        return response.data;
    }
};

export default analyticsService;