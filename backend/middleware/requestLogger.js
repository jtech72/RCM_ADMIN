const logger = require('../utils/logger');

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log request details
    logger.http('Incoming request:', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });

    // Override res.end to log response details
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - start;

        logger.http('Request completed:', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            contentLength: res.get('Content-Length') || 0,
        });

        originalEnd.call(this, chunk, encoding);
    };

    next();
};

module.exports = requestLogger;