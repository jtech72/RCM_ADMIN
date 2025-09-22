const { contractUploadS3, deleteFile, generateFileKey, validateFileUpload } = require('../services/s3Service');

describe('S3 Integration - contractUploadS3', () => {
    // Mock the S3 config
    jest.mock('../config/s3', () => ({
        s3Client: {
            upload: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({
                    Location: 'https://test-bucket.s3.amazonaws.com/uploads/test_123456_abcdef.jpg',
                    ETag: '"d41d8cd98f00b204e9800998ecf8427e"'
                })
            }),
            deleteObject: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            })
        },
        getBucketInfo: jest.fn(() => ({
            bucketName: 'test-bucket',
            region: 'us-east-1',
            bucketUrl: 'https://test-bucket.s3.us-east-1.amazonaws.com'
        }))
    }));

    test('contractUploadS3 should upload file buffer successfully', async () => {
        const fileBuffer = Buffer.from('test file content for upload');
        const params = {
            fileBuffer,
            fileName: 'test-upload.jpg',
            contentType: 'image/jpeg',
            folder: 'test-uploads',
            metadata: {
                userId: 'test-user-123',
                purpose: 'profile-picture'
            }
        };

        const result = await contractUploadS3(params);

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('fileKey');
        expect(result.data).toHaveProperty('fileUrl');
        expect(result.data).toHaveProperty('s3Location');
        expect(result.data).toHaveProperty('s3ETag');
        expect(result.data.fileSize).toBe(fileBuffer.length);
        expect(result.data.contentType).toBe('image/jpeg');
        expect(result.data.metadata.originalName).toBe('test-upload.jpg');
        expect(result.data.metadata.folder).toBe('test-uploads');
        expect(result.data.metadata.userId).toBe('test-user-123');
        expect(result.data.metadata.purpose).toBe('profile-picture');
    });

    test('contractUploadS3 should validate file types correctly', async () => {
        const fileBuffer = Buffer.from('test content');

        // Test valid file type
        const validParams = {
            fileBuffer,
            fileName: 'test.jpg',
            contentType: 'image/jpeg'
        };

        const validResult = await contractUploadS3(validParams);
        expect(validResult.success).toBe(true);

        // Test invalid file type
        const invalidParams = {
            fileBuffer,
            fileName: 'test.exe',
            contentType: 'application/exe'
        };

        const invalidResult = await contractUploadS3(invalidParams);
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.error).toContain('File type \'application/exe\' is not allowed');
    });

    test('contractUploadS3 should validate file size correctly', async () => {
        // Test oversized file (10MB for image/jpeg which has 5MB limit)
        const largeBuffer = Buffer.alloc(10 * 1024 * 1024);
        const params = {
            fileBuffer: largeBuffer,
            fileName: 'large-image.jpg',
            contentType: 'image/jpeg'
        };

        const result = await contractUploadS3(params);
        expect(result.success).toBe(false);
        expect(result.error).toContain('File size exceeds maximum allowed size');
    });

    test('generateFileKey should create unique keys', () => {
        const fileName = 'test-file.jpg';
        const contentType = 'image/jpeg';

        const key1 = generateFileKey(fileName, contentType, 'uploads');
        const key2 = generateFileKey(fileName, contentType, 'uploads');

        expect(key1).toMatch(/^uploads\/test-file_\d+_[a-f0-9]{16}\.jpg$/);
        expect(key2).toMatch(/^uploads\/test-file_\d+_[a-f0-9]{16}\.jpg$/);
        expect(key1).not.toBe(key2); // Should be unique
    });

    test('validateFileUpload should work correctly', () => {
        // Valid cases
        expect(validateFileUpload('image/jpeg', 1024 * 1024).isValid).toBe(true);
        expect(validateFileUpload('application/pdf', 5 * 1024 * 1024).isValid).toBe(true);

        // Invalid cases
        expect(validateFileUpload('application/exe', 1024).isValid).toBe(false);
        expect(validateFileUpload('image/jpeg', 10 * 1024 * 1024).isValid).toBe(false);
    });

    test('deleteFile should work correctly', async () => {
        const result = await deleteFile('uploads/test-file.jpg');

        expect(result.success).toBe(true);
        expect(result.data.fileKey).toBe('uploads/test-file.jpg');
        expect(result.data.deletedAt).toBeDefined();
    });
});