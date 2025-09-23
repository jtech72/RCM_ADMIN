import React from 'react';
import { FileText, Eye, Heart, Users, Edit, Archive, TrendingUp, TrendingDown } from 'lucide-react';

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
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-50 to-cyan-50',
            textColor: 'text-blue-600',
            change: '+12%',
            changeType: 'positive'
        },
        {
            title: 'Published Blogs',
            value: data?.publishedBlogs || 0,
            icon: Edit,
            gradient: 'from-green-500 to-emerald-500',
            bgGradient: 'from-green-50 to-emerald-50',
            textColor: 'text-green-600',
            change: '+8%',
            changeType: 'positive'
        },
        {
            title: 'Draft Blogs',
            value: data?.draftBlogs || 0,
            icon: Archive,
            gradient: 'from-yellow-500 to-orange-500',
            bgGradient: 'from-yellow-50 to-orange-50',
            textColor: 'text-yellow-600',
            change: '-3%',
            changeType: 'negative'
        },
        {
            title: 'Total Views',
            value: data?.totalViews || 0,
            icon: Eye,
            gradient: 'from-purple-500 to-pink-500',
            bgGradient: 'from-purple-50 to-pink-50',
            textColor: 'text-purple-600',
            change: '+24%',
            changeType: 'positive'
        },
        {
            title: 'Total Likes',
            value: data?.totalLikes || 0,
            icon: Heart,
            gradient: 'from-red-500 to-pink-500',
            bgGradient: 'from-red-50 to-pink-50',
            textColor: 'text-red-600',
            change: '+18%',
            changeType: 'positive'
        },
        {
            title: 'Total Users',
            value: data?.totalUsers || 0,
            icon: Users,
            gradient: 'from-indigo-500 to-purple-500',
            bgGradient: 'from-indigo-50 to-purple-50',
            textColor: 'text-indigo-600',
            change: '+15%',
            changeType: 'positive'
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                                <div className="ml-4 flex-1">
                                    <div className="h-4 bg-gray-200 rounded-lg w-24 mb-2"></div>
                                    <div className="h-6 bg-gray-200 rounded-lg w-16"></div>
                                </div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded-lg w-12"></div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => {
                const IconComponent = card.icon;
                const TrendIcon = card.changeType === 'positive' ? TrendingUp : TrendingDown;
                return (
                    <div 
                        key={index} 
                        className={`bg-gradient-to-br ${card.bgGradient} backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer`}
                        style={{
                            animationDelay: `${index * 100}ms`,
                            animation: 'slideUp 0.6s ease-out forwards'
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 bg-gradient-to-r ${card.gradient} rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <IconComponent className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                        {card.title}
                                    </h3>
                                    <p className={`text-2xl font-bold ${card.textColor} group-hover:scale-105 transition-transform duration-300`}>
                                        {card.value.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                card.changeType === 'positive' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                <TrendIcon className="w-3 h-3" />
                                <span>{card.change}</span>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full bg-gradient-to-r ${card.gradient} rounded-full transition-all duration-1000 ease-out`}
                                    style={{
                                        width: `${Math.min((card.value / Math.max(...cards.map(c => c.value))) * 100, 100)}%`,
                                        animationDelay: `${index * 200 + 500}ms`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default OverviewCards;

// Add custom CSS for animations
const styles = `
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}