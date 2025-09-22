const request = require('supertest');
const app = require('../server');
const { AppError, ValidationError, NotFoundError } = require('../utils/customErrors');
const { globalErrorHandler, catchAsync } = require('../middleware/errorHandler');

describe('Error Handling System', () => {
    describe('Custom Error Classes', () => {
        test('AppError should create error with correct properties', () => {
            const error = new AppError('Test error', 400);

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.status).toBe('fail');
            expect(error.isOperational).toBe(true);
        });

        test('ValidationError should extend AppError', () => {
            const error = new ValidationError('Invalid input', 'email');

            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(400);
            expect(error.field).toBe('email');
            expect(error.name).toBe('ValidationError');
        });

        test('NotFoundError should have correct status code', () => {
            const error = new NotFoundError('Resource not found');

            expect(error.statusCode).toBe(404);
            expect(error.name).toBe('NotFoundError');
        });
    });

    describe('catchAsync wrapper', () => {
        test('should catch async errors and pass to next', async () => {
            const asyncFn = catchAsync(async (req, res, next) => {
                throw new Error('Async error');
            });

            const mockReq = {};
            const mockRes = {};
            const mockNext = jest.fn();

            await asyncFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockNext.mock.calls[0][0].message).toBe('Async error');
        });

        test('should not interfere with successful async operations', async () => {
            const asyncFn = catchAsync(async (req, res, next) => {
                res.json({ success: true });
            });

            const mockReq = {};
            const mockRes = {
                json: jest.fn()
            };
            const mockNext = jest.fn();

            await asyncFn(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({ success: true });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Global Error Handler Integration', () => {
        test('should handle 404 errors correctly', async () => {
            const response = await request(app)
                .get('/api/nonexistent-route')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Route not found');
        });

        test('should handle validation errors in development', async () => {
            // This would require a route that triggers validation error
            // For now, we'll test the error handler directly
            const mockError = new ValidationError('Invalid email format');
            const mockReq = {
                method: 'POST',
                originalUrl: '/test',
                ip: '127.0.0.1',
                get: jest.fn().mockReturnValue('Test User Agent')
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();

            // Set NODE_ENV to development for this test
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            globalErrorHandler(mockError, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Invalid email format'
                })
            );

            // Restore original NODE_ENV
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Client Error Logging', () => {
        test('should log client errors successfully', async () => {
            const clientError = {
                message: 'Client-side error',
                stack: 'Error stack trace',
                userAgent: 'Test User Agent',
                url: 'http://localhost:3000/test',
                timestamp: new Date().toISOString(),
                context: 'public-frontend'
            };

            const response = await request(app)
                .post('/api/logs/client-error')
                .send(clientError)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Error logged successfully');
        });

        test('should handle missing client error data gracefully', async () => {
            const response = await request(app)
                .post('/api/logs/client-error')
                .send({})
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Request Logging', () => {
        test('should log requests and responses', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Server is running');
        });
    });
});