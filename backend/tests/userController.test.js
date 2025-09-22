const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('User Controller', () => {
    let adminToken;
    let editorToken;
    let readerToken;
    let adminUser;
    let editorUser;
    let readerUser;

    beforeAll(async () => {
        // Create test users
        adminUser = await User.create({
            username: 'admin',
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin'
        });

        editorUser = await User.create({
            username: 'editor',
            email: 'editor@test.com',
            password: 'password123',
            role: 'editor'
        });

        readerUser = await User.create({
            username: 'reader',
            email: 'reader@test.com',
            password: 'password123',
            role: 'reader'
        });

        // Generate tokens
        adminToken = jwt.sign(
            { id: adminUser._id, role: adminUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        editorToken = jwt.sign(
            { id: editorUser._id, role: editorUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        readerToken = jwt.sign(
            { id: readerUser._id, role: readerUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('GET /api/users', () => {
        it('should get all users for admin', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);
            expect(response.body.pagination).toBeDefined();
        });

        it('should deny access for non-admin users', async () => {
            await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${editorToken}`)
                .expect(403);

            await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${readerToken}`)
                .expect(403);
        });

        it('should filter users by role', async () => {
            const response = await request(app)
                .get('/api/users?role=admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].role).toBe('admin');
        });

        it('should search users by username', async () => {
            const response = await request(app)
                .get('/api/users?search=admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].username).toBe('admin');
        });

        it('should paginate users', async () => {
            const response = await request(app)
                .get('/api/users?page=1&limit=2')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(2);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(2);
        });
    });

    describe('GET /api/users/:id', () => {
        it('should get user by ID for admin', async () => {
            const response = await request(app)
                .get(`/api/users/${editorUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.username).toBe('editor');
            expect(response.body.data.password).toBeUndefined();
        });

        it('should return 404 for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .get(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    describe('POST /api/users', () => {
        it('should create new user for admin', async () => {
            const userData = {
                username: 'newuser',
                email: 'newuser@test.com',
                password: 'password123',
                role: 'editor',
                profile: {
                    firstName: 'New',
                    lastName: 'User'
                }
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.username).toBe('newuser');
            expect(response.body.data.password).toBeUndefined();
            expect(response.body.data.profile.firstName).toBe('New');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('required');
        });

        it('should prevent duplicate username', async () => {
            const userData = {
                username: 'admin', // Already exists
                email: 'newemail@test.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('already exists');
        });

        it('should prevent duplicate email', async () => {
            const userData = {
                username: 'newusername',
                email: 'admin@test.com', // Already exists
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('already exists');
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should update user for admin', async () => {
            const updateData = {
                profile: {
                    firstName: 'Updated',
                    lastName: 'Editor'
                }
            };

            const response = await request(app)
                .put(`/api/users/${editorUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.profile.firstName).toBe('Updated');
        });

        it('should return 404 for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .put(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'updated' })
                .expect(404);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should delete user for admin', async () => {
            // Create a user to delete
            const userToDelete = await User.create({
                username: 'todelete',
                email: 'todelete@test.com',
                password: 'password123'
            });

            const response = await request(app)
                .delete(`/api/users/${userToDelete._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify user is deleted
            const deletedUser = await User.findById(userToDelete._id);
            expect(deletedUser).toBeNull();
        });

        it('should prevent admin from deleting themselves', async () => {
            const response = await request(app)
                .delete(`/api/users/${adminUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Cannot delete your own account');
        });
    });

    describe('PATCH /api/users/:id/status', () => {
        it('should update user status for admin', async () => {
            const response = await request(app)
                .patch(`/api/users/${editorUser._id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: false })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isActive).toBe(false);
        });

        it('should prevent admin from deactivating themselves', async () => {
            const response = await request(app)
                .patch(`/api/users/${adminUser._id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: false })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Cannot deactivate your own account');
        });
    });

    describe('Authorization', () => {
        it('should deny access without token', async () => {
            await request(app)
                .get('/api/users')
                .expect(401);
        });

        it('should deny access with invalid token', async () => {
            await request(app)
                .get('/api/users')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should deny access for non-admin roles', async () => {
            await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${editorToken}`)
                .send({
                    username: 'test',
                    email: 'test@test.com',
                    password: 'password123'
                })
                .expect(403);
        });
    });
});