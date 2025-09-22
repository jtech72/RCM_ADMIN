/**
 * Role-based authorization middleware
 * Checks if authenticated user has required role(s)
 */

/**
 * Check if user has required role
 * @param {Array|String} allowedRoles - Array of allowed roles or single role
 * @returns {Function} Middleware function
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Ensure user is authenticated (should be set by auth middleware)
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            // Convert single role to array for consistent handling
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Check if user's role is in allowed roles
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. Insufficient permissions.',
                    details: `Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`
                });
            }

            next();
        } catch (error) {
            console.error('Role authorization error:', error);

            return res.status(500).json({
                success: false,
                error: 'Authorization check failed',
                details: error.message
            });
        }
    };
};

/**
 * Middleware to require admin role
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware to require admin or editor role
 */
const requireEditor = requireRole(['admin', 'editor']);

/**
 * Middleware to require any authenticated user (reader, editor, or admin)
 */
const requireAuth = requireRole(['reader', 'editor', 'admin']);

/**
 * Check if user has specific permission based on role hierarchy
 * Admin > Editor > Reader
 * @param {String} requiredLevel - Minimum required role level
 * @returns {Function} Middleware function
 */
const requireMinimumRole = (requiredLevel) => {
    const roleHierarchy = {
        'reader': 1,
        'editor': 2,
        'admin': 3
    };

    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const userLevel = roleHierarchy[req.user.role] || 0;
            const requiredLevelValue = roleHierarchy[requiredLevel] || 0;

            if (userLevel < requiredLevelValue) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. Insufficient permissions.',
                    details: `Required minimum role: ${requiredLevel}. Your role: ${req.user.role}`
                });
            }

            next();
        } catch (error) {
            console.error('Role hierarchy authorization error:', error);

            return res.status(500).json({
                success: false,
                error: 'Authorization check failed',
                details: error.message
            });
        }
    };
};

/**
 * Check if user owns the resource or has admin privileges
 * @param {String} userIdField - Field name in req.params or req.body that contains user ID
 * @returns {Function} Middleware function
 */
const requireOwnershipOrAdmin = (userIdField = 'userId') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            // Admin can access any resource
            if (req.user.role === 'admin') {
                return next();
            }

            // Get resource owner ID from params or body
            const resourceOwnerId = req.params[userIdField] || req.body[userIdField];

            if (!resourceOwnerId) {
                return res.status(400).json({
                    success: false,
                    error: 'Resource owner ID not provided'
                });
            }

            // Check if user owns the resource
            if (req.user._id.toString() !== resourceOwnerId.toString()) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. You can only access your own resources.'
                });
            }

            next();
        } catch (error) {
            console.error('Ownership authorization error:', error);

            return res.status(500).json({
                success: false,
                error: 'Authorization check failed',
                details: error.message
            });
        }
    };
};

module.exports = {
    requireRole,
    requireAdmin,
    requireEditor,
    requireAuth,
    requireMinimumRole,
    requireOwnershipOrAdmin
};