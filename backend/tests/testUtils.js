const mongoose = require('mongoose');
const User = require('../models/User');
const Blog = require('../models/Blog');
const AuthService = require('../services/authService');

/**
 * Test utilities for creating test data and common operations
 */
class TestUtils {
    /**
     * Create a test user with specified role
     */
    static async createTestUser(userData = {}) {
        const defaultData = {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
            role: 'reader',
            isActive: true,
            profile: {
                firstName: 'Test',
                lastName: 'User',
                bio: 'Test user bio'
            }
        };

        const user = await User.create({ ...defaultData, ...userData });
        return user;
    }

    /**
     * Create multiple test users with different roles
     */
    static async createTestUsers() {
        const admin = await this.createTestUser({
            username: 'admin_test',
            email: 'admin@test.com',
            role: 'admin'
        });

        const editor = await this.createTestUser({
            username: 'editor_test',
            email: 'editor@test.com',
            role: 'editor'
        });

        const reader = await this.createTestUser({
            username: 'reader_test',
            email: 'reader@test.com',
            role: 'reader'
        });

        return { admin, editor, reader };
    }

    /**
     * Generate JWT token for a user
     */
    static generateToken(userId) {
        return AuthService.generateToken(userId);
    }

    /**
     * Create a test blog
     */
    static async createTestBlog(blogData = {}, author = null) {
        if (!author) {
            author = await this.createTestUser({ role: 'admin' });
        }

        const defaultData = {
            title: `Test Blog ${Date.now()}`,
            content: '<p>This is test blog content with <strong>HTML</strong> formatting.</p>',
            excerpt: 'This is a test blog excerpt for testing purposes.',
            author: author._id,
            category: 'Testing',
            tags: ['test', 'blog', 'api'],
            status: 'published',
            featured: false,
            seoMetadata: {
                metaTitle: 'Test Blog SEO Title',
                metaDescription: 'Test blog SEO description',
                keywords: ['test', 'blog', 'seo']
            },
            coverImage: {
                url: 'https://example.com/test-image.jpg',
                alt: 'Test image'
            }
        };

        const blog = await Blog.create({ ...defaultData, ...blogData });
        return blog;
    }

    /**
     * Create multiple test blogs
     */
    static async createTestBlogs(count = 5, author = null) {
        if (!author) {
            author = await this.createTestUser({ role: 'admin' });
        }

        const blogs = [];
        for (let i = 0; i < count; i++) {
            const blog = await this.createTestBlog({
                title: `Test Blog ${i + 1}`,
                category: i % 2 === 0 ? 'Frontend' : 'Backend',
                status: i % 3 === 0 ? 'draft' : 'published',
                featured: i % 4 === 0,
                viewCount: Math.floor(Math.random() * 100),
                likes: i % 2 === 0 ? [author._id] : []
            }, author);
            blogs.push(blog);
        }
        return blogs;
    }

    /**
     * Clean up all test data
     */
    static async cleanup() {
        await User.deleteMany({});
        await Blog.deleteMany({});
    }

    /**
     * Wait for a specified amount of time
     */
    static async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate random string for testing
     */
    static generateRandomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Create mock request object for testing middleware
     */
    static createMockRequest(data = {}) {
        return {
            body: {},
            params: {},
            query: {},
            headers: {},
            user: null,
            ...data
        };
    }

    /**
     * Create mock response object for testing middleware
     */
    static createMockResponse() {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.send = jest.fn().mockReturnValue(res);
        res.cookie = jest.fn().mockReturnValue(res);
        res.clearCookie = jest.fn().mockReturnValue(res);
        return res;
    }

    /**
     * Create mock next function for testing middleware
     */
    static createMockNext() {
        return jest.fn();
    }

    /**
     * Validate MongoDB ObjectId
     */
    static isValidObjectId(id) {
        return mongoose.Types.ObjectId.isValid(id);
    }

    /**
     * Generate valid MongoDB ObjectId
     */
    static generateObjectId() {
        return new mongoose.Types.ObjectId();
    }

    /**
     * Create test file buffer
     */
    static createTestFileBuffer(content = 'test file content') {
        return Buffer.from(content);
    }

    /**
     * Create mock file object for upload testing
     */
    static createMockFile(options = {}) {
        const defaults = {
            fieldname: 'file',
            originalname: 'test.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            size: 1024,
            buffer: this.createTestFileBuffer()
        };
        return { ...defaults, ...options };
    }

    /**
     * Assert that an object has required properties
     */
    static assertHasProperties(obj, properties) {
        properties.forEach(prop => {
            expect(obj).toHaveProperty(prop);
        });
    }

    /**
     * Assert that a response has the expected structure
     */
    static assertApiResponse(response, expectedStatus = 200) {
        expect(response.status).toBe(expectedStatus);
        expect(response.body).toHaveProperty('success');

        if (response.body.success) {
            expect(response.body).toHaveProperty('data');
        } else {
            expect(response.body).toHaveProperty('error');
        }
    }

    /**
     * Assert pagination structure
     */
    static assertPaginationStructure(pagination) {
        expect(pagination).toHaveProperty('page');
        expect(pagination).toHaveProperty('limit');
        expect(pagination).toHaveProperty('total');
        expect(pagination).toHaveProperty('pages');
        expect(typeof pagination.page).toBe('number');
        expect(typeof pagination.limit).toBe('number');
        expect(typeof pagination.total).toBe('number');
        expect(typeof pagination.pages).toBe('number');
    }
}

module.exports = TestUtils;