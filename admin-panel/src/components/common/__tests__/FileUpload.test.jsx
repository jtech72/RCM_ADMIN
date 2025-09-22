import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import FileUpload from '../FileUpload.jsx';
import s3Service from '../../../services/s3.js';

// Mock the s3Service
vi.mock('../../../services/s3.js', () => ({
    default: {
        validateFile: vi.fn(),
        uploadFile: vi.fn(),
        uploadMultipleFiles: vi.fn(),
        generateUniqueFileName: vi.fn(),
        deleteFile: vi.fn()
    }
}));

describe('FileUpload', () => {
    const mockOnUpload = vi.fn();
    const mockOnError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders upload area when no file is uploaded', () => {
        render(<FileUpload onUpload={mockOnUpload} />);

        expect(screen.getByText('Click to upload')).toBeInTheDocument();
        expect(screen.getByText('or drag and drop')).toBeInTheDocument();
        expect(screen.getByText('Max size: 5.00 MB')).toBeInTheDocument();
    });

    it('renders with custom children', () => {
        render(
            <FileUpload onUpload={mockOnUpload}>
                Custom upload text
            </FileUpload>
        );

        expect(screen.getByText('Custom upload text')).toBeInTheDocument();
    });

    it('handles file selection via click', async () => {
        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.generateUniqueFileName.mockReturnValue('unique-test.jpg');
        s3Service.uploadFile.mockResolvedValue({
            success: true,
            data: { url: 'test-url', fileName: 'test.jpg', size: 1024 }
        });

        render(<FileUpload onUpload={mockOnUpload} />);

        const uploadArea = screen.getByText('Click to upload').closest('div');
        fireEvent.click(uploadArea);

        // Simulate file input change
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        Object.defineProperty(fileInput, 'files', {
            value: [file],
            writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
            expect(s3Service.validateFile).toHaveBeenCalled();
            expect(s3Service.uploadFile).toHaveBeenCalled();
            expect(mockOnUpload).toHaveBeenCalled();
        });
    });

    it('handles drag and drop', async () => {
        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.generateUniqueFileName.mockReturnValue('unique-test.jpg');
        s3Service.uploadFile.mockResolvedValue({
            success: true,
            data: { url: 'test-url', fileName: 'test.jpg', size: 1024 }
        });

        render(<FileUpload onUpload={mockOnUpload} />);

        const uploadArea = screen.getByText('Click to upload').closest('div');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        // Simulate drag events
        fireEvent.dragEnter(uploadArea);
        fireEvent.dragOver(uploadArea);
        fireEvent.drop(uploadArea, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(s3Service.validateFile).toHaveBeenCalled();
            expect(s3Service.uploadFile).toHaveBeenCalled();
        });
    });

    it('shows validation errors', async () => {
        s3Service.validateFile.mockReturnValue({
            valid: false,
            errors: ['File too large', 'Invalid file type']
        });

        render(<FileUpload onUpload={mockOnUpload} onError={mockOnError} />);

        const uploadArea = screen.getByText('Click to upload').closest('div');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        fireEvent.drop(uploadArea, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByText('File too large, Invalid file type')).toBeInTheDocument();
            expect(mockOnError).toHaveBeenCalledWith(['File too large', 'Invalid file type']);
        });
    });

    it('handles upload errors', async () => {
        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.generateUniqueFileName.mockReturnValue('unique-test.jpg');
        s3Service.uploadFile.mockResolvedValue({
            success: false,
            error: 'Upload failed'
        });

        render(<FileUpload onUpload={mockOnUpload} onError={mockOnError} />);

        const uploadArea = screen.getByText('Click to upload').closest('div');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        fireEvent.drop(uploadArea, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByText('Upload failed')).toBeInTheDocument();
            expect(mockOnError).toHaveBeenCalledWith(['Upload failed']);
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
                        resolve({ success: true, data: { url: 'test-url', fileName: 'test.jpg', size: 1024 } });
                    }, 100);
                }, 100);
            });
        });

        render(<FileUpload onUpload={mockOnUpload} />);

        const uploadArea = screen.getByText('Click to upload').closest('div');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        fireEvent.drop(uploadArea, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByText('Uploading...')).toBeInTheDocument();
            expect(screen.getByText('50%')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('100%')).toBeInTheDocument();
        });
    });

    it('handles multiple file uploads', async () => {
        s3Service.validateFile.mockReturnValue({ valid: true, errors: [] });
        s3Service.uploadMultipleFiles.mockResolvedValue([
            { success: true, data: { url: 'test-url-1', fileName: 'test1.jpg', size: 1024 } },
            { success: true, data: { url: 'test-url-2', fileName: 'test2.jpg', size: 2048 } }
        ]);

        render(<FileUpload onUpload={mockOnUpload} multiple={true} />);

        const uploadArea = screen.getByText('Click to upload').closest('div');
        const files = [
            new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
            new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
        ];

        fireEvent.drop(uploadArea, {
            dataTransfer: {
                files
            }
        });

        await waitFor(() => {
            expect(s3Service.uploadMultipleFiles).toHaveBeenCalledWith(
                files,
                'uploads',
                expect.any(Function)
            );
            expect(mockOnUpload).toHaveBeenCalled();
        });
    });

    it('prevents multiple files when multiple is false', async () => {
        render(<FileUpload onUpload={mockOnUpload} multiple={false} />);

        const uploadArea = screen.getByText('Click to upload').closest('div');
        const files = [
            new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
            new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
        ];

        fireEvent.drop(uploadArea, {
            dataTransfer: {
                files
            }
        });

        await waitFor(() => {
            expect(screen.getByText('Only one file is allowed')).toBeInTheDocument();
        });
    });

    it('shows file preview after upload', async () => {
        const uploadedFile = {
            url: 'https://example.com/test.jpg',
            fileName: 'test.jpg',
            size: 1024,
            contentType: 'image/jpeg',
            key: 'test-key'
        };

        render(
            <FileUpload
                onUpload={mockOnUpload}
                existingFile={uploadedFile}
                showPreview={true}
            />
        );

        expect(screen.getByText('test.jpg')).toBeInTheDocument();
        expect(screen.getByText('1.00 KB')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', uploadedFile.url);
    });

    it('handles file removal', async () => {
        s3Service.deleteFile.mockResolvedValue({ success: true });

        const uploadedFile = {
            url: 'https://example.com/test.jpg',
            fileName: 'test.jpg',
            size: 1024,
            contentType: 'image/jpeg',
            key: 'test-key'
        };

        render(
            <FileUpload
                onUpload={mockOnUpload}
                existingFile={uploadedFile}
                showPreview={true}
            />
        );

        const removeButton = screen.getByRole('button');
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(s3Service.deleteFile).toHaveBeenCalledWith('test-key');
            expect(mockOnUpload).toHaveBeenCalledWith(null);
        });
    });

    it('is disabled when disabled prop is true', () => {
        render(<FileUpload onUpload={mockOnUpload} disabled={true} />);

        const uploadArea = screen.getByText('Click to upload').closest('div');
        expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed');

        fireEvent.click(uploadArea);

        // Should not trigger file input
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toHaveAttribute('disabled');
    });

    it('formats file sizes correctly', () => {
        const testCases = [
            { bytes: 0, expected: '0 Bytes' },
            { bytes: 1024, expected: '1.00 KB' },
            { bytes: 1048576, expected: '1.00 MB' },
            { bytes: 1073741824, expected: '1.00 GB' }
        ];

        testCases.forEach(({ bytes, expected }) => {
            const uploadedFile = {
                url: 'https://example.com/test.jpg',
                fileName: 'test.jpg',
                size: bytes,
                contentType: 'image/jpeg',
                key: 'test-key'
            };

            const { unmount } = render(
                <FileUpload
                    onUpload={mockOnUpload}
                    existingFile={uploadedFile}
                    showPreview={true}
                />
            );

            expect(screen.getByText(expected)).toBeInTheDocument();
            unmount();
        });
    });

    it('shows correct icon for different file types', () => {
        const imageFile = {
            url: 'https://example.com/test.jpg',
            fileName: 'test.jpg',
            size: 1024,
            contentType: 'image/jpeg',
            key: 'test-key'
        };

        const { rerender } = render(
            <FileUpload
                onUpload={mockOnUpload}
                existingFile={imageFile}
                showPreview={true}
            />
        );

        expect(screen.getByRole('img')).toBeInTheDocument();

        const textFile = {
            url: 'https://example.com/test.txt',
            fileName: 'test.txt',
            size: 1024,
            contentType: 'text/plain',
            key: 'test-key'
        };

        rerender(
            <FileUpload
                onUpload={mockOnUpload}
                existingFile={textFile}
                showPreview={true}
            />
        );

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});