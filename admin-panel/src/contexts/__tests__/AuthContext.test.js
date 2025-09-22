import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import authService from '../../services/auth';

// Mock the auth service
vi.mock('../../services/auth', () => ({
    default: {
        login: vi.fn(),
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
        getToken: vi.fn(),
        isAuthenticated: vi.fn(),
        isAdmin: vi.fn(),
        canEdit: vi.fn(),
        verifyToken: vi.fn(),
    }
}));

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should provide initial state', () => {
        authService.isAuthenticated.mockReturnValue(false);
        authService.verifyToken.mockResolvedValue(false);

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });

        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should handle successful login', async () => {
        const mockUser = { id: '1', email: 'admin@test.com', role: 'admin' };
        const mockToken = 'mock-jwt-token';

        authService.isAuthenticated.mockReturnValue(false);
        authService.verifyToken.mockResolvedValue(false);
        authService.login.mockResolvedValue({ token: mockToken, user: mockUser });

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });

        await act(async () => {
            const loginResult = await result.current.login({
                email: 'admin@test.com',
                password: 'password123'
            });
            expect(loginResult.success).toBe(true);
        });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe(mockToken);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('should handle login failure', async () => {
        const errorMessage = 'Invalid credentials';

        authService.isAuthenticated.mockReturnValue(false);
        authService.verifyToken.mockResolvedValue(false);
        authService.login.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });

        await act(async () => {
            const loginResult = await result.current.login({
                email: 'wrong@test.com',
                password: 'wrongpassword'
            });
            expect(loginResult.success).toBe(false);
            expect(loginResult.error).toBe(errorMessage);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBe(errorMessage);
    });

    it('should handle logout', async () => {
        const mockUser = { id: '1', email: 'admin@test.com', role: 'admin' };
        const mockToken = 'mock-jwt-token';

        authService.isAuthenticated.mockReturnValue(false);
        authService.verifyToken.mockResolvedValue(false);
        authService.login.mockResolvedValue({ token: mockToken, user: mockUser });

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });

        // First login
        await act(async () => {
            await result.current.login({
                email: 'admin@test.com',
                password: 'password123'
            });
        });

        // Then logout
        act(() => {
            result.current.logout();
        });

        expect(authService.logout).toHaveBeenCalled();
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should clear error', async () => {
        authService.isAuthenticated.mockReturnValue(false);
        authService.verifyToken.mockResolvedValue(false);
        authService.login.mockRejectedValue(new Error('Test error'));

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });

        // Cause an error
        await act(async () => {
            await result.current.login({
                email: 'wrong@test.com',
                password: 'wrongpassword'
            });
        });

        expect(result.current.error).toBe('Test error');

        // Clear error
        act(() => {
            result.current.clearError();
        });

        expect(result.current.error).toBeNull();
    });

    it('should initialize with existing authentication', async () => {
        const mockUser = { id: '1', email: 'admin@test.com', role: 'admin' };
        const mockToken = 'existing-token';

        authService.isAuthenticated.mockReturnValue(true);
        authService.verifyToken.mockResolvedValue(true);
        authService.getCurrentUser.mockReturnValue(mockUser);
        authService.getToken.mockReturnValue(mockToken);

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe(mockToken);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle invalid existing token', async () => {
        authService.isAuthenticated.mockReturnValue(true);
        authService.verifyToken.mockResolvedValue(false);

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('should provide role checking functions', () => {
        authService.isAuthenticated.mockReturnValue(false);
        authService.verifyToken.mockResolvedValue(false);
        authService.isAdmin.mockReturnValue(true);
        authService.canEdit.mockReturnValue(true);

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });

        expect(result.current.isAdmin()).toBe(true);
        expect(result.current.canEdit()).toBe(true);
        expect(authService.isAdmin).toHaveBeenCalled();
        expect(authService.canEdit).toHaveBeenCalled();
    });

    it('should throw error when used outside provider', () => {
        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within an AuthProvider');
    });
});