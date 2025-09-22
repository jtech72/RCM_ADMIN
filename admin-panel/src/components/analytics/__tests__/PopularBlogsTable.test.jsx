import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PopularBlogsTable from '../PopularBlogsTable.jsx';

describe('PopularBlogsTable Component', () => {
    const mockData = [
        {
            _id: '1',
            title: 'First Popular Blog',
            slug: 'first-popular-blog',
            author: { username: 'john_doe' },
            category: 'Technology',
            viewCount: 1500,
            likeCount: 75,
            status: 'published',
            createdAt: '2023-01-15T10:30:00.000Z'
        },
        {
            _id: '2',
            title: 'Second Popular Blog',
            slug: 'second-popular-blog',
            author: { username: 'jane_smith' },
            category: 'Design',
            viewCount: 1200,
            likeCount: 60,
            status: 'draft',
            createdAt: '2023-02-20T14:45:00.000Z'
        }
    ];

    it('should render table with default title', () => {
        render(<PopularBlogsTable data={mockData} loading={false} />);

        expect(screen.getByText('Most Popular Blogs')).toBeInTheDocument();
    });

    it('should render table with custom title', () => {
        render(
            <PopularBlogsTable
                data={mockData}
                loading={false}
                title="Custom Blog Title"
            />
        );

        expect(screen.getByText('Custom Blog Title')).toBeInTheDocument();
    });

    it('should render table headers correctly', () => {
        render(<PopularBlogsTable data={mockData} loading={false} />);

        expect(screen.getByText('Blog Title')).toBeInTheDocument();
        expect(screen.getByText('Author')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Views')).toBeInTheDocument();
        expect(screen.getByText('Likes')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Created')).toBeInTheDocument();
    });

    it('should render blog data correctly', () => {
        render(<PopularBlogsTable data={mockData} loading={false} />);

        // Check blog titles
        expect(screen.getByText('First Popular Blog')).toBeInTheDocument();
        expect(screen.getByText('Second Popular Blog')).toBeInTheDocument();

        // Check slugs
        expect(screen.getByText('/first-popular-blog')).toBeInTheDocument();
        expect(screen.getByText('/second-popular-blog')).toBeInTheDocument();

        // Check authors
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('jane_smith')).toBeInTheDocument();

        // Check categories
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('Design')).toBeInTheDocument();

        // Check view counts (formatted with commas)
        expect(screen.getByText('1,500')).toBeInTheDocument();
        expect(screen.getByText('1,200')).toBeInTheDocument();

        // Check like counts
        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('60')).toBeInTheDocument();

        // Check statuses
        expect(screen.getByText('published')).toBeInTheDocument();
        expect(screen.getByText('draft')).toBeInTheDocument();
    });

    it('should render loading skeleton when loading is true', () => {
        render(<PopularBlogsTable data={[]} loading={true} />);

        // Should show loading animation
        expect(screen.getByText('Most Popular Blogs')).toBeInTheDocument();

        // Should have animate-pulse class
        const loadingElement = screen.getByRole('generic', {
            name: /loading/i
        }) || document.querySelector('.animate-pulse');

        expect(loadingElement).toBeInTheDocument();
    });

    it('should show empty state when no data is provided', () => {
        render(<PopularBlogsTable data={[]} loading={false} />);

        expect(screen.getByText('No blog data available for the selected period.')).toBeInTheDocument();
    });

    it('should show empty state when data is null', () => {
        render(<PopularBlogsTable data={null} loading={false} />);

        expect(screen.getByText('No blog data available for the selected period.')).toBeInTheDocument();
    });

    it('should render ranking numbers correctly', () => {
        render(<PopularBlogsTable data={mockData} loading={false} />);

        // Should show ranking numbers 1 and 2
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should handle missing author gracefully', () => {
        const dataWithMissingAuthor = [
            {
                _id: '1',
                title: 'Blog Without Author',
                slug: 'blog-without-author',
                author: null,
                category: 'Technology',
                viewCount: 100,
                likeCount: 5,
                status: 'published',
                createdAt: '2023-01-15T10:30:00.000Z'
            }
        ];

        render(<PopularBlogsTable data={dataWithMissingAuthor} loading={false} />);

        expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
        render(<PopularBlogsTable data={mockData} loading={false} />);

        // Check if dates are formatted (exact format may vary by locale)
        const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        expect(dateElements.length).toBeGreaterThan(0);
    });

    it('should apply correct status styling', () => {
        const { container } = render(<PopularBlogsTable data={mockData} loading={false} />);

        // Check for published status styling (green)
        expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
        expect(container.querySelector('.text-green-800')).toBeInTheDocument();

        // Check for draft status styling (yellow)
        expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument();
        expect(container.querySelector('.text-yellow-800')).toBeInTheDocument();
    });

    it('should have hover effects on table rows', () => {
        const { container } = render(<PopularBlogsTable data={mockData} loading={false} />);

        const rows = container.querySelectorAll('.hover\\:bg-gray-50');
        expect(rows.length).toBeGreaterThan(0);
    });

    it('should truncate long blog titles', () => {
        const dataWithLongTitle = [
            {
                _id: '1',
                title: 'This is a very long blog title that should be truncated when displayed in the table',
                slug: 'long-title-blog',
                author: { username: 'author' },
                category: 'Technology',
                viewCount: 100,
                likeCount: 5,
                status: 'published',
                createdAt: '2023-01-15T10:30:00.000Z'
            }
        ];

        const { container } = render(<PopularBlogsTable data={dataWithLongTitle} loading={false} />);

        // Should have truncate class
        expect(container.querySelector('.truncate')).toBeInTheDocument();
    });
});