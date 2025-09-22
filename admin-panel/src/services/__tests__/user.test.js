import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    getUserRoles,
    getUserStatusOptions
} from '../user.js';
import api from '../api.js';

// Mock the api module
vi.mock('../api.js', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn()
    }
}));

describe('User Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUsers', () => {
        it('should fetch users with default parameters', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: [
                        { _id: '1', username: 'user1', email: 'user1@test.com', role: 'reader' }
                    ],
                    pagination: { page: 1, limit: 10, total: 1, pages: 1 }
                }
            };

            api.get.mockResolvedValue(mockResponse);

            const result = await getUsers();

            expect(api.get).toHaveBeenCalledWith('/users', { params: {} });
            expect(result).toEqual(mockResponse.data);
        });

        it('should fetch users with custom parameters', async () => {
            const params = {
                page: 2,
                limit: 5,
                search: 'admin',
                role: 'admin',
                status: 'active'
            };

            const mockResponse = {
                data: {
                    success: true,
                    data: [],
                    pagination: { page: 2, limit: 5, total: 0, pages: 0 }
                }
            };

            api.get.mockResolvedValue(mockResponse);

            const result = await getUsers(params);

            expect(api.get).toHaveBeenCalledWith('/users', { params });
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle API errors', async () => {
            const error = new Error('Network error');
            api.get.mockRejectedValue(error);

            await expect(getUsers()).rejects.toThrow('Network error');
        });
    });

    describe('getUserById', () => {
        it('should fetch user by ID', async () => {
            const userId = '123';
            const mockResponse = {
                data: {
                    success: true,
                    data: { _id: userId, username: 'testuser', email: 'test@test.com' }
                }
            };

            api.get.mockResolvedValue(mockResponse);

            const result = await getUserById(userId);

            expect(api.get).toHaveBeenCalledWith(`/users/${userId}`);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('createUser', () => {
        it('should create a new user', async () => {
            const userData = {
                username: 'newuser',
                email: 'newuser@test.com',
                password: 'password123',
                role: 'editor'
            };

            const mockResponse = {
                data: {
                    success: true,
                    data: { _id: '123', ...userData },
                    message: 'User created successfully'
                }
            };

            api.post.mockResolvedValue(mockResponse);

            const result = await createUser(userData);

            expect(api.post).toHaveBeenCalledWith('/users', userData);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('updateUser', () => {
        it('should update a user', async () => {
            const userId = '123';
            const userData = {
                username: 'updateduser',
                email: 'updated@test.com'
            };

            const mockResponse = {
                data: {
                    success: true,
                    data: { _id: userId, ...userData },
                    message: 'User updated successfully'
                }
            };

            api.put.mockResolvedValue(mockResponse);

            const result = await updateUser(userId, userData);

            expect(api.put).toHaveBeenCalledWith(`/users/${userId}`, userData);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('deleteUser', () => {
        it('should delete a user', async () => {
            const userId = '123';
            const mockResponse = {
                data: {
                    success: true,
                    message: 'User deleted successfully'
                }
            };

            api.delete.mockResolvedValue(mockResponse);

            const result = await deleteUser(userId);

            expect(api.delete).toHaveBeenCalledWith(`/users/${userId}`);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('updateUserStatus', () => {
        it('should update user status', async () => {
            const userId = '123';
            const isActive = false;
            const mockResponse = {
                data: {
                    success: true,
                    data: { _id: userId, isActive },
                    message: 'User deactivated successfully'
                }
            };

            api.patch.mockResolvedValue(mockResponse);

            const result = await updateUserStatus(userId, isActive);

            expect(api.patch).toHaveBeenCalledWith(`/users/${userId}/status`, { isActive });
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('getUserRoles', () => {
        it('should return user roles array', () => {
            const roles = getUserRoles();

            expect(roles).toEqual([
                { value: 'admin', label: 'Admin' },
                { value: 'editor', label: 'Editor' },
                { value: 'reader', label: 'Reader' }
            ]);
        });
    });

    describe('getUserStatusOptions', () => {
        it('should return user status options array', () => {
            const statusOptions = getUserStatusOptions();

            expect(statusOptions).toEqual([
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
            ]);
        });
    });
});