const authService = require('../services/authService');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock User model
jest.mock('../models/User');

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_EXPIRES_IN = '7d';
    });

    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const user = {
                _id: 'user123',
                username: 'testuser',
                email: 'test@example.com',
                role: 'reader'
            };

            const token = authService.generateToken(user);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            expect(decoded.id).toBe(user._id);
            expect(decoded.username).toBe(user.username);
            expect(decoded.email).toBe(user.email);
            expect(decoded.role).toBe(user.role);
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a valid refresh token', () => {
            const user = { _id: 'user123' };

            const refreshToken = authService.generateRefreshToken(user);
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

            expect(decoded.id).toBe(user._id);
            expect(decoded.type).toBe('refresh');
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token', () => {
            const payload = { id: 'user123', username: 'testuser' };
            const token = jwt.sign(payload, process.env.JWT_SECRET);

            const decoded = authService.verifyToken(token);

            expect(decoded.id).toBe(payload.id);
            expect(decoded.username).toBe(payload.username);
        });

        it('should throw error for invalid token', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => {
                authService.verifyToken(invalidToken);
            }).toThrow('Invalid or expired token');
        });

        it('should throw error for expired token', () => {
            const payload = { id: 'user123' };
            const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1ms' });

            // Wait for token to expire
            setTimeout(() => {
                expect(() => {
                    authService.verifyToken(expiredToken);
                }).toThrow('Invalid or expired token');
            }, 10);
        });
    });

    describe('hashPassword', () => {
        it('should hash password correctly', async () => {
            const password = 'testpassword123';
            const hashedPassword = await authService.hashPassword(password);

            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.length).toBeGreaterThan(50);
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching password', async () => {
            const password = 'testpassword123';
            const hashedPassword = await bcrypt.hash(password, 12);

            const result = await authService.comparePassword(password, hashedPassword);

            expect(result).toBe(true);
        });

        it('should return false for non-matching password', async () => {
            const password = 'testpassword123';
            const wrongPassword = 'wrongpassword';
            const hashedPassword = await bcrypt.hash(password, 12);

            const result = await authService.comparePassword(wrongPassword, hashedPassword);

            expect(result).toBe(false);
        });
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'reader'
            };

            const mockUser = {
                _id: 'user123',
                ...userData,
                password: 'hashedpassword',
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'user123',
                    username: userData.username,
                    email: userData.email,
                    role: userData.role
                })
            };

            User.findOne.mockResolvedValue(null); // No existing user
            User.mockImplementation(() => mockUser);

            const result = await authService.register(userData);

            expect(User.findOne).toHaveBeenCalledWith({
                $or: [{ email: userData.email }, { username: userData.username }]
            });
            expect(mockUser.save).toHaveBeenCalled();
            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.user.password).toBeUndefined();
        });

        it('should throw error if user already exists', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue({ _id: 'existing-user' });

            await expect(authService.register(userData)).rejects.toThrow(
                'User with this email or username already exists'
            );
        });
    });

    describe('login', () => {
        it('should login user with valid credentials', async () => {
            const identifier = 'test@example.com';
            const password = 'password123';
            const hashedPassword = await bcrypt.hash(password, 12);

            const mockUser = {
                _id: 'user123',
                username: 'testuser',
                email: identifier,
                password: hashedPassword,
                role: 'reader',
                isActive: true,
                toObject: jest.fn().mockReturnValue({
                    _id: 'user123',
                    username: 'testuser',
                    email: identifier,
                    role: 'reader',
                    isActive: true
                })
            };

            User.findOne.mockResolvedValue(mockUser);

            const result = await authService.login(identifier, password);

            expect(User.findOne).toHaveBeenCalledWith({
                $or: [{ email: identifier }, { username: identifier }]
            });
            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.user.password).toBeUndefined();
        });

        it('should throw error for non-existent user', async () => {
            User.findOne.mockResolvedValue(null);

            await expect(authService.login('nonexistent@example.com', 'password')).rejects.toThrow(
                'Invalid credentials'
            );
        });

        it('should throw error for inactive user', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                isActive: false
            };

            User.findOne.mockResolvedValue(mockUser);

            await expect(authService.login('test@example.com', 'password')).rejects.toThrow(
                'Account is deactivated'
            );
        });

        it('should throw error for invalid password', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 12);
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: true
            };

            User.findOne.mockResolvedValue(mockUser);

            await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
                'Invalid credentials'
            );
        });
    });

    describe('refreshToken', () => {
        it('should refresh token successfully', async () => {
            const userId = 'user123';
            const refreshToken = jwt.sign(
                { id: userId, type: 'refresh' },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            const mockUser = {
                _id: userId,
                username: 'testuser',
                email: 'test@example.com',
                role: 'reader',
                isActive: true
            };

            User.findById.mockResolvedValue(mockUser);

            const result = await authService.refreshToken(refreshToken);

            expect(User.findById).toHaveBeenCalledWith(userId);
            expect(result.token).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });

        it('should throw error for invalid refresh token type', async () => {
            const accessToken = jwt.sign(
                { id: 'user123', type: 'access' },
                process.env.JWT_SECRET
            );

            await expect(authService.refreshToken(accessToken)).rejects.toThrow(
                'Invalid refresh token'
            );
        });

        it('should throw error for non-existent user', async () => {
            const refreshToken = jwt.sign(
                { id: 'nonexistent', type: 'refresh' },
                process.env.JWT_SECRET
            );

            User.findById.mockResolvedValue(null);

            await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
                'Invalid refresh token'
            );
        });
    });

    describe('getUserByToken', () => {
        it('should return user for valid token', async () => {
            const userId = 'user123';
            const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);

            const mockUser = {
                _id: userId,
                username: 'testuser',
                email: 'test@example.com',
                role: 'reader',
                isActive: true
            };

            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            const result = await authService.getUserByToken(token);

            expect(User.findById).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockUser);
        });

        it('should throw error for non-existent user', async () => {
            const token = jwt.sign({ id: 'nonexistent' }, process.env.JWT_SECRET);

            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            await expect(authService.getUserByToken(token)).rejects.toThrow(
                'User not found or inactive'
            );
        });
    });
});