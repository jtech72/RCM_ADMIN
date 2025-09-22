/**
 * End-to-End Test Suite for Admin Panel
 * Tests critical user journeys and workflows
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';

// Mock API services
vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
    }
}));

vi.mock('../services/auth', () => ({
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
}));

vi.mock('../services/blog', () => ({
    getBlogs: vi.fn(),
    createBlog: vi.fn(),
    updateBlog: vi.fn(),
    deleteBlog: vi.fn(),
}));

vi.mock('../services/user', () => ({
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
}));

vi.mock('../services/analytics', () => ({
    getOverview: vi.fn(),
    getPopularBlogs: vi.fn(),
    getEngagementData: vi.fn(),
}));

const renderWithProviders = (component) => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                {component}
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('Admin Panel E2E Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('Authentication Flow', () => {
        test('should complete login to dashboard workflow', async () => {
            const mockUser = {
                id: '1',
                username: 'admin',
                email: 'admin@test.com',
                role: 'admin'
            };

            const authService = await import('../services/auth');
            authService.login.mockResolvedValue({
                user: mockUser,
                token: 'mock-token'
            });
            authService.isAuthenticated.mockReturnValue(true);
            authService.getCurrentUser.mockReturnValue(mockUser);

            renderWithProviders(<App />);

            // Should show login form initially
            expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();

            // Fill login form
            fireEvent.change(screen.getByLabelText(/email/i), {
                target: { value: 'admin@test.com' }
            });
            fireEvent.change(screen.getByLabelText(/password/i), {
                target: { value: 'password123' }
            });

            // Submit login
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

            // Should redirect to dashboard
            await waitFor(() => {
                expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
            });
        });

        test('should handle logout workflow', async () => {
            const authService = await import('../services/auth');
            authService.isAuthenticated.mockReturnValue(true);
            authService.getCurrentUser.mockReturnValue({
                id: '1',
                username: 'admin',
                role: 'admin'
            });
            authService.logout.mockResolvedValue();

            renderWithProviders(<App />);

            // Should be on dashboard
            await waitFor(() => {
                expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
            });

            // Click logout
            const logoutButton = screen.getByRole('button', { name: /logout/i });
            fireEvent.click(logoutButton);

            // Should redirect to login
            await waitFor(() => {
                expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
            });
        });
    });

    describe('Blog Management Workflow', () => {
        beforeEach(() => {
            const authService = require('../services/auth');
            authService.isAuthenticated.mockReturnValue(true);
            authService.getCurrentUser.mockReturnValue({
                id: '1',
                username: 'admin',
                role: 'admin'
            });
        });

        test('should complete create blog workflow', async () => {
            const blogService = await import('../services/blog');
            blogService.getBlogs.mockResolvedValue({
                data: [],
                pagination: { page: 1, limit: 10, total: 0, pages: 0 }
            });
            blogService.createBlog.mockResolvedValue({
                id: '1',
                title: 'Test Blog',
                content: '<p>Test content</p>',
                status: 'draft'
            });

            renderWithProviders(<App />);

            // Navigate to blog management
            await waitFor(() => {
                const blogLink = screen.getByText(/blogs/i);
                fireEvent.click(blogLink);
            });

            // Click create blog
            await waitFor(() => {
                const createButton = screen.getByText(/create blog/i);
                fireEvent.click(createButton);
            });

            // Fill blog form
            await waitFor(() => {
                fireEvent.change(screen.getByLabelText(/title/i), {
                    target: { value: 'Test Blog' }
                });
                fireEvent.change(screen.getByLabelText(/excerpt/i), {
                    target: { value: 'Test excerpt' }
                });
                fireEvent.change(screen.getByLabelText(/category/i), {
                    target: { value: 'Technology' }
                });
            });

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create blog/i });
            fireEvent.click(submitButton);

            // Should show success message
            await waitFor(() => {
                expect(blogService.createBlog).toHaveBeenCalled();
            });
        });

        test('should complete edit blog workflow', async () => {
            const mockBlog = {
                id: '1',
                title: 'Existing Blog',
                content: '<p>Existing content</p>',
                excerpt: 'Existing excerpt',
                category: 'Technology',
                status: 'published'
            };

            const blogService = await import('../services/blog');
            blogService.getBlogs.mockResolvedValue({
                data: [mockBlog],
                pagination: { page: 1, limit: 10, total: 1, pages: 1 }
            });
            blogService.updateBlog.mockResolvedValue({
                ...mockBlog,
                title: 'Updated Blog'
            });

            renderWithProviders(<App />);

            // Navigate to blog management
            await waitFor(() => {
                const blogLink = screen.getByText(/blogs/i);
                fireEvent.click(blogLink);
            });

            // Click edit on first blog
            await waitFor(() => {
                const editButton = screen.getByText(/edit/i);
                fireEvent.click(editButton);
            });

            // Update title
            await waitFor(() => {
                const titleInput = screen.getByDisplayValue('Existing Blog');
                fireEvent.change(titleInput, {
                    target: { value: 'Updated Blog' }
                });
            });

            // Submit form
            const submitButton = screen.getByRole('button', { name: /update blog/i });
            fireEvent.click(submitButton);

            // Should call update API
            await waitFor(() => {
                expect(blogService.updateBlog).toHaveBeenCalledWith('1', expect.objectContaining({
                    title: 'Updated Blog'
                }));
            });
        });
    });

    describe('User Management Workflow', () => {
        beforeEach(() => {
            const authService = require('../services/auth');
            authService.isAuthenticated.mockReturnValue(true);
            authService.getCurrentUser.mockReturnValue({
                id: '1',
                username: 'admin',
                role: 'admin'
            });
        });

        test('should complete create user workflow', async () => {
            const userService = await import('../services/user');
            userService.getUsers.mockResolvedValue({
                data: [],
                pagination: { page: 1, limit: 10, total: 0, pages: 0 }
            });
            userService.createUser.mockResolvedValue({
                id: '2',
                username: 'newuser',
                email: 'newuser@test.com',
                role: 'editor'
            });

            renderWithProviders(<App />);

            // Navigate to user management
            await waitFor(() => {
                const userLink = screen.getByText(/users/i);
                fireEvent.click(userLink);
            });

            // Click create user
            await waitFor(() => {
                const createButton = screen.getByText(/create user/i);
                fireEvent.click(createButton);
            });

            // Fill user form
            await waitFor(() => {
                fireEvent.change(screen.getByLabelText(/username/i), {
                    target: { value: 'newuser' }
                });
                fireEvent.change(screen.getByLabelText(/email/i), {
                    target: { value: 'newuser@test.com' }
                });
                fireEvent.change(screen.getByLabelText(/password/i), {
                    target: { value: 'password123' }
                });
                fireEvent.change(screen.getByLabelText(/role/i), {
                    target: { value: 'editor' }
                });
            });

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create user/i });
            fireEvent.click(submitButton);

            // Should call create API
            await waitFor(() => {
                expect(userService.createUser).toHaveBeenCalled();
            });
        });
    });

    describe('Analytics Dashboard Workflow', () => {
        beforeEach(() => {
            const authService = require('../services/auth');
            authService.isAuthenticated.mockReturnValue(true);
            authService.getCurrentUser.mockReturnValue({
                id: '1',
                username: 'admin',
                role: 'admin'
            });
        });

        test('should load and display analytics data', async () => {
            const analyticsService = await import('../services/analytics');
            analyticsService.getOverview.mockResolvedValue({
                totalBlogs: 25,
                totalViews: 1500,
                totalLikes: 300,
                totalUsers: 10
            });
            analyticsService.getPopularBlogs.mockResolvedValue([
                { id: '1', title: 'Popular Blog 1', views: 500 },
                { id: '2', title: 'Popular Blog 2', views: 400 }
            ]);

            renderWithProviders(<App />);

            // Navigate to analytics
            await waitFor(() => {
                const analyticsLink = screen.getByText(/analytics/i);
                fireEvent.click(analyticsLink);
            });

            // Should display analytics data
            await waitFor(() => {
                expect(screen.getByText('25')).toBeInTheDocument(); // Total blogs
                expect(screen.getByText('1500')).toBeInTheDocument(); // Total views
                expect(screen.getByText('Popular Blog 1')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            const authService = require('../services/auth');
            authService.isAuthenticated.mockReturnValue(true);
            authService.getCurrentUser.mockReturnValue({
                id: '1',
                username: 'admin',
                role: 'admin'
            });
        });

        test('should handle API errors gracefully', async () => {
            const blogService = await import('../services/blog');
            blogService.getBlogs.mockRejectedValue(new Error('API Error'));

            renderWithProviders(<App />);

            // Navigate to blog management
            await waitFor(() => {
                const blogLink = screen.getByText(/blogs/i);
                fireEvent.click(blogLink);
            });

            // Should show error message
            await waitFor(() => {
                expect(screen.getByText(/error/i)).toBeInTheDocument();
            });
        });

        test('should handle network errors', async () => {
            const authService = await import('../services/auth');
            authService.login.mockRejectedValue(new Error('Network Error'));

            renderWithProviders(<App />);

            // Fill login form
            fireEvent.change(screen.getByLabelText(/email/i), {
                target: { value: 'admin@test.com' }
            });
            fireEvent.change(screen.getByLabelText(/password/i), {
                target: { value: 'password123' }
            });

            // Submit login
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

            // Should show error message
            await waitFor(() => {
                expect(screen.getByText(/error/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            const authService = require('../services/auth');
            authService.isAuthenticated.mockReturnValue(true);
            authService.getCurrentUser.mockReturnValue({
                id: '1',
                username: 'admin',
                role: 'admin'
            });
        });

        test('should have proper ARIA labels and roles', async () => {
            renderWithProviders(<App />);

            await waitFor(() => {
                // Check for proper navigation structure
                expect(screen.getByRole('navigation')).toBeInTheDocument();

                // Check for proper button labels
                const buttons = screen.getAllByRole('button');
                buttons.forEach(button => {
                    expect(button).toHaveAttribute('aria-label');
                });

                // Check for proper form labels
                const inputs = screen.getAllByRole('textbox');
                inputs.forEach(input => {
                    expect(input).toHaveAccessibleName();
                });
            });
        });

        test('should support keyboard navigation', async () => {
            renderWithProviders(<App />);

            await waitFor(() => {
                const firstButton = screen.getAllByRole('button')[0];
                firstButton.focus();
                expect(document.activeElement).toBe(firstButton);

                // Test tab navigation
                fireEvent.keyDown(firstButton, { key: 'Tab' });
                expect(document.activeElement).not.toBe(firstButton);
            });
        });
    });
});