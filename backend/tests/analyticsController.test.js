const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Blog = require('../models/Blog');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Analytics Controller', () => {
    let adminToken;
    let editorToken;
    let readerToken;
    let adminUser;
    let editorUser;
    let readerUser;

    beforeAll(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/blog_test');
        }

        // Create test users
        adminUser = new User({
            username: 'admin',
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin'
        });
        await adminUser.save();

        editorUser = new User({
            username: 'editor',
            email: 'editor@test.com',
            password: 'password123',
            role: 'editor'
        });
        await editorUser.save();

        readerUser = new User({
            username: 'reader',
            email: 'reader@test.com',
            password: 'password123',
            role: 'reader'
        });
        await readerUser.save();

        // Generate tokens
        adminToken = jwt.sign(
            { userId: adminUser._id, role: adminUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        editorToken = jwt.sign(
            { userId: editorUser._id, role: editorUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        readerToken = jwt.sign(
            { userId: readerUser._id, role: readerUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    beforeEach(async () => {
        // Clear blogs collection before each test
        await Blog.deleteMany({});

        // Create test blogs
        const testBlogs = [
            {
                title: 'Tech Blog 1',
                content: 'Content for tech blog 1',
                excerpt: 'Excerpt for tech blog 1',
                category: 'Technology',
                author: adminUser._id,
                status: 'published',
                viewCount: 100,
                likes: [editorUser._id, readerUser._id],
                createdAt: new Date('2023-01-15')
            },
            {
                title: 'Design Blog 1',
                content: 'Content for design blog 1',
                excerpt: 'Excerpt for design blog 1',
                category: 'Design',
                author: editorUser._id,
                status: 'published',
                viewCount: 200,
                likes: [adminUser._id],
                createdAt: new Date('2023-02-15')
            },
            {
                title: 'Draft Blog',
                content: 'Content for draft blog',
                excerpt: 'Excerpt for draft blog',
                category: 'Technology',
                author: adminUser._id,
                status: 'draft',
                viewCount: 50,
                likes: [],
                createdAt: new Date('2023-03-15')
            }
        ];

        await Blog.insertMany(testBlogs);
    });

    afterAll(async () => {
        // Clean up
        await Blog.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('GET /api/analytics/overview', () => {
        it('should return analytics overview for admin user', async () => {
            const response = await request(app)
                .get('/api/analytics/overview')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalBlogs', 3);
            expect(response.body.data).toHaveProperty('publishedBlogs', 2);
            expect(response.body.data).toHaveProperty('draftBlogs', 1);
            expect(response.body.data).toHaveProperty('totalViews', 350);
            expect(response.body.data).toHaveProperty('totalLikes', 3);
            expect(response.body.data).toHaveProperty('totalUsers', 3);
        });

        it('should return analytics overview for editor user', async () => {
            const response = await request(app)
                .get('/api/analytics/overview')
                .set('Authorization', `Bearer ${editorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalBlogs', 3);
        });

        it('should reject request from reader user', async () => {
            const response = await request(app)
                .get('/api/analytics/overview')
                .set('Authorization', `Bearer ${readerToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should reject request without authentication', async () => {
            const response = await request(app)
                .get('/api/analytics/overview')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should filter by date range', async () => {
            const response = await request(app)
                .get('/api/analytics/overview')
                .query({
                    startDate: '2023-02-01',
                    endDate: '2023-03-31'
                })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalBlogs).toBe(2); // Only blogs from Feb and Mar
        });
    });

    describe('GET /api/analytics/popular-blogs', () => {
        it('should return popular blogs sorted by views', async () => {
            const response = await request(app)
                .get('/api/analytics/popular-blogs')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);

            // Should be sorted by viewCount descending
            expect(response.body.data[0].viewCount).toBe(200);
            expect(response.body.data[1].viewCount).toBe(100);
            expect(response.body.data[2].viewCount).toBe(50);
        });

        it('should limit results when limit parameter is provided', async () => {
            const response = await request(app)
                .get('/api/analytics/popular-blogs')
                .query({ limit: 2 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });

        it('should include author information', async () => {
            const response = await request(app)
                .get('/api/analytics/popular-blogs')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data[0]).toHaveProperty('author');
            expect(response.body.data[0].author).toHaveProperty('username');
        });
    });

    describe('GET /api/analytics/liked-blogs', () => {
        it('should return most liked blogs', async () => {
            const response = await request(app)
                .get('/api/analytics/liked-blogs')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);

            // Should be sorted by likeCount descending
            expect(response.body.data[0].likeCount).toBe(2);
            expect(response.body.data[1].likeCount).toBe(1);
            expect(response.body.data[2].likeCount).toBe(0);
        });

        it('should include like count in response', async () => {
            const response = await request(app)
                .get('/api/analytics/liked-blogs')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach(blog => {
                expect(blog).toHaveProperty('likeCount');
                expect(typeof blog.likeCount).toBe('number');
            });
        });
    });

    describe('GET /api/analytics/engagement-trends', () => {
        it('should return engagement trends by week (default)', async () => {
            const response = await request(app)
                .get('/api/analytics/engagement-trends')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.period).toBe('week');
        });

        it('should return engagement trends by month', async () => {
            const response = await request(app)
                .get('/api/analytics/engagement-trends')
                .query({ period: 'month' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.period).toBe('month');
        });

        it('should return engagement trends by day', async () => {
            const response = await request(app)
                .get('/api/analytics/engagement-trends')
                .query({ period: 'day' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.period).toBe('day');
        });

        it('should include calculated averages', async () => {
            const response = await request(app)
                .get('/api/analytics/engagement-trends')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            if (response.body.data.length > 0) {
                response.body.data.forEach(trend => {
                    expect(trend).toHaveProperty('avgViewsPerBlog');
                    expect(trend).toHaveProperty('avgLikesPerBlog');
                });
            }
        });
    });

    describe('GET /api/analytics/category-performance', () => {
        it('should return category performance data', async () => {
            const response = await request(app)
                .get('/api/analytics/category-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should include all category metrics', async () => {
            const response = await request(app)
                .get('/api/analytics/category-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach(category => {
                expect(category).toHaveProperty('category');
                expect(category).toHaveProperty('blogCount');
                expect(category).toHaveProperty('totalViews');
                expect(category).toHaveProperty('totalLikes');
                expect(category).toHaveProperty('avgViewsPerBlog');
                expect(category).toHaveProperty('avgReadingTime');
            });
        });

        it('should sort categories by total views descending', async () => {
            const response = await request(app)
                .get('/api/analytics/category-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            if (response.body.data.length > 1) {
                for (let i = 0; i < response.body.data.length - 1; i++) {
                    expect(response.body.data[i].totalViews)
                        .toBeGreaterThanOrEqual(response.body.data[i + 1].totalViews);
                }
            }
        });
    });

    describe('Error handling', () => {
        it('should handle database errors gracefully', async () => {
            // Mock a database error
            const originalFind = Blog.find;
            Blog.find = jest.fn().mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/analytics/overview')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Failed to retrieve analytics overview');

            // Restore original method
            Blog.find = originalFind;
        });

        it('should handle invalid date parameters', async () => {
            const response = await request(app)
                .get('/api/analytics/overview')
                .query({
                    startDate: 'invalid-date',
                    endDate: 'also-invalid'
                })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(500);

            expect(response.body.success).toBe(false);
        });
    });
});