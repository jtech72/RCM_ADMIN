import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

/**
 * CategoryChart Component
 * Displays category performance analytics using recharts
 */
function CategoryChart({ data, loading, chartType = 'bar' }) {
    // Color palette for charts
    const COLORS = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];

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
                    Category Performance
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                    No category data available for the selected period.
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-medium text-gray-900 mb-2">{label || data.category}</p>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Blogs:</span> {data.blogCount}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Views:</span> {data.totalViews.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Likes:</span> {data.totalLikes.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Avg Views/Blog:</span> {data.avgViewsPerBlog}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Avg Reading Time:</span> {data.avgReadingTime} min
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const PieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-medium text-gray-900">{data.category}</p>
                    <p className="text-sm text-gray-600">
                        {payload[0].name}: {payload[0].value.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                        {((payload[0].value / data.total) * 100).toFixed(1)}% of total
                    </p>
                </div>
            );
        }
        return null;
    };

    // Prepare data for pie chart
    const pieData = data.map((item, index) => ({
        ...item,
        fill: COLORS[index % COLORS.length]
    }));

    return (
        <div className="bg-white rounded-lg shadow p-6">
            {/* <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                    Category Performance
                </h3>
                <div className="text-sm text-gray-500">
                    {data.length} categories
                </div>
            </div> */}

            {chartType === 'pie' ? (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="totalViews"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<PieTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="category"
                                stroke="#6b7280"
                                fontSize={12}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="totalViews" fill="#3b82f6" name="Total Views" />
                            <Bar dataKey="totalLikes" fill="#ef4444" name="Total Likes" />
                            <Bar dataKey="blogCount" fill="#10b981" name="Blog Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Category summary table */}
            <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Category
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Blogs
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Views
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Likes
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Avg Views/Blog
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Avg Reading Time
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((category, index) => (
                            <tr key={category.category} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {category.category}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {category.blogCount}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {category.totalViews.toLocaleString()}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {category.totalLikes.toLocaleString()}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {category.avgViewsPerBlog}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {category.avgReadingTime} min
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default CategoryChart;