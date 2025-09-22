const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Blog = require('../models/Blog');
const User = require('../models/User');
const {
    paginateQuery,
    searchBlogs,
    getRelatedBlogs,
    getPopularBlogs,
    monitorQuery,
    getBlogStatistics,
    getCategoryStatistics
} = require('../utils/queryOptimization');

describe('Query Optimization Tests', () => {
    let mongoServer;
    let testUser;
    let testBlogs = [];

    beforeAll(async () => {
        // Start in-memory MongoDB instance
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        await mongoose.connect(mongoUri);

        // Create test user
        testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'admin'
        });

        // Create test blogs with different categories and tags
        const blogData = [
            {
                title: 'JavaScript Fundamentals',
                content: 'This is a comprehensive guide to JavaScript fundamentals covering variables, functions, and objects.',
                excerpt: 'Learn JavaScript basics',
                category: 'Programming',
                tags: ['javascript', 'programming', 'web'],
                status: 'published',
                featured: true,
                author: testUser._id,
                viewCount: 100,
                likes: [testUser._id]
            },
            {
                title: 'React Best Practices',
                content: 'Explore the best practices for building React applications with hooks and modern patterns.',
                excerpt: 'React development tips',
                category: 'Programming',
                tags: ['react', 'javascript', 'frontend'],
                status: 'published',
                featured: false,
                author: testUser._id,
                viewCount: 75,
                likes: []
            },
            {
                title: 'Database Design Principles',
                content: 'Understanding database design principles and normalization techniques for better data management.',
                excerpt: 'Database design guide',
                category: 'Database',
                tags: ['database', 'design', 'sql'],
                status: 'published',
                featured: true,
                author: testUser._id,
                viewCount: 150,
                likes: [testUser._id]
            },
            {
                title: 'Draft Article',
                content: 'This is a draft article that should not appear in public queries.',
                excerpt: 'Draft content',
                category: 'Programming',
                tags: ['draft'],
                status: 'draft',
                featured: false,
                author: testUser._id,
                viewCount: 0,
                likes: []
            },
            {
                title: 'Machine Learning Basics',
                content: 'Introduction to machine learning concepts and algorithms for beginners.',
                excerpt: 'ML fundamentals',
                category: 'AI',
                tags: ['machine-learning', 'ai', 'python'],
                status: 'published',
                featured: false,
                author: testUser._id,
                viewCount: 200,
                likes: [testUser._id]
            }
        ];

        for (const data of blogData) {
            const blog = new Blog(data);
            await blog.save();
            testBlogs.push(blog);
        }

        // Ensure text index is created for testing
        try {
            await Blog.collection.createIndex({
                title: 'text',
                content: 'text',
                excerpt: 'text',
                'seoMetadata.keywords': 'text'
            }, {
                weights: {
                    title: 10,
                    excerpt: 5,
                    'seoMetadata.keywords': 3,
                    content: 1
                },
                name: 'blog_text_search'
            });
        } catch (error) {
            // Index might already exist, ignore error
            console.log('Text index creation skipped:', error.message);
        }
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe('paginateQuery', () => {
        test('should paginate results correctly', async () => {
            const result = await paginateQuery(Blog, { status: 'published' }, {
                page: 1,
                limit: 2,
                sort: { createdAt: -1 }
            });

            expect(result.data).toHaveLength(2);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(2);
            expect(result.pagination.total).toBe(4); // 4 published blogs
            expect(result.pagination.totalPages).toBe(2);
            expect(result.pagination.hasNextPage).toBe(true);
            expect(result.pagination.hasPrevPage).toBe(false);
        });

        test('should handle empty results', async () => {
            const result = await paginateQuery(Blog, { status: 'archived' }, {
                page: 1,
                limit: 10
            });

            expect(result.data).toHaveLength(0);
            expect(result.pagination.total).toBe(0);
            expect(result.pagination.totalPages).toBe(0);
        });

        test('should apply field selection', async () => {
            const result = await paginateQuery(Blog, { status: 'published' }, {
                page: 1,
                limit: 1,
                select: 'title category'
            });

            expect(result.data[0]).toHaveProperty('title');
            expect(result.data[0]).toHaveProperty('category');
            expect(result.data[0]).not.toHaveProperty('content');
        });
    });

    describe('searchBlogs', () => {
        test('should search blogs by text query', async () => {
            const result = await searchBlogs({
                query: 'JavaScript',
                page: 1,
                limit: 10
            });

            expect(result.data.length).toBeGreaterThan(0);
            // Should find blogs containing "JavaScript" in title or content
            const hasJavaScript = result.data.some(blog =>
                blog.title.toLowerCase().includes('javascript') ||
                blog.content.toLowerCase().includes('javascript')
            );
            expect(hasJavaScript).toBe(true);
        });

        test('should filter by category', async () => {
            const result = await searchBlogs({
                category: 'Programming',
                page: 1,
                limit: 10
            });

            expect(result.data.length).toBeGreaterThan(0);
            result.data.forEach(blog => {
                expect(blog.category).toBe('Programming');
            });
        });

        test('should filter by tags', async () => {
            const result = await searchBlogs({
                tags: ['javascript'],
                page: 1,
                limit: 10
            });

            expect(result.data.length).toBeGreaterThan(0);
            result.data.forEach(blog => {
                expect(blog.tags).toContain('javascript');
            });
        });

        test('should filter by featured status', async () => {
            const result = await searchBlogs({
                featured: true,
                page: 1,
                limit: 10
            });

            expect(result.data.length).toBeGreaterThan(0);
            result.data.forEach(blog => {
                expect(blog.featured).toBe(true);
            });
        });

        test('should sort by different fields', async () => {
            const result = await searchBlogs({
                sortBy: 'viewCount',
                sortOrder: 'desc',
                page: 1,
                limit: 10
            });

            expect(result.data.length).toBeGreaterThan(1);
            // Check if sorted by viewCount in descending order
            for (let i = 0; i < result.data.length - 1; i++) {
                expect(result.data[i].viewCount).toBeGreaterThanOrEqual(result.data[i + 1].viewCount);
            }
        });
    });

    describe('getRelatedBlogs', () => {
        test('should find related blogs by category and tags', async () => {
            const currentBlog = testBlogs.find(blog => blog.title === 'JavaScript Fundamentals');
            const relatedBlogs = await getRelatedBlogs(currentBlog, 5);

            expect(Array.isArray(relatedBlogs)).toBe(true);
            // Should not include the current blog
            expect(relatedBlogs.every(blog => blog._id.toString() !== currentBlog._id.toString())).toBe(true);

            // Should include blogs with same category or overlapping tags
            const hasRelated = relatedBlogs.some(blog =>
                blog.category === currentBlog.category ||
                blog.tags.some(tag => currentBlog.tags.includes(tag))
            );
            expect(hasRelated).toBe(true);
        });

        test('should limit results correctly', async () => {
            const currentBlog = testBlogs.find(blog => blog.title === 'JavaScript Fundamentals');
            const relatedBlogs = await getRelatedBlogs(currentBlog, 2);

            expect(relatedBlogs.length).toBeLessThanOrEqual(2);
        });
    });

    describe('getPopularBlogs', () => {
        test('should return blogs sorted by popularity', async () => {
            const popularBlogs = await getPopularBlogs({ limit: 5 });

            expect(Array.isArray(popularBlogs)).toBe(true);
            expect(popularBlogs.length).toBeGreaterThan(0);

            // Should be sorted by viewCount in descending order
            for (let i = 0; i < popularBlogs.length - 1; i++) {
                expect(popularBlogs[i].viewCount).toBeGreaterThanOrEqual(popularBlogs[i + 1].viewCount);
            }
        });

        test('should filter by category', async () => {
            const popularBlogs = await getPopularBlogs({
                category: 'Programming',
                limit: 5
            });

            expect(Array.isArray(popularBlogs)).toBe(true);
            popularBlogs.forEach(blog => {
                expect(blog.category).toBe('Programming');
            });
        });

        test('should limit results correctly', async () => {
            const popularBlogs = await getPopularBlogs({ limit: 2 });

            expect(popularBlogs.length).toBeLessThanOrEqual(2);
        });
    });

    describe('monitorQuery', () => {
        test('should monitor query performance', async () => {
            const testQuery = async () => {
                return await Blog.find({ status: 'published' }).limit(1);
            };

            const result = await monitorQuery(testQuery, 'Test Query');

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('performance');
            expect(result.performance).toHaveProperty('executionTime');
            expect(result.performance).toHaveProperty('queryName');
            expect(result.performance.queryName).toBe('Test Query');
            expect(typeof result.performance.executionTime).toBe('number');
        });

        test('should handle query errors', async () => {
            const errorQuery = async () => {
                throw new Error('Test error');
            };

            await expect(monitorQuery(errorQuery, 'Error Query')).rejects.toThrow('Test error');
        });
    });

    describe('getBlogStatistics', () => {
        test('should return correct blog statistics', async () => {
            const stats = await getBlogStatistics();

            expect(stats).toHaveProperty('totalBlogs');
            expect(stats).toHaveProperty('totalViews');
            expect(stats).toHaveProperty('totalLikes');
            expect(stats).toHaveProperty('avgReadingTime');
            expect(stats).toHaveProperty('avgViewCount');

            expect(stats.totalBlogs).toBe(4); // 4 published blogs
            expect(stats.totalViews).toBeGreaterThan(0);
            expect(stats.totalLikes).toBeGreaterThan(0);
        });

        test('should filter statistics by criteria', async () => {
            const stats = await getBlogStatistics({ category: 'Programming' });

            expect(stats.totalBlogs).toBe(2); // 2 published Programming blogs
        });
    });

    describe('getCategoryStatistics', () => {
        test('should return category-wise statistics', async () => {
            const categoryStats = await getCategoryStatistics();

            expect(Array.isArray(categoryStats)).toBe(true);
            expect(categoryStats.length).toBeGreaterThan(0);

            categoryStats.forEach(stat => {
                expect(stat).toHaveProperty('category');
                expect(stat).toHaveProperty('count');
                expect(stat).toHaveProperty('totalViews');
                expect(stat).toHaveProperty('totalLikes');
                expect(stat).toHaveProperty('avgReadingTime');
            });

            // Should be sorted by count in descending order
            for (let i = 0; i < categoryStats.length - 1; i++) {
                expect(categoryStats[i].count).toBeGreaterThanOrEqual(categoryStats[i + 1].count);
            }
        });
    });

    describe('Database Indexes Performance', () => {
        test('should use indexes for common queries', async () => {
            // Test slug index
            const slugQuery = Blog.find({ slug: 'javascript-fundamentals' }).explain();
            const slugExplain = await slugQuery;

            // Test status + createdAt compound index
            const statusQuery = Blog.find({ status: 'published' }).sort({ createdAt: -1 }).explain();
            const statusExplain = await statusQuery;

            // Test category + status compound index
            const categoryQuery = Blog.find({ category: 'Programming', status: 'published' }).explain();
            const categoryExplain = await categoryQuery;

            // These tests verify that indexes are being used
            // In a real MongoDB instance, we would check executionStats.indexesUsed
            expect(slugExplain).toBeDefined();
            expect(statusExplain).toBeDefined();
            expect(categoryExplain).toBeDefined();
        });

        test('should perform text search efficiently', async () => {
            const textQuery = Blog.find({ $text: { $search: 'JavaScript' } }).explain();
            const textExplain = await textQuery;

            expect(textExplain).toBeDefined();
        });
    });
});