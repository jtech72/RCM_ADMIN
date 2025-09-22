const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

class AuthService {
    /**
     * Generate JWT token for user
     * @param {Object} user - User object
     * @returns {String} JWT token
     */
    generateToken(user) {
        const payload = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });
    }

    /**
     * Generate refresh token for user
     * @param {Object} user - User object
     * @returns {String} Refresh token
     */
    generateRefreshToken(user) {
        const payload = {
            id: user._id,
            type: 'refresh'
        };

        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '30d' // Refresh tokens last longer
        });
    }

    /**
     * Verify JWT token
     * @param {String} token - JWT token
     * @returns {Object} Decoded token payload
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Hash password using bcrypt
     * @param {String} password - Plain text password
     * @returns {String} Hashed password
     */
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Compare password with hash
     * @param {String} password - Plain text password
     * @param {String} hash - Hashed password
     * @returns {Boolean} Password match result
     */
    async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Object} User and tokens
     */
    async register(userData) {
        const { username, email, password, role = 'reader' } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            throw new Error('User with this email or username already exists');
        }

        // Hash password
        const hashedPassword = await this.hashPassword(password);

        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role
        });

        await user.save();

        // Generate tokens
        const token = this.generateToken(user);
        const refreshToken = this.generateRefreshToken(user);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        return {
            user: userResponse,
            token,
            refreshToken
        };
    }

    /**
     * Login user
     * @param {String} identifier - Email or username
     * @param {String} password - Plain text password
     * @returns {Object} User and tokens
     */
    async login(identifier, password) {
        // Find user by email or username (this method includes password)
        const user = await User.findByEmailOrUsername(identifier);

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Verify password
        if (!password || !user.password) {
            throw new Error('Invalid credentials - missing password data');
        }

        const isPasswordValid = await this.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Generate tokens
        const token = this.generateToken(user);
        const refreshToken = this.generateRefreshToken(user);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        return {
            user: userResponse,
            token,
            refreshToken
        };
    }

    /**
     * Refresh access token
     * @param {String} refreshToken - Refresh token
     * @returns {Object} New tokens
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = this.verifyToken(refreshToken);

            if (decoded.type !== 'refresh') {
                throw new Error('Invalid refresh token');
            }

            // Find user
            const user = await User.findById(decoded.id);
            if (!user || !user.isActive) {
                throw new Error('User not found or inactive');
            }

            // Generate new tokens
            const newToken = this.generateToken(user);
            const newRefreshToken = this.generateRefreshToken(user);

            return {
                token: newToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * Get user by token
     * @param {String} token - JWT token
     * @returns {Object} User object
     */
    async getUserByToken(token) {
        const decoded = this.verifyToken(token);
        const user = await User.findById(decoded.id).select('-password');

        if (!user || !user.isActive) {
            throw new Error('User not found or inactive');
        }

        return user;
    }
}

module.exports = new AuthService();