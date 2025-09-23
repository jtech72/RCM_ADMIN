const express = require('express');
const multer = require('multer');
const {
    getPresignedUrl,
    getDownloadUrl,
    uploadFile,
    deleteFileFromS3,
    checkFileExists,
    getSupportedFileTypes
} = require('../controllers/s3Controller');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for memory storage (files will be stored in memory as Buffer)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
        files: 1 // Only allow 1 file per request
    },
    fileFilter: (req, file, cb) => {
        // Basic file type validation (more detailed validation happens in service)
        const allowedMimes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
            'application/pdf', 'text/plain',
            'video/mp4', 'video/webm'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} is not allowed`), false);
        }
    }
});

const router = express.Router();

/**
 * @route   GET /api/s3/presign
 * @desc    Generate presigned URL for file upload
 * @access  Private (requires authentication)
 * @params  fileName, contentType, fileSize, folder (optional), expiresIn (optional)
 */
router.get('/presign', authenticateToken, getPresignedUrl);

/**
 * @route   GET /api/s3/download/:fileKey
 * @desc    Generate presigned URL for file download
 * @access  Public
 * @params  fileKey (in URL), expiresIn (optional query param)
 */
router.get('/download/:fileKey(*)', getDownloadUrl);

/**
 * @route   GET /api/s3/exists/:fileKey
 * @desc    Check if file exists in S3
 * @access  Public
 * @params  fileKey (in URL)
 */
router.get('/exists/:fileKey(*)', checkFileExists);

/**
 * @route   POST /api/s3/upload
 * @desc    Upload file directly to S3 from server-side
 * @access  Private (requires authentication)
 * @body    file (multipart/form-data), folder (optional), metadata (optional JSON string)
 */
router.post('/upload', authenticateToken, upload.single('file'), uploadFile);

/**
 * @route   DELETE /api/s3/files/:fileKey
 * @desc    Delete file from S3
 * @access  Private (requires authentication)
 * @params  fileKey (in URL)
 */
router.delete('/files/:fileKey(*)', authenticateToken, deleteFileFromS3);

/**
 * @route   GET /api/s3/file-types
 * @desc    Get supported file types and their limits
 * @access  Public
 */
router.get('/file-types', getSupportedFileTypes);

module.exports = router;