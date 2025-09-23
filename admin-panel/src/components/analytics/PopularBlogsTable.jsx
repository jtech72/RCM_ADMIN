import React from 'react';
import { Eye, Heart, Calendar, User } from 'lucide-react';

/**
 * PopularBlogsTable Component
 * Displays most popular blogs in a table format
 */
function PopularBlogsTable({ data, loading, title = "Most Popular Blogs" }) {
    if (loading) {
        return (
            <div className="p-3">
                <div className="animate-pulse space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-3">
                            <div className="h-3 bg-gray-200 rounded w-6"></div>
                            <div className="h-3 bg-gray-200 rounded flex-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="p-3 text-center text-gray-500 text-sm">
                No blog data available for the selected period.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Author</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Views</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((blog, index) => (
                        <tr key={blog._id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                                <span className="text-sm text-gray-900">{index + 1}</span>
                            </td>
                            <td className="px-3 py-2">
                                <div className="max-w-xs">
                                    <div className="text-sm text-gray-900 truncate">{blog.title}</div>
                                    <div className="text-xs text-gray-500">{blog.category}</div>
                                </div>
                            </td>
                            <td className="px-3 capitalize py-2">
                                <span className="text-sm text-gray-900">{blog.author?.username || 'Unknown'}</span>
                            </td>
                            <td className="px-3 py-2">
                                <span className="text-sm text-gray-900">{blog.viewCount.toLocaleString()}</span>
                            </td>
                            <td className="px-3 py-2">
                                <span className={`capitalize inline-flex items-center px-2 py-0.5 rounded text-xs ${blog.status === 'published'
                                    ? 'bg-green-100 text-green-800'
                                    : blog.status === 'draft'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {blog.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default PopularBlogsTable;