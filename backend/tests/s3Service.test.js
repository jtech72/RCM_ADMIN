const {
    generatePresignedUrl,
    generateDownloadUrl,
    contractUploadS3,
    deleteFile,
    validateFileUpload,
    generateFileKey,
    fileExists,
    ALLOWED_FILE_TYPES
} = require('../services/s3Service');

// Mock the S3 config
jest.mock('../config/s3', () => ({
    s3Client: {
        getSignedUrlPromise: jest.fn(),
        headObject: jest.fn(),
        upload: jest.fn(),
        deleteObject: jest.fn()
    },
    getBucketInfo: jest.fn(() => ({
        bucketName: 'test-bucket',
        region: 'us-east-1',
        bucketUrl: 'https://test-bucket.s3.us-east-1.amazonaws.com'
    }))
}));

const { s3Client, getBucketInfo } = require('../config/s3');

describe('S3 Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validateFileUpload', () => {
        test('should validate allowed image file types', () => {
            const result = validateFileUpload('image/jpeg', 1024 * 1024); // 1MB
            expect(result.isValid).toBe(true);
        });

        test('should reject disallowed file types', () => {
            const result = validateFileUpload('application/exe', 1024);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('File type \'application/exe\' is not allowed');
        });

        test('should reject files exceeding size limit', () => {
            const result = validateFileUpload('image/jpeg', 10 * 1024 * 1024); // 10MB (exceeds 5MB limit)
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('File size exceeds maximum allowed size');
        });

        test('should validate PDF files with correct size', () => {
            const result = validateFileUpload('application/pdf', 5 * 1024 * 1024); // 5MB
            expect(result.isValid).toBe(true);
        });

        test('should reject PDF files exceeding size limit', () => {
            const result = validateFileUpload('application/pdf', 15 * 1024 * 1024); // 15MB (exceeds 10MB limit)
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('File size exceeds maximum allowed size of 10.0MB');
        });
    });

    describe('generateFileKey', () => {
        test('should generate unique file key with timestamp and random string', () => {
            const originalName = 'test-image.jpg';
            const contentType = 'image/jpeg';

            const key1 = generateFileKey(originalName, contentType);
            const key2 = generateFileKey(originalName, contentType);

            expect(key1).toMatch(/^uploads\/test-image_\d+_[a-f0-9]{16}\.jpg$/);
            expect(key2).toMatch(/^uploads\/test-image_\d+_[a-f0-9]{16}\.jpg$/);
            expect(key1).not.toBe(key2); // Should be unique
        });

        test('should clean special characters from filename', () => {
            const originalName = 'test@#$%^&*()image!.jpg';
            const contentType = 'image/jpeg';

            const key = generateFileKey(originalName, contentType);

            // The function replaces special chars with underscore, then replaces multiple underscores with single
            // Should match pattern like: uploads/test_image__1234567890_abcdef1234567890.jpg
            expect(key).toMatch(/^uploads\/test_image_+\d+_[a-f0-9]{16}\.jpg$/);
            expect(key).toContain('test_image');
            expect(key).toContain('.jpg');
        });

        test('should use custom folder', () => {
            const originalName = 'document.pdf';
            const contentType = 'application/pdf';
            const folder = 'documents';

            const key = generateFileKey(originalName, contentType, folder);

            expect(key).toMatch(/^documents\/document_\d+_[a-f0-9]{16}\.pdf$/);
        });

        test('should handle files without extensions', () => {
            const originalName = 'testfile';
            const contentType = 'image/png';

            const key = generateFileKey(originalName, contentType);

            expect(key).toMatch(/^uploads\/testfile_\d+_[a-f0-9]{16}\.png$/);
        });
    });

    describe('generatePresignedUrl', () => {
        test('should generate presigned URL successfully', async () => {
            const mockPresignedUrl = 'https://test-bucket.s3.amazonaws.com/presigned-url';
            s3Client.getSignedUrlPromise.mockResolvedValue(mockPresignedUrl);

            const params = {
                fileName: 'test.jpg',
                contentType: 'image/jpeg',
                fileSize: 1024 * 1024, // 1MB
                folder: 'uploads',
                expiresIn: 300
            };

            const result = await generatePresignedUrl(params);

            expect(result.success).toBe(true);
            expect(result.data.presignedUrl).toBe(mockPresignedUrl);
            expect(result.data.fileKey).toMatch(/^uploads\/test_\d+_[a-f0-9]{16}\.jpg$/);
            expect(result.data.fileUrl).toMatch(/^https:\/\/test-bucket\.s3\.us-east-1\.amazonaws\.com\/uploads\/test_\d+_[a-f0-9]{16}\.jpg$/);
            expect(result.data.expiresAt).toBeDefined();
            expect(result.data.uploadHeaders).toEqual({
                'Content-Type': 'image/jpeg',
                'Content-Length': '1048576'
            });

            expect(s3Client.getSignedUrlPromise).toHaveBeenCalledWith('putObject', expect.objectContaining({
                Bucket: 'test-bucket',
                ContentType: 'image/jpeg',
                ContentLength: 1048576,
                Expires: 300
            }));
        });

        test('should fail when S3 client is not initialized', async () => {
            // Mock s3Client as null
            const { s3Client } = require('../config/s3');
            const originalS3Client = s3Client;

            // Temporarily mock the s3Client as null
            jest.doMock('../config/s3', () => ({
                s3Client: null,
                getBucketInfo: jest.fn(() => ({
                    bucketName: 'test-bucket',
                    region: 'us-east-1',
                    bucketUrl: 'https://test-bucket.s3.us-east-1.amazonaws.com'
                }))
            }));

            // Re-require the service to get the mocked version
            delete require.cache[require.resolve('../services/s3Service')];
            const { generatePresignedUrl: mockedGeneratePresignedUrl } = require('../services/s3Service');

            const params = {
                fileName: 'test.jpg',
                contentType: 'image/jpeg',
                fileSize: 1024 * 1024
            };

            const result = await mockedGeneratePresignedUrl(params);

            expect(result.success).toBe(false);
            expect(result.error).toBe('S3 client not initialized. Check AWS configuration.');

            // Restore the original mock
            jest.doMock('../config/s3', () => ({
                s3Client: {
                    getSignedUrlPromise: jest.fn(),
                    headObject: jest.fn(),
                    upload: jest.fn(),
                    deleteObject: jest.fn()
                },
                getBucketInfo: jest.fn(() => ({
                    bucketName: 'test-bucket',
                    region: 'us-east-1',
                    bucketUrl: 'https://test-bucket.s3.us-east-1.amazonaws.com'
                }))
            }));
            delete require.cache[require.resolve('../services/s3Service')];
        });

        test('should fail for invalid file type', async () => {
            const params = {
                fileName: 'test.exe',
                contentType: 'application/exe',
                fileSize: 1024
            };

            const result = await generatePresignedUrl(params);

            expect(result.success).toBe(false);
            expect(result.error).toContain('File type \'application/exe\' is not allowed');
        });

        test('should fail for oversized file', async () => {
            const params = {
                fileName: 'test.jpg',
                contentType: 'image/jpeg',
                fileSize: 10 * 1024 * 1024 // 10MB (exceeds 5MB limit)
            };

            const result = await generatePresignedUrl(params);

            expect(result.success).toBe(false);
            expect(result.error).toContain('File size exceeds maximum allowed size');
        });

        test('should handle S3 errors gracefully', async () => {
            s3Client.getSignedUrlPromise.mockRejectedValue(new Error('S3 service unavailable'));

            const params = {
                fileName: 'test.jpg',
                contentType: 'image/jpeg',
                fileSize: 1024 * 1024
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await generatePresignedUrl(params);

            expect(result.success).toBe(false);
            expect(result.error).toBe('S3 service unavailable');
            expect(consoleSpy).toHaveBeenCalledWith('Error generating presigned URL:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('generateDownloadUrl', () => {
        test('should generate download URL successfully', async () => {
            const mockDownloadUrl = 'https://test-bucket.s3.amazonaws.com/download-url';
            s3Client.getSignedUrlPromise.mockResolvedValue(mockDownloadUrl);

            const result = await generateDownloadUrl('uploads/test.jpg', 3600);

            expect(result.success).toBe(true);
            expect(result.data.downloadUrl).toBe(mockDownloadUrl);
            expect(result.data.expiresAt).toBeDefined();

            expect(s3Client.getSignedUrlPromise).toHaveBeenCalledWith('getObject', {
                Bucket: 'test-bucket',
                Key: 'uploads/test.jpg',
                Expires: 3600
            });
        });

        test('should fail when S3 client is not initialized', async () => {
            const originalS3Client = require('../config/s3').s3Client;
            require('../config/s3').s3Client = null;

            const result = await generateDownloadUrl('uploads/test.jpg');

            expect(result.success).toBe(false);
            expect(result.error).toBe('S3 client not initialized. Check AWS configuration.');

            require('../config/s3').s3Client = originalS3Client;
        });

        test('should handle S3 errors gracefully', async () => {
            s3Client.getSignedUrlPromise.mockRejectedValue(new Error('Access denied'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await generateDownloadUrl('uploads/test.jpg');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Access denied');

            consoleSpy.mockRestore();
        });
    });

    describe('fileExists', () => {
        test('should return true when file exists', async () => {
            s3Client.headObject.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const result = await fileExists('uploads/test.jpg');

            expect(result).toBe(true);
            expect(s3Client.headObject).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                Key: 'uploads/test.jpg'
            });
        });

        test('should return false when file does not exist', async () => {
            const notFoundError = new Error('Not Found');
            notFoundError.code = 'NotFound';

            s3Client.headObject.mockReturnValue({
                promise: jest.fn().mockRejectedValue(notFoundError)
            });

            const result = await fileExists('uploads/nonexistent.jpg');

            expect(result).toBe(false);
        });

        test('should return false when S3 client is not initialized', async () => {
            const originalS3Client = require('../config/s3').s3Client;
            require('../config/s3').s3Client = null;

            const result = await fileExists('uploads/test.jpg');

            expect(result).toBe(false);

            require('../config/s3').s3Client = originalS3Client;
        });

        test('should handle other S3 errors gracefully', async () => {
            s3Client.headObject.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('Access denied'))
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await fileExists('uploads/test.jpg');

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('Error checking file existence:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('contractUploadS3', () => {
        test('should upload file buffer successfully', async () => {
            const mockUploadResult = {
                Location: 'https://test-bucket.s3.amazonaws.com/uploads/test_123456789_abcdef12.jpg',
                ETag: '"d41d8cd98f00b204e9800998ecf8427e"'
            };

            s3Client.upload.mockReturnValue({
                promise: jest.fn().mockResolvedValue(mockUploadResult)
            });

            const fileBuffer = Buffer.from('test file content');
            const params = {
                fileBuffer,
                fileName: 'test.jpg',
                contentType: 'image/jpeg',
                folder: 'uploads',
                metadata: { userId: '123', purpose: 'profile' }
            };

            const result = await contractUploadS3(params);

            expect(result.success).toBe(true);
            expect(result.data.fileKey).toMatch(/^uploads\/test_\d+_[a-f0-9]{16}\.jpg$/);
            expect(result.data.fileUrl).toMatch(/^https:\/\/test-bucket\.s3\.us-east-1\.amazonaws\.com\/uploads\/test_\d+_[a-f0-9]{16}\.jpg$/);
            expect(result.data.s3Location).toBe(mockUploadResult.Location);
            expect(result.data.s3ETag).toBe(mockUploadResult.ETag);
            expect(result.data.fileSize).toBe(fileBuffer.length);
            expect(result.data.contentType).toBe('image/jpeg');
            expect(result.data.uploadedAt).toBeDefined();
            expect(result.data.metadata.originalName).toBe('test.jpg');
            expect(result.data.metadata.folder).toBe('uploads');
            expect(result.data.metadata.userId).toBe('123');

            expect(s3Client.upload).toHaveBeenCalledWith(expect.objectContaining({
                Bucket: 'test-bucket',
                Body: fileBuffer,
                ContentType: 'image/jpeg',
                ContentLength: fileBuffer.length,
                ACL: 'private',
                Metadata: expect.objectContaining({
                    'original-name': 'test.jpg',
                    'upload-timestamp': expect.any(String),
                    'upload-method': 'server-side',
                    userId: '123',
                    purpose: 'profile'
                })
            }));
        });

        test('should fail when S3 client is not initialized', async () => {
            const originalS3Client = require('../config/s3').s3Client;
            require('../config/s3').s3Client = null;

            const fileBuffer = Buffer.from('test content');
            const params = {
                fileBuffer,
                fileName: 'test.jpg',
                contentType: 'image/jpeg'
            };

            const result = await contractUploadS3(params);

            expect(result.success).toBe(false);
            expect(result.error).toBe('S3 client not initialized. Check AWS configuration.');

            require('../config/s3').s3Client = originalS3Client;
        });

        test('should fail with invalid file buffer', async () => {
            const params = {
                fileBuffer: 'not a buffer',
                fileName: 'test.jpg',
                contentType: 'image/jpeg'
            };

            const result = await contractUploadS3(params);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid file buffer provided');
        });

        test('should fail with missing filename', async () => {
            const fileBuffer = Buffer.from('test content');
            const params = {
                fileBuffer,
                fileName: '',
                contentType: 'image/jpeg'
            };

            const result = await contractUploadS3(params);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Valid filename is required');
        });

        test('should fail with missing content type', async () => {
            const fileBuffer = Buffer.from('test content');
            const params = {
                fileBuffer,
                fileName: 'test.jpg',
                contentType: ''
            };

            const result = await contractUploadS3(params);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Valid content type is required');
        });

        test('should fail for invalid file type', async () => {
            const fileBuffer = Buffer.from('test content');
            const params = {
                fileBuffer,
                fileName: 'test.exe',
                contentType: 'application/exe'
            };

            const result = await contractUploadS3(params);

            expect(result.success).toBe(false);
            expect(result.error).toContain('File type \'application/exe\' is not allowed');
        });

        test('should fail for oversized file', async () => {
            const fileBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
            const params = {
                fileBuffer,
                fileName: 'test.jpg',
                contentType: 'image/jpeg'
            };

            const result = await contractUploadS3(params);

            expect(result.success).toBe(false);
            expect(result.error).toContain('File size exceeds maximum allowed size');
        });

        test('should handle S3 upload errors gracefully', async () => {
            s3Client.upload.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('S3 upload failed'))
            });

            const fileBuffer = Buffer.from('test content');
            const params = {
                fileBuffer,
                fileName: 'test.jpg',
                contentType: 'image/jpeg'
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await contractUploadS3(params);

            expect(result.success).toBe(false);
            expect(result.error).toBe('S3 upload failed');
            expect(result.details.fileName).toBe('test.jpg');
            expect(result.details.contentType).toBe('image/jpeg');
            expect(consoleSpy).toHaveBeenCalledWith('Error uploading file to S3:', expect.any(Error));

            consoleSpy.mockRestore();
        });

        test('should use default folder when not specified', async () => {
            const mockUploadResult = {
                Location: 'https://test-bucket.s3.amazonaws.com/uploads/test_123456789_abcdef12.jpg',
                ETag: '"d41d8cd98f00b204e9800998ecf8427e"'
            };

            s3Client.upload.mockReturnValue({
                promise: jest.fn().mockResolvedValue(mockUploadResult)
            });

            const fileBuffer = Buffer.from('test content');
            const params = {
                fileBuffer,
                fileName: 'test.jpg',
                contentType: 'image/jpeg'
            };

            const result = await contractUploadS3(params);

            expect(result.success).toBe(true);
            expect(result.data.fileKey).toMatch(/^uploads\/test_\d+_[a-f0-9]{16}\.jpg$/);
            expect(result.data.metadata.folder).toBe('uploads');
        });
    });

    describe('deleteFile', () => {
        test('should delete file successfully', async () => {
            s3Client.deleteObject.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const result = await deleteFile('uploads/test.jpg');

            expect(result.success).toBe(true);
            expect(result.data.fileKey).toBe('uploads/test.jpg');
            expect(result.data.deletedAt).toBeDefined();

            expect(s3Client.deleteObject).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                Key: 'uploads/test.jpg'
            });
        });

        test('should fail when S3 client is not initialized', async () => {
            const originalS3Client = require('../config/s3').s3Client;
            require('../config/s3').s3Client = null;

            const result = await deleteFile('uploads/test.jpg');

            expect(result.success).toBe(false);
            expect(result.error).toBe('S3 client not initialized. Check AWS configuration.');

            require('../config/s3').s3Client = originalS3Client;
        });

        test('should fail with invalid file key', async () => {
            const result = await deleteFile('');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Valid file key is required');
        });

        test('should handle S3 delete errors gracefully', async () => {
            s3Client.deleteObject.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('Access denied'))
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await deleteFile('uploads/test.jpg');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Access denied');
            expect(result.details.fileKey).toBe('uploads/test.jpg');
            expect(consoleSpy).toHaveBeenCalledWith('Error deleting file from S3:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('ALLOWED_FILE_TYPES', () => {
        test('should contain expected file types', () => {
            expect(ALLOWED_FILE_TYPES).toHaveProperty('image/jpeg');
            expect(ALLOWED_FILE_TYPES).toHaveProperty('image/png');
            expect(ALLOWED_FILE_TYPES).toHaveProperty('application/pdf');
            expect(ALLOWED_FILE_TYPES).toHaveProperty('video/mp4');
        });

        test('should have proper configuration for each file type', () => {
            Object.entries(ALLOWED_FILE_TYPES).forEach(([mimeType, config]) => {
                expect(config).toHaveProperty('extension');
                expect(config).toHaveProperty('maxSize');
                expect(typeof config.extension).toBe('string');
                expect(typeof config.maxSize).toBe('number');
                expect(config.maxSize).toBeGreaterThan(0);
            });
        });
    });
});