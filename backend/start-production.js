#!/usr/bin/env node

/**
 * Production startup script for the blogging system backend
 * This script handles production-specific initialization and monitoring
 */

const cluster = require('cluster');
const os = require('os');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Production configuration
const PRODUCTION_CONFIG = {
    // Use all CPU cores in production for better performance
    workers: process.env.CLUSTER_WORKERS || os.cpus().length,

    // Restart workers if they crash
    restartDelay: 1000,

    // Maximum memory usage before restart (in MB)
    maxMemory: process.env.MAX_MEMORY || 512,

    // Enable graceful shutdown
    gracefulShutdown: true,

    // Health check interval (in ms)
    healthCheckInterval: 30000
};

/**
 * Setup process monitoring and error handling
 */
function setupProcessMonitoring() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        console.error('Stack:', error.stack);

        // Graceful shutdown
        process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);

        // Graceful shutdown
        process.exit(1);
    });

    // Handle SIGTERM (graceful shutdown)
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Starting graceful shutdown...');

        if (cluster.isMaster) {
            // Close all workers
            for (const id in cluster.workers) {
                cluster.workers[id].kill('SIGTERM');
            }
        }

        // Give processes time to clean up
        setTimeout(() => {
            process.exit(0);
        }, 10000);
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
        console.log('SIGINT received. Starting graceful shutdown...');
        process.emit('SIGTERM');
    });
}

/**
 * Monitor worker memory usage
 */
function monitorWorkerMemory(worker) {
    const checkMemory = () => {
        if (!worker.isDead()) {
            const memUsage = process.memoryUsage();
            const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);

            if (memUsageMB > PRODUCTION_CONFIG.maxMemory) {
                console.warn(`Worker ${worker.process.pid} memory usage (${memUsageMB}MB) exceeds limit (${PRODUCTION_CONFIG.maxMemory}MB). Restarting...`);
                worker.kill('SIGTERM');
            }
        }
    };

    // Check memory every 5 minutes
    const memoryInterval = setInterval(checkMemory, 5 * 60 * 1000);

    worker.on('exit', () => {
        clearInterval(memoryInterval);
    });
}

/**
 * Setup cluster master process
 */
function setupClusterMaster() {
    console.log(`Master process ${process.pid} is running`);
    console.log(`Starting ${PRODUCTION_CONFIG.workers} workers...`);

    // Fork workers
    for (let i = 0; i < PRODUCTION_CONFIG.workers; i++) {
        const worker = cluster.fork();
        monitorWorkerMemory(worker);
    }

    // Handle worker exit
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);

        if (!worker.exitedAfterDisconnect) {
            console.log('Starting a new worker...');

            // Restart after delay
            setTimeout(() => {
                const newWorker = cluster.fork();
                monitorWorkerMemory(newWorker);
            }, PRODUCTION_CONFIG.restartDelay);
        }
    });

    // Handle worker online
    cluster.on('online', (worker) => {
        console.log(`Worker ${worker.process.pid} is online`);
    });

    // Setup health check for master process
    if (PRODUCTION_CONFIG.healthCheckInterval > 0) {
        setInterval(() => {
            const workerCount = Object.keys(cluster.workers).length;
            console.log(`Health check: ${workerCount} workers running`);

            if (workerCount === 0) {
                console.error('No workers running! Exiting...');
                process.exit(1);
            }
        }, PRODUCTION_CONFIG.healthCheckInterval);
    }
}

/**
 * Start worker process
 */
function startWorker() {
    // Import and start the main server
    require('./server.js');

    console.log(`Worker ${process.pid} started`);

    // Monitor worker memory usage
    setInterval(() => {
        const memUsage = process.memoryUsage();
        const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);

        if (memUsageMB > PRODUCTION_CONFIG.maxMemory) {
            console.warn(`Worker ${process.pid} memory usage: ${memUsageMB}MB (limit: ${PRODUCTION_CONFIG.maxMemory}MB)`);
        }
    }, 60000); // Check every minute
}

/**
 * Main startup logic
 */
function main() {
    // Validate environment
    if (process.env.NODE_ENV !== 'production') {
        console.warn('Warning: NODE_ENV is not set to "production"');
    }

    // Setup process monitoring
    setupProcessMonitoring();

    // Check if clustering is enabled
    const enableClustering = process.env.ENABLE_CLUSTERING !== 'false' && PRODUCTION_CONFIG.workers > 1;

    if (enableClustering && cluster.isMaster) {
        setupClusterMaster();
    } else {
        startWorker();
    }
}

// Start the application
if (require.main === module) {
    main();
}

module.exports = {
    PRODUCTION_CONFIG,
    setupProcessMonitoring,
    setupClusterMaster,
    startWorker
};