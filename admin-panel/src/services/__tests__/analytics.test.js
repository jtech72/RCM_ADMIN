import { describe, it, expect, vi, beforeEach } from 'vitest';
import analyticsService from '../analytics.js';
import api from '../api.js';

// Mock the api module
vi.mock('../api.js', () => ({
    default: {
        get: vi.fn()
    }
}));

describe('Analytics Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getOverview', () => {
        it('should fetch analytics overview without parameters', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: {
                        totalBlogs: 10,
                        publishedBlogs: 8,
                        draftBlogs: 2,
                        totalViews: 1000,
                        totalLikes: 50,
                        totalUsers: 5
                    }
                }
            };

            api.get.mockResolvedValue(mockResponse);

            const result = await analyticsService.getOverview();

            expect(api.get).toHaveBeenCalledWith('/analytics/overview?');
            expect(result).toEqual(mockResponse.data);
        });

        it('should fetch analytics overview with date range parameters', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: {
                        totalBlogs: 5,
                        publishedBlogs: 4,
                        draftBlogs: 1,
                        totalViews: 500,
                        totalLikes: 25,
                        totalUsers: 3
                    }
                }
            };

            const params = {
                startDate: '2023-01-01T00:00:00.000Z',
                endDate: '2023-12-31T23:59:59.999Z'
            };

            api.get.mockResolvedValue(mockResponse);

            const result = await analyticsService.getOverview(params);

            expect(api.get).toHaveBeenCalledWith(
                '/analytics/overview?startDate=2023-01-01T00%3A00%3A00.000Z&endDate=2023-12-31T23%3A59%3A59.999Z'
            );
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle API errors', async () => {
            const mockError = new Error('Network error');
            api.get.mockRejectedValue(mockError);

            await expect(analyticsService.getOverview()).rejects.toThrow('Network error');
        });
    });

    describe('getPopularBlogs', () => {
        it('should fetch popular blogs with default parameters', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: [
                        {
                            _id: '1',
                            title: 'Popular Blog 1',
                            viewCount: 100,
                            likeCount: 10
                        }
                    ]
                }
            };

            api.get.mockResolvedValue(mockResponse);

            const result = await analyticsService.getPopularBlogs();

            expect(api.get).toHaveBeenCalledWith('/analytics/popular-blogs?');
            expect(result).toEqual(mockResponse.data);
        });

        it('should fetch popular blogs with limit and date range', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: []
                }
            };

            const params = {
                limit: 5,
                startDate: '2023-01-01T00:00:00.000Z',
                endDate: '2023-12-31T23:59:59.999Z'
            };

            api.get.mockResolvedValue(mockResponse);

            const result = await analyticsService.getPopularBlogs(params);

            expect(api.get).toHaveBeenCalledWith(
                '/analytics/popular-blogs?limit=5&startDate=2023-01-01T00%3A00%3A00.000Z&endDate=2023-12-31T23%3A59%3A59.999Z'
            );
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('getMostLikedBlogs', () => {
        it('should fetch most liked blogs', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: [
                        {
                            _id: '1',
                            title: 'Liked Blog 1',
                            viewCount: 50,
                            likeCount: 20
                        }
                    ]
                }
            };

            api.get.mockResolvedValue(mockResponse);

            const result = await analyticsService.getMostLikedBlogs({ limit: 10 });

            expect(api.get).toHaveBeenCalledWith('/analytics/liked-blogs?limit=10');
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('getEngagementTrends', () => {
        it('should fetch engagement trends with period parameter', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: [
                        {
                            date: '2023-01',
                            blogCount: 5,
                            totalViews: 100,
                            totalLikes: 10
                        }
                    ]
                }
            };

            const params = {
                period: 'month',
                startDate: '2023-01-01T00:00:00.000Z'
            };

            api.get.mockResolvedValue(mockResponse);

            const result = await analyticsService.getEngagementTrends(params);

            expect(api.get).toHaveBeenCalledWith(
                '/analytics/engagement-trends?period=month&startDate=2023-01-01T00%3A00%3A00.000Z'
            );
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('getCategoryPerformance', () => {
        it('should fetch category performance data', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: [
                        {
                            category: 'Technology',
                            blogCount: 5,
                            totalViews: 200,
                            totalLikes: 15,
                            avgViewsPerBlog: 40,
                            avgReadingTime: 5.5
                        }
                    ]
                }
            };

            api.get.mockResolvedValue(mockResponse);

            const result = await analyticsService.getCategoryPerformance();

            expect(api.get).toHaveBeenCalledWith('/analytics/category-performance?');
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle empty parameters object', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: []
                }
            };

            api.get.mockResolvedValue(mockResponse);

            const result = await analyticsService.getCategoryPerformance({});

            expect(api.get).toHaveBeenCalledWith('/analytics/category-performance?');
            expect(result).toEqual(mockResponse.data);
        });
    });
});