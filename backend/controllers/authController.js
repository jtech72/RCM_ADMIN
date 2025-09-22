const authService = require('../services/authService');
const Joi = require('joi');

// Validation schemas
const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'editor', 'reader').default('reader'),
    profile: Joi.object({
        firstName: Joi.string().max(50),
        lastName: Joi.string().max(50),
        bio: Joi.string().max(500)
    }).optional()
});

const loginSchema = Joi.object({
    identifier: Joi.string().required(), // email or username
    password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required()
});

class AuthController {
    /**
     * Register new user
     */
    async register(req, res) {
        try {
            // Validate request body
            const { error, value } = registerSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.details[0].message
                });
            }

            // Register user
            const result = await authService.register(value);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        } catch (error) {
            console.error('Registration error:', error);

            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Registration failed',
                details: error.message
            });
        }
    }

    /**
     * Login user
     */
    async login(req, res) {
        try {
            // Validate request body
            const { error, value } = loginSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.details[0].message
                });
            }

            const { identifier, password } = value;

            // Login user
            const result = await authService.login(identifier, password);

            res.json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            console.error('Login error:', error);

            if (error.message.includes('Invalid credentials') || error.message.includes('deactivated')) {
                return res.status(401).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Login failed',
                details: error.message
            });
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(req, res) {
        try {
            // Validate request body
            const { error, value } = refreshTokenSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.details[0].message
                });
            }

            const { refreshToken } = value;

            // Refresh token
            const result = await authService.refreshToken(refreshToken);

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: result
            });
        } catch (error) {
            console.error('Token refresh error:', error);

            res.status(401).json({
                success: false,
                error: 'Token refresh failed',
                details: error.message
            });
        }
    }

    /**
     * Get current user profile
     */
    async getProfile(req, res) {
        try {
            // User is attached to req by auth middleware
            const user = req.user;

            res.json({
                success: true,
                message: 'Profile retrieved successfully',
                data: { user }
            });
        } catch (error) {
            console.error('Get profile error:', error);

            res.status(500).json({
                success: false,
                error: 'Failed to retrieve profile',
                details: error.message
            });
        }
    }

    /**
     * Verify token validity
     */
    async verifyToken(req, res) {
        try {
            // User is attached to req by auth middleware
            const user = req.user;

            res.json({
                success: true,
                message: 'Token is valid',
                data: { user }
            });
        } catch (error) {
            console.error('Token verification error:', error);

            res.status(401).json({
                success: false,
                error: 'Token verification failed',
                details: error.message
            });
        }
    }

    /**
     * Logout user (client-side token removal)
     */
    async logout(req, res) {
        try {
            // In a stateless JWT system, logout is handled client-side
            // This endpoint exists for consistency and future token blacklisting
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Logout error:', error);

            res.status(500).json({
                success: false,
                error: 'Logout failed',
                details: error.message
            });
        }
    }
}

module.exports = new AuthController();