import React from 'react';
import { Eye, Clock, User, Calendar, Tag } from 'lucide-react';

/**
 * Content Preview component for blog posts
 */
function ContentPreview({ blog, className = '' }) {
    if (!blog) return null;

    /**
     * Calculate reading time from content
     */
    const calculateReadingTime = (content) => {
        if (!content) return 0;

        // Remove HTML tags and count words
        const text = content.replace(/<[^>]*>/g, '');
        const words = text.trim().split(/\s+/).length;

        // Average reading speed is 200-250 words per minute
        const readingTime = Math.ceil(words / 225);
        return readingTime;
    };

    /**
     * Format date for display
     */
    const formatDate = (date) => {
        if (!date) return 'Not set';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    /**
     * Get status badge color
     */
    const getStatusColor = (status) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const readingTime = calculateReadingTime(blog.content);

    return (
        <div className={`bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
            {/* Cover Image */}
            {blog.coverImage?.url && (
                <div className="aspect-video w-full overflow-hidden">
                    <img
                        src={blog.coverImage.url}
                        alt={blog.coverImage.alt || blog.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Content */}
            <div className="p-6">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(blog.status)}`}>
                            {blog.status?.charAt(0).toUpperCase() + blog.status?.slice(1)}
                        </span>
                        {blog.featured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Featured
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {blog.title || 'Untitled Blog Post'}
                    </h1>

                    {blog.excerpt && (
                        <p className="text-gray-600 text-lg leading-relaxed mb-4">
                            {blog.excerpt}
                        </p>
                    )}

                    {/* Meta Information */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                        {blog.author && (
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                <span>{blog.author}</span>
                            </div>
                        )}

                        <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(blog.createdAt || new Date())}</span>
                        </div>

                        {readingTime > 0 && (
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{readingTime} min read</span>
                            </div>
                        )}

                        {blog.category && (
                            <div className="flex items-center">
                                <Tag className="h-4 w-4 mr-1" />
                                <span>{blog.category}</span>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {blog.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none">
                    {blog.content ? (
                        <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                    ) : (
                        <p className="text-gray-500 italic">No content available</p>
                    )}
                </div>

                {/* SEO Preview */}
                {blog.seoMetadata && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Preview</h3>

                        {/* Google Search Result Preview */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Google Search Result</h4>
                            <div className="space-y-1">
                                <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                                    {blog.seoMetadata.metaTitle || blog.title || 'Untitled'}
                                </div>
                                <div className="text-green-700 text-sm">
                                    https://yourblog.com/blog/{blog.slug || 'blog-post'}
                                </div>
                                <div className="text-gray-600 text-sm">
                                    {blog.seoMetadata.metaDescription || blog.excerpt || 'No description available'}
                                </div>
                            </div>
                        </div>

                        {/* Social Media Preview */}
                        {blog.seoMetadata.ogImage && (
                            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Social Media Preview</h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden max-w-md">
                                    <img
                                        src={blog.seoMetadata.ogImage}
                                        alt="OG Preview"
                                        className="w-full h-32 object-cover"
                                    />
                                    <div className="p-3">
                                        <div className="font-medium text-sm text-gray-900">
                                            {blog.seoMetadata.metaTitle || blog.title}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {blog.seoMetadata.metaDescription || blog.excerpt}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Keywords */}
                        {blog.seoMetadata.keywords && blog.seoMetadata.keywords.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">SEO Keywords</h4>
                                <div className="flex flex-wrap gap-2">
                                    {blog.seoMetadata.keywords.map((keyword, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ContentPreview;