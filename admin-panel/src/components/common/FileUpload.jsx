import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, File, AlertCircle, CheckCircle } from 'lucide-react';
import s3Service from '../../services/s3.js';

/**
 * File Upload component with drag & drop support and S3 integration
 */
function FileUpload({
    onUpload,
    onError,
    accept = 'image/*',
    maxSize = 5 * 1024 * 1024, // 5MB default
    folder = 'uploads',
    multiple = false,
    disabled = false,
    className = '',
    children,
    showPreview = true,
    existingFile = null
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(existingFile);
    const fileInputRef = useRef(null);

    /**
     * Handle file selection
     */
    const handleFileSelect = useCallback(async (files) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);

        if (!multiple && fileArray.length > 1) {
            setError('Only one file is allowed');
            return;
        }

        // Validate files
        for (const file of fileArray) {
            const validation = s3Service.validateFile(file, {
                allowedTypes: accept.split(',').map(type => type.trim()),
                maxSize
            });

            if (!validation.valid) {
                setError(validation.errors.join(', '));
                if (onError) onError(validation.errors);
                return;
            }
        }

        // Upload files
        await uploadFiles(fileArray);
    }, [accept, maxSize, multiple, onError]);

    /**
     * Upload files to S3
     */
    const uploadFiles = async (files) => {
        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            if (multiple) {
                // Upload multiple files
                const results = await s3Service.uploadMultipleFiles(
                    files,
                    folder,
                    (progressData) => {
                        const overallProgress = Math.round(
                            ((progressData.fileIndex * 100) + progressData.progress) / files.length
                        );
                        setUploadProgress(overallProgress);
                    }
                );

                const successfulUploads = results.filter(result => result.success);
                const failedUploads = results.filter(result => !result.success);

                if (failedUploads.length > 0) {
                    setError(`Failed to upload ${failedUploads.length} file(s)`);
                    if (onError) onError(failedUploads.map(f => f.error));
                }

                if (successfulUploads.length > 0) {
                    setUploadedFile(successfulUploads);
                    if (onUpload) onUpload(successfulUploads.map(f => f.data));
                }
            } else {
                // Upload single file
                const file = files[0];
                const uniqueFileName = s3Service.generateUniqueFileName(file.name);
                const renamedFile = new File([file], uniqueFileName, { type: file.type });

                const result = await s3Service.uploadFile(
                    renamedFile,
                    folder,
                    (progress) => setUploadProgress(progress)
                );

                if (result.success) {
                    setUploadedFile(result.data);
                    if (onUpload) onUpload(result.data);
                } else {
                    setError(result.error);
                    if (onError) onError([result.error]);
                }
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Upload failed. Please try again.');
            if (onError) onError([err.message]);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    /**
     * Handle drag events
     */
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled || uploading) return;

        const files = e.dataTransfer.files;
        handleFileSelect(files);
    }, [disabled, uploading, handleFileSelect]);

    /**
     * Handle click to select files
     */
    const handleClick = useCallback(() => {
        if (disabled || uploading) return;
        fileInputRef.current?.click();
    }, [disabled, uploading]);

    /**
     * Remove uploaded file
     */
    const handleRemoveFile = useCallback(async (fileKey) => {
        try {
            await s3Service.deleteFile(fileKey);
            setUploadedFile(null);
            if (onUpload) onUpload(null);
        } catch (err) {
            console.error('Error removing file:', err);
            setError('Failed to remove file');
        }
    }, [onUpload]);

    /**
     * Get file type icon
     */
    const getFileIcon = (contentType) => {
        if (contentType?.startsWith('image/')) {
            return <Image className="h-5 w-5" />;
        }
        return <File className="h-5 w-5" />;
    };

    /**
     * Format file size
     */
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    };

    return (
        <div className={`relative ${className}`}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                disabled={disabled || uploading}
            />

            {/* Upload Area */}
            {!uploadedFile && (
                <div
                    onClick={handleClick}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`
                        relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
                        ${isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }
                        ${disabled || uploading
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }
                    `}
                >
                    {uploading ? (
                        <div className="space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">Uploading...</p>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">{uploadProgress}%</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                            <div>
                                <p className="text-sm text-gray-600">
                                    {children || (
                                        <>
                                            <span className="font-medium text-blue-600">Click to upload</span>
                                            {' or drag and drop'}
                                        </>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Max size: {formatFileSize(maxSize)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Uploaded File Preview */}
            {uploadedFile && showPreview && (
                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {uploadedFile.contentType?.startsWith('image/') ? (
                                <img
                                    src={uploadedFile.url}
                                    alt={uploadedFile.fileName}
                                    className="h-12 w-12 object-cover rounded"
                                />
                            ) : (
                                <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                                    {getFileIcon(uploadedFile.contentType)}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {uploadedFile.fileName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(uploadedFile.size)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <button
                                onClick={() => handleRemoveFile(uploadedFile.key)}
                                className="text-red-500 hover:text-red-700"
                                disabled={uploading}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-2 flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default FileUpload;