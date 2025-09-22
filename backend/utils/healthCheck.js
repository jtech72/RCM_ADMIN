const mongoose = require('mongoose');
const AWS = require('aws-sdk');
require('dotenv').config();

/**
 * Health check utility for production deployment
 */
class HealthCheck {
    constructor() {
        this.checks = [];
    }

    /**
     * Add a health check
     * @param {string} name - Name of the check
     * @param {Function} checkFn - Function that returns a promise
     */
    addCheck(name, checkFn) {
        this.checks.push({ name, checkFn });
    }

    /**
     * Run all health checks
     * @returns {Promise<Object>} Health check results
     */
    async runChecks() {
        const results = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            checks: {},
            environment: process.env.NODE_ENV || 'development'
        };

        for (const check of this.checks) {
            try {
                const startTime = Date.now();
                await check.checkFn();
                const duration = Date.now() - startTime;

                results.checks[check.name] = {
                    status: 'pass',
                    duration: `${duration}ms`
                };
            } catch (error) {
                results.status = 'unhealthy';
                results.checks[check.name] = {
                    status: 'fail',
                    error: error.message,
                    details: error.stack
                };
            }
        }

        return results;
    }

    /**
     * Check database connectivity
     */
    async checkDatabase() {
        if (mongoose.connection.readyState === 1) {
            // Already connected
            await mongoose.connection.db.admin().ping();
            return;
        }

        // Connect if not already connected
        await mongoose.connect(process.env.MONGODB_URI);
        await mongoose.connection.db.admin().ping();
    }

    /**
     * Check AWS S3 connectivity
     */
    async checkS3() {
        const s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        });

        // Check if bucket exists and is accessible
        await s3.headBucket({ Bucket: process.env.S3_BUCKET_NAME }).promise();
    }

    /**
     * Check environment variables
     */
    async checkEnvironment() {
        const requiredVars = [
            'MONGODB_URI',
            'JWT_SECRET',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'S3_BUCKET_NAME',
            'AWS_REGION'
        ];

        const missing = requiredVars.filter(varName => !process.env[varName]);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        // Check JWT secret strength
        if (process.env.JWT_SECRET.length < 32) {
            throw new Error('JWT_SECRET should be at least 32 characters long for production');
        }
    }

    /**
     * Check system resources
     */
    async checkSystem() {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        // Check if memory usage is reasonable (less than 1GB)
        if (memoryUsage.heapUsed > 1024 * 1024 * 1024) {
            throw new Error(`High memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
        }

        return {
            uptime: `${Math.round(uptime)}s`,
            memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
        };
    }
}

/**
 * Initialize and run health checks
 */
async function checkHealth() {
    const healthCheck = new HealthCheck();

    // Add health checks
    healthCheck.addCheck('environment', () => healthCheck.checkEnvironment());
    healthCheck.addCheck('database', () => healthCheck.checkDatabase());
    healthCheck.addCheck('s3', () => healthCheck.checkS3());
    healthCheck.addCheck('system', () => healthCheck.checkSystem());

    try {
        const results = await healthCheck.runChecks();
        console.log('Health Check Results:', JSON.stringify(results, null, 2));

        if (results.status === 'unhealthy') {
            process.exit(1);
        }

        return results;
    } catch (error) {
        console.error('Health check failed:', error);
        process.exit(1);
    } finally {
        // Close database connection if we opened it
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

module.exports = {
    HealthCheck,
    checkHealth
};