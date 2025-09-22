import { describe, it, expect, beforeEach, vi } from 'vitest';
import authService from '../auth';
import api from '../api';

// Mock the api module
vi.mock('../api');

describe('AuthService', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            const mockResponse = {
                data: {
                    data: {
                        token: 'mock-jwt-token',
                        user: {
                            id: '1',
                            email: 'admin@test.com',
                            username: 'admin',
                            role: 'admin'
                        }
                    }
                }
            };

            api.post.mockResolvedValue(mockResponse);

            const result = await authService.login({
                email: 'admin@test.com',
                password: 'password123'
            });

            expect(api.post).toHaveBeenCalledWith('/auth/login', {
                email: 'admin@test.com',
                password: 'password123'
            });

            expect(result).toEqual({
                token: 'mock-jwt-token',
                user: mockResponse.data.data.user
            });

            expect(localStorage.getItem('adminToken')).toBe('mock-jwt-token');
            expect(localStorage.getItem('adminUser')).toBe(
                JSON.stringify(mockResponse.data.data.user)
            );
        });

        it('should reject login for non-admin/editor users', async () => {
            const mockResponse = {
                data: {
                    data: {
                        token: 'mock-jwt-token',
                        user: {
                            id: '1',
                            email: 'reader@test.com',
                            username: 'reader',
                            role: 'reader'
                        }
                    }
                }
            };

            api.post.mockResolvedValue(mockResponse);

            await expect(authService.login({
                email: 'reader@test.com',
                password: 'password123'
            })).rejects.toThrow('Access denied. Admin or editor role required.');

            expect(localStorage.getItem('adminToken')).toBeNull();
            expect(localStorage.getItem('adminUser')).toBeNull();
        });

        it('should handle login API errors', async () => {
            const mockError = {
                response: {
                    data: {
                        error: 'Invalid credentials'
                    }
                }
            };

            api.post.mockRejectedValue(mockError);

            await expect(authService.login({
                email: 'wrong@test.com',
                password: 'wrongpassword'
            })).rejects.toThrow('Invalid credentials');
        });
    });

    describe('logout', () => {
        it('should clear localStorage on logout', () => {
            localStorage.setItem('adminToken', 'test-token');
            localStorage.setItem('adminUser', JSON.stringify({ id: '1' }));

            authService.logout();

            expect(localStorage.getItem('adminToken')).toBeNull();
            expect(localStorage.getItem('adminUser')).toBeNull();
        });
    });

    describe('getCurrentUser', () => {
        it('should return user from localStorage', () => {
            const mockUser = { id: '1', email: 'test@test.com', role: 'admin' };
            localStorage.setItem('adminUser', JSON.stringify(mockUser));

            const user = authService.getCurrentUser();

            expect(user).toEqual(mockUser);
        });

        it('should return null if no user in localStorage', () => {
            const user = authService.getCurrentUser();
            expect(user).toBeNull();
        });

        it('should handle invalid JSON in localStorage', () => {
            localStorage.setItem('adminUser', 'invalid-json');

            const user = authService.getCurrentUser();
            expect(user).toBeNull();
        });
    });

    describe('isAuthenticated', () => {
        it('should return true when token and user exist', () => {
            localStorage.setItem('adminToken', 'test-token');
            localStorage.setItem('adminUser', JSON.stringify({ id: '1' }));

            expect(authService.isAuthenticated()).toBe(true);
        });

        it('should return false when token or user missing', () => {
            localStorage.setItem('adminToken', 'test-token');
            // No user set

            expect(authService.isAuthenticated()).toBe(false);
        });
    });

    describe('role checking', () => {
        it('should correctly identify admin users', () => {
            localStorage.setItem('adminUser', JSON.stringify({ role: 'admin' }));
            expect(authService.isAdmin()).toBe(true);
        });

        it('should correctly identify non-admin users', () => {
            localStorage.setItem('adminUser', JSON.stringify({ role: 'editor' }));
            expect(authService.isAdmin()).toBe(false);
        });

        it('should allow editing for admin and editor roles', () => {
            localStorage.setItem('adminUser', JSON.stringify({ role: 'admin' }));
            expect(authService.canEdit()).toBe(true);

            localStorage.setItem('adminUser', JSON.stringify({ role: 'editor' }));
            expect(authService.canEdit()).toBe(true);

            localStorage.setItem('adminUser', JSON.stringify({ role: 'reader' }));
            expect(authService.canEdit()).toBe(false);
        });
    });

    describe('verifyToken', () => {
        it('should return true for valid token', async () => {
            api.get.mockResolvedValue({ data: { success: true } });

            const result = await authService.verifyToken();

            expect(api.get).toHaveBeenCalledWith('/auth/verify');
            expect(result).toBe(true);
        });

        it('should logout and return false for invalid token', async () => {
            localStorage.setItem('adminToken', 'invalid-token');
            localStorage.setItem('adminUser', JSON.stringify({ id: '1' }));

            api.get.mockRejectedValue(new Error('Unauthorized'));

            const result = await authService.verifyToken();

            expect(result).toBe(false);
            expect(localStorage.getItem('adminToken')).toBeNull();
            expect(localStorage.getItem('adminUser')).toBeNull();
        });
    });
});