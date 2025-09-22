#!/usr/bin/env node

/**
 * Script to create initial admin user
 * Usage: node scripts/create-admin.js [username] [email] [password]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');

// Default admin credentials
const DEFAULT_ADMIN = {
    username: 'admin',
    email: 'support@rowthtech.com',
    password: 'Password@123',
    role: 'admin',
    profile: {
        firstName: 'System',
        lastName: 'Administrator'
    }
};

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get credentials from command line arguments or use defaults
        const username = process.argv[2] || DEFAULT_ADMIN.username;
        const email = process.argv[3] || DEFAULT_ADMIN.email;
        const password = process.argv[4] || DEFAULT_ADMIN.password;

        // Check if admin user already exists
        const existingAdmin = await User.findOne({
            $or: [
                { email: email },
                { username: username },
                { role: 'admin' }
            ]
        });

        if (existingAdmin) {
            console.log('Admin user already exists:');
            console.log(`Username: ${existingAdmin.username}`);
            console.log(`Email: ${existingAdmin.email}`);
            console.log(`Role: ${existingAdmin.role}`);
            console.log('\nIf you forgot the password, you can reset it by running:');
            console.log(`node scripts/reset-admin-password.js ${existingAdmin.username} [new-password]`);
            return;
        }

        // Create admin user
        const adminUser = new User({
            username,
            email,
            password,
            role: 'admin',
            profile: {
                firstName: 'System',
                lastName: 'Administrator'
            },
            isActive: true
        });

        await adminUser.save();

        console.log('✅ Admin user created successfully!');
        console.log('\n📋 Admin Credentials:');
        console.log(`Username: ${username}`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: admin`);
        console.log('\n⚠️  IMPORTANT: Please change the default password after first login!');
        console.log('\n🌐 You can now login to the admin panel at: http://localhost:3001');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);

        if (error.code === 11000) {
            console.log('\n💡 This error usually means a user with this email or username already exists.');
            console.log('Try using different credentials or check existing users.');
        }
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Handle script execution
if (require.main === module) {
    createAdmin().catch(console.error);
}

module.exports = createAdmin;