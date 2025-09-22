const { s3Client, getBucketInfo } = require('../config/s3');
const crypto = require('crypto');

/**
 * Supported file types for uploads
 */
const ALLOWED_FILE_TYPES = {
    // Images
    'image/jpeg': { extension: 'jpg', maxSize: 5 * 1024 * 1024 }, // 5MB
    'image/jpg': { extension: 'jpg', maxSize: 5 * 1024 * 1024 },
    'image/png': { extension: 'png', maxSize: 5 * 1024 * 1024 },
    'image/gif': { extension: 'gif', maxSize: 2 * 1024 * 1024 }, // 2MB
    'image/webp': { extension: 'webp', maxSize: 5 * 1024 * 1024 },

    // Documents
    'application/pdf': { extension: 'pdf', maxSize: 10 * 1024 * 1024 }, // 10MB
    'text/plain': { extension: 'txt', maxSize: 1 * 1024 * 1024 }, // 1MB

    // Videos (for future use)
    'video/mp4': { extension: 'mp4', maxSize: 50 * 1024 * 1024 }, // 50MB
    'video/webm': { extension: 'webm', maxSize: 50 * 1024 * 1024 }
};

/**
 * Validates file type and size for upload
 * @param {string} contentType - MIME type of the file
 * @param {number} fileSize - Size of the file in bytes
 * @returns {Object} Validation result with isValid boolean and error message
 */
const validateFileUpload = (contentType, fileSize) => {
    // Check if file type is allowed
    if (!ALLOWED_FILE_TYPES[contentType]) {
        return {
            isValid: false,
            error: `File type '${contentType}' is not allowed. Supported types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`
        };
    }

    const fileConfig = ALLOWED_FILE_TYPES[contentType];

    // Check file size
    if (fileSize > fileConfig.maxSize) {
        const maxSizeMB = (fileConfig.maxSize / (1024 * 1024)).toFixed(1);
        return {
            isValid: false,
            error: `File size exceeds maximum allowed size of ${maxSizeMB}MB for ${contentType}`
        };
    }

    return { isValid: true };
};

/**
 * Generates a unique file key for S3 storage
 * @param {string} originalName - Original filename
 * @param {string} contentType - MIME type of the file
 * @param {string} folder - Folder path (optional)
 * @returns {string} Generated S3 key
 */
const generateFileKey = (originalName, contentType, folder = 'uploads') => {
    const fileConfig = ALLOWED_FILE_TYPES[contentType];
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');

    // Clean the original filename
    const cleanName = originalName
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .toLowerCase();

    // Remove extension from clean name and add proper extension
    const nameWithoutExt = cleanName.replace(/\.[^/.]+$/, '');
    const finalName = `${nameWithoutExt}_${timestamp}_${randomString}.${fileConfig.extension}`;

    return `${folder}/${finalName}`;
};

/**
 * Generates presigned URL for file upload
 * @param {Object} params - Upload parameters
 * @param {string} params.fileName - Original filename
 * @param {string} params.contentType - MIME type
 * @param {number} params.fileSize - File size in bytes
 * @param {string} params.folder - Upload folder (optional)
 * @param {number} params.expiresIn - URL expiration time in seconds (default: 300)
 * @returns {Promise<Object>} Presigned URL data
 */
