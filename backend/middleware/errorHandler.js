const logger = require('../utils/logger');
const { AppError } = require('../utils/customErrors');

// Handle MongoDB cast errors
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

// Handle MongoDB duplicate field errors
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

// Handle MongoDB validation errors
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401);

// Send error response in development
const sendErrorDev = (err, res) => {
    logger.error('Error in development:', {
        error: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
    });

    res.status(err.statusCode).json({
        success: false,
        error: err.message,
        stack: err.stack,
        details: err,
    });
};

// Send error response in production
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        logger.error('Operational error:', {
            error: err.message,
            statusCode: err.statusCode,
            stack: err.stack,
        });

        res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
    } else {
        // Programming or other unknown error: don't leak error details
        logger.error('Programming error:', {
            error: err.message,
            stack: err.stack,
        });

        res.status(500).json({
            success: false,
            error: 'Something went wrong!',
        });
    }
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error with request context
    logger.error('Global error handler:', {
        error: err.message,
        statusCode: err.statusCode,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        stack: err.stack,
    });

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        // Handle specific error types
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

// Catch async errors wrapper
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection:', {
        error: err.message,
        stack: err.stack,
    });

    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', {
        error: err.message,
        stack: err.stack,
    });

    // Close server & exit process
    process.exit(1);
});

module.exports = {
    globalErrorHandler,
    catchAsync,
};