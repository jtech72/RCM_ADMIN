const { cacheMiddleware, cache, clearAllCache, getCacheStats } = require('../middleware/cache');

describe('Cache Middleware Tests', () => {
    beforeEach(() => {
        clearAllCache();
    });

    afterEach(() => {
        clearAllCache();
    });

    test('should create cache middleware function', () => {
        const middleware = cacheMiddleware(300);
        expect(typeof middleware).toBe('function');
    });

    test('should skip caching for non-GET requests', () => {
        const middleware = cacheMiddleware(300);
        const mockReq = { method: 'POST', originalUrl: '/test' };
        const mockRes = {};
        const mockNext = jest.fn();

        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });

    test('should handle cache miss and set cache', () => {
        const middleware = cacheMiddleware(300);
        const mockReq = { method: 'GET', originalUrl: '/test' };
        const mockRes = {
            json: jest.fn(),
            set: jest.fn()
        };
        const mockNext = jest.fn();

        // First call - cache miss
        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(cache.get('/test')).toBeUndefined();

        // Simulate response
        const testData = { message: 'test' };
        mockRes.statusCode = 200;
        mockRes.json(testData);

        expect(mockRes.set).toHaveBeenCalledWith('X-Cache', 'MISS');
        expect(cache.get('/test')).toEqual(testData);
    });

    test('should return cached data on cache hit', () => {
        const middleware = cacheMiddleware(300);
        const testData = { message: 'cached data' };

        // Set cache manually
        cache.set('/test', testData);

        const mockReq = { method: 'GET', originalUrl: '/test' };
        const mockRes = {
            json: jest.fn(),
            set: jest.fn()
        };
        const mockNext = jest.fn();

        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.set).toHaveBeenCalledWith('X-Cache', 'HIT');
        expect(mockRes.json).toHaveBeenCalledWith(testData);
    });

    test('should get cache statistics', () => {
        const stats = getCacheStats();
        expect(stats).toHaveProperty('keys');
        expect(stats).toHaveProperty('hits');
        expect(stats).toHaveProperty('misses');
    });

    test('should clear all cache', () => {
        cache.set('test1', 'data1');
        cache.set('test2', 'data2');

        expect(cache.keys().length).toBe(2);

        clearAllCache();

        expect(cache.keys().length).toBe(0);
    });
});