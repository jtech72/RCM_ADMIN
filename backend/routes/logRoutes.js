const express = require('express');
const { catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Log client-side errors
router.post('/client-error', catchAsync(async (req, res) => {
    const {
        message,
        stack,
        componentStack,
        userAgent,
        url,
        timestamp,
        context,
        type,
        filename,
        lineno,
        colno,
    } = req.body;

    // Log the client error with structured data
    logger.error('Client-side error:', {
        type: type || 'client-error',
        message,
        stack,
        componentStack,
        userAgent,
        url,
        timestamp,
        context: context || 'unknown',
        filename,
        lineno,
        colno,
        ip: req.ip,
        headers: {
            'user-agent': req.get('User-Agent'),
            'referer': req.get('Referer'),
        },
    });

    res.status(200).json({
        success: true,
        message: 'Error logged successfully',
    });
}));

module.exports = router;