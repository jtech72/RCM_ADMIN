const AWS = require('aws-sdk');
const {
    createS3Client,
    validateAWSEnvironment,
    testS3Connection,
    getBucketInfo
} = require('../config/s3');

// Mock AWS SDK
jest.mock('aws-sdk');

describe('S3 Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset environment variables before each test
        jest.resetModules();
        process.env = { ...originalEnv };

        // Clear AWS SDK mocks
        jest.clearAllMocks();
    });

    afterAll(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('validateAWSEnvironment', () => {
        test('should return valid when all required variables are present', () => {
            process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
            process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
            process.env.S3_BUCKET_NAME = 'test-bucket';
            process.env.AWS_REGION = 'us-east-1';

            const result = validateAWSEnvironment();

            expect(result.isValid).toBe(true);
            expect(result.missing).toEqual([]);
        });

        test('should return invalid when AWS_ACCESS_KEY_ID is missing', () => {
            delete process.env.AWS_ACCESS_KEY_ID;
            process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
            process.env.S3_BUCKET_NAME = 'test-bucket';
            process.env.AWS_REGION = 'us-east-1';

            const result = validateAWSEnvironment();

            expect(result.isValid).toBe(false);
            expect(result.missing).toContain('AWS_ACCESS_KEY_ID');
        });

        test('should return invalid when multiple variables are missing', () => {
            delete process.env.AWS_ACCESS_KEY_ID;
            delete process.env.S3_BUCKET_NAME;
            process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
            process.env.AWS_REGION = 'us-east-1';

            const result = validateAWSEnvironment();

            expect(result.isValid).toBe(false);
            expect(result.missing).toEqual(['AWS_ACCESS_KEY_ID', 'S3_BUCKET_NAME']);
        });

        test('should return invalid when all variables are missing', () => {
            delete process.env.AWS_ACCESS_KEY_ID;
            delete process.env.AWS_SECRET_ACCESS_KEY;
            delete process.env.S3_BUCKET_NAME;
            delete process.env.AWS_REGION;

            const result = validateAWSEnvironment();

            expect(result.isValid).toBe(false);
            expect(result.missing).toEqual([
                'AWS_ACCESS_KEY_ID',
                'AWS_SECRET_ACCESS_KEY',
                'S3_BUCKET_NAME',
                'AWS_REGION'
            ]);
        });
    });

    describe('createS3Client', () => {
        test('should create S3 client when all environment variables are present', () => {
            process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
            process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
            process.env.S3_BUCKET_NAME = 'test-bucket';
            process.env.AWS_REGION = 'us-east-1';

            const mockS3Instance = { apiVersion: '2006-03-01' };
            AWS.S3.mockImplementation(() => mockS3Instance);
            AWS.config = { update: jest.fn() };

            const s3Client = createS3Client();

            expect(AWS.config.update).toHaveBeenCalledWith({
                accessKeyId: 'test-access-key',
                secretAccessKey: 'test-secret-key',
                region: 'us-east-1'
            });

            expect(AWS.S3).toHaveBeenCalledWith({
                apiVersion: '2006-03-01',
                signatureVersion: 'v4',
                region: 'us-east-1',
                maxRetries: 3,
                retryDelayOptions: {
                    customBackoff: expect.any(Function)
                }
            });

            expect(s3Client).toBe(mockS3Instance);
        });

        test('should throw error when required environment variables are missing', () => {
            delete process.env.AWS_ACCESS_KEY_ID;
            process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
            process.env.S3_BUCKET_NAME = 'test-bucket';
            process.env.AWS_REGION = 'us-east-1';

            expect(() => createS3Client()).toThrow(
                'Missing required AWS environment variables: AWS_ACCESS_KEY_ID'
            );
        });

        test('should configure exponential backoff correctly', () => {
            process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
            process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
            process.env.S3_BUCKET_NAME = 'test-bucket';
            process.env.AWS_REGION = 'us-east-1';

            AWS.S3.mockImplementation(() => ({}));
            AWS.config = { update: jest.fn() };

            createS3Client();

            const s3Config = AWS.S3.mock.calls[0][0];
            const backoffFunction = s3Config.retryDelayOptions.customBackoff;

            expect(backoffFunction(1)).toBe(200); // 2^1 * 100
            expect(backoffFunction(2)).toBe(400); // 2^2 * 100
            expect(backoffFunction(3)).toBe(800); // 2^3 * 100
        });
    });

    describe('testS3Connection', () => {
        test('should return true when S3 connection is successful', async () => {
            process.env.S3_BUCKET_NAME = 'test-bucket';

            const mockS3Client = {
                listObjectsV2: jest.fn().mockReturnValue({
                    promise: jest.fn().mockResolvedValue({ Contents: [] })
                })
            };

            const result = await testS3Connection(mockS3Client);

            expect(result).toBe(true);
            expect(mockS3Client.listObjectsV2).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                MaxKeys: 1
            });
        });

        test('should return false when S3 connection fails', async () => {
            process.env.S3_BUCKET_NAME = 'test-bucket';

            const mockS3Client = {
                listObjectsV2: jest.fn().mockReturnValue({
                    promise: jest.fn().mockRejectedValue(new Error('Access denied'))
                })
            };

            // Mock console.error to avoid test output pollution
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await testS3Connection(mockS3Client);

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('S3 connection test failed:', 'Access denied');

            consoleSpy.mockRestore();
        });

        test('should handle network errors gracefully', async () => {
            process.env.S3_BUCKET_NAME = 'test-bucket';

            const mockS3Client = {
                listObjectsV2: jest.fn().mockReturnValue({
                    promise: jest.fn().mockRejectedValue(new Error('Network timeout'))
                })
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await testS3Connection(mockS3Client);

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('S3 connection test failed:', 'Network timeout');

            consoleSpy.mockRestore();
        });
    });

    describe('getBucketInfo', () => {
        test('should return correct bucket information', () => {
            process.env.S3_BUCKET_NAME = 'my-test-bucket';
            process.env.AWS_REGION = 'ap-south-1';

            const bucketInfo = getBucketInfo();

            expect(bucketInfo).toEqual({
                bucketName: 'my-test-bucket',
                region: 'ap-south-1',
                bucketUrl: 'https://my-test-bucket.s3.ap-south-1.amazonaws.com'
            });
        });

        test('should handle different regions correctly', () => {
            process.env.S3_BUCKET_NAME = 'eu-bucket';
            process.env.AWS_REGION = 'eu-west-1';

            const bucketInfo = getBucketInfo();

            expect(bucketInfo.bucketUrl).toBe('https://eu-bucket.s3.eu-west-1.amazonaws.com');
        });
    });
});