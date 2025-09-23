import React, { useState, useEffect } from 'react';
import { Save, X, Eye, EyeOff } from 'lucide-react';
import blogService from '../../services/blog.js';
import RichTextEditor from './RichTextEditor.jsx';
import FileUpload from '../common/FileUpload.jsx';
import ContentPreview from './ContentPreview.jsx';
import CategoryManager from './CategoryManager.jsx';
import TagManager from './TagManager.jsx';
import SEOMetadataForm from './SEOMetadataForm.jsx';
import axios from 'axios';

function BlogForm({ blogSlug, onSave, onCancel, mode = 'create' }) {
    const [blog, setBlog] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        category: '',
        tags: [],
        status: 'draft',
        featured: false,
        coverImage: {
            url: '',
            alt: ''
        },
        seoMetadata: {
            metaTitle: '',
            metaDescription: '',
            keywords: [],
            ogImage: ''
        }
    });

    console.log(formData, 'formDataformData')
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Tag management
    const [availableTags, setAvailableTags] = useState([
        'medicalBilling', 'medicalCoding', 'EHR', 'AIINHEALTHCARE', 'HEALTHCARE', 'guide', 'tips'
    ]);

    // Initialize form data when blog prop changes

    const fetchBlugBySlug = async () => {
        try {
            const response = await blogService.getBlog(blogSlug);
            console.log(response, 'responseresponseresponseresponse')
            if (response?.success) {
                setBlog(response?.data);
            }
        } catch (error) {
            console.log(error, 'Error fetching blog details');
        }
    }

    useEffect(() => {
        if (blogSlug && mode === 'edit') {
            fetchBlugBySlug();
        }
    }, [mode]);

    useEffect(() => {
        if (blog) {
            setFormData({
                title: blog.title || '',
                excerpt: blog.excerpt || '',
                content: blog.content || '',
                category: blog.category || '',
                tags: blog.tags || [],
                status: blog.status || 'draft',
                featured: blog.featured || false,
                coverImage: {
                    url: blog.coverImage?.url || '',
                    alt: blog.coverImage?.alt || ''
                },
                seoMetadata: {
                    metaTitle: blog.seoMetadata?.metaTitle || '',
                    metaDescription: blog.seoMetadata?.metaDescription || '',
                    keywords: blog.seoMetadata?.keywords || [],
                    ogImage: blog.seoMetadata?.ogImage || ''
                }
            });
        }
    }, [blog])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            // Handle nested object fields
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Handle category change
    const handleCategoryChange = (category) => {
        setFormData(prev => ({
            ...prev,
            category
        }));
    };

    // Handle tags change
    const handleTagsChange = (tags) => {
        setFormData(prev => ({
            ...prev,
            tags
        }));
    };

    // Handle SEO metadata change
    const handleSeoMetadataChange = (seoMetadata) => {
        setFormData(prev => ({
            ...prev,
            seoMetadata
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let response;
            console.log(formData, 'formData')
            if (mode === 'create') {
                response = await blogService.createBlog(formData);
            } else {
                response = await blogService.updateBlog(blog._id, formData);
            }

            if (response.success) {
                onSave(response.data);
            } else {
                setError(response.error || 'Failed to save blog');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save blog');
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate slug from title
    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };



    return (
        <div className="mx-auto bg-white shadow rounded-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {mode === 'create' ? 'Create New Blog' : 'Edit Blog'}
                    </h2>
                    <div className="flex items-center space-x-2">
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                            {showPreview ? 'Hide Preview' : 'Show Preview'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Title <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter blog title"
                        />
                        {formData.title && (
                            <p className="mt-1 text-sm text-gray-500">
                                Slug: {generateSlug(formData.title)}
                            </p>
                        )}
                    </div>

                    <div>
                        <CategoryManager
                            selectedCategory={formData.category}
                            onCategoryChange={handleCategoryChange}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Status <span className='text-red-500'>*</span>
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                </div>

                {/* Excerpt */}
                <div>
                    <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                        Excerpt
                    </label>
                    <textarea
                        id="excerpt"
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={handleChange}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief description of the blog post"
                    />
                </div>

                {/* Content */}
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                        Content <span className='text-red-500'>*</span>
                    </label>
                    <div style={{ display: showPreview ? 'none' : 'block' }}>
                        <RichTextEditor
                            key="editor"
                            value={formData.content}
                            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                            placeholder="Start writing your blog content..."
                            height="400px"
                            disabled={loading}
                        />
                    </div>
                    <div style={{ display: showPreview ? 'block' : 'none' }}>
                        <ContentPreview
                            blog={formData}
                            className="border border-gray-300 rounded-md min-h-[400px] p-4"
                        />
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <TagManager
                        selectedTags={formData.tags}
                        onTagsChange={handleTagsChange}
                        availableTags={availableTags}
                        onAvailableTagsUpdate={setAvailableTags}
                        disabled={loading}
                        maxTags={10}
                        placeholder="Add a tag"
                    />
                </div>

                {/* Cover Image */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cover Image
                    </label>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <FileUpload
                                accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                                maxSize={5 * 1024 * 1024} // 5MB
                                folder="blog-covers"
                                onUpload={(fileData) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        coverImage: {
                                            url: fileData.url,
                                            alt: formData.coverImage.alt || fileData.fileName
                                        }
                                    }));
                                }}
                                onError={(errors) => {
                                    setError(errors.join(', '));
                                }}
                                disabled={loading}
                                existingFile={formData.coverImage.url ? {
                                    url: formData.coverImage.url,
                                    fileName: 'Cover Image',
                                    contentType: 'image/jpeg'
                                } : null}
                            >
                                Upload cover image or drag & drop
                            </FileUpload>
                        </div>

                        <div>
                            <label htmlFor="coverImage.alt" className="block text-sm font-medium text-gray-700 mb-2">
                                Cover Image Alt Text
                            </label>
                            <input
                                type="text"
                                id="coverImage.alt"
                                name="coverImage.alt"
                                value={formData.coverImage.alt}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Describe the image for accessibility"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Alt text helps screen readers and improves SEO
                            </p>
                        </div>
                    </div>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="featured"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                        Mark as featured
                    </label>
                </div>

                {/* SEO Metadata */}
                <SEOMetadataForm
                    seoMetadata={formData.seoMetadata}
                    onSeoMetadataChange={handleSeoMetadataChange}
                    blogTitle={formData.title}
                    disabled={loading}
                />

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                {mode === 'create' ? 'Create Blog' : 'Update Blog'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}


export default BlogForm;