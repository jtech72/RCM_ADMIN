import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UserManagement from '../UserManagement.jsx';

// Mock the child components
vi.mock('../../components/user/UserList.jsx', () => ({
    default: ({ onCreateUser, onEditUser }) => (
        <div data-testid="user-list">
            <button onClick={onCreateUser}>Create User</button>
            <button onClick={() => onEditUser({ _id: '123', username: 'testuser' })}>
                Edit User
            </button>
        </div>
    )
}));

vi.mock('../../components/user/UserForm.jsx', () => ({
    default: ({ user, mode, onSave, onCancel }) => (
        <div data-testid="user-form">
            <div>Mode: {mode}</div>
            {user && <div>Editing: {user.username}</div>}
            <button onClick={() => onSave({ _id: '123', username: 'saved' })}>
                Save
            </button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    )
}));

describe('UserManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render page header', () => {
        render(<UserManagement />);

        expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('should show user list by default', () => {
        render(<UserManagement />);

        expect(screen.getByTestId('user-list')).toBeInTheDocument();
        expect(screen.queryByTestId('user-form')).not.toBeInTheDocument();
    });

    it('should switch to create view when create user is clicked', () => {
        render(<UserManagement />);

        const createButton = screen.getByText('Create User');
        fireEvent.click(createButton);

        expect(screen.getByTestId('user-form')).toBeInTheDocument();
        expect(screen.getByText('Mode: create')).toBeInTheDocument();
        expect(screen.queryByTestId('user-list')).not.toBeInTheDocument();
    });

    it('should switch to edit view when edit user is clicked', () => {
        render(<UserManagement />);

        const editButton = screen.getByText('Edit User');
        fireEvent.click(editButton);

        expect(screen.getByTestId('user-form')).toBeInTheDocument();
        expect(screen.getByText('Mode: edit')).toBeInTheDocument();
        expect(screen.getByText('Editing: testuser')).toBeInTheDocument();
        expect(screen.queryByTestId('user-list')).not.toBeInTheDocument();
    });

    it('should return to list view after saving user', () => {
        render(<UserManagement />);

        // Go to create view
        const createButton = screen.getByText('Create User');
        fireEvent.click(createButton);

        expect(screen.getByTestId('user-form')).toBeInTheDocument();

        // Save user
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        expect(screen.getByTestId('user-list')).toBeInTheDocument();
        expect(screen.queryByTestId('user-form')).not.toBeInTheDocument();
    });

    it('should return to list view when cancel is clicked', () => {
        render(<UserManagement />);

        // Go to create view
        const createButton = screen.getByText('Create User');
        fireEvent.click(createButton);

        expect(screen.getByTestId('user-form')).toBeInTheDocument();

        // Cancel form
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(screen.getByTestId('user-list')).toBeInTheDocument();
        expect(screen.queryByTestId('user-form')).not.toBeInTheDocument();
    });

    it('should handle view state transitions correctly', () => {
        render(<UserManagement />);

        // Start with list view
        expect(screen.getByTestId('user-list')).toBeInTheDocument();

        // Go to create view
        fireEvent.click(screen.getByText('Create User'));
        expect(screen.getByTestId('user-form')).toBeInTheDocument();
        expect(screen.getByText('Mode: create')).toBeInTheDocument();

        // Cancel and go back to list
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.getByTestId('user-list')).toBeInTheDocument();

        // Go to edit view
        fireEvent.click(screen.getByText('Edit User'));
        expect(screen.getByTestId('user-form')).toBeInTheDocument();
        expect(screen.getByText('Mode: edit')).toBeInTheDocument();

        // Save and go back to list
        fireEvent.click(screen.getByText('Save'));
        expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    it('should clear selected user when switching to create mode', () => {
        render(<UserManagement />);

        // Go to edit view first
        fireEvent.click(screen.getByText('Edit User'));
        expect(screen.getByText('Editing: testuser')).toBeInTheDocument();

        // Cancel to go back to list
        fireEvent.click(screen.getByText('Cancel'));

        // Go to create view
        fireEvent.click(screen.getByText('Create User'));
        expect(screen.getByText('Mode: create')).toBeInTheDocument();
        expect(screen.queryByText('Editing:')).not.toBeInTheDocument();
    });

    it('should maintain responsive layout structure', () => {
        render(<UserManagement />);

        // Check for main layout classes
        const mainContainer = screen.getByRole('main');
        expect(mainContainer).toHaveClass('max-w-7xl', 'mx-auto', 'py-6');

        // Check for header structure
        const header = screen.getByRole('banner');
        expect(header).toHaveClass('bg-white', 'shadow');
    });
});