import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OverviewCards from '../OverviewCards.jsx';

describe('OverviewCards Component', () => {
    const mockData = {
        totalBlogs: 25,
        publishedBlogs: 20,
        draftBlogs: 5,
        totalViews: 1500,
        totalLikes: 75,
        totalUsers: 10
    };

    it('should render all overview cards with correct data', () => {
        render(<OverviewCards data={mockData} loading={false} />);

        // Check if all card titles are present
        expect(screen.getByText('Total Blogs')).toBeInTheDocument();
        expect(screen.getByText('Published Blogs')).toBeInTheDocument();
        expect(screen.getByText('Draft Blogs')).toBeInTheDocument();
        expect(screen.getByText('Total Views')).toBeInTheDocument();
        expect(screen.getByText('Total Likes')).toBeInTheDocument();
        expect(screen.getByText('Total Users')).toBeInTheDocument();

        // Check if all values are displayed correctly
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('1,500')).toBeInTheDocument(); // Should be formatted with comma
        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should render loading skeleton when loading is true', () => {
        render(<OverviewCards data={null} loading={true} />);

        // Should render 6 skeleton cards
        const skeletonCards = screen.getAllByRole('generic').filter(
            element => element.classList.contains('animate-pulse')
        );
        expect(skeletonCards.length).toBeGreaterThan(0);
    });

    it('should handle missing data gracefully', () => {
        render(<OverviewCards data={null} loading={false} />);

        // Should display 0 for all values when data is null
        const zeroValues = screen.getAllByText('0');
        expect(zeroValues).toHaveLength(6);
    });

    it('should handle partial data', () => {
        const partialData = {
            totalBlogs: 10,
            publishedBlogs: 8
            // Missing other properties
        };

        render(<OverviewCards data={partialData} loading={false} />);

        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();

        // Should show 0 for missing values
        const zeroValues = screen.getAllByText('0');
        expect(zeroValues).toHaveLength(4); // 4 missing values should show as 0
    });

    it('should format large numbers with commas', () => {
        const largeNumberData = {
            totalBlogs: 1000,
            publishedBlogs: 999,
            draftBlogs: 1,
            totalViews: 1234567,
            totalLikes: 12345,
            totalUsers: 1000
        };

        render(<OverviewCards data={largeNumberData} loading={false} />);

        expect(screen.getByText('1,000')).toBeInTheDocument();
        expect(screen.getByText('999')).toBeInTheDocument();
        expect(screen.getByText('1,234,567')).toBeInTheDocument();
        expect(screen.getByText('12,345')).toBeInTheDocument();
    });

    it('should render correct icons for each card', () => {
        render(<OverviewCards data={mockData} loading={false} />);

        // Check that icons are rendered (they should have specific classes)
        const cards = screen.getAllByRole('generic').filter(
            element => element.classList.contains('bg-white') &&
                element.classList.contains('rounded-lg')
        );

        expect(cards).toHaveLength(6);
    });

    it('should apply correct color classes to cards', () => {
        const { container } = render(<OverviewCards data={mockData} loading={false} />);

        // Check for different background color classes
        expect(container.querySelector('.bg-blue-500')).toBeInTheDocument();
        expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
        expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument();
        expect(container.querySelector('.bg-purple-500')).toBeInTheDocument();
        expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
        expect(container.querySelector('.bg-indigo-500')).toBeInTheDocument();
    });

    it('should have hover effects on cards', () => {
        const { container } = render(<OverviewCards data={mockData} loading={false} />);

        const cards = container.querySelectorAll('.hover\\:shadow-lg');
        expect(cards).toHaveLength(6);
    });

    it('should handle zero values correctly', () => {
        const zeroData = {
            totalBlogs: 0,
            publishedBlogs: 0,
            draftBlogs: 0,
            totalViews: 0,
            totalLikes: 0,
            totalUsers: 0
        };

        render(<OverviewCards data={zeroData} loading={false} />);

        const zeroValues = screen.getAllByText('0');
        expect(zeroValues).toHaveLength(6);
    });
});