const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            role = '',
            status = ''
        } = req.query;

        // Build filter object
        const filter = {};

        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            filter.role = role;
        }

        if (status !== '') {
            filter.isActive = status === 'active';
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get users with pagination
        const users = await User.find(filter)
            .select('-password') // Exclude password field
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user'
        });
    }
};

// Create new user
const createUser = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            role = 'reader',
            profile = {},
            isActive = true
        } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email or username already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role,
            profile,
            isActive
        });

        await user.save();

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            data: userResponse,
            message: 'User created successfully'
        });
    } catch (error) {
        console.error('Create user error:', error);

        if (error.code === 11000) {
            // Duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                error: `User with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create user'
        });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Remove password from update data if present (use separate endpoint for password updates)
        delete updateData.password;

        // Prevent users from updating their own role (except admin)
        if (req.user.id === id && req.user.role !== 'admin') {
            delete updateData.role;
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update user error:', error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                error: `User with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent users from deleting themselves
        if (req.user.id === id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete your own account'
            });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user'
        });
    }
};

// Update user status (active/inactive)
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        // Prevent users from deactivating themselves
        if (req.user.id === id && !isActive) {
            return res.status(400).json({
                success: false,
                error: 'Cannot deactivate your own account'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user status'
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus
};