const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

// Import routes and middleware
const blogRoutes = require('../routes/blogRoutes');
const authRoutes = require('../routes/authRoutes');
const s3Routes = require('../routes/s3Routes');
const userRoutes = require('../routes/userRoutes');
const analyticsRoutes = require('../routes/analyticsRoutes');
const errorHandler = require('../middleware/errorHandler');
const requestLogger = require('../middleware/requestLogger');

// Import models
const User = require('../models/User');
const Blog = require('../models/Blog');

// Import services
const AuthService = require('../services/authService');

describe('Integration Tests - Full API Workflow', () => {
    let app;
    let adminUser, editorUser, readerUser;
    let adminToken, editorToken, readerToken;
    let testBlog;

    beforeAll(async () => {
        // Create Express app with all middleware and routes
        app = express();

        // Middleware
        app.use(helmet());
        app.use(cors());
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true }));
        app.use(requestLogger);

        // Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/blogs', blogRoutes);
        app.use('/api/s3', s3Routes);
        app.use('/api/users', userRoutes);
        app.use('/api/analytics', analyticsRoutes);

        // Error handling
        app.use(errorHandler);

        // Create test users
        adminUser = await User.create({
            username: 'admin_integration',
            email: 'admin@integration.test',
            password: 'password123',
            role: 'admin',
            isActive: true
        });

        editorUser = await User.create({
            username: 'editor_integration',
            email: 'editor@integration.test',
            password: 'password123',
            role: 'editor',
            isActive: true
        });

        readerUser = await User.create({
            username: 'reader_integration',
            email: 'reader@integration.test',
            password: 'password123',
            role: 'reader',
            isActive: true
        });

        // Generate tokens
        adminToken = AuthService.generateToken(adminUser._id);
        editorToken = AuthService.generateToken(editorUser._id);
        readerToken = AuthService.generateToken(readerUser._id);
    });

    describe('Authentication Flow', () => {
        test('should register a new user', async () => {
            const userData = {
                username: 'newuser',
                email: 'newuser@test.com',
                password: 'password123',
                role: 'reader'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.username).toBe(userData.username);
            expect(response.body.data.token).toBeDefined();
        });

        test('should login with valid credentials', async () => {
            const loginData = {
                email: 'admin@integration.test',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(loginData.email);
            expect(response.body.data.token).toBeDefined();
        });

        test('should reject login with invalid credentials', async () => {
            const loginData = {
                email: 'admin@integration.test',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Blog Management Workflow', () => {
        test('should create, read, update, and delete a blog (CRUD)', async () => {
            // CREATE - Admin creates a blog
            const blogData = {
                title: 'Integration Test Blog',
                content: '<p>This is a test blog for integration testing.</p>',
                excerpt: 'Test blog excerpt',
                category: 'Testing',
                tags: ['integration', 'testing', 'api'],
                status: 'draft',
                featured: false,
                seoMetadata: {
                    metaTitle: 'Integration Test Blog - SEO Title',
                    metaDescription: 'SEO description for integration test blog',
                    keywords: ['integration', 'test', 'blog']
                }
            };

            const createResponse = await request(app)
                .post('/api/blogs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(blogData);

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.success).toBe(true);
            testBlog = createResponse.body.data;

            // READ - Get the created blog
            const getResponse = await request(app)
                .get(`/api/blogs/${testBlog.slug}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.title).toBe(blogData.title);

            // UPDATE - Editor updates the blog
            const updateData = {
                title: 'Updated Integration Test Blog',
                status: 'published'
            };

            const updateResponse = await request(app)
                .put(`/api/blogs/${testBlog._id}`)
                .set('Authorization', `Bearer ${editorToken}`)
                .send(updateData);

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.title).toBe(updateData.title);
            expect(updateResponse.body.data.status).toBe(updateData.status);

            // DELETE - Admin deletes the blog
            const deleteResponse = await request(app)
                .delete(`/api/blogs/${testBlog._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.body.success).toBe(true);

            // Verify deletion
            const verifyResponse = await request(app)
                .get(`/api/blogs/${testBlog.slug}`);

            expect(verifyResponse.status).toBe(404);
        });

        test('should handle blog interactions (like, view)', async () => {
            // Create a test blog
            const blog = await Blog.create({
                title: 'Interaction Test Blog',
                content: '<p>Test content</p>',
                excerpt: 'Test excerpt',
                author: adminUser._id,
                category: 'Testing',
                status: 'published'
            });

            // Like the blog
            const likeResponse = await request(app)
                .patch(`/api/blogs/${blog._id}/like`)
                .set('Authorization', `Bearer ${readerToken}`);

            expect(likeResponse.status).toBe(200);
            expect(likeResponse.body.success).toBe(true);
            expect(likeResponse.body.data.liked).toBe(true);

            // View the blog
            const viewResponse = await request(app)
                .patch(`/api/blogs/${blog._id}/view`);

            expect(viewResponse.status).toBe(200);
            expect(viewResponse.body.success).toBe(true);
            expect(viewResponse.body.data.viewCount).toBe(1);

            // Unlike the blog
            const unlikeResponse = await request(app)
                .patch(`/api/blogs/${blog._id}/like`)
                .set('Authorization', `Bearer ${readerToken}`);

            expect(unlikeResponse.status).toBe(200);
            expect(unlikeResponse.body.success).toBe(true);
            expect(unlikeResponse.body.data.liked).toBe(false);
        });
    });

    describe('Role-Based Access Control', () => {
        test('should enforce role-based permissions', async () => {
            const blogData = {
                title: 'Permission Test Blog',
                content: '<p>Test content</p>',
                excerpt: 'Test excerpt',
                category: 'Testing'
            };

            // Reader should not be able to create blogs
            const readerCreateResponse = await request(app)
                .post('/api/blogs')
                .set('Authorization', `Bearer ${readerToken}`)
                .send(blogData);

            expect(readerCreateResponse.status).toBe(403);

            // Editor should be able to create blogs
            const editorCreateResponse = await request(app)
                .post('/api/blogs')
                .set('Authorization', `Bearer ${editorToken}`)
                .send(blogData);

            expect(editorCreateResponse.status).toBe(201);

            const createdBlog = editorCreateResponse.body.data;

            // Reader should not be able to delete blogs
            const readerDeleteResponse = await request(app)
                .delete(`/api/blogs/${createdBlog._id}`)
                .set('Authorization', `Bearer ${readerToken}`);

            expect(readerDeleteResponse.status).toBe(403);

            // Editor should not be able to delete blogs (admin only)
            const editorDeleteResponse = await request(app)
                .delete(`/api/blogs/${createdBlog._id}`)
                .set('Authorization', `Bearer ${editorToken}`);

            expect(editorDeleteResponse.status).toBe(403);

            // Admin should be able to delete blogs
            const adminDeleteResponse = await request(app)
                .delete(`/api/blogs/${createdBlog._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(adminDeleteResponse.status).toBe(200);
        });
    });

    describe('User Management', () => {
        test('should allow admin to manage users', async () => {
            // Get all users
            const getUsersResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(getUsersResponse.status).toBe(200);
            expect(getUsersResponse.body.success).toBe(true);
            expect(Array.isArray(getUsersResponse.body.data)).toBe(true);

            // Update user role
            const updateUserResponse = await request(app)
                .put(`/api/users/${readerUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'editor' });

            expect(updateUserResponse.status).toBe(200);
            expect(updateUserResponse.body.success).toBe(true);
            expect(updateUserResponse.body.data.role).toBe('editor');
        });

        test('should prevent non-admin users from managing users', async () => {
            const updateUserResponse = await request(app)
                .put(`/api/users/${readerUser._id}`)
                .set('Authorization', `Bearer ${editorToken}`)
                .send({ role: 'admin' });

            expect(updateUserResponse.status).toBe(403);
        });
    });

    describe('Analytics', () => {
        test('should provide analytics data to admin users', async () => {
            // Create some test data
            await Blog.create([
                {
                    title: 'Analytics Test Blog 1',
                    content: '<p>Content 1</p>',
                    excerpt: 'Excerpt 1',
                    author: adminUser._id,
                    category: 'Analytics',
                    status: 'published',
                    viewCount: 100,
                    likes: [readerUser._id]
                },
                {
                    title: 'Analytics Test Blog 2',
                    content: '<p>Content 2</p>',
                    excerpt: 'Excerpt 2',
                    author: editorUser._id,
                    category: 'Analytics',
                    status: 'published',
                    viewCount: 50,
                    likes: []
                }
            ]);

            // Get analytics overview
            const analyticsResponse = await request(app)
                .get('/api/analytics/overview')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(analyticsResponse.status).toBe(200);
            expect(analyticsResponse.body.success).toBe(true);
            expect(analyticsResponse.body.data.totalBlogs).toBeGreaterThan(0);
            expect(analyticsResponse.body.data.totalViews).toBeGreaterThan(0);
            expect(analyticsResponse.body.data.totalLikes).toBeGreaterThan(0);

            // Get popular blogs
            const popularBlogsResponse = await request(app)
                .get('/api/analytics/popular-blogs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(popularBlogsResponse.status).toBe(200);
            expect(popularBlogsResponse.body.success).toBe(true);
            expect(Array.isArray(popularBlogsResponse.body.data)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid routes', async () => {
            const response = await request(app)
                .get('/api/nonexistent');

            expect(response.status).toBe(404);
        });

        test('should handle malformed JSON', async () => {
            const response = await request(app)
                .post('/api/blogs')
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send('invalid json');

            expect(response.status).toBe(400);
        });

        test('should handle unauthorized access', async () => {
            const response = await request(app)
                .post('/api/blogs')
                .send({ title: 'Test' });

            expect(response.status).toBe(401);
        });
    });
});