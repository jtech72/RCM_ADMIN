import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlogList from '../BlogList.jsx';
import blogService from '../../../services/blog.js';

// Mock the blog service
vi.mock('../../../services/blog.js');

// Mock window.confirm
global.confirm = vi.fn();

describe('BlogList', () => {
    const mockOnCreateBlog = vi.fn();
    const mockOnEditBlog = vi.fn();

    const mockBlogs = [
        {
            _id: '1',
            title: 'First Blog',
            excerpt: 'First blog excerpt',
            status: 'published',
            featured: true,
            author: { username: 'john_doe' },
            viewCount: 100,
            likeCount: 10,
            tags: ['javascript', 'react'],
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-02T00:00:00.000Z',
            coverImage: { url: 'https://example.com/image1.jpg' }
        },
        {
            _id: '2',
            title: 'Second Blog',
            excerpt: 'Second blog excerpt',
            status: 'draft',
            featured: false,
            author: { username: 'jane_doe' },
            viewCount: 50,
            likeCount: 5,
            tags: ['nodejs'],
            createdAt: '2023-01-03T00:00:00.000Z',
            updatedAt: '2023-01-03T00:00:00.000Z'
        }
    ];

    const mockPagination = {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
    };

    beforeEach(() => {
        vi.clearAllMocks();
        blogService.getBlogs.mockResolvedValue({
            success: true,
            data: mockBlogs,
            pagination: mockPagination
        });
    });

    describe('Initial Render', () => {
        it('renders blog list with header and create button', async () => {
            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            expect(screen.getByText('Blog Management')).toBeInTheDocument();
            expect(screen.getByText('Manage your blog posts')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /create blog/i })).toBeInTheDocument();

            await waitFor(() => {
                expect(blogService.getBlogs).toHaveBeenCalled();
            });
        });

        it('displays loading state initially', () => {
            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
        });

        it('displays blogs after loading', async () => {
            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('First Blog')).toBeInTheDocument();
                expect(screen.getByText('Second Blog')).toBeInTheDocument();
            });
        });
    });

    describe('Blog Display', () => {
        it('displays blog information correctly', async () => {
            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                // Check first blog
                expect(screen.getByText('First Blog')).toBeInTheDocument();
                expect(screen.getByText('First blog excerpt')).toBeInTheDocument();
                expect(screen.getByText('john_doe')).toBeInTheDocument();
                expect(screen.getByText('100 views')).toBeInTheDocument();
                expect(screen.getByText('10 likes')).toBeInTheDocument();
                expect(screen.getByText('javascript, react')).toBeInTheDocument();

                // Check second blog
                expect(screen.getByText('Second Blog')).toBeInTheDocument();
                expect(screen.getByText('jane_doe')).toBeInTheDocument();
            });
        });

        it('displays cover images when available', async () => {
            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                const coverImage = screen.getByAltText('First Blog');
                expect(coverImage).toBeInTheDocument();
                expect(coverImage).toHaveAttribute('src', 'https://example.com/image1.jpg');
            });
        });

        it('shows featured star for featured blogs', async () => {
            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                // First blog is featured, should have filled star
                const featuredStars = screen.getAllByTitle(/featured/i);
                expect(featuredStars.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Search and Filters', () => {
        it('handles search input', async () => {
            const user = userEvent.setup();
            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            const searchInput = screen.getByPlaceholderText('Search blogs...');
            const searchButton = screen.getByRole('button', { name: /search/i });

            await user.type(searchInput, 'test search');
            await user.click(searchButton);

            await waitFor(() => {
                expect(blogService.getBlogs).toHaveBeenCalledWith(
                    expect.objectContaining({
                        search: 'test search'
                    })
                );
            });
        });

        it('toggles filter panel', async () => {
            const user = userEvent.setup();
            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            const filtersButton = screen.getByRole('button', { name: /filters/i });
            await user.click(filtersButton);

            expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/featured/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
        });

        it('applies status filter', async () => {
            const user = userEvent.setup();
            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            // Open filters
            const filtersButton = screen.getByRole('button', { name: /filters/i });
            await user.click(filtersButton);

            // Select published status
            const statusSelect = screen.getByLabelText(/status/i);
            await user.selectOptions(statusSelect, 'published');

            await waitFor(() => {
                expect(blogService.getBlogs).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: 'published'
                    })
                );
            });
        });
    });

    describe('Blog Actions', () => {
        it('calls onCreateBlog when create button is clicked', async () => {
            const user = userEvent.setup();
            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            const createButton = screen.getByRole('button', { name: /create blog/i });
            await user.click(createButton);

            expect(mockOnCreateBlog).toHaveBeenCalled();
        });

        it('calls onEditBlog when edit button is clicked', async () => {
            const user = userEvent.setup();
            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                const editButtons = screen.getAllByTitle('Edit blog');
                expect(editButtons).toHaveLength(2);
            });

            const editButtons = screen.getAllByTitle('Edit blog');
            await user.click(editButtons[0]);

            expect(mockOnEditBlog).toHaveBeenCalledWith(mockBlogs[0]);
        });

        it('handles status change', async () => {
            const user = userEvent.setup();
            blogService.updateBlog.mockResolvedValue({ success: true });

            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                const statusSelects = screen.getAllByDisplayValue('published');
                expect(statusSelects).toHaveLength(1);
            });

            const statusSelect = screen.getAllByDisplayValue('published')[0];
            await user.selectOptions(statusSelect, 'draft');

            await waitFor(() => {
                expect(blogService.updateBlog).toHaveBeenCalledWith('1', { status: 'draft' });
            });
        });

        it('handles featured toggle', async () => {
            const user = userEvent.setup();
            blogService.getBlog.mockResolvedValue({
                success: true,
                data: mockBlogs[0]
            });
            blogService.updateBlog.mockResolvedValue({ success: true });

            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                const featuredButtons = screen.getAllByTitle(/featured/i);
                expect(featuredButtons.length).toBeGreaterThan(0);
            });

            const featuredButton = screen.getAllByTitle(/remove from featured/i)[0];
            await user.click(featuredButton);

            await waitFor(() => {
                expect(blogService.toggleFeatured).toHaveBeenCalledWith('1');
            });
        });

        it('handles blog deletion with confirmation', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(true);
            blogService.deleteBlog.mockResolvedValue({ success: true });

            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                const deleteButtons = screen.getAllByTitle('Delete blog');
                expect(deleteButtons).toHaveLength(2);
            });

            const deleteButton = screen.getAllByTitle('Delete blog')[0];
            await user.click(deleteButton);

            expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete "First Blog"?');

            await waitFor(() => {
                expect(blogService.deleteBlog).toHaveBeenCalledWith('1');
            });
        });

        it('cancels blog deletion when not confirmed', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(false);

            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                const deleteButtons = screen.getAllByTitle('Delete blog');
                expect(deleteButtons).toHaveLength(2);
            });

            const deleteButton = screen.getAllByTitle('Delete blog')[0];
            await user.click(deleteButton);

            expect(global.confirm).toHaveBeenCalled();
            expect(blogService.deleteBlog).not.toHaveBeenCalled();
        });
    });

    describe('Pagination', () => {
        it('displays pagination when multiple pages exist', async () => {
            blogService.getBlogs.mockResolvedValue({
                success: true,
                data: mockBlogs,
                pagination: { ...mockPagination, pages: 3, total: 30 }
            });

            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Showing 1 to 2 of 30 results')).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
            });
        });

        it('handles page navigation', async () => {
            const user = userEvent.setup();
            blogService.getBlogs.mockResolvedValue({
                success: true,
                data: mockBlogs,
                pagination: { ...mockPagination, pages: 3, total: 30 }
            });

            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).toBeInTheDocument();
            });

            const nextButton = screen.getByRole('button', { name: /next/i });
            await user.click(nextButton);

            await waitFor(() => {
                expect(blogService.getBlogs).toHaveBeenCalledWith(
                    expect.objectContaining({
                        page: 2
                    })
                );
            });
        });
    });

    describe('Error Handling', () => {
        it('displays error message when loading fails', async () => {
            blogService.getBlogs.mockResolvedValue({
                success: false,
                error: 'Failed to load blogs'
            });

            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Failed to load blogs')).toBeInTheDocument();
            });
        });

        it('displays no blogs message when list is empty', async () => {
            blogService.getBlogs.mockResolvedValue({
                success: true,
                data: [],
                pagination: { ...mockPagination, total: 0 }
            });

            render(
                <BlogList
                    onCreateBlog={mockOnCreateBlog}
                    onEditBlog={mockOnEditBlog}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('No blogs found')).toBeInTheDocument();
            });
        });
    });
});