const authMiddleware = require('../middleware/auth');
const authService = require('../services/authService');

// Mock authService
jest.mock('../services/authService');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            header: jest.fn()
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('authMiddleware', () => {
        it('should authenticate user with valid token', async () => {
            const mockUser = {
                _id: 'user123',
                username: 'testuser',
                email: 'test@example.com',
                role: 'reader'
            };

            req.header.mockReturnValue('Bearer valid-token');
            authService.getUserByToken.mockResolvedValue(mockUser);

            await authMiddleware(req, res, next);

            expect(req.header).toHaveBeenCalledWith('Authorization');
            expect(authService.getUserByToken).toHaveBeenCalledWith('valid-token');
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 401 when no authorization header', async () => {
            req.header.mockReturnValue(null);

            await authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. No token provided.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when authorization header does not start with Bearer', async () => {
            req.header.mockReturnValue('Basic invalid-format');

            await authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. Invalid token format.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token is empty after Bearer', async () => {
            req.header.mockReturnValue('Bearer ');

            await authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. No token provided.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token is invalid', async () => {
            req.header.mockReturnValue('Bearer invalid-token');
            authService.getUserByToken.mockRejectedValue(new Error('Invalid token'));

            await authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. Invalid token.',
                details: 'Invalid token'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when user is not found', async () => {
            req.header.mockReturnValue('Bearer valid-token');
            authService.getUserByToken.mockRejectedValue(new Error('User not found'));

            await authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. Invalid token.',
                details: 'User not found'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
});