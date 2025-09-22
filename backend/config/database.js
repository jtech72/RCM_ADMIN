const mongoose = require('mongoose');

/**
 * Database connection utility with error handling and retry logic
 */
class DatabaseConnection {
    constructor() {
        this.isConnected = false;
        this.retryAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 5000; // 5 seconds
    }

    /**
     * Connect to MongoDB with retry logic
     * @param {string} uri - MongoDB connection URI
     * @returns {Promise<void>}
     */
    async connect(uri = process.env.MONGODB_URI) {
        if (!uri) {
            throw new Error('MongoDB URI is required. Please set MONGODB_URI in environment variables.');
        }

        // If already connected to the same URI, return
        if (this.isConnected && mongoose.connection.readyState === 1) {
            return;
        }

        // If connected to a different URI, disconnect first
        if (mongoose.connection.readyState !== 0) {
            await this.disconnect();
        }

        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000, // Added connection timeout
            bufferCommands: false,
            retryWrites: true,
            retryReads: true
        };

        try {
            await mongoose.connect(uri, options);
            this.isConnected = true;
            this.retryAttempts = 0;
            console.log('✅ MongoDB connected successfully');

            // Set up connection event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);

            if (this.retryAttempts < this.maxRetries) {
                this.retryAttempts++;
                console.log(`🔄 Retrying connection... Attempt ${this.retryAttempts}/${this.maxRetries}`);

                await this.delay(this.retryDelay);
                return this.connect(uri);
            } else {
                throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts: ${error.message}`);
            }
        }
    }

    /**
     * Set up mongoose connection event listeners
     */
    setupEventListeners() {
        mongoose.connection.on('connected', () => {
            console.log('📡 Mongoose connected to MongoDB');
            this.isConnected = true;
        });

        mongoose.connection.on('error', (error) => {
            console.error('❌ Mongoose connection error:', error);
            this.isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('📴 Mongoose disconnected from MongoDB');
            this.isConnected = false;
        });

        // Handle application termination
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    /**
     * Disconnect from MongoDB
     * @returns {Promise<void>}
     */
    async disconnect() {
        try {
            await mongoose.connection.close();
            this.isConnected = false;
            console.log('🔌 MongoDB connection closed');
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error.message);
            throw error;
        }
    }

    /**
     * Check if database is connected
     * @returns {boolean}
     */
    isDbConnected() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }

    /**
     * Get connection status
     * @returns {string}
     */
    getConnectionStatus() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        return states[mongoose.connection.readyState] || 'unknown';
    }

    /**
     * Utility method to add delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;