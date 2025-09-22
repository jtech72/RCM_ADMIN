const NodeCache = require('node-cache');

// Create cache instance with TTL of 5 minutes (300 seconds)
const cache = new NodeCache({
    stdTTL: 300,
    checkperiod: 60,
    useClones: false
});

/**
 * Cache middleware for Express routes
 * @param {number} duration - Cache duration in seconds (optional, defaults to 300)
 * @returns {Function} Express middleware function
 */
const cacheMiddleware = (duration = 300) => {
    return (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Create cache key from URL and query parameters
        const key = `${req.originalUrl || req.url}`;

        try {
            const cachedResponse = cache.get(key);

            if (cachedResponse) {
                // Add cache hit header for debugging
                res.set('X-Cache', 'HIT');
                return res.json(cachedResponse);
            }

            // Store original res.json function
            const originalJson = res.json;

            // Override res.json to cache the response
            res.json = function (data) {
                // Only cache successful responses
                if (res.statusCode === 200) {
                    cache.set(key, data, duration);
                    res.set('X-Cache', 'MISS');
                }

                // Call original json function
                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match cache keys
 */
const clearCacheByPattern = (pattern) => {
    const keys = cache.keys();
    const keysToDelete = keys.filter(key => key.includes(pattern));

    keysToDelete.forEach(key => {
        cache.del(key);
    });

    return keysToDelete.length;
};

/**
 * Clear all cache
 */
const clearAllCache = () => {
    cache.flushAll();
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
    return cache.getStats();
};

module.exports = {
    cacheMiddleware,
    clearCacheByPattern,
    clearAllCache,
    getCacheStats,
    cache
};