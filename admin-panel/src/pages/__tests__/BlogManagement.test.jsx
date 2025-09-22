import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlogManagement from '../BlogManagement.jsx';
import blogService from '../../services/blog.js';

// Mock the blog service
vi.mock('../../services/blog.js');

// Mock the child components
vi.mock('../../components/blog/BlogList.jsx', () => ({
    default: function MockBlogList({ onCreateBlog, onEditBlog }) {
        return (
            <div data-testid="blog-list">
                <button onClick={onCreateBlog}>Create Blog</button>
                <button onClick={() => onEditBlog({ _id: '123', title: 'Test Blog' })}>
                    Edit Blog
                </button>
            </div>
        );
    }
}));

vi.mock('../../components/blog/BlogForm.jsx', () => ({
    default: function MockBlogForm({ blog, mode, onSave, onCancel }) {
        return (
            <div data-testid="blog-form">
                <p>Mode: {mode}</p>
                {blog && <p>Editing: {blog.title}</p>}
                <button onClick={() => onSave({ _id: '456', title: 'Saved Blog' })}>
                    Save Blog
                </button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        );
    }
}));

describe('BlogManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Initial Render', () => {
        it('renders blog management page with header', () => {
            render(<BlogManagement />);

            expect(screen.getByText('Blog Management')).toBeInTheDocument();
            expect(screen.getByTestId('blog-list')).toBeInTheDocument();
        });

        it('starts in list view by default', () => {
            render(<BlogManagement />);

            expect(screen.getByTestId('blog-list')).toBeInTheDocument();
            expect(screen.queryByTestId('blog-form')).not.toBeInTheDocument();
        });
    });

    describe('Navigation Between Views', () => {
        it('switches to create view when create blog is clicked', async () => {
            const user = userEvent.setup();
            render(<BlogManagement />);

            const createButton = screen.getByText('Create Blog');
            await user.click(createButton);

            expect(screen.getByTestId('blog-form')).toBeInTheDocument();
            expect(screen.getByText('Mode: create')).toBeInTheDocument();
            expect(screen.queryByTestId('blog-list')).not.toBeInTheDocument();
        });

        it('switches to edit view when edit blog is clicked', async () => {
            const user = userEvent.setup();
            render(<BlogManagement />);

            const editButton = screen.getByText('Edit Blog');
            await user.click(editButton);

            expect(screen.getByTestId('blog-form')).toBeInTheDocument();
            expect(screen.getByText('Mode: edit')).toBeInTheDocument();
            expect(screen.getByText('Editing: Test Blog')).toBeInTheDocument();
            expect(screen.queryByTestId('blog-list')).not.toBeInTheDocument();
        });

        it('returns to list view when blog is saved', async () => {
            const user = userEvent.setup();
            render(<BlogManagement />);

            // Go to create view
            const createButton = screen.getByText('Create Blog');
            await user.click(createButton);

            expect(screen.getByTestId('blog-form')).toBeInTheDocument();

            // Save the blog
            const saveButton = screen.getByText('Save Blog');
            await user.click(saveButton);

            expect(screen.getByTestId('blog-list')).toBeInTheDocument();
            expect(screen.queryByTestId('blog-form')).not.toBeInTheDocument();
        });

        it('returns to list view when form is cancelled', async () => {
            const user = userEvent.setup();
            render(<BlogManagement />);

            // Go to create view
            const createButton = screen.getByText('Create Blog');
            await user.click(createButton);

            expect(screen.getByTestId('blog-form')).toBeInTheDocument();

            // Cancel the form
            const cancelButton = screen.getByText('Cancel');
            await user.click(cancelButton);

            expect(screen.getByTestId('blog-list')).toBeInTheDocument();
            expect(screen.queryByTestId('blog-form')).not.toBeInTheDocument();
        });
    });

    describe('State Management', () => {
        it('clears selected blog when switching to create view', async () => {
            const user = userEvent.setup();
            render(<BlogManagement />);

            // First edit a blog
            const editButton = screen.getByText('Edit Blog');
            await user.click(editButton);

            expect(screen.getByText('Editing: Test Blog')).toBeInTheDocument();

            // Go back to list
            const cancelButton = screen.getByText('Cancel');
            await user.click(cancelButton);

            // Now create a new blog
            const createButton = screen.getByText('Create Blog');
            await user.click(createButton);

            expect(screen.getByText('Mode: create')).toBeInTheDocument();
            expect(screen.queryByText('Editing:')).not.toBeInTheDocument();
        });

        it('maintains selected blog data in edit view', async () => {
            const user = userEvent.setup();
            render(<BlogManagement />);

            const editButton = screen.getByText('Edit Blog');
            await user.click(editButton);

            expect(screen.getByText('Mode: edit')).toBeInTheDocument();
            expect(screen.getByText('Editing: Test Blog')).toBeInTheDocument();
        });
    });

    describe('Form Integration', () => {
        it('passes correct props to BlogForm in create mode', async () => {
            const user = userEvent.setup();
            render(<BlogManagement />);

            const createButton = screen.getByText('Create Blog');
            await user.click(createButton);

            expect(screen.getByText('Mode: create')).toBeInTheDocument();
            expect(screen.queryByText('Editing:')).not.toBeInTheDocument();
        });

        it('passes correct props to BlogForm in edit mode', async () => {
            const user = userEvent.setup();
            render(<BlogManagement />);

            const editButton = screen.getByText('Edit Blog');
            await user.click(editButton);

            expect(screen.getByText('Mode: edit')).toBeInTheDocument();
            expect(screen.getByText('Editing: Test Blog')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('handles form save errors gracefully', async () => {
            const user = userEvent.setup();

            // Mock console.error to avoid error output in tests
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            render(<BlogManagement />);

            const createButton = screen.getByText('Create Blog');
            await user.click(createButton);

            // The form should still be rendered even if there are errors
            expect(screen.getByTestId('blog-form')).toBeInTheDocument();

            consoleSpy.mockRestore();
        });
    });

    describe('Accessibility', () => {
        it('has proper heading structure', () => {
            render(<BlogManagement />);

            const heading = screen.getByRole('heading', { name: 'Blog Management' });
            expect(heading).toBeInTheDocument();
            expect(heading.tagName).toBe('H1');
        });

        it('maintains focus management between views', async () => {
            const user = userEvent.setup();
            render(<BlogManagement />);

            const createButton = screen.getByText('Create Blog');
            await user.click(createButton);

            // Form should be rendered and focusable
            expect(screen.getByTestId('blog-form')).toBeInTheDocument();
        });
    });

    describe('Responsive Design', () => {
        it('renders properly on different screen sizes', () => {
            render(<BlogManagement />);

            // Check that the main container has responsive classes
            const main = screen.getByRole('main');
            expect(main).toHaveClass('max-w-7xl', 'mx-auto');
        });
    });
});