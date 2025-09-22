const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const dbConnection = require('../config/database');
require('dotenv').config();

describe('User Model', () => {
    beforeAll(async () => {
        await dbConnection.connect();
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clean up the User collection before each test
        await User.deleteMany({});
    });

    describe('Schema Validation', () => {
        test('should create a valid user with required fields', async () => {
            const validUser = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            const savedUser = await validUser.save();

            expect(savedUser.username).toBe('testuser');
            expect(savedUser.email).toBe('test@example.com');
            expect(savedUser.role).toBe('reader'); // default value
            expect(savedUser.isActive).toBe(true); // default value
            expect(savedUser.password).toBeDefined(); // Should be hashed
            expect(savedUser.password).not.toBe('password123'); // Should not be plain text
        });

        test('should fail validation when required fields are missing', async () => {
            const invalidUser = new User({
                email: 'test@example.com'
                // Missing username and password
            });

            await expect(invalidUser.save()).rejects.toThrow();
        });

        test('should fail validation with invalid email format', async () => {
            const invalidUser = new User({
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123'
            });

            await expect(invalidUser.save()).rejects.toThrow();
        });

        test('should fail validation with invalid username format', async () => {
            const invalidUser = new User({
                username: 'test user!', // Contains space and special character
                email: 'test@example.com',
                password: 'password123'
            });

            await expect(invalidUser.save()).rejects.toThrow();
        });

        test('should fail validation when username is too short', async () => {
            const invalidUser = new User({
                username: 'ab', // Only 2 characters
                email: 'test@example.com',
                password: 'password123'
            });

            await expect(invalidUser.save()).rejects.toThrow();
        });

        test('should fail validation when password is too short', async () => {
            const invalidUser = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: '12345' // Only 5 characters
            });

            await expect(invalidUser.save()).rejects.toThrow();
        });

        test('should validate role enum values', async () => {
            const validRoles = ['admin', 'editor', 'reader'];

            for (const role of validRoles) {
                const user = new User({
                    username: `testuser_${role}`,
                    email: `test_${role}@example.com`,
                    password: 'password123',
                    role: role
                });

                const savedUser = await user.save();
                expect(savedUser.role).toBe(role);
                await User.deleteOne({ _id: savedUser._id });
            }
        });

        test('should fail validation with invalid role', async () => {
            const invalidUser = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'invalid-role'
            });

            await expect(invalidUser.save()).rejects.toThrow();
        });

        test('should enforce unique constraints', async () => {
            const user1 = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            await user1.save();

            // Try to create user with same username
            const user2 = new User({
                username: 'testuser', // Same username
                email: 'different@example.com',
                password: 'password123'
            });

            await expect(user2.save()).rejects.toThrow();

            // Try to create user with same email
            const user3 = new User({
                username: 'differentuser',
                email: 'test@example.com', // Same email
                password: 'password123'
            });

            await expect(user3.save()).rejects.toThrow();
        });
    });

    describe('Password Hashing', () => {
        test('should hash password before saving', async () => {
            const plainPassword = 'password123';
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: plainPassword
            });

            const savedUser = await user.save();

            expect(savedUser.password).not.toBe(plainPassword);
            expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
        });

        test('should not rehash password if not modified', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            const savedUser = await user.save();
            const originalHash = savedUser.password;

            // Update a different field
            savedUser.profile.firstName = 'John';
            const updatedUser = await savedUser.save();

            expect(updatedUser.password).toBe(originalHash);
        });

        test('should rehash password when modified', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            const savedUser = await user.save();
            const originalHash = savedUser.password;

            // Update password
            savedUser.password = 'newpassword123';
            const updatedUser = await savedUser.save();

            expect(updatedUser.password).not.toBe(originalHash);
        });
    });

    describe('Virtual Fields', () => {
        test('should return full name when both first and last names are provided', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                profile: {
                    firstName: 'John',
                    lastName: 'Doe'
                }
            });

            const savedUser = await user.save();
            expect(savedUser.fullName).toBe('John Doe');
        });

        test('should return first name when only first name is provided', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                profile: {
                    firstName: 'John'
                }
            });

            const savedUser = await user.save();
            expect(savedUser.fullName).toBe('John');
        });

        test('should return username when no names are provided', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            const savedUser = await user.save();
            expect(savedUser.fullName).toBe('testuser');
        });
    });

    describe('Instance Methods', () => {
        let testUser;

        beforeEach(async () => {
            testUser = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'editor'
            });
            testUser = await testUser.save();
        });

        test('should compare password correctly', async () => {
            const isMatch = await testUser.comparePassword('password123');
            expect(isMatch).toBe(true);

            const isNotMatch = await testUser.comparePassword('wrongpassword');
            expect(isNotMatch).toBe(false);
        });

        test('should check role correctly', () => {
            expect(testUser.hasRole('editor')).toBe(true);
            expect(testUser.hasRole('admin')).toBe(false);
            expect(testUser.hasRole('reader')).toBe(false);
        });

        test('should check admin privileges', async () => {
            expect(testUser.isAdmin()).toBe(false);

            testUser.role = 'admin';
            await testUser.save();
            expect(testUser.isAdmin()).toBe(true);
        });

        test('should check edit privileges', async () => {
            expect(testUser.canEdit()).toBe(true); // editor can edit

            testUser.role = 'admin';
            await testUser.save();
            expect(testUser.canEdit()).toBe(true); // admin can edit

            testUser.role = 'reader';
            await testUser.save();
            expect(testUser.canEdit()).toBe(false); // reader cannot edit
        });

        test('should update last login', async () => {
            const originalLastLogin = testUser.lastLogin;

            await testUser.updateLastLogin();

            expect(testUser.lastLogin).toBeDefined();
            expect(testUser.lastLogin).not.toBe(originalLastLogin);
        });
    });

    describe('Static Methods', () => {
        beforeEach(async () => {
            // Create test users with different roles and statuses
            const users = [
                {
                    username: 'admin1',
                    email: 'admin1@example.com',
                    password: 'password123',
                    role: 'admin',
                    isActive: true
                },
                {
                    username: 'editor1',
                    email: 'editor1@example.com',
                    password: 'password123',
                    role: 'editor',
                    isActive: true
                },
                {
                    username: 'reader1',
                    email: 'reader1@example.com',
                    password: 'password123',
                    role: 'reader',
                    isActive: true
                },
                {
                    username: 'inactive1',
                    email: 'inactive1@example.com',
                    password: 'password123',
                    role: 'reader',
                    isActive: false
                }
            ];

            for (const userData of users) {
                const user = new User(userData);
                await user.save();
            }
        });

        test('should find only active users', async () => {
            const activeUsers = await User.findActive();

            expect(activeUsers).toHaveLength(3);
            activeUsers.forEach(user => {
                expect(user.isActive).toBe(true);
            });
        });

        test('should find users by role', async () => {
            const adminUsers = await User.findByRole('admin');
            expect(adminUsers).toHaveLength(1);
            expect(adminUsers[0].role).toBe('admin');

            const editorUsers = await User.findByRole('editor');
            expect(editorUsers).toHaveLength(1);
            expect(editorUsers[0].role).toBe('editor');

            const readerUsers = await User.findByRole('reader');
            expect(readerUsers).toHaveLength(1); // Only active reader
            expect(readerUsers[0].role).toBe('reader');
            expect(readerUsers[0].isActive).toBe(true);
        });

        test('should find user by email or username', async () => {
            // Find by email
            const userByEmail = await User.findByEmailOrUsername('admin1@example.com');
            expect(userByEmail).toBeDefined();
            expect(userByEmail.email).toBe('admin1@example.com');
            expect(userByEmail.password).toBeDefined(); // Should include password

            // Find by username
            const userByUsername = await User.findByEmailOrUsername('editor1');
            expect(userByUsername).toBeDefined();
            expect(userByUsername.username).toBe('editor1');
            expect(userByUsername.password).toBeDefined(); // Should include password

            // Should not find inactive user
            const inactiveUser = await User.findByEmailOrUsername('inactive1');
            expect(inactiveUser).toBeNull();
        });
    });

    describe('JSON Transformation', () => {
        test('should exclude sensitive fields from JSON output', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

            const savedUser = await user.save();
            const userJSON = savedUser.toJSON();

            expect(userJSON.password).toBeUndefined();
            expect(userJSON.passwordResetToken).toBeUndefined();
            expect(userJSON.passwordResetExpires).toBeUndefined();
            expect(userJSON.username).toBe('testuser');
            expect(userJSON.email).toBe('test@example.com');
        });
    });

    describe('Profile Validation', () => {
        test('should validate profile field lengths', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                profile: {
                    firstName: 'a'.repeat(51), // Exceeds 50 character limit
                    bio: 'a'.repeat(501) // Exceeds 500 character limit
                }
            });

            await expect(user.save()).rejects.toThrow();
        });

        test('should save valid profile data', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                profile: {
                    firstName: 'John',
                    lastName: 'Doe',
                    bio: 'Software developer with 5 years of experience'
                }
            });

            const savedUser = await user.save();

            expect(savedUser.profile.firstName).toBe('John');
            expect(savedUser.profile.lastName).toBe('Doe');
            expect(savedUser.profile.bio).toBe('Software developer with 5 years of experience');
        });
    });
});