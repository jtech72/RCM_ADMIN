#!/usr/bin/env node

/**
 * Script to reset admin user password
 * Usage: node scripts/reset-admin-password.js [username] [new-password]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function resetAdminPassword() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get credentials from command line arguments
        const username = process.argv[2];
        const newPassword = process.argv[3] || 'admin123';

        if (!username) {
            console.log('Usage: node scripts/reset-admin-password.js [username] [new-password]');
            console.log('Example: node scripts/reset-admin-password.js admin newpassword123');
            return;
        }

        // Find the user
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        });

        if (!user) {
            console.log(`❌ User not found: ${username}`);
            console.log('\n💡 Available users:');
            const users = await User.find({}, 'username email role').limit(10);
            users.forEach(u => {
                console.log(`  - ${u.username} (${u.email}) - ${u.role}`);
            });
            return;
        }

        // Update password
        user.password = newPassword;
        await user.save();

        console.log('✅ Password reset successfully!');
        console.log('\n📋 Updated Credentials:');
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`New Password: ${newPassword}`);
        console.log(`Role: ${user.role}`);
        console.log('\n🌐 You can now login to the admin panel at: http://localhost:3001');

    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Handle script execution
if (require.main === module) {
    resetAdminPassword().catch(console.error);
}

module.exports = resetAdminPassword;