const generatePresignedUrl = async ({
    fileName,
    contentType,
    fileSize,
    folder = 'uploads',
    expiresIn = 300 // 5 minutes default
}) => {
    try {
        // Validate S3 client
        if (!s3Client) {
            throw new Error('S3 client not initialized. Check AWS configuration.');
        }

        // Validate file upload
        const validation = validateFileUpload(contentType, fileSize);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        // Generate unique file key
        const fileKey = generateFileKey(fileName, contentType, folder);
        const bucketInfo = getBucketInfo();

        // Prepare S3 parameters
        const s3Params = {
            Bucket: bucketInfo.bucketName,
            Key: fileKey,
            ContentType: contentType,
            ContentLength: fileSize,
            Expires: expiresIn,
            // Add metadata
            Metadata: {
                'original-name': fileName,
                'upload-timestamp': Date.now().toString()
            }
        };

        // Generate presigned URL
        const presignedUrl = await s3Client.getSignedUrlPromise('putObject', s3Params);

        // Generate the final URL where the file will be accessible
        const fileUrl = `${bucketInfo.bucketUrl}/${fileKey}`;

        return {
            success: true,
            data: {
                presignedUrl,
                fileKey,
                fileUrl,
                expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
                uploadHeaders: {
                    'Content-Type': contentType,
                    'Content-Length': fileSize.toString()
                }
            }
        };

    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Generates presigned URL for file download/access
 * @param {string} fileKey - S3 file key
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<Object>} Presigned URL for download
 */
const generateDownloadUrl = async (fileKey, expiresIn = 3600) => {
    try {
        if (!s3Client) {
            throw new Error('S3 client not initialized. Check AWS configuration.');
        }

        const bucketInfo = getBucketInfo();
        const s3Params = {
            Bucket: bucketInfo.bucketName,
            Key: fileKey,
            Expires: expiresIn
        };

        const presignedUrl = await s3Client.getSignedUrlPromise('getObject', s3Params);

        return {
            success: true,
            data: {
                downloadUrl: presignedUrl,
                expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
            }
        };

    } catch (error) {
        console.error('Error generating download URL:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Uploads a file directly to S3 from server-side (buffer-based upload)
 * @param {Object} params - Upload parameters
 * @param {Buffer} params.fileBuffer - File buffer data
 * @param {string} params.fileName - Original filename
 * @param {string} params.contentType - MIME type
 * @param {string} params.folder - Upload folder (optional)
 * @param {Object} params.metadata - Additional metadata (optional)
 * @returns {Promise<Object>} Upload result with file URL and key
 */
const contractUploadS3 = async ({
    fileBuffer,
    fileName,
    contentType,
    folder = 'uploads',
    metadata = {}
}) => {
    try {
        // Validate S3 client
        if (!s3Client) {
            throw new Error('S3 client not initialized. Check AWS configuration.');
        }

        // Validate inputs
        if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
            throw new Error('Invalid file buffer provided');
        }

        if (!fileName || typeof fileName !== 'string') {
            throw new Error('Valid filename is required');
        }

        if (!contentType || typeof contentType !== 'string') {
            throw new Error('Valid content type is required');
        }

        // Validate file upload (type and size)
        const fileSize = fileBuffer.length;
        const validation = validateFileUpload(contentType, fileSize);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        // Generate unique file key
        const fileKey = generateFileKey(fileName, contentType, folder);
        const bucketInfo = getBucketInfo();

        // Prepare upload parameters
        const uploadParams = {
            Bucket: bucketInfo.bucketName,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: contentType,
            ContentLength: fileSize,
            // Add metadata
            Metadata: {
                'original-name': fileName,
                'upload-timestamp': Date.now().toString(),
                'upload-method': 'server-side',
                ...metadata
            },
            // Set appropriate ACL (adjust based on your needs)
            ACL: 'private' // Files are private by default, use presigned URLs for access
        };

        // Upload file to S3
        const uploadResult = await s3Client.upload(uploadParams).promise();

        // Generate the public URL (for reference, actual access should use presigned URLs)
        const fileUrl = `${bucketInfo.bucketUrl}/${fileKey}`;

        return {
            success: true,
            data: {
                fileKey,
                fileUrl,
                s3Location: uploadResult.Location,
                s3ETag: uploadResult.ETag,
                fileSize,
                contentType,
                uploadedAt: new Date().toISOString(),
                metadata: {
                    originalName: fileName,
                    folder,
                    ...metadata
                }
            }
        };

    } catch (error) {
        console.error('Error uploading file to S3:', error);
        return {
            success: false,
            error: error.message,
            details: {
                fileName,
                contentType,
                fileSize: fileBuffer ? fileBuffer.length : 0
            }
        };
    }
};

/**
 * Deletes a file from S3
 * @param {string} fileKey - S3 file key to delete
 * @returns {Promise<Object>} Deletion result
 */
const deleteFile = async (fileKey) => {
    try {
        if (!s3Client) {
            throw new Error('S3 client not initialized. Check AWS configuration.');
        }

        if (!fileKey || typeof fileKey !== 'string') {
            throw new Error('Valid file key is required');
        }

        const bucketInfo = getBucketInfo();

        // Delete the file
        await s3Client.deleteObject({
            Bucket: bucketInfo.bucketName,
            Key: fileKey
        }).promise();

        return {
            success: true,
            data: {
                fileKey,
                deletedAt: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Error deleting file from S3:', error);
        return {
            success: false,
            error: error.message,
            details: { fileKey }
        };
    }
};

/**
 * Checks if a file exists in S3
 * @param {string} fileKey - S3 file key
 * @returns {Promise<boolean>} True if file exists
 */
const fileExists = async (fileKey) => {
    try {
        if (!s3Client) {
            return false;
        }

        const bucketInfo = getBucketInfo();
        await s3Client.headObject({
            Bucket: bucketInfo.bucketName,
            Key: fileKey
        }).promise();

        return true;
    } catch (error) {
        if (error.code === 'NotFound') {
            return false;
        }
        console.error('Error checking file existence:', error);
        return false;
    }
};

module.exports = {
    generatePresignedUrl,
    generateDownloadUrl,
    contractUploadS3,
    deleteFile,
    validateFileUpload,
    generateFileKey,
    fileExists,
    ALLOWED_FILE_TYPES
};