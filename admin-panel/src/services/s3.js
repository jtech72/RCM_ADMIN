import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * S3 Service for handling file uploads and management
 */
class S3Service {
    constructor() {
        this.api = axios.create({
            baseURL: `${API_BASE_URL}/s3`,
            timeout: 30000, // 30 seconds for file operations
        });

        // Add auth token to requests
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('adminToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    /**
     * Get presigned URL for direct upload to S3
     * @param {Object} params - Upload parameters
     * @param {string} params.fileName - Name of the file
     * @param {string} params.contentType - MIME type of the file
     * @param {number} params.fileSize - Size of the file in bytes
     * @param {string} [params.folder='uploads'] - S3 folder path
     * @param {number} [params.expiresIn=300] - URL expiration in seconds
     * @returns {Promise<Object>} Presigned URL data
     */
    async getPresignedUrl({ fileName, contentType, fileSize, folder = 'uploads', expiresIn = 300 }) {
        try {
            const response = await this.api.get('/presign', {
                params: {
                    fileName,
                    contentType,
                    fileSize,
                    folder,
                    expiresIn
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error getting presigned URL:', error);
            throw new Error(error.response?.data?.error || 'Failed to get presigned URL');
        }
    }

    /**
     * Upload file directly to S3 using presigned URL
     * @param {File} file - File object to upload
     * @param {string} [folder='uploads'] - S3 folder path
     * @param {Function} [onProgress] - Progress callback function
     * @returns {Promise<Object>} Upload result with S3 URL
     */
    async uploadFile(file, folder = 'uploads', onProgress = null) {
        try {
            // Get presigned URL
            const presignedData = await this.getPresignedUrl({
                fileName: file.name,
                contentType: file.type,
                fileSize: file.size,
                folder
            });

            if (!presignedData.success) {
                throw new Error(presignedData.error);
            }

            const { uploadUrl, fileUrl, fileKey } = presignedData.data;

            // Upload file to S3 using presigned URL
            const uploadResponse = await axios.put(uploadUrl, file, {
                headers: {
                    'Content-Type': file.type,
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress(percentCompleted);
                    }
                }
            });

            if (uploadResponse.status === 200) {
                return {
                    success: true,
                    data: {
                        url: fileUrl,
                        key: fileKey,
                        fileName: file.name,
                        contentType: file.type,
                        size: file.size
                    }
                };
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            return {
                success: false,
                error: error.message || 'Failed to upload file'
            };
        }
    }

    /**
     * Upload multiple files
     * @param {FileList|Array} files - Files to upload
     * @param {string} [folder='uploads'] - S3 folder path
     * @param {Function} [onProgress] - Progress callback function
     * @returns {Promise<Array>} Array of upload results
     */
    async uploadMultipleFiles(files, folder = 'uploads', onProgress = null) {
        const fileArray = Array.from(files);
        const results = [];

        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];

            const progressCallback = onProgress ? (progress) => {
                onProgress({
                    fileIndex: i,
                    fileName: file.name,
                    progress,
                    totalFiles: fileArray.length
                });
            } : null;

            const result = await this.uploadFile(file, folder, progressCallback);
            results.push({
                file: file.name,
                ...result
            });
        }

        return results;
    }

    /**
     * Delete file from S3
     * @param {string} fileKey - S3 file key
     * @returns {Promise<Object>} Delete result
     */
    async deleteFile(fileKey) {
        try {
            const response = await this.api.delete(`/files/${encodeURIComponent(fileKey)}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw new Error(error.response?.data?.error || 'Failed to delete file');
        }
    }

    /**
     * Check if file exists in S3
     * @param {string} fileKey - S3 file key
     * @returns {Promise<boolean>} Whether file exists
     */
    async fileExists(fileKey) {
        try {
            const response = await this.api.get(`/exists/${encodeURIComponent(fileKey)}`);
            return response.data.data.exists;
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * Get download URL for file
     * @param {string} fileKey - S3 file key
     * @param {number} [expiresIn=3600] - URL expiration in seconds
     * @returns {Promise<string>} Download URL
     */
    async getDownloadUrl(fileKey, expiresIn = 3600) {
        try {
            const response = await this.api.get(`/download/${encodeURIComponent(fileKey)}`, {
                params: { expiresIn }
            });
            return response.data.data.downloadUrl;
        } catch (error) {
            console.error('Error getting download URL:', error);
            throw new Error(error.response?.data?.error || 'Failed to get download URL');
        }
    }

    /**
     * Get supported file types
     * @returns {Promise<Object>} Supported file types and limits
     */
    async getSupportedFileTypes() {
        try {
            const response = await this.api.get('/file-types');
            return response.data;
        } catch (error) {
            console.error('Error getting supported file types:', error);
            throw new Error(error.response?.data?.error || 'Failed to get supported file types');
        }
    }

    /**
     * Validate file before upload
     * @param {File} file - File to validate
     * @param {Object} [options] - Validation options
     * @param {Array} [options.allowedTypes] - Allowed MIME types
     * @param {number} [options.maxSize] - Maximum file size in bytes
     * @returns {Object} Validation result
     */
    validateFile(file, options = {}) {
        const {
            allowedTypes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
                'text/plain',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ],
            maxSize = 10 * 1024 * 1024 // 10MB default
        } = options;

        const errors = [];

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            errors.push(`File type ${file.type} is not allowed`);
        }

        // Check file size
        if (file.size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            errors.push(`File size exceeds ${maxSizeMB}MB limit`);
        }

        // Check if file is empty
        if (file.size === 0) {
            errors.push('File is empty');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Generate unique file name to prevent conflicts
     * @param {string} originalName - Original file name
     * @returns {string} Unique file name
     */
    generateUniqueFileName(originalName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop();
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');

        return `${nameWithoutExt}-${timestamp}-${random}.${extension}`;
    }
}

// Create and export singleton instance
const s3Service = new S3Service();
export default s3Service;