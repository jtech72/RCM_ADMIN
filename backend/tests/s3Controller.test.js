const request = require('supertest');
const express = require('express');
const {
    getPresignedUrl,
    getDownloadUrl,
    uploadFile,
    deleteFileFromS3,
    checkFileExists,
    getSupportedFileTypes
} = require('../controllers/s3Controller');

// Mock the S3 service
jest.mock('../services/s3Service');
const s3Service = require('../services/s3Service');

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'admin' };
    next();
};

// Mock multer middleware for file uploads
const mockMulter = (req, res, next) => {
    // Simulate multer adding file to request
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        req.file = {
            buffer: Buffer.from('test file content'),
            originalname: 'test.jpg',
            mimetype: 'image/jpeg',
            size: 1024
        };
    }
    next();
};

// Set up routes
app.get('/presign', mockAuth, getPresignedUrl);
app.get('/download/:fileKey(*)', getDownloadUrl);
app.post('/upload', mockAuth, mockMulter, uploadFile);
app.delete('/files/:fileKey(*)', mockAuth, deleteFileFromS3);
app.get('/exists/:fileKey(*)', checkFileExists);
app.get('/file-types', getSupportedFileTypes);

describe('S3 Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /presign', () => {
        test('should generate presigned URL with valid parameters', async () => {
            const mockResult = {
                success: true,
                data: {
                    presignedUrl: 'https://test-bucket.s3.amazonaws.com/presigned-url',
                    fileKey: 'uploads/test_123456_abcdef.jpg',
                    fileUrl: 'https://test-bucket.s3.amazonaws.com/uploads/test_123456_abcdef.jpg',
                    expiresAt: '2023-01-01T12:00:00.000Z',
                    uploadHeaders: {
                        'Content-Type': 'image/jpeg',
                        'Content-Length': '1048576'
                    }
                }
            };

            s3Service.generatePresignedUrl.mockResolvedValue(mockResult);

            const response = await request(app)
                .get('/presign')
                .query({
                    fileName: 'test.jpg',
                    contentType: 'image/jpeg',
                    fileSize: '1048576',
                    folder: 'uploads',
                    expiresIn: '300'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockResult.data);
            expect(s3Service.generatePresignedUrl).toHaveBeenCalledWith({
                fileName: 'test.jpg',
                contentType: 'image/jpeg',
                fileSize: 1048576,
                folder: 'uploads',
                expiresIn: 300
            });
        });

        test('should use default values for optional parameters', async () => {
            const mockResult = {
                success: true,
                data: {
                    presignedUrl: 'https://test-bucket.s3.amazonaws.com/presigned-url',
                    fileKey: 'uploads/test_123456_abcdef.jpg',
                    fileUrl: 'https://test-bucket.s3.amazonaws.com/uploads/test_123456_abcdef.jpg',
                    expiresAt: '2023-01-01T12:00:00.000Z',
                    uploadHeaders: {
                        'Content-Type': 'image/jpeg',
                        'Content-Length': '1048576'
                    }
                }
            };

            s3Service.generatePresignedUrl.mockResolvedValue(mockResult);

            const response = await request(app)
                .get('/presign')
                .query({
                    fileName: 'test.jpg',
                    contentType: 'image/jpeg',
                    fileSize: '1048576'
                });

            expect(response.status).toBe(200);
            expect(s3Service.generatePresignedUrl).toHaveBeenCalledWith({
                fileName: 'test.jpg',
                contentType: 'image/jpeg',
                fileSize: 1048576,
                folder: 'uploads',
                expiresIn: 300
            });
        });

        test('should return 400 for missing required parameters', async () => {
            const response = await request(app)
                .get('/presign')
                .query({
                    fileName: 'test.jpg',
                    contentType: 'image/jpeg'
                    // Missing fileSize
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('File size must be a number');
        });

        test('should return 400 for invalid file size', async () => {
            const response = await request(app)
                .get('/presign')
                .query({
                    fileName: 'test.jpg',
                    contentType: 'image/jpeg',
                    fileSize: '0' // Invalid size
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.details).toContain('File size must be greater than 0');
        });

        test('should return 400 for oversized file', async () => {
            const response = await request(app)
                .get('/presign')
                .query({
                    fileName: 'test.jpg',
                    contentType: 'image/jpeg',
                    fileSize: (101 * 1024 * 1024).toString() // 101MB
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.details).toContain('File size must be less than 100MB');
        });

        test('should return 400 for invalid folder name', async () => {
            const response = await request(app)
                .get('/presign')
                .query({
                    fileName: 'test.jpg',
                    contentType: 'image/jpeg',
                    fileSize: '1048576',
                    folder: 'invalid@folder#name'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.details).toContain('Folder name can only contain letters, numbers, hyphens, underscores, and forward slashes');
        });

        test('should return 400 when S3 service fails', async () => {
            s3Service.generatePresignedUrl.mockResolvedValue({
                success: false,
                error: 'File type not allowed'
            });

            const response = await request(app)
                .get('/presign')
                .query({
                    fileName: 'test.exe',
                    contentType: 'application/exe',
                    fileSize: '1048576'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('File type not allowed');
        });

        test('should handle internal server errors', async () => {
            s3Service.generatePresignedUrl.mockRejectedValue(new Error('Internal error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .get('/presign')
                .query({
                    fileName: 'test.jpg',
                    contentType: 'image/jpeg',
                    fileSize: '1048576'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Internal server error while generating presigned URL');

            consoleSpy.mockRestore();
        });
    });

    describe('GET /download/:fileKey', () => {
        test('should generate download URL successfully', async () => {
            const mockResult = {
                success: true,
                data: {
                    downloadUrl: 'https://test-bucket.s3.amazonaws.com/download-url',
                    expiresAt: '2023-01-01T12:00:00.000Z'
                }
            };

            s3Service.fileExists.mockResolvedValue(true);
            s3Service.generateDownloadUrl.mockResolvedValue(mockResult);

            const response = await request(app)
                .get('/download/uploads/test.jpg');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockResult.data);
            expect(s3Service.generateDownloadUrl).toHaveBeenCalledWith('uploads/test.jpg', 3600);
        });

        test('should handle custom expiration time', async () => {
            const mockResult = {
                success: true,
                data: {
                    downloadUrl: 'https://test-bucket.s3.amazonaws.com/download-url',
                    expiresAt: '2023-01-01T12:00:00.000Z'
                }
            };

            s3Service.fileExists.mockResolvedValue(true);
            s3Service.generateDownloadUrl.mockResolvedValue(mockResult);

            const response = await request(app)
                .get('/download/uploads/test.jpg')
                .query({ expiresIn: '7200' });

            expect(response.status).toBe(200);
            expect(s3Service.generateDownloadUrl).toHaveBeenCalledWith('uploads/test.jpg', 7200);
        });

        test('should return 400 for empty file key', async () => {
            const response = await request(app)
                .get('/download/');

            expect(response.status).toBe(404); // Express returns 404 for missing route params
        });

        test('should return 400 for invalid expiration time', async () => {
            const response = await request(app)
                .get('/download/uploads/test.jpg')
                .query({ expiresIn: '30' }); // Less than 60 seconds

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Expiration time must be between 60 seconds and 24 hours');
        });

        test('should return 404 when file does not exist', async () => {
            s3Service.fileExists.mockResolvedValue(false);

            const response = await request(app)
                .get('/download/uploads/nonexistent.jpg');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('File not found');
        });

        test('should return 400 when S3 service fails', async () => {
            s3Service.fileExists.mockResolvedValue(true);
            s3Service.generateDownloadUrl.mockResolvedValue({
                success: false,
                error: 'Access denied'
            });

            const response = await request(app)
                .get('/download/uploads/test.jpg');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Access denied');
        });
    });

    describe('GET /exists/:fileKey', () => {
        test('should check file existence successfully', async () => {
            s3Service.fileExists.mockResolvedValue(true);

            const response = await request(app)
                .get('/exists/uploads/test.jpg');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual({
                exists: true,
                fileKey: 'uploads/test.jpg'
            });
        });

        test('should return false when file does not exist', async () => {
            s3Service.fileExists.mockResolvedValue(false);

            const response = await request(app)
                .get('/exists/uploads/nonexistent.jpg');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual({
                exists: false,
                fileKey: 'uploads/nonexistent.jpg'
            });
        });

        test('should handle internal server errors', async () => {
            s3Service.fileExists.mockRejectedValue(new Error('Internal error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .get('/exists/uploads/test.jpg');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Internal server error while checking file existence');

            consoleSpy.mockRestore();
        });
    });

    describe('GET /file-types', () => {
        test('should return supported file types', async () => {
            // Mock the ALLOWED_FILE_TYPES
            s3Service.ALLOWED_FILE_TYPES = {
                'image/jpeg': { extension: 'jpg', maxSize: 5 * 1024 * 1024 },
                'image/png': { extension: 'png', maxSize: 5 * 1024 * 1024 },
                'application/pdf': { extension: 'pdf', maxSize: 10 * 1024 * 1024 }
            };

            const response = await request(app)
                .get('/file-types');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.fileTypes).toHaveLength(3);
            expect(response.body.data.fileTypes[0]).toEqual({
                mimeType: 'image/jpeg',
                extension: 'jpg',
                maxSize: 5 * 1024 * 1024,
                maxSizeMB: '5.0'
            });
            expect(response.body.data.totalTypes).toBe(3);
        });

        test('should handle internal server errors', async () => {
            // Mock require to throw an error
            const originalRequire = require;
            jest.doMock('../services/s3Service', () => {
                throw new Error('Module not found');
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .get('/file-types');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Internal server error while retrieving file types');

            consoleSpy.mockRestore();
        });
    });

    describe('POST /upload', () => {
        test('should upload file successfully', async () => {
            const mockResult = {
                success: true,
                data: {
                    fileKey: 'uploads/test_123456_abcdef.jpg',
                    fileUrl: 'https://test-bucket.s3.amazonaws.com/uploads/test_123456_abcdef.jpg',
                    s3Location: 'https://test-bucket.s3.amazonaws.com/uploads/test_123456_abcdef.jpg',
                    s3ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
                    fileSize: 1024,
                    contentType: 'image/jpeg',
                    uploadedAt: '2023-01-01T12:00:00.000Z',
                    metadata: {
                        originalName: 'test.jpg',
                        folder: 'uploads'
                    }
                }
            };

            s3Service.contractUploadS3.mockResolvedValue(mockResult);

            const response = await request(app)
                .post('/upload')
                .set('Content-Type', 'multipart/form-data')
                .field('folder', 'uploads')
                .field('metadata', JSON.stringify({ userId: '123' }));

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockResult.data);
            expect(s3Service.contractUploadS3).toHaveBeenCalledWith({
                fileBuffer: expect.any(Buffer),
                fileName: 'test.jpg',
                contentType: 'image/jpeg',
                folder: 'uploads',
                metadata: { userId: '123' }
            });
        });

        test('should use default folder when not specified', async () => {
            const mockResult = {
                success: true,
                data: {
                    fileKey: 'uploads/test_123456_abcdef.jpg',
                    fileUrl: 'https://test-bucket.s3.amazonaws.com/uploads/test_123456_abcdef.jpg',
                    s3Location: 'https://test-bucket.s3.amazonaws.com/uploads/test_123456_abcdef.jpg',
                    s3ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
                    fileSize: 1024,
                    contentType: 'image/jpeg',
                    uploadedAt: '2023-01-01T12:00:00.000Z',
                    metadata: {
                        originalName: 'test.jpg',
                        folder: 'uploads'
                    }
                }
            };

            s3Service.contractUploadS3.mockResolvedValue(mockResult);

            const response = await request(app)
                .post('/upload')
                .set('Content-Type', 'multipart/form-data');

            expect(response.status).toBe(201);
            expect(s3Service.contractUploadS3).toHaveBeenCalledWith({
                fileBuffer: expect.any(Buffer),
                fileName: 'test.jpg',
                contentType: 'image/jpeg',
                folder: 'uploads',
                metadata: {}
            });
        });

        test('should return 400 when no file is uploaded', async () => {
            const response = await request(app)
                .post('/upload');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('No file uploaded. Please provide a file in the request.');
        });

        test('should return 400 for invalid metadata JSON', async () => {
            const response = await request(app)
                .post('/upload')
                .set('Content-Type', 'multipart/form-data')
                .field('metadata', 'invalid json');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid metadata format. Must be valid JSON.');
        });

        test('should return 400 when S3 service fails', async () => {
            s3Service.contractUploadS3.mockResolvedValue({
                success: false,
                error: 'File type not allowed',
                details: { fileName: 'test.exe', contentType: 'application/exe', fileSize: 1024 }
            });

            const response = await request(app)
                .post('/upload')
                .set('Content-Type', 'multipart/form-data');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('File type not allowed');
            expect(response.body.details).toEqual({
                fileName: 'test.exe',
                contentType: 'application/exe',
                fileSize: 1024
            });
        });

        test('should handle internal server errors', async () => {
            s3Service.contractUploadS3.mockRejectedValue(new Error('Internal error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .post('/upload')
                .set('Content-Type', 'multipart/form-data');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Internal server error while uploading file');

            consoleSpy.mockRestore();
        });
    });

    describe('DELETE /files/:fileKey', () => {
        test('should delete file successfully', async () => {
            const mockResult = {
                success: true,
                data: {
                    fileKey: 'uploads/test.jpg',
                    deletedAt: '2023-01-01T12:00:00.000Z'
                }
            };

            s3Service.fileExists.mockResolvedValue(true);
            s3Service.deleteFile.mockResolvedValue(mockResult);

            const response = await request(app)
                .delete('/files/uploads/test.jpg');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockResult.data);
            expect(s3Service.fileExists).toHaveBeenCalledWith('uploads/test.jpg');
            expect(s3Service.deleteFile).toHaveBeenCalledWith('uploads/test.jpg');
        });

        test('should return 400 for empty file key', async () => {
            const response = await request(app)
                .delete('/files/');

            expect(response.status).toBe(404); // Express returns 404 for missing route params
        });

        test('should return 404 when file does not exist', async () => {
            s3Service.fileExists.mockResolvedValue(false);

            const response = await request(app)
                .delete('/files/uploads/nonexistent.jpg');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('File not found');
        });

        test('should return 400 when S3 service fails', async () => {
            s3Service.fileExists.mockResolvedValue(true);
            s3Service.deleteFile.mockResolvedValue({
                success: false,
                error: 'Access denied',
                details: { fileKey: 'uploads/test.jpg' }
            });

            const response = await request(app)
                .delete('/files/uploads/test.jpg');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Access denied');
            expect(response.body.details).toEqual({ fileKey: 'uploads/test.jpg' });
        });

        test('should handle internal server errors', async () => {
            s3Service.fileExists.mockRejectedValue(new Error('Internal error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .delete('/files/uploads/test.jpg');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Internal server error while deleting file');

            consoleSpy.mockRestore();
        });
    });
});