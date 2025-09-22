import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import RichTextEditor from '../RichTextEditor.jsx';
import s3Service from '../../../services/s3.js';

// Mock the s3Service
vi.mock('../../../services/s3.js', () => ({
    default: {
        validateFile: vi.fn(),
        uploadFile: vi.fn(),
        generateUniqueFileName: vi.fn()
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
            <div data-testid="quill-editor">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    data-testid="quill-textarea"
                />
            </div>
        );
    })
}));

// Mock CSS import
vi.mock('react-quill/dist/quill.snow.css', () => ({}));

describe('RichTextEditor', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders with default props', () => {
        render(<RichTextEditor onChange={mockOnChange} />);

        expect(screen.getByTestId('quill-editor')).toBeInTheDocument();
        expect(screen.getByTestId('quill-textarea')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Start writing your blog content...')).toBeInTheDocument();
    });

    it('renders with custom props', () => {
        const customPlaceholder = 'Custom placeholder';
        const customValue = '<p>Custom content</p>';

        render(
            <RichTextEditor
                value={customValue}
                onChange={mockOnChange}
                placeholder={customPlaceholder}
                height="300px"
                disabled={true}
            />
        );

        expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
        expect(screen.getByDisplayValue(customValue)).toBeInTheDocument();
        expect(screen.getByTestId('quill-textarea')).toHaveAttribute('readOnly');
    });

    it('calls onChange when content changes', () => {
        render(<RichTextEditor onChange={mockOnChange} />);

        const textarea = screen.getByTestId('quill-textarea');
        fireEvent.change(textarea, { target: { value: 'New content' } });

        expect(mockOnChange).toHaveBeenCalledWith('New content');
    });

    it('shows helper text', () => {
        render(<RichTextEditor onChange={mockOnChange} />);

        expect(screen.getByText('Drag & drop images or paste from clipboard')).toBeInTheDocument();
        expect(screen.getByText('Use toolbar for links and formatting')).toBeInTheDocument();
    });

    it('handles file validation errors', async () => {
        s3Service.validateFile.mockReturnValue({
            valid: false,
            errors: ['File too large', 'Invalid file type']
        });

        render(<RichTextEditor onChange={mockOnChange} />);

        // Simulate file drop
        const editor = screen.getByTestId('quill-editor');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

        fireEvent.drop(editor, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByText('File too large, Invalid file type')).toBeInTheDocument();
        });

        expect(s3Service.validateFile).toHaveBeenCalledWith(file, {
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            maxSize: 5 * 1024 * 1024
        });
    });

    it('handles successful file upload', async () => {
        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.generateUniqueFileName.mockReturnValue('unique-test.jpg');
        s3Service.uploadFile.mockResolvedValue({
            success: true,
            data: { url: 'https://s3.amazonaws.com/bucket/unique-test.jpg' }
        });

        render(<RichTextEditor onChange={mockOnChange} />);

        const editor = screen.getByTestId('quill-editor');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        fireEvent.drop(editor, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByText('Uploading image...')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(s3Service.uploadFile).toHaveBeenCalled();
        });
    });

    it('handles upload errors', async () => {
        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.generateUniqueFileName.mockReturnValue('unique-test.jpg');
        s3Service.uploadFile.mockResolvedValue({
            success: false,
            error: 'Upload failed'
        });

        render(<RichTextEditor onChange={mockOnChange} />);

        const editor = screen.getByTestId('quill-editor');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        fireEvent.drop(editor, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByText('Upload failed')).toBeInTheDocument();
        });
    });

    it('shows upload progress', async () => {
        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.generateUniqueFileName.mockReturnValue('unique-test.jpg');

        let progressCallback;
        s3Service.uploadFile.mockImplementation((file, folder, onProgress) => {
            progressCallback = onProgress;
            return new Promise((resolve) => {
                setTimeout(() => {
                    if (progressCallback) progressCallback(50);
                    setTimeout(() => {
                        if (progressCallback) progressCallback(100);
                        resolve({ success: true, data: { url: 'test-url' } });
                    }, 100);
                }, 100);
            });
        });

        render(<RichTextEditor onChange={mockOnChange} />);

        const editor = screen.getByTestId('quill-editor');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        fireEvent.drop(editor, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByText('50%')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('100%')).toBeInTheDocument();
        });
    });

    it('prevents drop when disabled', () => {
        render(<RichTextEditor onChange={mockOnChange} disabled={true} />);

        const editor = screen.getByTestId('quill-editor');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        fireEvent.drop(editor, {
            dataTransfer: {
                files: [file]
            }
        });

        expect(s3Service.validateFile).not.toHaveBeenCalled();
    });

    it('filters non-image files from drop', async () => {
        render(<RichTextEditor onChange={mockOnChange} />);

        const editor = screen.getByTestId('quill-editor');
        const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.generateUniqueFileName.mockReturnValue('unique-test.jpg');
        s3Service.uploadFile.mockResolvedValue({
            success: true,
            data: { url: 'test-url' }
        });

        fireEvent.drop(editor, {
            dataTransfer: {
                files: [textFile, imageFile]
            }
        });

        await waitFor(() => {
            expect(s3Service.validateFile).toHaveBeenCalledTimes(1);
            expect(s3Service.uploadFile).toHaveBeenCalledTimes(1);
        });
    });

    it('clears error after timeout', async () => {
        vi.useFakeTimers();

        s3Service.validateFile.mockReturnValue({
            valid: false,
            errors: ['Test error']
        });

        render(<RichTextEditor onChange={mockOnChange} />);

        const editor = screen.getByTestId('quill-editor');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        fireEvent.drop(editor, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByText('Test error')).toBeInTheDocument();
        });

        // Fast forward 5 seconds
        vi.advanceTimersByTime(5000);

        await waitFor(() => {
            expect(screen.queryByText('Test error')).not.toBeInTheDocument();
        });

        vi.useRealTimers();
    });

    it('handles drag events correctly', () => {
        render(<RichTextEditor onChange={mockOnChange} />);

        const editor = screen.getByTestId('quill-editor');

        fireEvent.dragOver(editor);
        fireEvent.dragEnter(editor);
        fireEvent.dragLeave(editor);

        // Should not throw errors
        expect(editor).toBeInTheDocument();
    });
});