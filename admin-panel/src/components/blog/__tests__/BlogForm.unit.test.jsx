import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlogForm from '../BlogForm.jsx';
import blogService from '../../../services/blog.js';

// Mock the blog service
vi.mock('../../../services/blog.js');

describe('BlogForm Unit Tests', () => {
    const mockOnSave = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Create Mode', () => {
        it('renders create form with empty fields', () => {
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('Create New Blog')).toBeInTheDocument();
            expect(screen.getByLabelText(/title/i)).toHaveValue('');
            expect(screen.getByLabelText(/excerpt/i)).toHaveValue('');
            expect(screen.getByLabelText(/content/i)).toHaveValue('');
            expect(screen.getByLabelText(/category/i)).toHaveValue('');
            expect(screen.getByLabelText(/status/i)).toHaveValue('draft');
            expect(screen.getByLabelText(/mark as featured/i)).not.toBeChecked();
        });

        it('handles basic form input changes', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const titleInput = screen.getByLabelText(/title/i);
            const excerptInput = screen.getByLabelText(/excerpt/i);
            const contentInput = screen.getByLabelText(/content/i);

            await user.type(titleInput, 'Test Blog Title');
            await user.type(excerptInput, 'Test excerpt');
            await user.type(contentInput, 'Test content');

            expect(titleInput).toHaveValue('Test Blog Title');
            expect(excerptInput).toHaveValue('Test excerpt');
            expect(contentInput).toHaveValue('Test content');
        });

        it('generates slug from title', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const titleInput = screen.getByLabelText(/title/i);
            await user.type(titleInput, 'Test Blog Title With Spaces');

            expect(screen.getByText('Slug: test-blog-title-with-spaces')).toBeInTheDocument();
        });

        it('calls onCancel when cancel button is clicked', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            await user.click(cancelButton);

            expect(mockOnCancel).toHaveBeenCalled();
        });
    });

    describe('Edit Mode', () => {
        const mockBlog = {
            _id: '123',
            title: 'Existing Blog',
            excerpt: 'Existing excerpt',
            content: 'Existing content',
            category: 'Technology',
            tags: ['javascript', 'react'],
            status: 'published',
            featured: true,
            coverImage: {
                url: 'https://example.com/image.jpg',
                alt: 'Test image'
            },
            seoMetadata: {
                metaTitle: 'SEO Title',
                metaDescription: 'SEO Description',
                keywords: ['seo', 'blog'],
                ogImage: 'https://example.com/og.jpg'
            }
        };

        it('renders edit form with existing blog data', () => {
            render(
                <BlogForm
                    blog={mockBlog}
                    mode="edit"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('Edit Blog')).toBeInTheDocument();
            expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Blog');
            expect(screen.getByLabelText(/excerpt/i)).toHaveValue('Existing excerpt');
            expect(screen.getByLabelText(/content/i)).toHaveValue('Existing content');
            expect(screen.getByLabelText(/category/i)).toHaveValue('Technology');
            expect(screen.getByLabelText(/status/i)).toHaveValue('published');
            expect(screen.getByLabelText(/mark as featured/i)).toBeChecked();
        });

        it('displays existing tags', () => {
            render(
                <BlogForm
                    blog={mockBlog}
                    mode="edit"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('javascript')).toBeInTheDocument();
            expect(screen.getByText('react')).toBeInTheDocument();
        });
    });

    describe('Form Submission', () => {
        it('submits create form with correct data', async () => {
            const user = userEvent.setup();
            blogService.createBlog.mockResolvedValue({
                success: true,
                data: { _id: '123', title: 'Test Blog' }
            });

            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            // Fill required fields
            await user.type(screen.getByLabelText(/title/i), 'Test Blog');
            await user.type(screen.getByLabelText(/content/i), 'Test content');

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create blog/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(blogService.createBlog).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Test Blog',
                        content: 'Test content',
                        status: 'draft',
                        featured: false
                    })
                );
                expect(mockOnSave).toHaveBeenCalledWith({ _id: '123', title: 'Test Blog' });
            });
        });

        it('handles form submission error', async () => {
            const user = userEvent.setup();
            blogService.createBlog.mockResolvedValue({
                success: false,
                error: 'Failed to create blog'
            });

            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            // Fill required fields
            await user.type(screen.getByLabelText(/title/i), 'Test Blog');
            await user.type(screen.getByLabelText(/content/i), 'Test content');

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create blog/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to create blog')).toBeInTheDocument();
                expect(mockOnSave).not.toHaveBeenCalled();
            });
        });
    });

    describe('Preview Mode', () => {
        it('toggles between edit and preview mode', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const contentTextarea = screen.getByLabelText(/content/i);
            const previewButton = screen.getByRole('button', { name: /show preview/i });

            // Initially in edit mode
            expect(contentTextarea).toBeInTheDocument();

            // Switch to preview mode
            await user.click(previewButton);
            expect(screen.getByRole('button', { name: /hide preview/i })).toBeInTheDocument();
            expect(screen.queryByLabelText(/content/i)).not.toBeInTheDocument();
        });
    });
});