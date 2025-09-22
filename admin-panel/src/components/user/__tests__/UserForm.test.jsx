import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UserForm from '../UserForm.jsx';
import * as userService from '../../../services/user.js';

// Mock the user service
vi.mock('../../../services/user.js', () => ({
    createUser: vi.fn(),
    updateUser: vi.fn(),
    getUserRoles: vi.fn(() => [
        { value: 'admin', label: 'Admin' },
        { value: 'editor', label: 'Editor' },
        { value: 'reader', label: 'Reader' }
    ])
}));

describe('UserForm', () => {
    const mockProps = {
        onSave: vi.fn(),
        onCancel: vi.fn()
    };

    const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@test.com',
        role: 'editor',
        isActive: true,
        profile: {
            firstName: 'Test',
            lastName: 'User',
            bio: 'Test bio'
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Create Mode', () => {
        it('should render create form with empty fields', () => {
            render(<UserForm {...mockProps} mode="create" />);

            expect(screen.getByText('Create New User')).toBeInTheDocument();
            expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Username field
            expect(screen.getByDisplayValue('reader')).toBeInTheDocument(); // Default role
            expect(screen.getByText('Create User')).toBeInTheDocument();
        });

        it('should validate required fields on create', async () => {
            render(<UserForm {...mockProps} mode="create" />);

            const submitButton = screen.getByText('Create User');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Username is required')).toBeInTheDocument();
                expect(screen.getByText('Email is required')).toBeInTheDocument();
                expect(screen.getByText('Password is required')).toBeInTheDocument();
            });

            expect(userService.createUser).not.toHaveBeenCalled();
        });

        it('should validate password confirmation', async () => {
            render(<UserForm {...mockProps} mode="create" />);

            fireEvent.change(screen.getByPlaceholderText('Enter username'), {
                target: { value: 'testuser' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
                target: { value: 'test@test.com' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter password'), {
                target: { value: 'password123' }
            });
            fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
                target: { value: 'different' }
            });

            const submitButton = screen.getByText('Create User');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
            });
        });

        it('should create user successfully', async () => {
            const mockResponse = {
                data: { _id: '123', username: 'testuser', email: 'test@test.com' }
            };
            userService.createUser.mockResolvedValue(mockResponse);

            render(<UserForm {...mockProps} mode="create" />);

            // Fill form
            fireEvent.change(screen.getByPlaceholderText('Enter username'), {
                target: { value: 'testuser' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
                target: { value: 'test@test.com' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter password'), {
                target: { value: 'password123' }
            });
            fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
                target: { value: 'password123' }
            });

            const submitButton = screen.getByText('Create User');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(userService.createUser).toHaveBeenCalledWith({
                    username: 'testuser',
                    email: 'test@test.com',
                    password: 'password123',
                    role: 'reader',
                    profile: {
                        firstName: '',
                        lastName: '',
                        bio: ''
                    },
                    isActive: true
                });
            });

            expect(mockProps.onSave).toHaveBeenCalledWith(mockResponse.data);
        });
    });

    describe('Edit Mode', () => {
        it('should render edit form with user data', () => {
            render(<UserForm {...mockProps} user={mockUser} mode="edit" />);

            expect(screen.getByText('Edit User')).toBeInTheDocument();
            expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
            expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
            expect(screen.getByDisplayValue('editor')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
            expect(screen.getByDisplayValue('User')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
            expect(screen.getByText('Update User')).toBeInTheDocument();
        });

        it('should show password as optional in edit mode', () => {
            render(<UserForm {...mockProps} user={mockUser} mode="edit" />);

            expect(screen.getByText('(leave blank to keep current)')).toBeInTheDocument();
        });

        it('should update user successfully', async () => {
            const mockResponse = {
                data: { ...mockUser, username: 'updateduser' }
            };
            userService.updateUser.mockResolvedValue(mockResponse);

            render(<UserForm {...mockProps} user={mockUser} mode="edit" />);

            // Update username
            const usernameInput = screen.getByDisplayValue('testuser');
            fireEvent.change(usernameInput, { target: { value: 'updateduser' } });

            const submitButton = screen.getByText('Update User');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(userService.updateUser).toHaveBeenCalledWith('123', {
                    username: 'updateduser',
                    email: 'test@test.com',
                    role: 'editor',
                    profile: {
                        firstName: 'Test',
                        lastName: 'User',
                        bio: 'Test bio'
                    },
                    isActive: true
                });
            });

            expect(mockProps.onSave).toHaveBeenCalledWith(mockResponse.data);
        });

        it('should include password in update if provided', async () => {
            const mockResponse = { data: mockUser };
            userService.updateUser.mockResolvedValue(mockResponse);

            render(<UserForm {...mockProps} user={mockUser} mode="edit" />);

            // Add password
            fireEvent.change(screen.getByPlaceholderText('Enter password'), {
                target: { value: 'newpassword123' }
            });
            fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
                target: { value: 'newpassword123' }
            });

            const submitButton = screen.getByText('Update User');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(userService.updateUser).toHaveBeenCalledWith('123',
                    expect.objectContaining({
                        password: 'newpassword123'
                    })
                );
            });
        });
    });

    describe('Form Interactions', () => {
        it('should toggle password visibility', () => {
            render(<UserForm {...mockProps} mode="create" />);

            const passwordInput = screen.getByPlaceholderText('Enter password');
            const toggleButton = screen.getAllByRole('button')[0]; // First button is password toggle

            expect(passwordInput.type).toBe('password');

            fireEvent.click(toggleButton);
            expect(passwordInput.type).toBe('text');

            fireEvent.click(toggleButton);
            expect(passwordInput.type).toBe('password');
        });

        it('should handle role selection', () => {
            render(<UserForm {...mockProps} mode="create" />);

            const roleSelect = screen.getByDisplayValue('reader');
            fireEvent.change(roleSelect, { target: { value: 'admin' } });

            expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
        });

        it('should handle status toggle', () => {
            render(<UserForm {...mockProps} mode="create" />);

            const statusCheckbox = screen.getByLabelText('Active User');
            expect(statusCheckbox.checked).toBe(true);

            fireEvent.click(statusCheckbox);
            expect(statusCheckbox.checked).toBe(false);
        });

        it('should handle profile fields', () => {
            render(<UserForm {...mockProps} mode="create" />);

            fireEvent.change(screen.getByPlaceholderText('Enter first name'), {
                target: { value: 'John' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter last name'), {
                target: { value: 'Doe' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter user bio...'), {
                target: { value: 'Software developer' }
            });

            expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Software developer')).toBeInTheDocument();
        });

        it('should call onCancel when cancel button is clicked', () => {
            render(<UserForm {...mockProps} mode="create" />);

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockProps.onCancel).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should display API errors', async () => {
            const error = new Error('API Error');
            error.response = { data: { error: 'Username already exists' } };
            userService.createUser.mockRejectedValue(error);

            render(<UserForm {...mockProps} mode="create" />);

            // Fill and submit form
            fireEvent.change(screen.getByPlaceholderText('Enter username'), {
                target: { value: 'testuser' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
                target: { value: 'test@test.com' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter password'), {
                target: { value: 'password123' }
            });
            fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
                target: { value: 'password123' }
            });

            const submitButton = screen.getByText('Create User');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Username already exists')).toBeInTheDocument();
            });
        });

        it('should validate email format', async () => {
            render(<UserForm {...mockProps} mode="create" />);

            fireEvent.change(screen.getByPlaceholderText('Enter username'), {
                target: { value: 'testuser' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
                target: { value: 'invalid-email' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter password'), {
                target: { value: 'password123' }
            });
            fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
                target: { value: 'password123' }
            });

            const submitButton = screen.getByText('Create User');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
            });
        });

        it('should validate minimum password length', async () => {
            render(<UserForm {...mockProps} mode="create" />);

            fireEvent.change(screen.getByPlaceholderText('Enter username'), {
                target: { value: 'testuser' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
                target: { value: 'test@test.com' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter password'), {
                target: { value: '123' }
            });
            fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
                target: { value: '123' }
            });

            const submitButton = screen.getByText('Create User');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
            });
        });

        it('should validate minimum username length', async () => {
            render(<UserForm {...mockProps} mode="create" />);

            fireEvent.change(screen.getByPlaceholderText('Enter username'), {
                target: { value: 'ab' }
            });

            const submitButton = screen.getByText('Create User');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => {
        it('should show loading state during form submission', async () => {
            userService.createUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            render(<UserForm {...mockProps} mode="create" />);

            // Fill and submit form
            fireEvent.change(screen.getByPlaceholderText('Enter username'), {
                target: { value: 'testuser' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
                target: { value: 'test@test.com' }
            });
            fireEvent.change(screen.getByPlaceholderText('Enter password'), {
                target: { value: 'password123' }
            });
            fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
                target: { value: 'password123' }
            });

            const submitButton = screen.getByText('Create User');
            fireEvent.click(submitButton);

            expect(screen.getByText('Saving...')).toBeInTheDocument();
            expect(submitButton).toBeDisabled();
        });
    });
});