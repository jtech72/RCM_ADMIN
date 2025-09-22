const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');
const { requireEditor } = require('../middleware/roles');

/**
 * Analytics Routes
 * All routes are prefixed with /api/analytics
 * All routes require admin or editor role
 */

// Get analytics overview - requires admin or editor role
router.get('/overview', authMiddleware, requireEditor, analyticsController.getAnalyticsOverview);

// Get most popular blogs by views - requires admin or editor role
router.get('/popular-blogs', authMiddleware, requireEditor, analyticsController.getPopularBlogs);

// Get most liked blogs - requires admin or editor role
router.get('/liked-blogs', authMiddleware, requireEditor, analyticsController.getMostLikedBlogs);

// Get engagement trends over time - requires admin or editor role
router.get('/engagement-trends', authMiddleware, requireEditor, analyticsController.getEngagementTrends);

// Get category performance analytics - requires admin or editor role
router.get('/category-performance', authMiddleware, requireEditor, analyticsController.getCategoryPerformance);

module.exports = router;