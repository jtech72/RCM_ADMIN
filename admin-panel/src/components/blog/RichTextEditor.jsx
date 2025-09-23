import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Upload, Image, Link, AlertCircle } from 'lucide-react';
import s3Service from '../../services/s3.js';

// Custom styles to ensure editor visibility
const editorStyles = `
  .ql-editor {
    min-height: 300px !important;
    font-size: 16px;
    line-height: 1.6;
  }
  .ql-toolbar {
    border-top: 1px solid #ccc;
    border-left: 1px solid #ccc;
    border-right: 1px solid #ccc;
  }
  .ql-container {
    border-bottom: 1px solid #ccc;
    border-left: 1px solid #ccc;
    border-right: 1px solid #ccc;
    font-family: inherit;
  }
`;

/**
 * Rich Text Editor component with image upload functionality
 */
function RichTextEditor({
    value = '',
    onChange,
    placeholder = 'Start writing your blog content...',
    height = '400px',
    disabled = false,
    className = ''
}) {
    const quillRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    // Custom toolbar configuration
    const modules = {
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'font': [] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'script': 'sub' }, { 'script': 'super' }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'align': [] }],
                ['link', 'formula'],
                ['code-block'],
                ['blockquote'],
                ['clean']
            ],
            handlers: {
                image: handleImageUpload
            }
        },
        clipboard: {
            matchVisual: false
        }
    };

    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'list', 'bullet', 'indent',
        'direction', 'align',
        'link', 'image', 'video', 'formula',
        'code-block', 'blockquote'
    ];

    /**
     * Handle image upload from toolbar
     */
    async function handleImageUpload() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            await uploadAndInsertImage(file);
        };
    }

    /**
     * Upload image and insert into editor
     */
    const uploadAndInsertImage = useCallback(async (file) => {
        if (!file) return;

        // Validate file
        const validation = s3Service.validateFile(file, {
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            maxSize: 5 * 1024 * 1024 // 5MB for images
        });

        if (!validation.valid) {
            setError(validation.errors.join(', '));
            return;
        }

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            // Generate unique filename
            const uniqueFileName = s3Service.generateUniqueFileName(file.name);
            const renamedFile = new File([file], uniqueFileName, { type: file.type });

            // Upload to S3
            const result = await s3Service.uploadFile(
                renamedFile,
                'blog-images',
                (progress) => setUploadProgress(progress)
            );

            if (result.success) {
                // Insert image into editor
                const quill = quillRef.current?.getEditor();
                if (quill) {
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', result.data.url);
                    quill.setSelection(range.index + 1);
                }
            } else {
                setError(result.error);
            }
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }, []);

    /**
     * Handle drag and drop for images
     */
    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length > 0) {
            // Upload first image file
            await uploadAndInsertImage(imageFiles[0]);
        }
    }, [uploadAndInsertImage]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    /**
     * Handle paste events for images
     */
    useEffect(() => {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        const handlePaste = async (e) => {
            const clipboardData = e.clipboardData || window.clipboardData;
            const items = clipboardData.items;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        await uploadAndInsertImage(file);
                    }
                    break;
                }
            }
        };

        const editorElement = quill.root;
        editorElement.addEventListener('paste', handlePaste);
        editorElement.addEventListener('drop', handleDrop);
        editorElement.addEventListener('dragover', handleDragOver);

        return () => {
            editorElement.removeEventListener('paste', handlePaste);
            editorElement.removeEventListener('drop', handleDrop);
            editorElement.removeEventListener('dragover', handleDragOver);
        };
    }, [uploadAndInsertImage, handleDrop, handleDragOver]);

    /**
     * Clear error after timeout
     */
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <div className={`relative ${className}`}>
            {/* Upload Progress */}
            {uploading && (
                <div className="absolute top-0 left-0 right-0 z-10 bg-blue-50 border border-blue-200 rounded-t-md p-3">
                    <div className="flex items-center space-x-2">
                        <Upload className="h-4 w-4 text-blue-600 animate-pulse" />
                        <span className="text-sm text-blue-800">Uploading image...</span>
                        <div className="flex-1 bg-blue-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <span className="text-sm text-blue-800 font-medium">{uploadProgress}%</span>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="absolute top-0 left-0 right-0 z-10 bg-red-50 border border-red-200 rounded-t-md p-3">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-800">{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-600 hover:text-red-800"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Editor */}
            <div
                className={`${uploading || error ? 'mt-12' : ''} relative`}
                style={{ minHeight: height }}
            >
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    modules={modules}
                    formats={formats}
                    readOnly={disabled || uploading}
                    style={{
                        height: height,
                        minHeight: height
                    }}
                />
            </div>

            {/* Helper Text */}
            <div className="mt-2 text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                        <Image className="h-3 w-3" />
                        <span>Drag & drop images or paste from clipboard</span>
                    </span>
                    <span className="flex items-center space-x-1">
                        <Link className="h-3 w-3" />
                        <span>Use toolbar for links and formatting</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default RichTextEditor;