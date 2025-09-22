const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const dbConnection = require('../config/database');
require('dotenv').config();

describe('Blog Model', () => {
    beforeAll(async () => {
        await dbConnection.connect();
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clean up the Blog collection before each test
        await Blog.deleteMany({});
    });

    describe('Schema Validation', () => {
        test('should create a valid blog with required fields', async () => {
            const validBlog = new Blog({
                title: 'Test Blog Post',
                content: 'This is a test blog post content with enough words to calculate reading time properly.',
                excerpt: 'This is a test excerpt',
                author: new mongoose.Types.ObjectId(),
                category: 'Technology'
            });

            const savedBlog = await validBlog.save();

            expect(savedBlog.title).toBe('Test Blog Post');
            expect(savedBlog.content).toBe('This is a test blog post content with enough words to calculate reading time properly.');
            expect(savedBlog.excerpt).toBe('This is a test excerpt');
            expect(savedBlog.category).toBe('Technology');
            expect(savedBlog.status).toBe('draft'); // default value
            expect(savedBlog.featured).toBe(false); // default value
            expect(savedBlog.viewCount).toBe(0); // default value
            expect(savedBlog.likes).toHaveLength(0); // default empty array
        });

        test('should fail validation when required fields are missing', async () => {
            const invalidBlog = new Blog({
                content: 'Content without title'
            });

            await expect(invalidBlog.save()).rejects.toThrow();
        });

        test('should fail validation when title exceeds maximum length', async () => {
            const longTitle = 'a'.repeat(201); // Exceeds 200 character limit
            const invalidBlog = new Blog({
                title: longTitle,
                content: 'Valid content',
                excerpt: 'Valid excerpt',
                author: new mongoose.Types.ObjectId(),
                category: 'Technology'
            });

            await expect(invalidBlog.save()).rejects.toThrow();
        });

        test('should fail validation when excerpt exceeds maximum length', async () => {
            const longExcerpt = 'a'.repeat(501); // Exceeds 500 character limit
            const invalidBlog = new Blog({
                title: 'Valid Title',
                content: 'Valid content',
                excerpt: longExcerpt,
                author: new mongoose.Types.ObjectId(),
                category: 'Technology'
            });

            await expect(invalidBlog.save()).rejects.toThrow();
        });

        test('should validate status enum values', async () => {
            const validStatuses = ['draft', 'published', 'archived'];

            for (const status of validStatuses) {
                const blog = new Blog({
                    title: `Test Blog ${status}`,
                    content: 'Valid content',
                    excerpt: 'Valid excerpt',
                    author: new mongoose.Types.ObjectId(),
                    category: 'Technology',
                    status: status
                });

                const savedBlog = await blog.save();
                expect(savedBlog.status).toBe(status);
                await Blog.deleteOne({ _id: savedBlog._id });
            }
        });

        test('should fail validation with invalid status', async () => {
            const invalidBlog = new Blog({
                title: 'Test Blog',
                content: 'Valid content',
                excerpt: 'Valid excerpt',
                author: new mongoose.Types.ObjectId(),
                category: 'Technology',
                status: 'invalid-status'
            });

            await expect(invalidBlog.save()).rejects.toThrow();
        });
    });

    describe('Pre-save Hooks', () => {
        test('should generate slug from title on save', async () => {
            const blog = new Blog({
                title: 'This is a Test Blog Post!',
                content: 'Valid content',
                excerpt: 'Valid excerpt',
                author: new mongoose.Types.ObjectId(),
                category: 'Technology'
            });

            const savedBlog = await blog.save();

            expect(savedBlog.slug).toMatch(/^this-is-a-test-blog-post-\d{6}$/);
            expect(savedBlog.slug).not.toContain('!');
            expect(savedBlog.slug).not.toContain(' ');
        });

        test('should calculate reading time based on content', async () => {
            // Create content with approximately 400 words (should be 2 minutes reading time)
            const words = Array(400).fill('word').join(' ');

            const blog = new Blog({
                title: 'Reading Time Test',
                content: words,
                excerpt: 'Valid excerpt',
                author: new mongoose.Types.ObjectId(),
                category: 'Technology'
            });

            const savedBlog = await blog.save();

            expect(savedBlog.readingTime).toBe(2); // 400 words / 200 words per minute = 2 minutes
        });

        test('should update reading time when content is modified', async () => {
            const blog = new Blog({
                title: 'Reading Time Update Test',
                content: 'Short content',
                excerpt: 'Valid excerpt',
                author: new mongoose.Types.ObjectId(),
                category: 'Technology'
            });

            let savedBlog = await blog.save();
            expect(savedBlog.readingTime).toBe(1); // Minimum 1 minute

            // Update with longer content
            const longContent = Array(600).fill('word').join(' ');
            savedBlog.content = longContent;
            savedBlog = await savedBlog.save();

            expect(savedBlog.readingTime).toBe(3); // 600 words / 200 words per minute = 3 minutes
        });

        test('should update slug when title is modified', async () => {
            const blog = new Blog({
                title: 'Original Title',
                content: 'Valid content',
                excerpt: 'Valid excerpt',
                author: new mongoose.Types.ObjectId(),
                category: 'Technology'
            });

            let savedBlog = await blog.save();
            const originalSlug = savedBlog.slug;

            // Update title
            savedBlog.title = 'Updated Title';
            savedBlog = await savedBlog.save();

            expect(savedBlog.slug).not.toBe(originalSlug);
            expect(savedBlog.slug).toMatch(/^updated-title/);
        });
    });

    describe('Virtual Fields', () => {
        test('should calculate likeCount virtual field', async () => {
            const userId1 = new mongoose.Types.ObjectId();
            const userId2 = new mongoose.Types.ObjectId();

            const blog = new Blog({
                title: 'Like Count Test',
                content: 'Valid content',
                excerpt: 'Valid excerpt',
                author: new mongoose.Types.ObjectId(),
                category: 'Technology',
                likes: [userId1, userId2]
            });

            const savedBlog = await blog.save();

            expect(savedBlog.likeCount).toBe(2);
            expect(savedBlog.likes).toHaveLength(2);
        });

        test('should return 0 for likeCount when no likes', async () => {
            const blog = new Blog({
                title: 'No Likes Test',
                content: 'Valid content',
                excerpt: 'Valid excerpt',
                author: new mongoose.Types.ObjectId(),
                category: 'Technology'
            });

            const savedBlog = await blog.save();

            expect(savedBlog.likeCount).toBe(0);
        });
    });

    describe('Instance Methods', () => {
        let testBlog;
        let userId;

        beforeEach(async () => {
            userId = new mongoose.Types.ObjectId();
            testBlog = new Blog({
                title: 'Method Test Blog',
                content: 'Valid content',
                excerpt: 'Valid excerpt',
                author: new mongoose.Types.ObjectId(),
                category: 'Technology'
            });
            testBlog = await testBlog.save();
        });

        test('should increment view count', async () => {
            expect(testBlog.viewCount).toBe(0);

            await testBlog.incrementViewCount();

            expect(testBlog.viewCount).toBe(1);
        });

        test('should toggle like - add like', async () => {
            expect(testBlog.likes).toHaveLength(0);

            await testBlog.toggleLike(userId);

            expect(testBlog.likes).toHaveLength(1);
            expect(testBlog.likes[0].toString()).toBe(userId.toString());
        });

        test('should toggle like - remove like', async () => {
            // First add a like
            testBlog.likes.push(userId);
            await testBlog.save();

            expect(testBlog.likes).toHaveLength(1);

            // Then remove it
            await testBlog.toggleLike(userId);

            expect(testBlog.likes).toHaveLength(0);
        });

        test('should check if user has liked', async () => {
            expect(testBlog.isLikedBy(userId)).toBe(false);

            testBlog.likes.push(userId);
            await testBlog.save();

            expect(testBlog.isLikedBy(userId)).toBe(true);
        });
    });

    describe('Static Methods', () => {
        beforeEach(async () => {
            // Create test blogs with different statuses using save() to trigger pre-save hooks
            const blog1 = new Blog({
                title: 'Published Blog 1',
                content: 'Content 1',
                excerpt: 'Excerpt 1',
                author: new mongoose.Types.ObjectId(),
                category: 'Tech',
                status: 'published'
            });

            const blog2 = new Blog({
                title: 'Published Featured Blog',
                content: 'Content 2',
                excerpt: 'Excerpt 2',
                author: new mongoose.Types.ObjectId(),
                category: 'Tech',
                status: 'published',
                featured: true
            });

            const blog3 = new Blog({
                title: 'Draft Blog',
                content: 'Content 3',
                excerpt: 'Excerpt 3',
                author: new mongoose.Types.ObjectId(),
                category: 'Tech',
                status: 'draft'
            });

            await blog1.save();
            await blog2.save();
            await blog3.save();
        });

        test('should find only published blogs', async () => {
            const publishedBlogs = await Blog.findPublished();

            expect(publishedBlogs).toHaveLength(2);
            publishedBlogs.forEach(blog => {
                expect(blog.status).toBe('published');
            });
        });

        test('should find only featured blogs', async () => {
            const featuredBlogs = await Blog.findFeatured();

            expect(featuredBlogs).toHaveLength(1);
            expect(featuredBlogs[0].featured).toBe(true);
            expect(featuredBlogs[0].status).toBe('published');
        });
    });

    describe('Indexes', () => {
        test('should have unique slug constraint', async () => {
            // Test that the slug field has unique constraint in schema
            const slugPath = Blog.schema.paths.slug;
            expect(slugPath.options.unique).toBe(true);
        });
    });
});