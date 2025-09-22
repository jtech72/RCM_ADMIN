import React from 'react';
import { FileText, Eye, Heart, Users, Edit, Archive } from 'lucide-react';

/**
 * OverviewCards Component
 * Displays key analytics metrics in card format
 */
function OverviewCards({ data, loading }) {
    const cards = [
        {
            title: 'Total Blogs',
            value: data?.totalBlogs || 0,
            icon: FileText,
            color: 'bg-blue-500',
            textColor: 'text-blue-600'
        },
        {
            title: 'Published Blogs',
            value: data?.publishedBlogs || 0,
            icon: Edit,
            color: 'bg-green-500',
            textColor: 'text-green-600'
        },
        {
            title: 'Draft Blogs',
            value: data?.draftBlogs || 0,
            icon: Archive,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600'
        },
        {
            title: 'Total Views',
            value: data?.totalViews || 0,
            icon: Eye,
            color: 'bg-purple-500',
            textColor: 'text-purple-600'
        },
        {
            title: 'Total Likes',
            value: data?.totalLikes || 0,
            icon: Heart,
            color: 'bg-red-500',
            textColor: 'text-red-600'
        },
        {
            title: 'Total Users',
            value: data?.totalUsers || 0,
            icon: Users,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-600'
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md"></div>
                            <div className="ml-4 flex-1">
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                <div className="h-6 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => {
                const IconComponent = card.icon;
                return (
                    <div key={index} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 ${card.color} rounded-md p-3`}>
                                <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                    {card.title}
                                </h3>
                                <p className={`text-2xl font-bold ${card.textColor}`}>
                                    {card.value.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default OverviewCards;