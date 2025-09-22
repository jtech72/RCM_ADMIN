module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: ['<rootDir>/tests/**/*.test.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'models/**/*.js',
        'services/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js',
        'config/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testTimeout: 30000,
    forceExit: true,
    detectOpenHandles: true,
    verbose: true
};