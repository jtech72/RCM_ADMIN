const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

// Get all users (admin only)
router.get('/', auth, requireAdmin, userController.getAllUsers);

// Get user by ID (admin only)
router.get('/:id', auth, requireAdmin, userController.getUserById);

// Create new user (admin only)
router.post('/', auth, requireAdmin, userController.createUser);

// Update user (admin only)
router.put('/:id', auth, requireAdmin, userController.updateUser);

// Delete user (admin only)
router.delete('/:id', auth, requireAdmin, userController.deleteUser);

// Update user status (admin only)
router.patch('/:id/status', auth, requireAdmin, userController.updateUserStatus);

module.exports = router;