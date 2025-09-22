import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import s3Service from '../s3.js';

// Mock axios
vi.mock('axios');

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('S3Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue('mock-token');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getPresignedUrl', () => {
        it('should get presigned URL successfully', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: {
                        uploadUrl: 'https://s3.amazonaws.com/presigned-url',
                        fileUrl: 'https://s3.amazonaws.com/file-url',
                        fileKey: 'uploads/test-file.jpg'
                    }
                }
            };

            s3Service.api.get = vi.fn().mockResolvedValue(mockResponse);

            const params = {
                fileName: 'test.jpg',
                contentType: 'image/jpeg',
                fileSize: 1024,
                folder: 'uploads'
            };

            const result = await s3Service.getPresignedUrl(params);

            expect(s3Service.api.get).toHaveBeenCalledWith('/presign', { params });
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle API errors', async () => {
            const mockError = {
                response: {
                    data: {
                        error: 'Invalid file type'
                    }
                }
            };

            s3Service.api.get = vi.fn().mockRejectedValue(mockError);

            const params = {
                fileName: 'test.txt',
                contentType: 'text/plain',
                fileSize: 1024
            };

            await expect(s3Service.getPresignedUrl(params)).rejects.toThrow('Invalid file type');
        });
    });

    describe('uploadFile', () => {
        it('should upload file successfully', async () => {
            const mockPresignedResponse = {
                data: {
                    success: true,
                    data: {
                        uploadUrl: 'https://s3.amazonaws.com/presigned-url',
                        fileUrl: 'https://s3.amazonaws.com/file-url',
                        fileKey: 'uploads/test-file.jpg'
                    }
                }
            };

            const mockUploadResponse = {
                status: 200
            };

            s3Service.api.get = vi.fn().mockResolvedValue(mockPresignedResponse);
            axios.put = vi.fn().mockResolvedValue(mockUploadResponse);

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const result = await s3Service.uploadFile(file, 'uploads');

            expect(result.success).toBe(true);
            expect(result.data.url).toBe('https://s3.amazonaws.com/file-url');
            expect(result.data.key).toBe('uploads/test-file.jpg');
            expect(result.data.fileName).toBe('test.jpg');
        });

        it('should handle upload progress', async () => {
            const mockPresignedResponse = {
                data: {
                    success: true,
                    data: {
                        uploadUrl: 'https://s3.amazonaws.com/presigned-url',
                        fileUrl: 'https://s3.amazonaws.com/file-url',
                        fileKey: 'uploads/test-file.jpg'
                    }
                }
            };

            const mockUploadResponse = {
                status: 200
            };

            s3Service.api.get = vi.fn().mockResolvedValue(mockPresignedResponse);
            axios.put = vi.fn().mockImplementation((url, file, config) => {
                // Simulate progress
                if (config.onUploadProgress) {
                    config.onUploadProgress({ loaded: 50, total: 100 });
                }
                return Promise.resolve(mockUploadResponse);
            });

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const onProgress = vi.fn();

            await s3Service.uploadFile(file, 'uploads', onProgress);

            expect(onProgress).toHaveBeenCalledWith(50);
        });

        it('should handle upload failures', async () => {
            const mockPresignedResponse = {
                data: {
                    success: true,
                    data: {
                        uploadUrl: 'https://s3.amazonaws.com/presigned-url',
                        fileUrl: 'https://s3.amazonaws.com/file-url',
                        fileKey: 'uploads/test-file.jpg'
                    }
                }
            };

            s3Service.api.get = vi.fn().mockResolvedValue(mockPresignedResponse);
            axios.put = vi.fn().mockRejectedValue(new Error('Upload failed'));

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const result = await s3Service.uploadFile(file, 'uploads');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Upload failed');
        });
    });

    describe('uploadMultipleFiles', () => {
        it('should upload multiple files successfully', async () => {
            const mockPresignedResponse = {
                data: {
                    success: true,
                    data: {
                        uploadUrl: 'https://s3.amazonaws.com/presigned-url',
                        fileUrl: 'https://s3.amazonaws.com/file-url',
                        fileKey: 'uploads/test-file.jpg'
                    }
                }
            };

            const mockUploadResponse = {
                status: 200
            };

            s3Service.api.get = vi.fn().mockResolvedValue(mockPresignedResponse);
            axios.put = vi.fn().mockResolvedValue(mockUploadResponse);

            const files = [
                new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
                new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
            ];

            const onProgress = vi.fn();
            const results = await s3Service.uploadMultipleFiles(files, 'uploads', onProgress);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(true);
            expect(onProgress).toHaveBeenCalled();
        });
    });

    describe('deleteFile', () => {
        it('should delete file successfully', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    message: 'File deleted successfully'
                }
            };

            s3Service.api.delete = vi.fn().mockResolvedValue(mockResponse);

            const result = await s3Service.deleteFile('uploads/test-file.jpg');

            expect(s3Service.api.delete).toHaveBeenCalledWith('/files/uploads%2Ftest-file.jpg');
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle delete errors', async () => {
            const mockError = {
                response: {
                    data: {
                        error: 'File not found'
                    }
                }
            };

            s3Service.api.delete = vi.fn().mockRejectedValue(mockError);

            await expect(s3Service.deleteFile('uploads/test-file.jpg')).rejects.toThrow('File not found');
        });
    });

    describe('fileExists', () => {
        it('should check if file exists', async () => {
            const mockResponse = {
                data: {
                    data: {
                        exists: true
                    }
                }
            };

            s3Service.api.get = vi.fn().mockResolvedValue(mockResponse);

            const exists = await s3Service.fileExists('uploads/test-file.jpg');

            expect(s3Service.api.get).toHaveBeenCalledWith('/exists/uploads%2Ftest-file.jpg');
            expect(exists).toBe(true);
        });

        it('should return false on error', async () => {
            s3Service.api.get = vi.fn().mockRejectedValue(new Error('API Error'));

            const exists = await s3Service.fileExists('uploads/test-file.jpg');

            expect(exists).toBe(false);
        });
    });

    describe('getDownloadUrl', () => {
        it('should get download URL successfully', async () => {
            const mockResponse = {
                data: {
                    data: {
                        downloadUrl: 'https://s3.amazonaws.com/download-url'
                    }
                }
            };

            s3Service.api.get = vi.fn().mockResolvedValue(mockResponse);

            const url = await s3Service.getDownloadUrl('uploads/test-file.jpg', 3600);

            expect(s3Service.api.get).toHaveBeenCalledWith('/download/uploads%2Ftest-file.jpg', {
                params: { expiresIn: 3600 }
            });
            expect(url).toBe('https://s3.amazonaws.com/download-url');
        });
    });

    describe('getSupportedFileTypes', () => {
        it('should get supported file types', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: {
                        fileTypes: [
                            { mimeType: 'image/jpeg', extension: '.jpg', maxSize: 5242880 }
                        ]
                    }
                }
            };

            s3Service.api.get = vi.fn().mockResolvedValue(mockResponse);

            const result = await s3Service.getSupportedFileTypes();

            expect(s3Service.api.get).toHaveBeenCalledWith('/file-types');
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('validateFile', () => {
        it('should validate file successfully', () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 1024 });

            const result = s3Service.validateFile(file);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid file type', () => {
            const file = new File(['test'], 'test.exe', { type: 'application/x-executable' });
            Object.defineProperty(file, 'size', { value: 1024 });

            const result = s3Service.validateFile(file);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('File type application/x-executable is not allowed');
        });

        it('should reject oversized file', () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 }); // 20MB

            const result = s3Service.validateFile(file, { maxSize: 10 * 1024 * 1024 });

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('File size exceeds 10.0MB limit');
        });

        it('should reject empty file', () => {
            const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 0 });

            const result = s3Service.validateFile(file);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('File is empty');
        });
    });

    describe('generateUniqueFileName', () => {
        it('should generate unique file name', () => {
            const originalName = 'test-file.jpg';
            const uniqueName = s3Service.generateUniqueFileName(originalName);

            expect(uniqueName).toMatch(/^test-file-\d+-[a-z0-9]{6}\.jpg$/);
            expect(uniqueName).not.toBe(originalName);
        });

        it('should handle files without extension', () => {
            const originalName = 'test-file';
            const uniqueName = s3Service.generateUniqueFileName(originalName);

            expect(uniqueName).toMatch(/^test-file-\d+-[a-z0-9]{6}\.undefined$/);
        });

        it('should handle files with multiple dots', () => {
            const originalName = 'test.file.name.jpg';
            const uniqueName = s3Service.generateUniqueFileName(originalName);

            expect(uniqueName).toMatch(/^test\.file\.name-\d+-[a-z0-9]{6}\.jpg$/);
        });
    });
});