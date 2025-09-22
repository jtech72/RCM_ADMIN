import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Analytics from '../Analytics.jsx';
import { AuthProvider } from '../../contexts/AuthContext.jsx';
import analyticsService from '../../services/analytics.js';

// Mock the analytics service
vi.mock('../../services/analytics.js', () => ({
    default: {
        getOverview: vi.fn(),
        getPopularBlogs: vi.fn(),
        getMostLikedBlogs: vi.fn(),
        getEngagementTrends: vi.fn(),
        getCategoryPerformance: vi.fn()
    }
}));

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => <div data-testid="pie" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    Cell: () => <div data-testid="cell" />
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
    <BrowserRouter>
        <AuthProvider>
            {children}
        </AuthProvider>
    </BrowserRouter>
);

describe('Analytics Page', () => {
    const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin'
    };

    const mockOverviewData = {
        success: true,
        data: {
            totalBlogs: 25,
            publishedBlogs: 20,
            draftBlogs: 5,
            totalViews: 1500,
            totalLikes: 75,
            totalUsers: 10
        }
    };

    const mockPopularBlogs = {
        success: true,
        data: [
            {
                _id: '1',
                title: 'Popular Blog 1',
                slug: 'popular-blog-1',
                author: { username: 'author1' },
                category: 'Technology',
                viewCount: 1000,
                likeCount: 50,
                status: 'published',
                createdAt: '2023-01-15T10:30:00.000Z'
            }
        ]
    };

    const mockEngagementTrends = {
        success: true,
        data: [
            {
                date: '2023-01',
                blogCount: 5,
                totalViews: 500,
                totalLikes: 25,
                avgViewsPerBlog: 100,
                avgLikesPerBlog: 5
            }
        ]
    };

    const mockCategoryPerformance = {
        success: true,
        data: [
            {
                category: 'Technology',
                blogCount: 10,
                totalViews: 1000,
                totalLikes: 50,
                avgViewsPerBlog: 100,
                avgReadingTime: 5.5
            }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock successful API responses
        analyticsService.getOverview.mockResolvedValue(mockOverviewData);
        analyticsService.getPopularBlogs.mockResolvedValue(mockPopularBlogs);
        analyticsService.getMostLikedBlogs.mockResolvedValue(mockPopularBlogs);
        analyticsService.getEngagementTrends.mockResolvedValue(mockEngagementTrends);
        analyticsService.getCategoryPerformance.mockResolvedValue(mockCategoryPerformance);

        // Mock AuthContext
        vi.mock('../../contexts/AuthContext.jsx', () => ({
            AuthProvider: ({ children }) => children,
            useAuth: () => ({
                user: mockUser,
                isAuthenticated: true
            })
        }));
    });

    it('should render analytics dashboard header', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Welcome back, testuser')).toBeInTheDocument();
        expect(screen.getByText('Refresh Data')).toBeInTheDocument();
    });

    it('should render date range picker', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        expect(screen.getByText('Date Range:')).toBeInTheDocument();
        expect(screen.getByText('From:')).toBeInTheDocument();
        expect(screen.getByText('To:')).toBeInTheDocument();
    });

    it('should fetch analytics data on mount', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(analyticsService.getOverview).toHaveBeenCalled();
            expect(analyticsService.getPopularBlogs).toHaveBeenCalled();
            expect(analyticsService.getMostLikedBlogs).toHaveBeenCalled();
            expect(analyticsService.getEngagementTrends).toHaveBeenCalled();
            expect(analyticsService.getCategoryPerformance).toHaveBeenCalled();
        });
    });

    it('should render overview cards after data loads', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Total Blogs')).toBeInTheDocument();
            expect(screen.getByText('Published Blogs')).toBeInTheDocument();
            expect(screen.getByText('Draft Blogs')).toBeInTheDocument();
            expect(screen.getByText('Total Views')).toBeInTheDocument();
            expect(screen.getByText('Total Likes')).toBeInTheDocument();
            expect(screen.getByText('Total Users')).toBeInTheDocument();
        });
    });

    it('should render chart controls', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        expect(screen.getByText('Chart Controls')).toBeInTheDocument();
        expect(screen.getByText('Period:')).toBeInTheDocument();
        expect(screen.getByText('Chart Type:')).toBeInTheDocument();
    });

    it('should handle period change for engagement trends', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        const periodSelect = screen.getAllByDisplayValue('Weekly')[0];
        fireEvent.change(periodSelect, { target: { value: 'month' } });

        await waitFor(() => {
            expect(analyticsService.getEngagementTrends).toHaveBeenCalledWith(
                expect.objectContaining({ period: 'month' })
            );
        });
    });

    it('should handle chart type change for engagement trends', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        const chartTypeSelect = screen.getByDisplayValue('Line Chart');
        fireEvent.change(chartTypeSelect, { target: { value: 'bar' } });

        // Should re-render chart with new type
        await waitFor(() => {
            expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        });
    });

    it('should handle date range changes', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        const startDateInput = screen.getByLabelText('From:');
        fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });

        await waitFor(() => {
            expect(analyticsService.getOverview).toHaveBeenCalledWith(
                expect.objectContaining({
                    startDate: '2023-01-01T00:00:00.000Z'
                })
            );
        });
    });

    it('should handle refresh data button click', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        const refreshButton = screen.getByText('Refresh Data');
        fireEvent.click(refreshButton);

        await waitFor(() => {
            expect(analyticsService.getOverview).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
        });
    });

    it('should display error message when API calls fail', async () => {
        analyticsService.getOverview.mockRejectedValue(new Error('API Error'));

        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Error loading analytics data')).toBeInTheDocument();
        });
    });

    it('should render popular blogs tables', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Most Popular Blogs (by Views)')).toBeInTheDocument();
            expect(screen.getByText('Most Liked Blogs')).toBeInTheDocument();
        });
    });

    it('should render category performance section', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Category Performance')).toBeInTheDocument();
        });
    });

    it('should handle category chart type change', async () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        // Find the category chart type select (second one)
        const chartTypeSelects = screen.getAllByDisplayValue('Bar Chart');
        const categoryChartSelect = chartTypeSelects[chartTypeSelects.length - 1];

        fireEvent.change(categoryChartSelect, { target: { value: 'pie' } });

        await waitFor(() => {
            expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        });
    });

    it('should show loading states initially', () => {
        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        // Should show loading animations
        const loadingElements = document.querySelectorAll('.animate-pulse');
        expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should handle partial API failures gracefully', async () => {
        analyticsService.getOverview.mockResolvedValue(mockOverviewData);
        analyticsService.getPopularBlogs.mockRejectedValue(new Error('Popular blogs failed'));
        analyticsService.getMostLikedBlogs.mockResolvedValue(mockPopularBlogs);
        analyticsService.getEngagementTrends.mockResolvedValue(mockEngagementTrends);
        analyticsService.getCategoryPerformance.mockResolvedValue(mockCategoryPerformance);

        render(
            <TestWrapper>
                <Analytics />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('Some analytics data could not be loaded. Please try refreshing.')).toBeInTheDocument();
        });
    });
});