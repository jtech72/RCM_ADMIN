import { ArrowLeftIcon } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Blog Content Preview Component (Tailwind)
 */
function ContentPreview({ blog, blogContent }) {
    if (!blog) return null;

    // Calculate reading time
    const calculateReadingTime = (content) => {
        if (!content) return 0;
        const text = content.replace(/<[^>]*>/g, '');
        const words = text.trim().split(/\s+/).length;
        return Math.ceil(words / 225);
    };

    const readingTime = calculateReadingTime(blogContent);

    return (
        <div className="blog-detail-page ">
            <div className="container mx-auto px-4">
                {/* Back Button */}
                <div className="max-w-4xl mx-auto">
                    {/* Blog Header */}
                    <div className="mb-6">
                        <div className="flex items-center mb-3">
                            {blog.category && (
                                <span className="inline-block bg-gradient-to-r from-orange-500 to-orange-700 text-white rounded-full px-4 py-1 text-sm mr-3">
                                    {blog.category}
                                </span>
                            )}
                            <span className="text-gray-500 capitalize text-sm">
                                {readingTime > 0 ? `${readingTime} mins to read` : '5 min read'}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                            {blog.title || 'Untitled Blog Post'}
                        </h1>

                        <div className="flex items-center text-gray-500 text-sm mb-4">
                            <span>{new Date(blog.createdAt || new Date()).toLocaleDateString()}</span>
                            <>
                                <span className="mx-2">•</span>
                                <span>{0} views</span>
                            </>
                        </div>
                    </div>

                    {/* Featured Image */}
                    {blog.coverImage?.url && (
                        <div className="mb-8">
                            <img
                                src={blog.coverImage.url}
                                alt={blog.coverImage.alt || blog.title}
                                className="w-full h-96 object-cover rounded-2xl"
                            />
                        </div>
                    )}

                    {/* Blog Content */}
                    <div
                        className="prose prose-lg max-w-none text-gray-900 mb-8"
                        dangerouslySetInnerHTML={{ __html: blogContent }}
                    />

                    {/* SEO Preview */}
                    {blog.seoMetadata && (
                        <div className="border-t pt-6 mt-10">
                            <h5 className="text-gray-900 font-semibold mb-3">SEO Preview</h5>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-blue-600 text-lg mb-1">
                                    {blog.seoMetadata.metaTitle || blog.title}
                                </div>
                                <div className="text-green-700 text-sm mb-1">
                                    https://yourblog.com/blog/{blog.slug || 'blog-post'}
                                </div>
                                <div className="text-gray-600 text-sm">
                                    {blog.seoMetadata.metaDescription || blog.excerpt || 'No description available'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContentPreview;
