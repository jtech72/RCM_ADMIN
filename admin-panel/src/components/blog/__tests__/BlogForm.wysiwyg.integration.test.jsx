import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import BlogForm from '../BlogForm.jsx';
import blogService from '../../../services/blog.js';
import s3Service from '../../../services/s3.js';

// Mock services
vi.mock('../../../services/blog.js', () => ({
    default: {
        createBlog: vi.fn(),
        updateBlog: vi.fn()
    }
}));

vi.mock('../../../services/s3.js', () => ({
    default: {
        validateFile: vi.fn(),
        uploadFile: vi.fn(),
        generateUniqueFileName: vi.fn(),
        deleteFile: vi.fn()
    }
}));

// Mock ReactQuill
vi.mock('react-quill', () => ({
    default: React.forwardRef(({ value, onChange, placeholder, readOnly }, ref) => {
        React.useImperativeHandle(ref, () => ({
            getEditor: () => ({
                getSelection: vi.fn(() => ({ index: 0 })),
                insertEmbed: vi.fn(),
                setSelection: vi.fn(),
                root: document.createElement('div')
            })
        }));

        return (
            <div data-testid="rich-text-editor">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    data-testid="editor-textarea"
                />
            </div>
        );
    })
}));

// Mock CSS import
vi.mock('react-quill/dist/quill.snow.css', () => ({}));

