import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlogForm from '../BlogForm.jsx';
import blogService from '../../../services/blog.js';

// Mock the blog service
vi.mock('../../../services/blog.js');

describe('BlogForm Metadata Management Tests', () => {
    const mockOnSave = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('SEO Metadata Fields', () => {
        it('renders all SEO metadata fields', () => {
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('SEO Metadata')).toBeInTheDocument();
            expect(screen.getByLabelText(/meta title/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/meta description/i)).toBeInTheDocument();
            expect(screen.getByText('SEO Keywords')).toBeInTheDocument();
            expect(screen.getByText('Open Graph Image')).toBeInTheDocument();
        });

        it('auto-generates meta title from blog title', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const titleInput = screen.getByLabelText(/^title/i);
            const metaTitleInput = screen.getByLabelText(/meta title/i);

            await user.type(titleInput, 'My Amazing Blog Post');

            await waitFor(() => {
                expect(metaTitleInput).toHaveValue('My Amazing Blog Post');
            });
        });

        it('does not override existing meta title', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const titleInput = screen.getByLabelText(/^title/i);
            const metaTitleInput = screen.getByLabelText(/meta title/i);

            // Set custom meta title first
            await user.type(metaTitleInput, 'Custom SEO Title');
            await user.type(titleInput, 'My Amazing Blog Post');

            expect(metaTitleInput).toHaveValue('Custom SEO Title');
        });

        it('handles meta description input', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const metaDescInput = screen.getByLabelText(/meta description/i);
            await user.type(metaDescInput, 'This is a comprehensive meta description for SEO purposes');

            expect(metaDescInput).toHaveValue('This is a comprehensive meta description for SEO purposes');
        });
    });

    describe('SEO Keywords Management', () => {
        it('adds SEO keywords', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const keywordInput = screen.getByPlaceholderText(/add an seo keyword/i);
            const addButton = screen.getByRole('button', { name: /add/i });

            await user.type(keywordInput, 'javascript');
            await user.click(addButton);

            expect(screen.getByText('javascript')).toBeInTheDocument();
            expect(keywordInput).toHaveValue('');
        });

        it('adds keyword on Enter key press', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const keywordInput = screen.getByPlaceholderText(/add an seo keyword/i);

            await user.type(keywordInput, 'react');
            await user.keyboard('{Enter}');

            expect(screen.getByText('react')).toBeInTheDocument();
            expect(keywordInput).toHaveValue('');
        });

        it('prevents duplicate keywords', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const keywordInput = screen.getByPlaceholderText(/add an seo keyword/i);
            const addButton = screen.getByRole('button', { name: /add/i });

            // Add first keyword
            await user.type(keywordInput, 'javascript');
            await user.click(addButton);

            // Try to add same keyword again
            await user.type(keywordInput, 'javascript');
            await user.click(addButton);

            // Should only have one instance
            const keywordElements = screen.getAllByText('javascript');
            expect(keywordElements).toHaveLength(1);
        });

        it('removes keywords', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const keywordInput = screen.getByPlaceholderText(/add an seo keyword/i);
            const addButton = screen.getByRole('button', { name: /add/i });

            // Add keyword
            await user.type(keywordInput, 'javascript');
            await user.click(addButton);

            expect(screen.getByText('javascript')).toBeInTheDocument();

            // Remove keyword
            const removeButton = screen.getByRole('button', { name: '' }); // X button
            await user.click(removeButton);

            expect(screen.queryByText('javascript')).not.toBeInTheDocument();
        });

        it('trims whitespace from keywords', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const keywordInput = screen.getByPlaceholderText(/add an seo keyword/i);
            const addButton = screen.getByRole('button', { name: /add/i });

            await user.type(keywordInput, '  javascript  ');
            await user.click(addButton);

            expect(screen.getByText('javascript')).toBeInTheDocument();
        });

        it('ignores empty keywords', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const keywordInput = screen.getByPlaceholderText(/add an seo keyword/i);
            const addButton = screen.getByRole('button', { name: /add/i });

            await user.type(keywordInput, '   ');
            await user.click(addButton);

            // Should not add empty keyword
            expect(keywordInput).toHaveValue('   ');
        });
    });

    describe('Category and Tag Management', () => {
        it('handles category input', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const categoryInput = screen.getByLabelText(/category/i);
            await user.type(categoryInput, 'Technology');

            expect(categoryInput).toHaveValue('Technology');
        });

        it('adds tags', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const tagInput = screen.getByPlaceholderText(/add a tag/i);
            const addButton = screen.getAllByRole('button', { name: /add/i })[0]; // First add button is for tags

            await user.type(tagInput, 'javascript');
            await user.click(addButton);

            expect(screen.getByText('javascript')).toBeInTheDocument();
            expect(tagInput).toHaveValue('');
        });

        it('adds tag on Enter key press', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const tagInput = screen.getByPlaceholderText(/add a tag/i);

            await user.type(tagInput, 'react');
            await user.keyboard('{Enter}');

            expect(screen.getByText('react')).toBeInTheDocument();
            expect(tagInput).toHaveValue('');
        });

        it('prevents duplicate tags', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const tagInput = screen.getByPlaceholderText(/add a tag/i);
            const addButton = screen.getAllByRole('button', { name: /add/i })[0];

            // Add first tag
            await user.type(tagInput, 'javascript');
            await user.click(addButton);

            // Try to add same tag again
            await user.type(tagInput, 'javascript');
            await user.click(addButton);

            // Should only have one instance
            const tagElements = screen.getAllByText('javascript');
            expect(tagElements).toHaveLength(1);
        });

        it('removes tags', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const tagInput = screen.getByPlaceholderText(/add a tag/i);
            const addButton = screen.getAllByRole('button', { name: /add/i })[0];

            // Add tag
            await user.type(tagInput, 'javascript');
            await user.click(addButton);

            // Find the tag by its title attribute
            const removeButton = screen.getByTitle('Remove javascript tag');
            await user.click(removeButton);

            expect(screen.queryByTitle('Remove javascript tag')).not.toBeInTheDocument();
        });
    });

    describe('Cover Image Management', () => {
        it('renders cover image upload section', () => {
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('Cover Image')).toBeInTheDocument();
            expect(screen.getByLabelText(/cover image alt text/i)).toBeInTheDocument();
            expect(screen.getByText(/upload cover image or drag & drop/i)).toBeInTheDocument();
        });

        it('handles cover image alt text input', async () => {
            const user = userEvent.setup();
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            const altTextInput = screen.getByLabelText(/cover image alt text/i);
            await user.type(altTextInput, 'A beautiful landscape photo');

            expect(altTextInput).toHaveValue('A beautiful landscape photo');
        });

        it('shows alt text help text', () => {
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText(/alt text helps screen readers and improves seo/i)).toBeInTheDocument();
        });
    });

    describe('Open Graph Image Management', () => {
        it('renders OG image upload section', () => {
            render(
                <BlogForm
                    mode="create"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('Open Graph Image')).toBeInTheDocument();
            expect(screen.getByText(/upload open graph image/i)).toBeInTheDocument();
            expect(screen.getByText(/1200x630px/i)).toBeInTheDocument();
        });
    });

    describe('Form Submission with Metadata', () => {
        it('submits form with complete metadata', async () => {
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
            await user.type(screen.getByLabelText(/^title/i), 'Test Blog Post');
            await user.type(screen.getByLabelText(/^content/i), 'Test content');

            // Fill metadata fields
            await user.type(screen.getByLabelText(/category/i), 'Technology');
            await user.type(screen.getByLabelText(/meta description/i), 'Test meta description');

            // Add tags
            const tagInput = screen.getByPlaceholderText(/add a tag/i);
            const tagAddButton = screen.getAllByRole('button', { name: /add/i })[0];
            await user.type(tagInput, 'javascript');
            await user.click(tagAddButton);

            // Add keywords
            const keywordInput = screen.getByPlaceholderText(/add an seo keyword/i);
            const keywordAddButton = screen.getAllByRole('button', { name: /add/i })[1];
            await user.type(keywordInput, 'seo');
            await user.click(keywordAddButton);

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create blog/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(blogService.createBlog).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Test Blog Post',
                        content: 'Test content',
                        category: 'Technology',
                        tags: ['javascript'],
                        seoMetadata: expect.objectContaining({
                            metaTitle: 'Test Blog Post',
                            metaDescription: 'Test meta description',
                            keywords: ['seo']
                        })
                    })
                );
            });
        });
    });

    describe('Edit Mode with Existing Metadata', () => {
        const mockBlogWithMetadata = {
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
                metaTitle: 'Custom SEO Title',
                metaDescription: 'Custom SEO Description',
                keywords: ['seo', 'blog', 'javascript'],
                ogImage: 'https://example.com/og.jpg'
            }
        };

        it('displays existing SEO metadata', () => {
            render(
                <BlogForm
                    blog={mockBlogWithMetadata}
                    mode="edit"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByLabelText(/meta title/i)).toHaveValue('Custom SEO Title');
            expect(screen.getByLabelText(/meta description/i)).toHaveValue('Custom SEO Description');
            // Check for SEO keywords (green background)
            const seoKeywords = screen.getAllByText('seo');
            expect(seoKeywords.length).toBeGreaterThan(0);

            const blogKeywords = screen.getAllByText('blog');
            expect(blogKeywords.length).toBeGreaterThan(0);

            const jsKeywords = screen.getAllByText('javascript');
            expect(jsKeywords.length).toBeGreaterThan(0);
        });

        it('displays existing tags and category', () => {
            render(
                <BlogForm
                    blog={mockBlogWithMetadata}
                    mode="edit"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByDisplayValue('Technology')).toBeInTheDocument();

            // Check for tags (blue background) and keywords (green background)
            const jsElements = screen.getAllByText('javascript');
            expect(jsElements.length).toBeGreaterThan(0);

            const reactElements = screen.getAllByText('react');
            expect(reactElements.length).toBeGreaterThan(0);
        });

        it('displays existing cover image alt text', () => {
            render(
                <BlogForm
                    blog={mockBlogWithMetadata}
                    mode="edit"
                    onSave={mockOnSave}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByLabelText(/cover image alt text/i)).toHaveValue('Test image');
        });
    });
});