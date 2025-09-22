const mongoose = require('mongoose');
const dbConnection = require('../config/database');
require('dotenv').config();

// Use the actual MongoDB URI from environment variables
const testUri = process.env.MONGODB_URI;

describe('Database Connection', () => {
    beforeAll(async () => {
        // Ensure we start with a clean state
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });

    afterAll(async () => {
        // Clean up after tests
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });

    describe('connect()', () => {
        test('should connect to MongoDB successfully', async () => {
            await dbConnection.connect(testUri);

            expect(dbConnection.isDbConnected()).toBe(true);
            expect(dbConnection.getConnectionStatus()).toBe('connected');
        }, 15000); // 15 second timeout for connection

        test('should throw error when URI is not provided', async () => {
            await expect(dbConnection.connect('')).rejects.toThrow(
                'MongoDB URI is required. Please set MONGODB_URI in environment variables.'
            );
        });

        test('should handle connection errors gracefully', async () => {
            // First disconnect to ensure clean state
            await dbConnection.disconnect();

            const invalidUri = 'mongodb://invalid-host:27017/test';

            // This should eventually throw after retries
            await expect(dbConnection.connect(invalidUri)).rejects.toThrow();
        }, 30000); // 30 second timeout for retry logic
    });

    describe('connection status methods', () => {
        beforeEach(async () => {
            if (!dbConnection.isDbConnected()) {
                await dbConnection.connect(testUri);
            }
        });

        test('should return correct connection status', () => {
            expect(dbConnection.isDbConnected()).toBe(true);
            expect(dbConnection.getConnectionStatus()).toBe('connected');
        });

        test('should disconnect successfully', async () => {
            await dbConnection.disconnect();

            expect(dbConnection.isDbConnected()).toBe(false);
            expect(dbConnection.getConnectionStatus()).toBe('disconnected');
        });
    });

    describe('retry logic', () => {
        test('should have correct retry configuration', () => {
            expect(dbConnection.maxRetries).toBe(5);
            expect(dbConnection.retryDelay).toBe(5000);
        });

        test('should reset retry attempts on successful connection', async () => {
            await dbConnection.connect(testUri);
            expect(dbConnection.retryAttempts).toBe(0);
        });
    });

    describe('event listeners', () => {
        test('should set up connection event listeners', async () => {
            // Connect to ensure event listeners are set up
            await dbConnection.connect(testUri);

            // Check that mongoose connection has event listeners
            const connectionEvents = mongoose.connection.eventNames();
            expect(connectionEvents).toContain('connected');
            expect(connectionEvents).toContain('error');
            expect(connectionEvents).toContain('disconnected');
        });
    });
});