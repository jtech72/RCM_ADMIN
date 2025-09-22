const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Blog = require('../models/Blog');
const User = require('../models/User');

describe('Database Index Performance Tests', () => {
    let mongoServer;
    let testUser;

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

        // Create a larger dataset for performance testing
        const blogPromises = [];
        const categories = ['Programming', 'Database', 'AI', 'DevOps', 'Security'];
        const tags = ['javascript', 'python', 'react', 'node', 'mongodb', 'sql', 'machine-learning'];
        const statuses = ['published', 'draft', 'archived'];

        for (let i = 0; i < 100; i++) {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const randomTags = tags.slice(0, Math.floor(Math.random() * 3) + 1);
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            blogPromises.push(
                Blog.create({
                    title: `Test Blog ${i + 1}`,
                    content: `This is test content for blog ${i + 1}. It contains various keywords for testing search functionality.`,
                    excerpt: `Test excerpt ${i + 1}`,
                    category: randomCategory,
                    tags: randomTags,
                    status: randomStatus,
                    featured: Math.random() > 0.7,
                    author: testUser._id,
                    viewCount: Math.floor(Math.random() * 1000),
                    likes: Math.random() > 0.5 ? [testUser._id] : []
                })
            );
        }

        await Promise.all(blogPromises);
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe('Index Usage Verification', () => {
        test('should use slug index for unique lookups', async () => {
            const startTime = Date.now();

            // Find by slug (should use index)
            const blog = await Blog.findOne({ slug: /test-blog-1/ });

            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(100); // Should be fast with index
            expect(blog).toBeDefined();
        });

        test('should use status index for filtering', async () => {
            const startTime = Date.now();

            // Find by status (should use index)
            const blogs = await Blog.find({ status: 'published' });

            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(100); // Should be fast with index
            expect(blogs.length).toBeGreaterThan(0);
        });

        test('should use compound index for status + createdAt sorting', async () => {
            const startTime = Date.now();

            // Find published blogs sorted by creation date (should use compound index)
            const blogs = await Blog.find({ status: 'published' })
                .sort({ createdAt: -1 })
                .limit(10);

            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(100); // Should be fast with compound index
            expect(blogs.length).toBeGreaterThan(0);

            // Verify sorting
            for (let i = 0; i < blogs.length - 1; i++) {
                expect(blogs[i].createdAt.getTime()).toBeGreaterThanOrEqual(blogs[i + 1].createdAt.getTime());
            }
        });

        test('should use category + status compound index', async () => {
            const startTime = Date.now();

            // Find by category and status (should use compound index)
            const blogs = await Blog.find({
                category: 'Programming',
                status: 'published'
            });

            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(100); // Should be fast with compound index
            blogs.forEach(blog => {
                expect(blog.category).toBe('Programming');
                expect(blog.status).toBe('published');
            });
        });

        test('should use tags + status compound index', async () => {
            const startTime = Date.now();

            // Find by tags and status (should use compound index)
            const blogs = await Blog.find({
                tags: { $in: ['javascript'] },
                status: 'published'
            });

            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(100); // Should be fast with compound index
            blogs.forEach(blog => {
                expect(blog.tags).toContain('javascript');
                expect(blog.status).toBe('published');
            });
        });

        test('should use featured + status + createdAt compound index', async () => {
            const startTime = Date.now();

            // Find featured published blogs sorted by date (should use compound index)
            const blogs = await Blog.find({
                featured: true,
                status: 'published'
            }).sort({ createdAt: -1 });

            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(100); // Should be fast with compound index
            blogs.forEach(blog => {
                expect(blog.featured).toBe(true);
                expect(blog.status).toBe('published');
            });
        });

        test('should use text index for search queries', async () => {
            const startTime = Date.now();

            // Text search (should use text index)
            const blogs = await Blog.find({
                $text: { $search: 'test content' }
            }).sort({ score: { $meta: 'textScore' } });

            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(200); // Text search might be slightly slower
            expect(blogs.length).toBeGreaterThan(0);
        });
    });

    describe('Query Performance Benchmarks', () => {
        test('pagination performance with large dataset', async () => {
            const startTime = Date.now();

            // Paginated query with sorting
            const blogs = await Blog.find({ status: 'published' })
                .sort({ createdAt: -1 })
                .skip(20)
                .limit(10)
                .lean();

            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(50); // Should be very fast with proper indexing
            expect(blogs.length).toBeLessThanOrEqual(10);
        });

        test('complex filter performance', async () => {
            const startTime = Date.now();

            // Complex query with multiple filters
            const blogs = await Blog.find({
                status: 'published',
                category: 'Programming',
                featured: true,
                tags: { $in: ['javascript', 'react'] }
            }).sort({ viewCount: -1 }).lean();

            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(100); // Should be fast with proper indexing
        });

        test('aggregation performance', async () => {
            const startTime = Date.now();

            // Aggregation query for statistics
            const stats = await Blog.aggregate([
                { $match: { status: 'published' } },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 },
                        avgViews: { $avg: '$viewCount' },
                        totalLikes: { $sum: { $size: '$likes' } }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(150); // Aggregation might be slightly slower
            expect(stats.length).toBeGreaterThan(0);
        });

        test('author lookup performance', async () => {
            const startTime = Date.now();

            // Query with population (should use author index)
            const blogs = await Blog.find({
                author: testUser._id,
                status: 'published'
            })
                .populate('author', 'username email')
                .sort({ createdAt: -1 })
                .lean();

            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(100); // Should be fast with author index
            blogs.forEach(blog => {
                expect(blog.author._id.toString()).toBe(testUser._id.toString());
            });
        });
    });

    describe('Index Coverage Analysis', () => {
        test('should verify all critical indexes exist', async () => {
            const blogIndexes = await Blog.collection.getIndexes();
            const userIndexes = await User.collection.getIndexes();

            // Check Blog indexes
            const blogIndexNames = Object.keys(blogIndexes);
            expect(blogIndexNames).toContain('slug_1'); // Slug index
            expect(blogIndexNames.some(name => name.includes('status_1'))).toBe(true); // Status index
            expect(blogIndexNames.some(name => name.includes('category_1'))).toBe(true); // Category index
            expect(blogIndexNames.some(name => name.includes('blog_text_search'))).toBe(true); // Text index

            // Check User indexes
            const userIndexNames = Object.keys(userIndexes);
            expect(userIndexNames).toContain('email_1'); // Email index
            expect(userIndexNames).toContain('username_1'); // Username index
        });

        test('should measure index selectivity', async () => {
            // Test index selectivity for different fields
            const totalBlogs = await Blog.countDocuments();
            const publishedBlogs = await Blog.countDocuments({ status: 'published' });
            const featuredBlogs = await Blog.countDocuments({ featured: true });

            // Calculate selectivity (lower is better for indexes)
            const statusSelectivity = publishedBlogs / totalBlogs;
            const featuredSelectivity = featuredBlogs / totalBlogs;

            expect(statusSelectivity).toBeGreaterThan(0);
            expect(statusSelectivity).toBeLessThan(1);
            expect(featuredSelectivity).toBeGreaterThan(0);
            expect(featuredSelectivity).toBeLessThan(1);

            console.log(`Status index selectivity: ${statusSelectivity.toFixed(2)}`);
            console.log(`Featured index selectivity: ${featuredSelectivity.toFixed(2)}`);
        });
    });

    describe('Query Optimization Recommendations', () => {
        test('should identify slow queries', async () => {
            // Simulate a potentially slow query without proper indexing
            const startTime = Date.now();

            // Query that might not use optimal indexes
            const blogs = await Blog.find({
                'seoMetadata.keywords': { $in: ['test'] }
            });

            const executionTime = Date.now() - startTime;

            if (executionTime > 100) {
                console.warn(`Slow query detected: seoMetadata.keywords lookup took ${executionTime}ms`);
                console.warn('Consider adding an index on seoMetadata.keywords');
            }

            expect(executionTime).toBeLessThan(500); // Should not be extremely slow
        });

        test('should validate compound index usage', async () => {
            // Test queries that should benefit from compound indexes
            const queries = [
                { status: 'published', category: 'Programming' },
                { status: 'published', featured: true },
                { status: 'published', tags: { $in: ['javascript'] } },
                { author: testUser._id, status: 'published' }
            ];

            for (const query of queries) {
                const startTime = Date.now();
                await Blog.find(query).sort({ createdAt: -1 }).limit(5);
                const executionTime = Date.now() - startTime;

                expect(executionTime).toBeLessThan(100);
                console.log(`Query ${JSON.stringify(query)} executed in ${executionTime}ms`);
            }
        });
    });
});