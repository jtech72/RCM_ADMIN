const AWS = require('aws-sdk');
require('dotenv').config();

/**
 * Validates that all required AWS environment variables are present
 * @returns {Object} Validation result with isValid boolean and missing fields array
 */
const validateAWSEnvironment = () => {
    const requiredVars = [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'S3_BUCKET_NAME',
        'AWS_REGION'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    return {
        isValid: missing.length === 0,
        missing: missing
    };
};

/**
 * Creates and configures AWS S3 client
 * @returns {AWS.S3} Configured S3 client instance
 * @throws {Error} If required environment variables are missing
 */
const createS3Client = () => {
    // Validate environment variables
    const validation = validateAWSEnvironment();
    if (!validation.isValid) {
        throw new Error(`Missing required AWS environment variables: ${validation.missing.join(', ')}`);
    }

    // Configure AWS SDK
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

    // Create S3 client with additional configuration
    const s3Client = new AWS.S3({
        apiVersion: '2006-03-01',
        signatureVersion: 'v4',
        region: process.env.AWS_REGION,
        // Add retry configuration for better reliability
        maxRetries: 3,
        retryDelayOptions: {
            customBackoff: function (retryCount) {
                return Math.pow(2, retryCount) * 100; // Exponential backoff
            }
        }
    });

    return s3Client;
};

/**
 * Tests S3 connection by attempting to list bucket contents
 * @param {AWS.S3} s3Client - S3 client instance
 * @returns {Promise<boolean>} True if connection successful
 */
const testS3Connection = async (s3Client) => {
    try {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            MaxKeys: 1 // Only get 1 object to minimize data transfer
        };

        await s3Client.listObjectsV2(params).promise();
        return true;
    } catch (error) {
        console.error('S3 connection test failed:', error.message);
        return false;
    }
};

/**
 * Gets S3 bucket information
 * @returns {Object} Bucket configuration details
 */
const getBucketInfo = () => {
    return {
        bucketName: process.env.S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
        bucketUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`
    };
};

// Initialize S3 client
let s3Client;
try {
    s3Client = createS3Client();
    console.log('✅ S3 client initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize S3 client:', error.message);
    s3Client = null;
}

module.exports = {
    s3Client,
    createS3Client,
    validateAWSEnvironment,
    testS3Connection,
    getBucketInfo
};