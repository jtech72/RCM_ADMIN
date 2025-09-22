import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

/**
 * EngagementChart Component
 * Displays engagement trends over time using recharts
 */
function EngagementChart({ data, loading, period = 'week', chartType = 'line' }) {
    // Format date for display based on period
    const formatDate = (dateString) => {
        if (!dateString) return '';

        try {
            if (period === 'day') {
                return new Date(dateString).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            } else if (period === 'week') {
                // For week format (YYYY-WW), create a readable format
                const [year, week] = dateString.split('-');
                return `Week ${week}, ${year}`;
            } else if (period === 'month') {
                const [year, month] = dateString.split('-');
                return new Date(year, month - 1).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short'
                });
            }
            return dateString;
        } catch (error) {
            return dateString;
        }
    };

    // Format data for chart
    const chartData = data?.map(item => ({
        ...item,
        formattedDate: formatDate(item.date),
        avgViewsPerBlog: Math.round(item.avgViewsPerBlog * 100) / 100,
        avgLikesPerBlog: Math.round(item.avgLikesPerBlog * 100) / 100
    })) || [];

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Engagement Trends
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                    No engagement data available for the selected period.
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-medium text-gray-900 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const ChartComponent = chartType === 'bar' ? BarChart : LineChart;
    const DataComponent = chartType === 'bar' ? Bar : Line;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                    Engagement Trends
                </h3>
                <div className="text-sm text-gray-500">
                    Period: {period}
                </div>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="formattedDate"
                            stroke="#6b7280"
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />

                        {chartType === 'line' ? (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="totalViews"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Total Views"
                                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="totalLikes"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    name="Total Likes"
                                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="blogCount"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Blog Count"
                                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                />
                            </>
                        ) : (
                            <>
                                <Bar dataKey="totalViews" fill="#3b82f6" name="Total Views" />
                                <Bar dataKey="totalLikes" fill="#ef4444" name="Total Likes" />
                                <Bar dataKey="blogCount" fill="#10b981" name="Blog Count" />
                            </>
                        )}
                    </ChartComponent>
                </ResponsiveContainer>
            </div>

            {/* Summary stats */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                    <div className="text-sm text-gray-500">Total Periods</div>
                    <div className="text-lg font-semibold text-gray-900">
                        {chartData.length}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-sm text-gray-500">Avg Views/Period</div>
                    <div className="text-lg font-semibold text-blue-600">
                        {Math.round(chartData.reduce((sum, item) => sum + item.totalViews, 0) / chartData.length || 0)}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-sm text-gray-500">Avg Likes/Period</div>
                    <div className="text-lg font-semibold text-red-600">
                        {Math.round(chartData.reduce((sum, item) => sum + item.totalLikes, 0) / chartData.length || 0)}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-sm text-gray-500">Avg Blogs/Period</div>
                    <div className="text-lg font-semibold text-green-600">
                        {Math.round(chartData.reduce((sum, item) => sum + item.blogCount, 0) / chartData.length || 0)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EngagementChart;