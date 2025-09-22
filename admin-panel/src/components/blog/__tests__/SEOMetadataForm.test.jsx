import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SEOMetadataForm from '../SEOMetadataForm.jsx';

// Mock FileUpload component
vi.mock('../../common/FileUpload.jsx', () => ({
    default: ({ children, onUpload, existingFile }) => (
        <div data-testid="file-upload">
            {children}
            {existingFile && <div data-testid="existing-file">{existingFile.fileName}</div>}
            <button onClick={() => onUpload({ url: 'https://example.com/og-image.jpg' })}>
                Mock Upload
            </button>
        </div>
    )
}));

describe('SEOMetadataForm', () => {
    const mockOnSeoMetadataChange = vi.fn();
    const defaultSeoMetadata = {
        metaTitle: '',
        metaDescription: '',
        keywords: [],
        ogImage: ''
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Form Rendering', () => {
        it('renders all SEO metadata fields', () => {
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByText('SEO Metadata')).toBeInTheDocument();
            expect(screen.getByLabelText(/meta title/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/meta description/i)).toBeInTheDocument();
            expect(screen.getByText('SEO Keywords')).toBeInTheDocument();
            expect(screen.getByText('Open Graph Image')).toBeInTheDocument();
        });

        it('displays existing metadata values', () => {
            const existingMetadata = {
                metaTitle: 'Existing Title',
                metaDescription: 'Existing description',
                keywords: ['seo', 'blog'],
                ogImage: 'https://example.com/og.jpg'
            };

            render(
                <SEOMetadataForm
                    seoMetadata={existingMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByDisplayValue('Existing Title')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
            expect(screen.getByText('seo')).toBeInTheDocument();
            expect(screen.getByText('blog')).toBeInTheDocument();
        });
    });

    describe('Meta Title', () => {
        it('auto-generates meta title from blog title', async () => {
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                    blogTitle="My Amazing Blog Post"
                />
            );

            await waitFor(() => {
                expect(mockOnSeoMetadataChange).toHaveBeenCalledWith({
                    ...defaultSeoMetadata,
                    metaTitle: 'My Amazing Blog Post'
                });
            });
        });

        it('does not override existing meta title', () => {
            const existingMetadata = {
                ...defaultSeoMetadata,
                metaTitle: 'Custom SEO Title'
            };

            render(
                <SEOMetadataForm
                    seoMetadata={existingMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                    blogTitle="My Amazing Blog Post"
                />
            );

            expect(mockOnSeoMetadataChange).not.toHaveBeenCalled();
        });

        it('updates meta title when input changes', async () => {
            const user = userEvent.setup();
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            const metaTitleInput = screen.getByLabelText(/meta title/i);
            await user.type(metaTitleInput, 'New SEO Title');

            expect(mockOnSeoMetadataChange).toHaveBeenCalledWith({
                ...defaultSeoMetadata,
                metaTitle: 'New SEO Title'
            });
        });

        it('shows character count for meta title', () => {
            const metadataWithTitle = {
                ...defaultSeoMetadata,
                metaTitle: 'Test Title'
            };

            render(
                <SEOMetadataForm
                    seoMetadata={metadataWithTitle}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByText('10/60')).toBeInTheDocument();
        });

        it('shows warning when meta title exceeds optimal length', () => {
            const longTitle = 'A'.repeat(65);
            const metadataWithLongTitle = {
                ...defaultSeoMetadata,
                metaTitle: longTitle
            };

            render(
                <SEOMetadataForm
                    seoMetadata={metadataWithLongTitle}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByText('65/60')).toBeInTheDocument();
        });
    });

    describe('Meta Description', () => {
        it('updates meta description when input changes', async () => {
            const user = userEvent.setup();
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            const metaDescInput = screen.getByLabelText(/meta description/i);
            await user.type(metaDescInput, 'New meta description');

            expect(mockOnSeoMetadataChange).toHaveBeenCalledWith({
                ...defaultSeoMetadata,
                metaDescription: 'New meta description'
            });
        });

        it('shows character count for meta description', () => {
            const metadataWithDesc = {
                ...defaultSeoMetadata,
                metaDescription: 'Test description'
            };

            render(
                <SEOMetadataForm
                    seoMetadata={metadataWithDesc}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByText('16/160')).toBeInTheDocument();
        });

        it('shows warning when meta description exceeds optimal length', () => {
            const longDesc = 'A'.repeat(165);
            const metadataWithLongDesc = {
                ...defaultSeoMetadata,
                metaDescription: longDesc
            };

            render(
                <SEOMetadataForm
                    seoMetadata={metadataWithLongDesc}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByText('165/160')).toBeInTheDocument();
        });
    });

    describe('SEO Keywords', () => {
        it('displays existing keywords', () => {
            const metadataWithKeywords = {
                ...defaultSeoMetadata,
                keywords: ['javascript', 'react', 'seo']
            };

            render(
                <SEOMetadataForm
                    seoMetadata={metadataWithKeywords}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByText('javascript')).toBeInTheDocument();
            expect(screen.getByText('react')).toBeInTheDocument();
            expect(screen.getByText('seo')).toBeInTheDocument();
        });

        it('adds keyword when Add button is clicked', async () => {
            const user = userEvent.setup();
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            const keywordInput = screen.getByPlaceholderText(/add an seo keyword/i);
            const addButton = screen.getByRole('button', { name: '' }); // Plus icon

            await user.type(keywordInput, 'javascript');
            await user.click(addButton);

            expect(mockOnSeoMetadataChange).toHaveBeenCalledWith({
                ...defaultSeoMetadata,
                keywords: ['javascript']
            });
        });

        it('adds keyword when Enter key is pressed', async () => {
            const user = userEvent.setup();
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            const keywordInput = screen.getByPlaceholderText(/add an seo keyword/i);
            await user.type(keywordInput, 'react');
            await user.keyboard('{Enter}');

            expect(mockOnSeoMetadataChange).toHaveBeenCalledWith({
                ...defaultSeoMetadata,
                keywords: ['react']
            });
        });

        it('prevents duplicate keywords', async () => {
            const user = userEvent.setup();
            const metadataWithKeywords = {
                ...defaultSeoMetadata,
                keywords: ['javascript']
            };

            render(
                <SEOMetadataForm
                    seoMetadata={metadataWithKeywords}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            const keywordInput = screen.getByPlaceholderText(/add an seo keyword/i);
            const addButton = screen.getByRole('button', { name: '' });

            await user.type(keywordInput, 'javascript');
            await user.click(addButton);

            expect(mockOnSeoMetadataChange).not.toHaveBeenCalled();
        });

        it('removes keyword when X button is clicked', async () => {
            const user = userEvent.setup();
            const metadataWithKeywords = {
                ...defaultSeoMetadata,
                keywords: ['javascript', 'react']
            };

            render(
                <SEOMetadataForm
                    seoMetadata={metadataWithKeywords}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            const removeButton = screen.getAllByTitle(/remove.*keyword/i)[0];
            await user.click(removeButton);

            expect(mockOnSeoMetadataChange).toHaveBeenCalledWith({
                ...defaultSeoMetadata,
                keywords: ['react']
            });
        });

        it('trims whitespace from keywords', async () => {
            const user = userEvent.setup();
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            const keywordInput = screen.getByPlaceholderText(/add an seo keyword/i);
            const addButton = screen.getByRole('button', { name: '' });

            await user.type(keywordInput, '  javascript  ');
            await user.click(addButton);

            expect(mockOnSeoMetadataChange).toHaveBeenCalledWith({
                ...defaultSeoMetadata,
                keywords: ['javascript']
            });
        });
    });

    describe('Open Graph Image', () => {
        it('renders file upload component', () => {
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByTestId('file-upload')).toBeInTheDocument();
            expect(screen.getByText('Upload Open Graph image')).toBeInTheDocument();
        });

        it('shows existing OG image', () => {
            const metadataWithOgImage = {
                ...defaultSeoMetadata,
                ogImage: 'https://example.com/og.jpg'
            };

            render(
                <SEOMetadataForm
                    seoMetadata={metadataWithOgImage}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByTestId('existing-file')).toBeInTheDocument();
            expect(screen.getByText('Open Graph Image')).toBeInTheDocument();
        });

        it('updates OG image when file is uploaded', async () => {
            const user = userEvent.setup();
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            const uploadButton = screen.getByText('Mock Upload');
            await user.click(uploadButton);

            expect(mockOnSeoMetadataChange).toHaveBeenCalledWith({
                ...defaultSeoMetadata,
                ogImage: 'https://example.com/og-image.jpg'
            });
        });
    });

    describe('SEO Preview', () => {
        it('shows SEO preview when metadata is provided', () => {
            const metadataWithContent = {
                metaTitle: 'Test SEO Title',
                metaDescription: 'Test SEO description',
                keywords: ['test'],
                ogImage: ''
            };

            render(
                <SEOMetadataForm
                    seoMetadata={metadataWithContent}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByText('Search Engine Preview')).toBeInTheDocument();
            expect(screen.getByText('Test SEO Title')).toBeInTheDocument();
            // Check for the description in the preview section
            const previewSection = screen.getByText('Search Engine Preview').closest('div');
            expect(previewSection).toHaveTextContent('Test SEO description');
        });

        it('uses blog title as fallback in preview', () => {
            const metadataWithDesc = {
                ...defaultSeoMetadata,
                metaDescription: 'Test description'
            };

            render(
                <SEOMetadataForm
                    seoMetadata={metadataWithDesc}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                    blogTitle="My Blog Post"
                />
            );

            expect(screen.getByText('My Blog Post')).toBeInTheDocument();
            // Check for the description in the preview section
            const previewSection = screen.getByText('Search Engine Preview').closest('div');
            expect(previewSection).toHaveTextContent('Test description');
        });

        it('does not show preview when no metadata is provided', () => {
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.queryByText('Search Engine Preview')).not.toBeInTheDocument();
        });
    });

    describe('Disabled State', () => {
        it('disables all inputs when disabled prop is true', () => {
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                    disabled={true}
                />
            );

            expect(screen.getByLabelText(/meta title/i)).toBeDisabled();
            expect(screen.getByLabelText(/meta description/i)).toBeDisabled();
            expect(screen.getByPlaceholderText(/add an seo keyword/i)).toBeDisabled();
        });
    });

    describe('Help Text and Guidelines', () => {
        it('shows character count guidelines', () => {
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByText(/optimal length: 50-60 characters/i)).toBeInTheDocument();
            expect(screen.getByText(/optimal length: 150-160 characters/i)).toBeInTheDocument();
        });

        it('shows OG image recommendations', () => {
            render(
                <SEOMetadataForm
                    seoMetadata={defaultSeoMetadata}
                    onSeoMetadataChange={mockOnSeoMetadataChange}
                />
            );

            expect(screen.getByText(/1200x630px/i)).toBeInTheDocument();
            expect(screen.getByText(/this image appears when your blog is shared/i)).toBeInTheDocument();
        });
    });
});