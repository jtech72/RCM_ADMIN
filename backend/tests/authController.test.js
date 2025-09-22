const request = require('supertest');
const express = require('express');
const authController = require('../controllers/authController');
const authService = require('../services/authService');

// Mock authService
jest.mock('../services/authService');

// Create test app
const app = express();
app.use(express.json());

// Mock middleware for protected routes
const mockAuthMiddleware = (req, res, next) => {
    req.user = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'reader'
    };
    next();
};

// Set up routes
app.post('/register', authController.register);
app.post('/login', authController.login);
app.post('/refresh', authController.refreshToken);
app.get('/profile', mockAuthMiddleware, authController.getProfile);
app.post('/logout', mockAuthMiddleware, authController.logout);

describe('Auth Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /register', () => {
        it('should register user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'reader'
            };

            const mockResult = {
                user: {
                    _id: 'user123',
                    username: userData.username,
                    email: userData.email,
                    role: userData.role
                },
                token: 'jwt-token',
                refreshToken: 'refresh-token'
            };

            authService.register.mockResolvedValue(mockResult);

            const response = await request(app)
                .post('/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data).toEqual(mockResult);
            expect(authService.register).toHaveBeenCalledWith(userData);
        });

        it('should return 400 for invalid input', async () => {
            const invalidData = {
                username: 'ab', // Too short
                email: 'invalid-email',
                password: '123' // Too short
            };

            const response = await request(app)
                .post('/register')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation error');
        });

        it('should return 409 for existing user', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            authService.register.mockRejectedValue(
                new Error('User with this email or username already exists')
            );

            const response = await request(app)
                .post('/register')
                .send(userData);

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('User with this email or username already exists');
        });
    });

    describe('POST /login', () => {
        it('should login user successfully', async () => {
            const loginData = {
                identifier: 'test@example.com',
                password: 'password123'
            };

            const mockResult = {
                user: {
                    _id: 'user123',
                    username: 'testuser',
                    email: 'test@example.com',
                    role: 'reader'
                },
                token: 'jwt-token',
                refreshToken: 'refresh-token'
            };

            authService.login.mockResolvedValue(mockResult);

            const response = await request(app)
                .post('/login')
                .send(loginData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data).toEqual(mockResult);
            expect(authService.login).toHaveBeenCalledWith(loginData.identifier, loginData.password);
        });

        it('should return 400 for missing credentials', async () => {
            const response = await request(app)
                .post('/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation error');
        });

        it('should return 401 for invalid credentials', async () => {
            const loginData = {
                identifier: 'test@example.com',
                password: 'wrongpassword'
            };

            authService.login.mockRejectedValue(new Error('Invalid credentials'));

            const response = await request(app)
                .post('/login')
                .send(loginData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should return 401 for deactivated account', async () => {
            const loginData = {
                identifier: 'test@example.com',
                password: 'password123'
            };

            authService.login.mockRejectedValue(new Error('Account is deactivated'));

            const response = await request(app)
                .post('/login')
                .send(loginData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Account is deactivated');
        });
    });

    describe('POST /refresh', () => {
        it('should refresh token successfully', async () => {
            const refreshData = {
                refreshToken: 'valid-refresh-token'
            };

            const mockResult = {
                token: 'new-jwt-token',
                refreshToken: 'new-refresh-token'
            };

            authService.refreshToken.mockResolvedValue(mockResult);

            const response = await request(app)
                .post('/refresh')
                .send(refreshData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Token refreshed successfully');
            expect(response.body.data).toEqual(mockResult);
            expect(authService.refreshToken).toHaveBeenCalledWith(refreshData.refreshToken);
        });

        it('should return 400 for missing refresh token', async () => {
            const response = await request(app)
                .post('/refresh')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation error');
        });

        it('should return 401 for invalid refresh token', async () => {
            const refreshData = {
                refreshToken: 'invalid-refresh-token'
            };

            authService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

            const response = await request(app)
                .post('/refresh')
                .send(refreshData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Token refresh failed');
        });
    });

    describe('GET /profile', () => {
        it('should return user profile successfully', async () => {
            const response = await request(app)
                .get('/profile');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Profile retrieved successfully');
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user._id).toBe('user123');
        });
    });

    describe('POST /logout', () => {
        it('should logout successfully', async () => {
            const response = await request(app)
                .post('/logout');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout successful');
        });
    });
});