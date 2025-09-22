import React, { useState, useEffect } from 'react';
import { Search, Globe, Image, X, Plus, AlertCircle } from 'lucide-react';
import FileUpload from '../common/FileUpload.jsx';

function SEOMetadataForm({
    seoMetadata,
    onSeoMetadataChange,
    blogTitle = '',
    disabled = false
}) {
    const [keywordInput, setKeywordInput] = useState('');
    const [charCounts, setCharCounts] = useState({
        metaTitle: 0,
        metaDescription: 0
    });

    useEffect(() => {
        setCharCounts({
            metaTitle: seoMetadata.metaTitle?.length || 0,
            metaDescription: seoMetadata.metaDescription?.length || 0
        });
    }, [seoMetadata.metaTitle, seoMetadata.metaDescription]);

    // Auto-generate meta title from blog title if empty
    useEffect(() => {
        if (blogTitle && !seoMetadata.metaTitle) {
            handleSeoChange('metaTitle', blogTitle);
        }
    }, [blogTitle, seoMetadata.metaTitle]);

    const handleSeoChange = (field, value) => {
        onSeoMetadataChange({
            ...seoMetadata,
            [field]: value
        });
    };

    const handleAddKeyword = (e) => {
        e.preventDefault();
        const keyword = keywordInput.trim();

        if (keyword && !seoMetadata.keywords.includes(keyword)) {
            const updatedKeywords = [...seoMetadata.keywords, keyword];
            handleSeoChange('keywords', updatedKeywords);
            setKeywordInput('');
        }
    };

    const handleRemoveKeyword = (keywordToRemove) => {
        const updatedKeywords = seoMetadata.keywords.filter(keyword => keyword !== keywordToRemove);
        handleSeoChange('keywords', updatedKeywords);
    };

    const handleKeywordKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddKeyword(e);
        }
    };

    const getCharCountColor = (count, max, optimal) => {
        if (count === 0) return 'text-gray-400';
        if (count > max) return 'text-red-500';
        if (count < optimal) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getCharCountIcon = (count, max) => {
        if (count > max) return <AlertCircle className="h-3 w-3 text-red-500" />;
        return null;
    };

    return (
        <div className="border-t pt-6">
            <div className="flex items-center mb-4">
                <Search className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">SEO Metadata</h3>
            </div>

            <div className="space-y-6">
                {/* Meta Title */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="seo-meta-title" className="block text-sm font-medium text-gray-700">
                            Meta Title
                        </label>
                        <div className="flex items-center gap-1 text-xs">
                            {getCharCountIcon(charCounts.metaTitle, 60)}
                            <span className={getCharCountColor(charCounts.metaTitle, 60, 30)}>
                                {charCounts.metaTitle}/60
                            </span>
                        </div>
                    </div>
                    <input
                        type="text"
                        id="seo-meta-title"
                        value={seoMetadata.metaTitle || ''}
                        onChange={(e) => handleSeoChange('metaTitle', e.target.value)}
                        disabled={disabled}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="SEO title for search engines (50-60 characters)"
                        maxLength={70}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        This title appears in search engine results. Optimal length: 50-60 characters.
                    </p>
                </div>

                {/* Meta Description */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="seo-meta-description" className="block text-sm font-medium text-gray-700">
                            Meta Description
                        </label>
                        <div className="flex items-center gap-1 text-xs">
                            {getCharCountIcon(charCounts.metaDescription, 160)}
                            <span className={getCharCountColor(charCounts.metaDescription, 160, 120)}>
                                {charCounts.metaDescription}/160
                            </span>
                        </div>
                    </div>
                    <textarea
                        id="seo-meta-description"
                        value={seoMetadata.metaDescription || ''}
                        onChange={(e) => handleSeoChange('metaDescription', e.target.value)}
                        disabled={disabled}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Brief description for search engines (150-160 characters)"
                        maxLength={200}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        This description appears in search results. Optimal length: 150-160 characters.
                    </p>
                </div>

                {/* SEO Keywords */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Keywords
                    </label>

                    {/* Selected Keywords */}
                    {seoMetadata.keywords && seoMetadata.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {seoMetadata.keywords.map((keyword, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                >
                                    {keyword}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveKeyword(keyword)}
                                        disabled={disabled}
                                        className="ml-1 text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={`Remove ${keyword} keyword`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Add Keyword Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={handleKeywordKeyDown}
                            disabled={disabled}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Add an SEO keyword"
                        />
                        <button
                            type="button"
                            onClick={handleAddKeyword}
                            disabled={disabled || !keywordInput.trim()}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Add relevant keywords that describe your content. Press Enter or click Add.
                    </p>
                </div>

                {/* Open Graph Image */}
                <div>
                    <div className="flex items-center mb-2">
                        <Globe className="h-4 w-4 text-gray-400 mr-2" />
                        <label className="block text-sm font-medium text-gray-700">
                            Open Graph Image
                        </label>
                    </div>
                    <FileUpload
                        accept="image/*"
                        maxSize={2 * 1024 * 1024} // 2MB for OG images
                        folder="og-images"
                        onUpload={(fileData) => {
                            handleSeoChange('ogImage', fileData.url);
                        }}
                        onError={(errors) => {
                            console.error('OG Image upload error:', errors);
                        }}
                        disabled={disabled}
                        existingFile={seoMetadata.ogImage ? {
                            url: seoMetadata.ogImage,
                            fileName: 'Open Graph Image',
                            contentType: 'image/jpeg'
                        } : null}
                    >
                        <div className="flex items-center justify-center">
                            <Image className="h-5 w-5 text-gray-400 mr-2" />
                            Upload Open Graph image
                        </div>
                    </FileUpload>
                    <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">
                            <strong>Recommended size:</strong> 1200x630px for optimal social media sharing
                        </p>
                        <p className="text-xs text-gray-500">
                            This image appears when your blog is shared on social media platforms.
                        </p>
                    </div>
                </div>

                {/* SEO Preview */}
                {(seoMetadata.metaTitle || seoMetadata.metaDescription) && (
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                            <Search className="h-4 w-4 mr-2" />
                            Search Engine Preview
                        </h4>
                        <div className="bg-white p-3 rounded border">
                            <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                                {seoMetadata.metaTitle || blogTitle || 'Your Blog Title'}
                            </div>
                            <div className="text-green-700 text-sm">
                                https://yourdomain.com/blog/your-blog-slug
                            </div>
                            <div className="text-gray-600 text-sm mt-1">
                                {seoMetadata.metaDescription || 'Your meta description will appear here...'}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SEOMetadataForm;