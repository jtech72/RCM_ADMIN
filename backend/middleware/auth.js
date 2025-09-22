const authService = require('../services/authService');

/**
 * Authentication middleware to verify JWT tokens
 * Attaches user object to req.user if token is valid
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
        }

        // Check if token starts with 'Bearer '
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. Invalid token format.'
            });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
        }

        // Verify token and get user
        const user = await authService.getUserByToken(token);

        // Attach user to request object
        req.user = user;

        next();
    } catch (error) {
        console.error('Authentication error:', error);

        return res.status(401).json({
            success: false,
            error: 'Access denied. Invalid token.',
            details: error.message
        });
    }
};

// Export both as default and named export for compatibility
const authenticateToken = authMiddleware;

module.exports = authMiddleware;
module.exports.authenticateToken = authenticateToken;