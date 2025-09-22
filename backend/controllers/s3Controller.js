const { generatePresignedUrl, generateDownloadUrl, contractUploadS3, deleteFile, fileExists } = require('../services/s3Service');
const Joi = require('joi');

/**
 * Validation schema for presigned URL request
 */
const presignedUrlSchema = Joi.object({
    fileName: Joi.string().min(1).max(255).required()
        .messages({
            'string.empty': 'File name is required',
            'string.max': 'File name must be less than 255 characters'
        }),
    contentType: Joi.string().required()
        .messages({
            'string.empty': 'Content type is required'
        }),
    fileSize: Joi.number().integer().min(1).max(100 * 1024 * 1024).required() // Max 100MB
        .messages({
            'number.base': 'File size must be a number',
            'number.min': 'File size must be greater than 0',
            'number.max': 'File size must be less than 100MB'
        }),
    folder: Joi.string().optional().default('uploads')
        .pattern(/^[a-zA-Z0-9/_-]+$/)
        .messages({
            'string.pattern.base': 'Folder name can only contain letters, numbers, hyphens, underscores, and forward slashes'
        }),
    expiresIn: Joi.number().integer().min(60).max(3600).optional().default(300)
        .messages({
            'number.min': 'Expiration time must be at least 60 seconds',
            'number.max': 'Expiration time must be at most 1 hour'
        })
});

/**
 * Generate presigned URL for file upload
 * GET /api/s3/presign
 */
const getPresignedUrl = async (req, res) => {
    try {
        // Validate request parameters
        const { error, value } = presignedUrlSchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.details.map(detail => detail.message)
            });
        }

        const { fileName, contentType, fileSize, folder, expiresIn } = value;

        // Generate presigned URL
        const result = await generatePresignedUrl({
            fileName,
            contentType,
            fileSize: parseInt(fileSize),
            folder,
            expiresIn
        });

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Presigned URL generated successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Error in getPresignedUrl:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while generating presigned URL'
        });
    }
};

/**
 * Generate presigned URL for file download
 * GET /api/s3/download/:fileKey
 */
const getDownloadUrl = async (req, res) => {
    try {
        const { fileKey } = req.params;
        const expiresIn = parseInt(req.query.expiresIn) || 3600;

        // Validate file key
        if (!fileKey || fileKey.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'File key is required'
            });
        }

        // Validate expiration time
        if (expiresIn < 60 || expiresIn > 86400) { // 1 minute to 24 hours
            return res.status(400).json({
                success: false,
                error: 'Expiration time must be between 60 seconds and 24 hours'
            });
        }

        // Check if file exists
        const exists = await fileExists(fileKey);
        if (!exists) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Generate download URL
        const result = await generateDownloadUrl(fileKey, expiresIn);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Download URL generated successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Error in getDownloadUrl:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while generating download URL'
        });
    }
};

/**
 * Check if file exists in S3
 * GET /api/s3/exists/:fileKey
 */
const checkFileExists = async (req, res) => {
    try {
        const { fileKey } = req.params;

        if (!fileKey || fileKey.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'File key is required'
            });
        }

        const exists = await fileExists(fileKey);

        res.json({
            success: true,
            data: {
                exists,
                fileKey
            }
        });

    } catch (error) {
        console.error('Error in checkFileExists:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while checking file existence'
        });
    }
};

/**
 * Upload file directly to S3 from server-side
 * POST /api/s3/upload
 * Expects multipart/form-data with file field
 */
const uploadFile = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded. Please provide a file in the request.'
            });
        }

        const { buffer, originalname, mimetype, size } = req.file;
        const { folder, metadata } = req.body;

        // Parse metadata if provided
        let parsedMetadata = {};
        if (metadata) {
            try {
                parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid metadata format. Must be valid JSON.'
                });
            }
        }

        // Upload file using contractUploadS3
        const result = await contractUploadS3({
            fileBuffer: buffer,
            fileName: originalname,
            contentType: mimetype,
            folder: folder || 'uploads',
            metadata: parsedMetadata
        });

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                details: result.details
            });
        }

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Error in uploadFile:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while uploading file'
        });
    }
};

/**
 * Delete file from S3
 * DELETE /api/s3/files/:fileKey
 */
const deleteFileFromS3 = async (req, res) => {
    try {
        const { fileKey } = req.params;

        if (!fileKey || fileKey.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'File key is required'
            });
        }

        // Check if file exists first
        const exists = await fileExists(fileKey);
        if (!exists) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Delete the file
        const result = await deleteFile(fileKey);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                details: result.details
            });
        }

        res.json({
            success: true,
            message: 'File deleted successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Error in deleteFileFromS3:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while deleting file'
        });
    }
};

/**
 * Get supported file types and their limits
 * GET /api/s3/file-types
 */
const getSupportedFileTypes = (req, res) => {
    try {
        const { ALLOWED_FILE_TYPES } = require('../services/s3Service');

        const fileTypes = Object.entries(ALLOWED_FILE_TYPES).map(([mimeType, config]) => ({
            mimeType,
            extension: config.extension,
            maxSize: config.maxSize,
            maxSizeMB: (config.maxSize / (1024 * 1024)).toFixed(1)
        }));

        res.json({
            success: true,
            message: 'Supported file types retrieved successfully',
            data: {
                fileTypes,
                totalTypes: fileTypes.length
            }
        });

    } catch (error) {
        console.error('Error in getSupportedFileTypes:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving file types'
        });
    }
};

module.exports = {
    getPresignedUrl,
    getDownloadUrl,
    uploadFile,
    deleteFileFromS3,
    checkFileExists,
    getSupportedFileTypes
};