describe('BlogForm WYSIWYG Integration', () => {
    const mockOnSave = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders with WYSIWYG editor by default', () => {
        render(<BlogForm onSave={mockOnSave} onCancel={mockOnCancel} />);

        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
        expect(screen.getByTestId('editor-textarea')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Start writing your blog content...')).toBeInTheDocument();
    });

    it('switches between editor and preview modes', async () => {
        render(<BlogForm onSave={mockOnSave} onCancel={mockOnCancel} />);

        // Initially shows editor
        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();

        // Add some content
        const textarea = screen.getByTestId('editor-textarea');
        fireEvent.change(textarea, { target: { value: '<p>Test content</p>' } });

        // Switch to preview
        const previewButton = screen.getByText('Show Preview');
        fireEvent.click(previewButton);

        await waitFor(() => {
            expect(screen.getByText('Hide Preview')).toBeInTheDocument();
            expect(screen.queryByTestId('rich-text-editor')).not.toBeInTheDocument();
        });

        // Switch back to editor
        const hidePreviewButton = screen.getByText('Hide Preview');
        fireEvent.click(hidePreviewButton);

        await waitFor(() => {
            expect(screen.getByText('Show Preview')).toBeInTheDocument();
            expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
        });
    });

    it('handles cover image upload through FileUpload component', async () => {
        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.generateUniqueFileName.mockReturnValue('unique-cover.jpg');
        s3Service.uploadFile.mockResolvedValue({
            success: true,
            data: {
                url: 'https://s3.amazonaws.com/bucket/unique-cover.jpg',
                fileName: 'cover.jpg',
                size: 1024
            }
        });

        render(<BlogForm onSave={mockOnSave} onCancel={mockOnCancel} />);

        // Find the cover image upload area
        const uploadArea = screen.getByText('Upload cover image or drag & drop').closest('div');
        expect(uploadArea).toBeInTheDocument();

        // Simulate file drop
        const file = new File(['test'], 'cover.jpg', { type: 'image/jpeg' });
        fireEvent.drop(uploadArea, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(s3Service.validateFile).toHaveBeenCalledWith(file, {
                allowedTypes: ['image/*'],
                maxSize: 5 * 1024 * 1024
            });
            expect(s3Service.uploadFile).toHaveBeenCalled();
        });
    });

    it('handles OG image upload through FileUpload component', async () => {
        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.generateUniqueFileName.mockReturnValue('unique-og.jpg');
        s3Service.uploadFile.mockResolvedValue({
            success: true,
            data: {
                url: 'https://s3.amazonaws.com/bucket/unique-og.jpg',
                fileName: 'og.jpg',
                size: 1024
            }
        });

        render(<BlogForm onSave={mockOnSave} onCancel={mockOnCancel} />);

        // Find the OG image upload area
        const uploadArea = screen.getByText('Upload Open Graph image').closest('div');
        expect(uploadArea).toBeInTheDocument();

        // Simulate file drop
        const file = new File(['test'], 'og.jpg', { type: 'image/jpeg' });
        fireEvent.drop(uploadArea, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(s3Service.validateFile).toHaveBeenCalledWith(file, {
                allowedTypes: ['image/*'],
                maxSize: 2 * 1024 * 1024
            });
            expect(s3Service.uploadFile).toHaveBeenCalled();
        });
    });

    it('creates blog with rich content and uploaded images', async () => {
        blogService.createBlog.mockResolvedValue({
            success: true,
            data: { _id: 'blog-id', title: 'Test Blog' }
        });

        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.generateUniqueFileName.mockReturnValue('unique-cover.jpg');
        s3Service.uploadFile.mockResolvedValue({
            success: true,
            data: {
                url: 'https://s3.amazonaws.com/bucket/unique-cover.jpg',
                fileName: 'cover.jpg',
                size: 1024
            }
        });

        render(<BlogForm onSave={mockOnSave} onCancel={mockOnCancel} />);

        // Fill in form data
        fireEvent.change(screen.getByLabelText(/title/i), {
            target: { value: 'Test Blog Post' }
        });

        fireEvent.change(screen.getByLabelText(/excerpt/i), {
            target: { value: 'Test excerpt' }
        });

        // Add rich content
        const textarea = screen.getByTestId('editor-textarea');
        fireEvent.change(textarea, {
            target: { value: '<p>Rich <strong>content</strong> with <em>formatting</em></p>' }
        });

        // Upload cover image
        const coverUploadArea = screen.getByText('Upload cover image or drag & drop').closest('div');
        const coverFile = new File(['test'], 'cover.jpg', { type: 'image/jpeg' });
        fireEvent.drop(coverUploadArea, {
            dataTransfer: {
                files: [coverFile]
            }
        });

        await waitFor(() => {
            expect(s3Service.uploadFile).toHaveBeenCalled();
        });

        // Submit form
        const submitButton = screen.getByText('Create Blog');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(blogService.createBlog).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Test Blog Post',
                    excerpt: 'Test excerpt',
                    content: '<p>Rich <strong>content</strong> with <em>formatting</em></p>',
                    coverImage: expect.objectContaining({
                        url: 'https://s3.amazonaws.com/bucket/unique-cover.jpg'
                    })
                })
            );
            expect(mockOnSave).toHaveBeenCalled();
        });
    });

    it('handles upload errors gracefully', async () => {
        s3Service.validateFile.mockReturnValue({
            valid: false,
            errors: ['File too large']
        });

        render(<BlogForm onSave={mockOnSave} onCancel={mockOnCancel} />);

        const uploadArea = screen.getByText('Upload cover image or drag & drop').closest('div');
        const file = new File(['test'], 'large-file.jpg', { type: 'image/jpeg' });

        fireEvent.drop(uploadArea, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByText('File too large')).toBeInTheDocument();
        });
    });

    it('shows upload progress during file upload', async () => {
        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.generateUniqueFileName.mockReturnValue('unique-cover.jpg');

        let progressCallback;
        s3Service.uploadFile.mockImplementation((file, folder, onProgress) => {
            progressCallback = onProgress;
            return new Promise((resolve) => {
                setTimeout(() => {
                    if (progressCallback) progressCallback(50);
                    setTimeout(() => {
                        if (progressCallback) progressCallback(100);
                        resolve({
                            success: true,
                            data: { url: 'test-url', fileName: 'test.jpg', size: 1024 }
                        });
                    }, 100);
                }, 100);
            });
        });

        render(<BlogForm onSave={mockOnSave} onCancel={mockOnCancel} />);

        const uploadArea = screen.getByText('Upload cover image or drag & drop').closest('div');
        const file = new File(['test'], 'cover.jpg', { type: 'image/jpeg' });

        fireEvent.drop(uploadArea, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByText('Uploading...')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('50%')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('100%')).toBeInTheDocument();
        });
    });

    it('preserves content when switching between editor and preview', async () => {
        render(<BlogForm onSave={mockOnSave} onCancel={mockOnCancel} />);

        // Add content in editor
        const textarea = screen.getByTestId('editor-textarea');
        const testContent = '<h1>Test Heading</h1><p>Test paragraph with <strong>bold</strong> text.</p>';
        fireEvent.change(textarea, { target: { value: testContent } });

        // Switch to preview
        fireEvent.click(screen.getByText('Show Preview'));

        await waitFor(() => {
            // Content should be rendered as HTML in preview
            expect(screen.getByText('Test Heading')).toBeInTheDocument();
            expect(screen.getByText('bold')).toBeInTheDocument();
        });

        // Switch back to editor
        fireEvent.click(screen.getByText('Hide Preview'));

        await waitFor(() => {
            // Content should be preserved in editor
            expect(screen.getByTestId('editor-textarea')).toHaveValue(testContent);
        });
    });

    it('disables editor during form submission', async () => {
        blogService.createBlog.mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 1000))
        );

        render(<BlogForm onSave={mockOnSave} onCancel={mockOnCancel} />);

        // Fill required fields
        fireEvent.change(screen.getByLabelText(/title/i), {
            target: { value: 'Test Blog' }
        });

        const textarea = screen.getByTestId('editor-textarea');
        fireEvent.change(textarea, {
            target: { value: 'Test content' }
        });

        // Submit form
        fireEvent.click(screen.getByText('Create Blog'));

        await waitFor(() => {
            expect(screen.getByTestId('editor-textarea')).toHaveAttribute('readOnly');
            expect(screen.getByText('Saving...')).toBeInTheDocument();
        });
    });

    it('shows content preview with proper formatting', async () => {
        const testBlog = {
            title: 'Test Blog Post',
            excerpt: 'This is a test excerpt',
            content: '<h2>Introduction</h2><p>This is a <strong>test</strong> blog post with <em>formatting</em>.</p>',
            category: 'Technology',
            tags: ['react', 'javascript'],
            status: 'published',
            featured: true,
            coverImage: {
                url: 'https://example.com/cover.jpg',
                alt: 'Cover image'
            },
            seoMetadata: {
                metaTitle: 'SEO Title',
                metaDescription: 'SEO Description',
                keywords: ['seo', 'blog'],
                ogImage: 'https://example.com/og.jpg'
            }
        };

        render(<BlogForm blog={testBlog} onSave={mockOnSave} onCancel={mockOnCancel} mode="edit" />);

        // Switch to preview
        fireEvent.click(screen.getByText('Show Preview'));

        await waitFor(() => {
            expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
            expect(screen.getByText('This is a test excerpt')).toBeInTheDocument();
            expect(screen.getByText('Introduction')).toBeInTheDocument();
            expect(screen.getByText('test')).toBeInTheDocument(); // bold text
            expect(screen.getByText('formatting')).toBeInTheDocument(); // italic text
            expect(screen.getByText('Published')).toBeInTheDocument();
            expect(screen.getByText('Featured')).toBeInTheDocument();
            expect(screen.getByText('#react')).toBeInTheDocument();
            expect(screen.getByText('#javascript')).toBeInTheDocument();
        });
    });
});