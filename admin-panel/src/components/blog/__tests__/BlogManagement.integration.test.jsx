import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlogManagement from '../../../pages/BlogManagement.jsx';
import blogService from '../../../services/blog.js';

// Mock the blog service
vi.mock('../../../services/blog.js');

describe('BlogManagement Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock successful blog service responses
        blogService.getBlogs.mockResolvedValue({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 }
        });
    });

    describe('Basic Functionality', () => {
        it('renders blog management page', async () => {
            render(<BlogManagement />);

            expect(screen.getByText('Blog Management')).toBeInTheDocument();

            // Wait for the blog list to load
            await waitFor(() => {
                expect(blogService.getBlogs).toHaveBeenCalled();
            });
        });

        it('shows create blog button', async () => {
            render(<BlogManagement />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /create blog/i })).toBeInTheDocument();
            });
        });

        it('displays no blogs message when list is empty', async () => {
            render(<BlogManagement />);

            await waitFor(() => {
                expect(screen.getByText('No blogs found')).toBeInTheDocument();
            });
        });
    });

    describe('Navigation', () => {
        it('switches to create form when create button is clicked', async () => {
            const user = userEvent.setup();
            render(<BlogManagement />);

            // Wait for initial load
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /create blog/i })).toBeInTheDocument();
            });

            const createButton = screen.getByRole('button', { name: /create blog/i });
            await user.click(createButton);

            // Should show the form
            expect(screen.getByText('Create New Blog')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('handles blog loading errors', async () => {
            blogService.getBlogs.mockResolvedValue({
                success: false,
                error: 'Failed to load blogs'
            });

            render(<BlogManagement />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load blogs')).toBeInTheDocument();
            });
        });
    });
});