const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/auth');
const { requireEditor, requireAdmin } = require('../middleware/roles');
const { cacheMiddleware } = require('../middleware/cache');

/**
 * Blog Routes
 * All routes are prefixed with /api/blogs
 */

// Create blog - requires admin or editor role
router.post('/', authMiddleware, requireEditor, blogController.createBlog);

// Get blogs with pagination and filtering - public endpoint (cached for 5 minutes)
router.get('/', blogController.getBlogs);

// Get popular blogs - public endpoint (cached for 10 minutes)
router.get('/popular', blogController.getPopularBlogsEndpoint);

// Get single blog by slug - public endpoint (cached for 15 minutes)
router.get('/:slug', blogController.getBlogBySlug);

// Get related blogs for a specific blog - public endpoint (cached for 10 minutes)
router.get('/:slug/related', blogController.getRelatedBlogsEndpoint);

// Update blog - requires admin or editor role (with ownership check)
router.put('/:id', authMiddleware, requireEditor, blogController.updateBlog);

// Partial update blog (status, featured, etc.) - requires admin or editor role
router.patch('/:id', authMiddleware, requireEditor, blogController.updateBlog);

// Delete blog - requires admin role only
router.delete('/:id', authMiddleware, requireAdmin, blogController.deleteBlog);

// Toggle like/unlike blog - requires authentication
router.patch('/:id/like', authMiddleware, blogController.toggleBlogLike);

// Increment view count - public endpoint
router.patch('/:id/view', blogController.incrementBlogView);

module.exports = router;