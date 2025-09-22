const Blog = require('../models/Blog');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Analytics Controller
 * Handles analytics data for the admin dashboard
 */

/**
 * Get blog analytics overview
 * GET /api/analytics/overview
 * Requires admin or editor role
 */
const getAnalyticsOverview = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        // Get basic counts
        const [
            totalBlogs,
            publishedBlogs,
            draftBlogs,
            totalViews,
            totalLikes,
            totalUsers
        ] = await Promise.all([
            Blog.countDocuments(dateFilter),
            Blog.countDocuments({ ...dateFilter, status: 'published' }),
            Blog.countDocuments({ ...dateFilter, status: 'draft' }),
            Blog.aggregate([
                { $match: dateFilter },
                { $group: { _id: null, total: { $sum: '$viewCount' } } }
            ]),
            Blog.aggregate([
                { $match: dateFilter },
                { $group: { _id: null, total: { $sum: { $size: '$likes' } } } }
            ]),
            User.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalBlogs,
                publishedBlogs,
                draftBlogs,
                totalViews: totalViews[0]?.total || 0,
                totalLikes: totalLikes[0]?.total || 0,
                totalUsers,
                dateRange: {
                    startDate: startDate || null,
                    endDate: endDate || null
                }
            }
        });

    } catch (error) {
        console.error('Get analytics overview error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve analytics overview',
            details: error.message
        });
    }
};

/**
 * Get most popular blogs by views
 * GET /api/analytics/popular-blogs
 * Requires admin or editor role
 */
const getPopularBlogs = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        const popularBlogs = await Blog.find(dateFilter)
            .select('title slug viewCount likes category status createdAt')
            .populate('author', 'username')
            .sort({ viewCount: -1 })
            .limit(parseInt(limit))
            .lean();

        // Add like count to each blog
        const blogsWithLikeCount = popularBlogs.map(blog => ({
            ...blog,
            likeCount: blog.likes?.length || 0
        }));

        res.status(200).json({
            success: true,
            data: blogsWithLikeCount
        });

    } catch (error) {
        console.error('Get popular blogs error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve popular blogs',
            details: error.message
        });
    }
};

/**
 * Get most liked blogs
 * GET /api/analytics/liked-blogs
 * Requires admin or editor role
 */
const getMostLikedBlogs = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        const likedBlogs = await Blog.aggregate([
            { $match: dateFilter },
            {
                $addFields: {
                    likeCount: { $size: '$likes' }
                }
            },
            { $sort: { likeCount: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                    pipeline: [{ $project: { username: 1 } }]
                }
            },
            {
                $unwind: '$author'
            },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    viewCount: 1,
                    likeCount: 1,
                    category: 1,
                    status: 1,
                    createdAt: 1,
                    author: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: likedBlogs
        });

    } catch (error) {
        console.error('Get most liked blogs error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve most liked blogs',
            details: error.message
        });
    }
};

/**
 * Get engagement trends over time
 * GET /api/analytics/engagement-trends
 * Requires admin or editor role
 */
const getEngagementTrends = async (req, res) => {
    try {
        const { period = 'week', startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        // Determine grouping format based on period
        let dateFormat;
        switch (period) {
            case 'day':
                dateFormat = '%Y-%m-%d';
                break;
            case 'week':
                dateFormat = '%Y-%U'; // Year-Week
                break;
            case 'month':
                dateFormat = '%Y-%m';
                break;
            default:
                dateFormat = '%Y-%m-%d';
        }

        const trends = await Blog.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: dateFormat, date: '$createdAt' } }
                    },
                    blogCount: { $sum: 1 },
                    totalViews: { $sum: '$viewCount' },
                    totalLikes: { $sum: { $size: '$likes' } },
                    publishedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
                    }
                }
            },
            { $sort: { '_id.date': 1 } },
            {
                $project: {
                    _id: 0,
                    date: '$_id.date',
                    blogCount: 1,
                    totalViews: 1,
                    totalLikes: 1,
                    publishedCount: 1,
                    avgViewsPerBlog: {
                        $cond: [
                            { $gt: ['$blogCount', 0] },
                            { $divide: ['$totalViews', '$blogCount'] },
                            0
                        ]
                    },
                    avgLikesPerBlog: {
                        $cond: [
                            { $gt: ['$blogCount', 0] },
                            { $divide: ['$totalLikes', '$blogCount'] },
                            0
                        ]
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: trends,
            period,
            dateRange: {
                startDate: startDate || null,
                endDate: endDate || null
            }
        });

    } catch (error) {
        console.error('Get engagement trends error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve engagement trends',
            details: error.message
        });
    }
};

/**
 * Get category performance analytics
 * GET /api/analytics/category-performance
 * Requires admin or editor role
 */
const getCategoryPerformance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        const categoryStats = await Blog.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$category',
                    blogCount: { $sum: 1 },
                    totalViews: { $sum: '$viewCount' },
                    totalLikes: { $sum: { $size: '$likes' } },
                    publishedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
                    },
                    avgReadingTime: { $avg: '$readingTime' }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    blogCount: 1,
                    totalViews: 1,
                    totalLikes: 1,
                    publishedCount: 1,
                    avgReadingTime: { $round: ['$avgReadingTime', 1] },
                    avgViewsPerBlog: {
                        $cond: [
                            { $gt: ['$blogCount', 0] },
                            { $round: [{ $divide: ['$totalViews', '$blogCount'] }, 1] },
                            0
                        ]
                    },
                    avgLikesPerBlog: {
                        $cond: [
                            { $gt: ['$blogCount', 0] },
                            { $round: [{ $divide: ['$totalLikes', '$blogCount'] }, 1] },
                            0
                        ]
                    }
                }
            },
            { $sort: { totalViews: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: categoryStats,
            dateRange: {
                startDate: startDate || null,
                endDate: endDate || null
            }
        });

    } catch (error) {
        console.error('Get category performance error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve category performance',
            details: error.message
        });
    }
};

module.exports = {
    getAnalyticsOverview,
    getPopularBlogs,
    getMostLikedBlogs,
    getEngagementTrends,
    getCategoryPerformance
};