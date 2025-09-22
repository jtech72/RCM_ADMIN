import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UserList from '../UserList.jsx';
import * as userService from '../../../services/user.js';

// Mock the user service
vi.mock('../../../services/user.js', () => ({
    getUsers: vi.fn(),
    deleteUser: vi.fn(),
    updateUserStatus: vi.fn(),
    getUserRoles: vi.fn(() => [
        { value: 'admin', label: 'Admin' },
        { value: 'editor', label: 'Editor' },
        { value: 'reader', label: 'Reader' }
    ]),
    getUserStatusOptions: vi.fn(() => [
        { value: '', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
    ])
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
    writable: true,
    value: vi.fn()
});

// Mock window.alert
Object.defineProperty(window, 'alert', {
    writable: true,
    value: vi.fn()
});

describe('UserList', () => {
    const mockUsers = [
        {
            _id: '1',
            username: 'admin',
            email: 'admin@test.com',
            role: 'admin',
            isActive: true,
            createdAt: '2023-01-01T00:00:00.000Z',
            profile: {
                firstName: 'Admin',
                lastName: 'User'
            }
        },
        {
            _id: '2',
            username: 'editor',
            email: 'editor@test.com',
            role: 'editor',
            isActive: false,
            createdAt: '2023-01-02T00:00:00.000Z',
            profile: {}
        }
    ];

    const mockPagination = {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
    };

    const mockProps = {
        onCreateUser: vi.fn(),
        onEditUser: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        userService.getUsers.mockResolvedValue({
            data: mockUsers,
            pagination: mockPagination
        });
    });

    it('should render users list', async () => {
        render(<UserList {...mockProps} />);

        // Wait for loading to complete
        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        // Check if users are displayed
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
        expect(screen.getByText('editor@test.com')).toBeInTheDocument();
        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.getByText('editor')).toBeInTheDocument(); // Falls back to username
    });

    it('should display loading state initially', () => {
        render(<UserList {...mockProps} />);
        expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should handle create user button click', async () => {
        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        const createButton = screen.getByText('Create User');
        fireEvent.click(createButton);

        expect(mockProps.onCreateUser).toHaveBeenCalled();
    });

    it('should handle edit user button click', async () => {
        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);

        expect(mockProps.onEditUser).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should handle search functionality', async () => {
        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search users...');
        fireEvent.change(searchInput, { target: { value: 'admin' } });

        const searchButton = screen.getByText('Search');
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(userService.getUsers).toHaveBeenCalledWith(
                expect.objectContaining({
                    search: 'admin'
                })
            );
        });
    });

    it('should handle role filter', async () => {
        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        const roleSelect = screen.getByDisplayValue('All Roles');
        fireEvent.change(roleSelect, { target: { value: 'admin' } });

        await waitFor(() => {
            expect(userService.getUsers).toHaveBeenCalledWith(
                expect.objectContaining({
                    role: 'admin'
                })
            );
        });
    });

    it('should handle status filter', async () => {
        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        const statusSelect = screen.getByDisplayValue('All Status');
        fireEvent.change(statusSelect, { target: { value: 'active' } });

        await waitFor(() => {
            expect(userService.getUsers).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'active'
                })
            );
        });
    });

    it('should handle user deletion with confirmation', async () => {
        window.confirm.mockReturnValue(true);
        userService.deleteUser.mockResolvedValue({ success: true });

        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalledWith(
            'Are you sure you want to delete user "admin"? This action cannot be undone.'
        );

        await waitFor(() => {
            expect(userService.deleteUser).toHaveBeenCalledWith('1');
        });
    });

    it('should not delete user if confirmation is cancelled', async () => {
        window.confirm.mockReturnValue(false);

        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalled();
        expect(userService.deleteUser).not.toHaveBeenCalled();
    });

    it('should handle user status toggle', async () => {
        userService.updateUserStatus.mockResolvedValue({ success: true });

        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        // Click deactivate for active user
        const deactivateButton = screen.getByText('Deactivate');
        fireEvent.click(deactivateButton);

        await waitFor(() => {
            expect(userService.updateUserStatus).toHaveBeenCalledWith('1', false);
        });

        // Click activate for inactive user
        const activateButton = screen.getByText('Activate');
        fireEvent.click(activateButton);

        await waitFor(() => {
            expect(userService.updateUserStatus).toHaveBeenCalledWith('2', true);
        });
    });

    it('should display role badges with correct colors', async () => {
        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        const adminBadge = screen.getByText('admin');
        const editorBadge = screen.getByText('editor');

        expect(adminBadge).toHaveClass('bg-red-100', 'text-red-800');
        expect(editorBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should display status badges with correct colors', async () => {
        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        const activeBadge = screen.getByText('Active');
        const inactiveBadge = screen.getByText('Inactive');

        expect(activeBadge).toHaveClass('bg-green-100', 'text-green-800');
        expect(inactiveBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should handle pagination', async () => {
        const multiPagePagination = { ...mockPagination, pages: 3 };
        userService.getUsers.mockResolvedValue({
            data: mockUsers,
            pagination: multiPagePagination
        });

        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading')).not.toBeInTheDocument();
        });

        // Check if pagination is displayed
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        // Click on page 2
        fireEvent.click(screen.getByText('2'));

        await waitFor(() => {
            expect(userService.getUsers).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 2
                })
            );
        });
    });

    it('should display empty state when no users found', async () => {
        userService.getUsers.mockResolvedValue({
            data: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 }
        });

        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('No users found')).toBeInTheDocument();
        });
    });

    it('should handle API errors', async () => {
        const error = new Error('API Error');
        error.response = { data: { error: 'Failed to load users' } };
        userService.getUsers.mockRejectedValue(error);

        render(<UserList {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load users')).toBeInTheDocument();
        });
    });
});