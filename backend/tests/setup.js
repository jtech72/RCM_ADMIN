const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Global test setup
beforeAll(async () => {
    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
}, 60000);

// Clean up after each test
afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
        const collections = mongoose.connection.collections;

        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    }
});

// Global test teardown
afterAll(async () => {
    try {
        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.dropDatabase();
            await mongoose.disconnect();
        }

        // Stop the in-memory MongoDB instance
        if (mongoServer) {
            await mongoServer.stop();
        }
    } catch (error) {
        console.error('Error during test teardown:', error);
    }
}, 60000);

// Increase timeout for async operations
jest.setTimeout(60000);

// Suppress console output during tests
const originalConsole = global.console;
global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
};