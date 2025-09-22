const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { cacheMiddleware } = require('../middleware/cache');

/**
 * Category Routes
 * All routes are prefixed with /api/categories
 */

// Create category - requires admin role
router.post('/', authMiddleware, requireAdmin, categoryController.createCategory);

// Get all categories - public endpoint
router.get('/', categoryController.getCategories);

// Get category statistics - public endpoint
router.get('/stats', categoryController.getCategoryStats);

// Validate category - public endpoint
router.post('/validate', categoryController.validateCategory);

// Get single category by slug - public endpoint
router.get('/:slug', categoryController.getCategoryBySlug);

// Update category - requires admin role
router.put('/:id', authMiddleware, requireAdmin, categoryController.updateCategory);

// Delete category - requires admin role
router.delete('/:id', authMiddleware, requireAdmin, categoryController.deleteCategory);

module.exports = router;