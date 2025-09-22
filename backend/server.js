const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Add better error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Stack trace:', err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...');
    console.error('Error:', err);
    process.exit(1);
});

const dbConnection = require('./config/database');
const logger = require('./utils/logger');
const { globalErrorHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Import routes with error handling
let blogRoutes, authRoutes, analyticsRoutes, userRoutes, logRoutes, s3Routes, categoryRoutes;

try {
    console.log('Loading routes...');
    blogRoutes = require('./routes/blogRoutes');
    console.log('✅ Blog routes loaded');

    authRoutes = require('./routes/authRoutes');
    console.log('✅ Auth routes loaded');

    analyticsRoutes = require('./routes/analyticsRoutes');
    console.log('✅ Analytics routes loaded');

    userRoutes = require('./routes/userRoutes');
    console.log('✅ User routes loaded');

    logRoutes = require('./routes/logRoutes');
    console.log('✅ Log routes loaded');

    s3Routes = require('./routes/s3Routes');
    console.log('✅ S3 routes loaded');

    categoryRoutes = require('./routes/categoryRoutes');
    console.log('✅ Category routes loaded');

    console.log('✅ All routes loaded successfully');
} catch (error) {
    console.error('❌ Error loading routes:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
    dbConnection.connect();
}

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001',
    'http://localhost:5173', // Vite dev server default port
    'http://localhost:4173'  // Vite preview server default port
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/s3', s3Routes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        details: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Global error handler
app.use(globalErrorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

module.exports = app;