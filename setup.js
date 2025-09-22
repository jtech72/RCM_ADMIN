#!/usr/bin/env node

/**
 * Quick setup script for the blogging system
 * This script will:
 * 1. Install dependencies for backend and admin panel
 * 2. Create initial admin user
 * 3. Provide next steps
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Blogging System...\n');

// Check if we're in the right directory
if (!fs.existsSync('backend') || !fs.existsSync('admin-panel')) {
    console.error('❌ Please run this script from the root directory of the blogging system');
    process.exit(1);
}

try {
    // Install backend dependencies
    console.log('📦 Installing backend dependencies...');
    execSync('npm install', { cwd: 'backend', stdio: 'inherit' });

    // Install admin panel dependencies
    console.log('\n📦 Installing admin panel dependencies...');
    execSync('npm install', { cwd: 'admin-panel', stdio: 'inherit' });

    // Check if .env files exist
    const backendEnvExists = fs.existsSync('backend/.env');
    const adminEnvExists = fs.existsSync('admin-panel/.env');

    if (!backendEnvExists) {
        console.log('\n⚠️  Backend .env file not found. Please copy backend/.env.example to backend/.env and configure it.');
    }

    if (!adminEnvExists) {
        console.log('\n⚠️  Admin panel .env file not found. Please copy admin-panel/.env.example to admin-panel/.env and configure it.');
    }

    if (backendEnvExists) {
        // Create admin user
        console.log('\n👤 Creating initial admin user...');
        try {
            execSync('npm run create-admin', { cwd: 'backend', stdio: 'inherit' });
        } catch (error) {
            console.log('\n⚠️  Could not create admin user automatically. You can create it later by running:');
            console.log('cd backend && npm run create-admin');
        }
    }

    console.log('\n✅ Setup complete!');
    console.log('\n🎯 Next steps:');
    console.log('1. Configure your .env files if not already done');
    console.log('2. Start the backend: cd backend && npm run dev');
    console.log('3. Start the admin panel: cd admin-panel && npm run dev');
    console.log('4. Access admin panel at: http://localhost:3001 or http://localhost:5173');

    if (backendEnvExists) {
        console.log('\n🔑 Default admin credentials:');
        console.log('Username: admin');
        console.log('Email: admin@localhost.com');
        console.log('Password: admin123');
        console.log('\n⚠️  Please change the password after first login!');
    }

} catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n💡 You can set up manually by:');
    console.log('1. cd backend && npm install');
    console.log('2. cd admin-panel && npm install');
    console.log('3. Configure .env files');
    console.log('4. cd backend && npm run create-admin');
    process.exit(1);
}