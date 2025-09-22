import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { BarChart3, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
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
        <div className="min-h-screen bg-gray-50">
            {/* Main content */}
            <main className=" mx-auto py-6 pt-0 sm:px-6 lg:px-8">
                <div className="px-4 py-6 pt-0 sm:px-0">
                    {/* Error message */}
                    {error && (
                        <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Error loading analytics data
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        {error}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Date Range Picker */}
                    <div className="mb-6">
                        <DateRangePicker
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                            onStartDateChange={handleStartDateChange}
                            onEndDateChange={handleEndDateChange}
                            onClear={handleClearDateRange}
                        />
                    </div>

                    {/* Overview Cards */}
                    <div className="mb-8">
                        <OverviewCards
                            data={analyticsData.overview}
                            loading={loading.overview}
                        />
                    </div>

                    {/* Engagement Trends Chart */}
                    <div className="mb-8">
                        <div className="bg-white rounded-lg shadow p-4 mb-4">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Chart Controls
                                </h3>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600">Period:</label>
                                        <select
                                            value={chartConfig.engagementPeriod}
                                            onChange={(e) => handleEngagementPeriodChange(e.target.value)}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="line">Line Chart</option>
                                            <option value="bar">Bar Chart</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <EngagementChart
                            data={analyticsData.engagementTrends}
                            loading={loading.engagementTrends}
                            period={chartConfig.engagementPeriod}
                            chartType={chartConfig.engagementChartType}
                        />
                    </div>

                    {/* Popular and Liked Blogs Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <PopularBlogsTable
                            data={analyticsData.popularBlogs}
                            loading={loading.popularBlogs}
                            title="Most Popular Blogs (by Views)"
                        />
                        <PopularBlogsTable
                            data={analyticsData.likedBlogs}
                            loading={loading.likedBlogs}
                            title="Most Liked Blogs"
                        />
                    </div>

                    {/* Category Performance Chart */}
                    <div className="mb-8">
                        <div className="bg-white rounded-lg shadow p-4 mb-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Category Performance
                                </h3>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">Chart Type:</label>
                                    <select
                                        value={chartConfig.categoryChartType}
                                        onChange={(e) => handleCategoryChartTypeChange(e.target.value)}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="bar">Bar Chart</option>
                                        <option value="pie">Pie Chart</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <CategoryChart
                            data={analyticsData.categoryPerformance}
                            loading={loading.categoryPerformance}
                            chartType={chartConfig.categoryChartType}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Analytics;