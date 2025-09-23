import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    Star,
    Calendar,
    User,
    Tag,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import blogService from '../../services/blog.js';

function BlogList({ onCreateBlog, onEditBlog }) {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null
    });

    console.log(pagination, 'paginationpagination')

    // Filter and search states
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        category: '',
        featured: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    const [showFilters, setShowFilters] = useState(false);

    // Load blogs
    const loadBlogs = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            };

            // Remove empty filter values except status (keep empty status to fetch all blogs)
            Object.keys(params).forEach(key => {
                if (key !== 'status' && (params[key] === '' || params[key] === null || params[key] === undefined)) {
                    delete params[key];
                }
            });

            const response = await blogService.getBlogs(params);

            if (response.success) {
                setBlogs(response.data);
                console.log(response, 'responseresponseresponseresponse')
                setPagination(response?.pagination);
            } else {
                setError(response.error || 'Failed to load blogs');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load blogs');
        } finally {
            setLoading(false);
        }
    };

    // Load blogs when filters or pagination change
    useEffect(() => {
        loadBlogs();
    }, [pagination.page, filters]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        loadBlogs();
    };

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    // Handle delete blog
    const handleDeleteBlog = async (blogId, blogTitle) => {
        if (!window.confirm(`Are you sure you want to delete "${blogTitle}"?`)) {
            return;
        }

        try {
            const response = await blogService.deleteBlog(blogId);
            if (response.success) {
                loadBlogs(); // Reload the list
            } else {
                alert(response.error || 'Failed to delete blog');
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete blog');
        }
    };

    // Handle status change
    const handleStatusChange = async (blogId, newStatus) => {
        try {
            const response = await blogService.updateBlogStatus(blogId, newStatus);
            if (response.success) {
                loadBlogs(); // Reload the list
            } else {
                alert(response.error || 'Failed to update blog status');
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update blog status');
        }
    };

    // Handle toggle featured
    const handleToggleFeatured = async (blogId, currentFeatured) => {
        try {
            const response = await blogService.toggleFeatured(blogId, currentFeatured);
            if (response.success) {
                loadBlogs(); // Reload the list
            } else {
                alert(response.error || 'Failed to toggle featured status');
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to toggle featured status');
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get status badge color
    const getStatusBadgeColor = (status) => {
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

    if (loading && blogs.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div >
                <div className="flex items-center  justify-between  gap-4 mb-4">
                    <form onSubmit={handleSearch} className="flex-1 flex items-center justify-end gap-4">
                        <div className="w-64">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search blogs..."
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters((prev) => ({ ...prev, search: e.target.value }))
                                    }
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </button>
                        <button
                            onClick={onCreateBlog}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Blog
                        </button>
                    </form>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Featured
                            </label>
                            <select
                                value={filters.featured}
                                onChange={(e) => handleFilterChange('featured', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Posts</option>
                                <option value="true">Featured Only</option>
                                <option value="false">Non-Featured</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sort By
                            </label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="createdAt">Created Date</option>
                                <option value="updatedAt">Updated Date</option>
                                <option value="title">Title</option>
                                <option value="viewCount">Views</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Order
                            </label>
                            <select
                                value={filters.sortOrder}
                                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>
                    </div>
                )}

            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Blog List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {blogs.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No blogs found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Blog
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stats
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created On
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {blogs.map((blog) => (
                                    <tr key={blog?._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-start space-x-3">
                                                {blog.coverImage?.url && (
                                                    <img
                                                        src={blog.coverImage.url}
                                                        alt={blog.title}
                                                        className="h-12 w-12 rounded-lg object-cover"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 style={{ cursor: 'pointer' }} title={blog?.title}
                                                            className="text-sm font-medium text-gray-800 truncate">
                                                            {blog?.title?.length > 40 ? blog?.title?.slice?.(0, 39) + '...' : blog?.title}
                                                        </h3>
                                                    </div>
                                                    {blog.tags && blog.tags.length > 0 && (
                                                        <div className="flex items-center mt-1">
                                                            <Tag className="h-3 w-3 text-gray-400 mr-1" />
                                                            <span className="text-xs text-gray-500">
                                                                {blog.tags.slice(0, 2).join(', ')}
                                                                {blog.tags.length > 2 && '...'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <select
                                                value={blog.status}
                                                onChange={(e) => handleStatusChange(blog._id, e.target.value)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getStatusBadgeColor(blog.status)}`}
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Eye className="h-3 w-3 mr-1" />
                                                {blog.viewCount || 0} views
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(blog.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleToggleFeatured(blog._id, blog.featured)}
                                                    className={`p-0 rounded ${blog?.featured
                                                        ? 'text-yellow-400 hover:text-yellow-500'
                                                        : 'text-gray-400 hover:text-yellow-500'
                                                        }`}
                                                    title={blog.featured ? 'Remove from featured' : 'Mark as featured'}
                                                >
                                                    <Star className={`h-3 w-3 ${blog.featured ? 'fill-current' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={() => onEditBlog(blog)}
                                                    className="text-blue-600 hover:text-blue-900 p-0 rounded"
                                                    title="Edit blog"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBlog(blog._id, blog.title)}
                                                    className="text-red-600 hover:text-red-900 p-0 rounded"
                                                    title="Delete blog"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((pagination.page - 1) * pagination.limit) + 1}
                            to {Math.min(pagination.page * pagination.limit, pagination.total)}
                            of {pagination.total} results
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(pagination.prevPage)}
                                disabled={!pagination.hasPrevPage}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </button>
                            <span className="text-sm text-gray-700">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.nextPage)}
                                disabled={!pagination.hasNextPage}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </button>
                        </div>
                    </div>
                )}

            </div>


        </div>
    );
}

export default BlogList;