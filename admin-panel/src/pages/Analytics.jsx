import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { BarChart3, TrendingUp, Calendar, RefreshCw, Sparkles, Zap, Activity, Users, Eye, Heart, FileText, Edit, Archive, Filter, Download, Settings } from 'lucide-react';
import analyticsService from '../services/analytics.js';
import DateRangePicker from '../components/analytics/DateRangePicker.jsx';
import OverviewCards from '../components/analytics/OverviewCards.jsx';
import PopularBlogsTable from '../components/analytics/PopularBlogsTable.jsx';
import EngagementChart from '../components/analytics/EngagementChart.jsx';
import CategoryChart from '../components/analytics/CategoryChart.jsx';

/**
 * Analytics Page Component
 * Main analytics dashboard for the admin panel
 */
function Analytics() {
    const { user } = useAuth();

    // State for date filtering
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // State for analytics data
    const [analyticsData, setAnalyticsData] = useState({
        overview: null,
        popularBlogs: [],
        likedBlogs: [],
        engagementTrends: [],
        categoryPerformance: []
    });

    // Loading states
    const [loading, setLoading] = useState({
        overview: true,
        popularBlogs: true,
        likedBlogs: true,
        engagementTrends: true,
        categoryPerformance: true
    });

    // Chart configuration
    const [chartConfig, setChartConfig] = useState({
        engagementPeriod: 'week',
        engagementChartType: 'line',
        categoryChartType: 'bar'
    });

    // Error state
    const [error, setError] = useState(null);

    // Fetch analytics data
    const fetchAnalyticsData = async () => {
        try {
            setError(null);

            const params = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            };

            // Set all loading states to true
            setLoading({
                overview: true,
                popularBlogs: true,
                likedBlogs: true,
                engagementTrends: true,
                categoryPerformance: true
            });

            // Fetch all analytics data in parallel
            const [
                overviewResponse,
                popularBlogsResponse,
                likedBlogsResponse,
                engagementTrendsResponse,
                categoryPerformanceResponse
            ] = await Promise.allSettled([
                analyticsService.getOverview(params),
                analyticsService.getPopularBlogs({ ...params, limit: 10 }),
                analyticsService.getMostLikedBlogs({ ...params, limit: 10 }),
                analyticsService.getEngagementTrends({
                    ...params,
                    period: chartConfig.engagementPeriod
                }),
                analyticsService.getCategoryPerformance(params)
            ]);

            // Update data and loading states
            setAnalyticsData({
                overview: overviewResponse.status === 'fulfilled' ? overviewResponse.value.data : null,
                popularBlogs: popularBlogsResponse.status === 'fulfilled' ? popularBlogsResponse.value.data : [],
                likedBlogs: likedBlogsResponse.status === 'fulfilled' ? likedBlogsResponse.value.data : [],
                engagementTrends: engagementTrendsResponse.status === 'fulfilled' ? engagementTrendsResponse.value.data : [],
                categoryPerformance: categoryPerformanceResponse.status === 'fulfilled' ? categoryPerformanceResponse.value.data : []
            });

            setLoading({
                overview: false,
                popularBlogs: false,
                likedBlogs: false,
                engagementTrends: false,
                categoryPerformance: false
            });

            // Check for any errors
            const errors = [
                overviewResponse,
                popularBlogsResponse,
                likedBlogsResponse,
                engagementTrendsResponse,
                categoryPerformanceResponse
            ].filter(response => response.status === 'rejected');

            if (errors.length > 0) {
                console.error('Some analytics requests failed:', errors);
                setError('Some analytics data could not be loaded. Please try refreshing.');
            }

        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
            setError('Failed to load analytics data. Please try again.');
            setLoading({
                overview: false,
                popularBlogs: false,
                likedBlogs: false,
                engagementTrends: false,
                categoryPerformance: false
            });
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchAnalyticsData();
    }, [dateRange.startDate, dateRange.endDate, chartConfig.engagementPeriod]);

    // Handle date range changes
    const handleStartDateChange = (date) => {
        setDateRange(prev => ({ ...prev, startDate: date }));
    };

    const handleEndDateChange = (date) => {
        setDateRange(prev => ({ ...prev, endDate: date }));
    };

    const handleClearDateRange = () => {
        setDateRange({ startDate: '', endDate: '' });
    };

    // Handle chart configuration changes
    const handleEngagementPeriodChange = (period) => {
        setChartConfig(prev => ({ ...prev, engagementPeriod: period }));
    };

    const handleEngagementChartTypeChange = (type) => {
        setChartConfig(prev => ({ ...prev, engagementChartType: type }));
    };

    const handleCategoryChartTypeChange = (type) => {
        setChartConfig(prev => ({ ...prev, categoryChartType: type }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
            </div>

            {/* Header Section */}
            {/* <div className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                                <Sparkles className="w-6 h-6 text-white animate-pulse" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                    Blog Analytics Dashboard
                                </h1>
                                <p className="text-gray-600 mt-1">Monitor your blog's performance and engagement</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={fetchAnalyticsData}
                                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Refresh</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg">
                                <Download className="w-4 h-4" />
                                <span>Export</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* Main Content */}
            <main className="relative z-10 mx-auto py-4 px-4 sm:px-6 lg:px-8">
                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
                        <div className="text-sm text-red-800">{error}</div>
                    </div>
                )}

                {/* Date Range Picker */}
                <div className="mb-6">
                    <div className="bg-white rounded-lg shadow border p-4">
                        <DateRangePicker
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                            onStartDateChange={handleStartDateChange}
                            onEndDateChange={handleEndDateChange}
                            onClear={handleClearDateRange}
                        />
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="mb-6">
                    <OverviewCards
                        data={analyticsData.overview}
                        loading={loading.overview}
                    />
                </div>

                {/* Engagement Chart */}
                <div className="mb-6">
                    <div className="bg-white rounded-lg shadow border p-4 mb-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <h3 className="text-sm font-medium text-gray-900">Engagement Trends</h3>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">Period:</label>
                                    <select
                                        value={chartConfig.engagementPeriod}
                                        onChange={(e) => handleEngagementPeriodChange(e.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                        <option value="day">Daily</option>
                                        <option value="week">Weekly</option>
                                        <option value="month">Monthly</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">Chart Type:</label>
                                    <select
                                        value={chartConfig.engagementChartType}
                                        onChange={(e) => handleEngagementChartTypeChange(e.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                        <option value="line">Line Chart</option>
                                        <option value="bar">Bar Chart</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow border overflow-hidden">
                        <EngagementChart
                            data={analyticsData.engagementTrends}
                            loading={loading.engagementTrends}
                            period={chartConfig.engagementPeriod}
                            chartType={chartConfig.engagementChartType}
                        />
                    </div>
                </div>

                {/* Blog Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow border">
                        <div className="p-4 border-b">
                            <h3 className="text-sm font-medium text-gray-900">Most Popular Blogs</h3>
                        </div>
                        <PopularBlogsTable
                            data={analyticsData.popularBlogs}
                            loading={loading.popularBlogs}
                            title="Most Popular Blogs (by Views)"
                        />
                    </div>
                    <div className="bg-white rounded-lg shadow border">
                        <div className="p-4 border-b">
                            <h3 className="text-sm font-medium text-gray-900">Most Liked Blogs</h3>
                        </div>
                        <PopularBlogsTable
                            data={analyticsData.likedBlogs}
                            loading={loading.likedBlogs}
                            title="Most Liked Blogs"
                        />
                    </div>
                </div>

                {/* Category Chart */}
                <div className="mb-6">
                    <div className="bg-white rounded-lg shadow border p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">Category Performance</h3>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Chart Type:</label>
                                <select
                                    value={chartConfig.categoryChartType}
                                    onChange={(e) => handleCategoryChartTypeChange(e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                    <option value="bar">Bar Chart</option>
                                    <option value="pie">Pie Chart</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow border overflow-hidden">
                        <CategoryChart
                            data={analyticsData.categoryPerformance}
                            loading={loading.categoryPerformance}
                            chartType={chartConfig.categoryChartType}
                        />
                    </div>
                </div>
            </main>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
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
                .animate-slideIn {
                    animation: slideIn 0.5s ease-out;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.6s ease-out;
                }
                .animation-delay-200 {
                    animation-delay: 0.2s;
                }
                .animation-delay-400 {
                    animation-delay: 0.4s;
                }
                .animation-delay-600 {
                    animation-delay: 0.6s;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}

export default Analytics;