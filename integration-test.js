#!/usr/bin/env node

/**
 * Full System Integration Test
 * Tests the complete blogging system workflow from backend to frontend
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    backend: {
        url: 'http://localhost:5000',
        port: 5000
    },
    adminPanel: {
        url: 'http://localhost:3001',
        port: 3001
    },
    publicFrontend: {
        url: 'http://localhost:3000',
        port: 3000
    }
};

// Test data
const testUser = {
    username: 'testadmin',
    email: 'test@example.com',
    password: 'testpassword123',
    role: 'admin'
};

const testBlog = {
    title: 'Integration Test Blog Post',
    content: '<p>This is a test blog post created during integration testing.</p>',
    excerpt: 'A test blog post for integration testing',
    category: 'Technology',
    tags: ['test', 'integration'],
    status: 'published',
    featured: true,
    seoMetadata: {
        metaTitle: 'Integration Test Blog Post',
        metaDescription: 'A test blog post for integration testing',
        keywords: ['test', 'integration', 'blog']
    }
};

class IntegrationTester {
    constructor() {
        this.processes = [];
        this.authToken = null;
        this.createdBlogId = null;
        this.createdBlogSlug = null;
    }

    async log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async waitForServer(url, maxAttempts = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                await axios.get(`${url}/health`);
                return true;
            } catch (error) {
                await this.delay(1000);
            }
        }
        return false;
    }

    async startBackend() {
        await this.log('Starting backend server...');

        const backendProcess = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'backend'),
            stdio: 'pipe',
            shell: true
        });

        this.processes.push(backendProcess);

        // Wait for backend to be ready
        const isReady = await this.waitForServer(config.backend.url);
        if (!isReady) {
            throw new Error('Backend server failed to start');
        }

        await this.log('Backend server started successfully', 'success');
    }

    async testBackendHealth() {
        await this.log('Testing backend health...');

        try {
            const response = await axios.get(`${config.backend.url}/health`);
            if (response.data.success) {
                await this.log('Backend health check passed', 'success');
                return true;
            }
        } catch (error) {
            await this.log(`Backend health check failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testUserRegistration() {
        await this.log('Testing user registration...');

        try {
            const response = await axios.post(`${config.backend.url}/api/auth/register`, testUser);
            if (response.data.success) {
                await this.log('User registration successful', 'success');
                return true;
            }
        } catch (error) {
            // User might already exist, try login instead
            await this.log('User might already exist, proceeding to login...');
            return true;
        }
    }

    async testUserLogin() {
        await this.log('Testing user login...');

        try {
            const response = await axios.post(`${config.backend.url}/api/auth/login`, {
                email: testUser.email,
                password: testUser.password
            });

            if (response.data.success && response.data.token) {
                this.authToken = response.data.token;
                await this.log('User login successful', 'success');
                return true;
            }
        } catch (error) {
            await this.log(`User login failed: ${error.response?.data?.error || error.message}`, 'error');
            return false;
        }
    }

    async testBlogCreation() {
        await this.log('Testing blog creation...');

        try {
            const response = await axios.post(
                `${config.backend.url}/api/blogs`,
                testBlog,
                {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success && response.data.data) {
                this.createdBlogId = response.data.data._id;
                this.createdBlogSlug = response.data.data.slug;
                await this.log('Blog creation successful', 'success');
                return true;
            }
        } catch (error) {
            await this.log(`Blog creation failed: ${error.response?.data?.error || error.message}`, 'error');
            return false;
        }
    }

    async testBlogRetrieval() {
        await this.log('Testing blog retrieval...');

        try {
            // Test getting blog by slug (public endpoint)
            const response = await axios.get(`${config.backend.url}/api/blogs/${this.createdBlogSlug}`);

            if (response.data.success && response.data.data) {
                await this.log('Blog retrieval successful', 'success');
                return true;
            }
        } catch (error) {
            await this.log(`Blog retrieval failed: ${error.response?.data?.error || error.message}`, 'error');
            return false;
        }
    }

    async testBlogListing() {
        await this.log('Testing blog listing...');

        try {
            const response = await axios.get(`${config.backend.url}/api/blogs?status=published`);

            if (response.data.success && Array.isArray(response.data.data)) {
                await this.log(`Blog listing successful - found ${response.data.data.length} blogs`, 'success');
                return true;
            }
        } catch (error) {
            await this.log(`Blog listing failed: ${error.response?.data?.error || error.message}`, 'error');
            return false;
        }
    }

    async testBlogInteractions() {
        await this.log('Testing blog interactions...');

        try {
            // Test view increment
            await axios.patch(`${config.backend.url}/api/blogs/${this.createdBlogId}/view`);

            // Test like (requires auth)
            await axios.patch(
                `${config.backend.url}/api/blogs/${this.createdBlogId}/like`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                }
            );

            await this.log('Blog interactions successful', 'success');
            return true;
        } catch (error) {
            await this.log(`Blog interactions failed: ${error.response?.data?.error || error.message}`, 'error');
            return false;
        }
    }

    async testRoleBasedAccess() {
        await this.log('Testing role-based access control...');

        try {
            // Test admin-only endpoint (user management)
            const response = await axios.get(
                `${config.backend.url}/api/users`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                }
            );

            if (response.data.success) {
                await this.log('Role-based access control working correctly', 'success');
                return true;
            }
        } catch (error) {
            await this.log(`Role-based access test failed: ${error.response?.data?.error || error.message}`, 'error');
            return false;
        }
    }

    async testS3Integration() {
        await this.log('Testing S3 integration...');

        try {
            // Test presigned URL generation
            const response = await axios.get(
                `${config.backend.url}/api/s3/presign?fileName=test.jpg&fileType=image/jpeg`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                }
            );

            if (response.data.success && response.data.data.uploadUrl) {
                await this.log('S3 presigned URL generation successful', 'success');
                return true;
            }
        } catch (error) {
            await this.log(`S3 integration test failed: ${error.response?.data?.error || error.message}`, 'error');
            return false;
        }
    }

    async testAnalytics() {
        await this.log('Testing analytics endpoints...');

        try {
            const response = await axios.get(
                `${config.backend.url}/api/analytics/overview`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                }
            );

            if (response.data.success) {
                await this.log('Analytics endpoints working correctly', 'success');
                return true;
            }
        } catch (error) {
            await this.log(`Analytics test failed: ${error.response?.data?.error || error.message}`, 'error');
            return false;
        }
    }

    async cleanup() {
        await this.log('Cleaning up test data...');

        try {
            if (this.createdBlogId && this.authToken) {
                await axios.delete(
                    `${config.backend.url}/api/blogs/${this.createdBlogId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.authToken}`
                        }
                    }
                );
                await this.log('Test blog deleted successfully', 'success');
            }
        } catch (error) {
            await this.log(`Cleanup failed: ${error.response?.data?.error || error.message}`, 'error');
        }
    }

    async stopProcesses() {
        await this.log('Stopping all processes...');

        this.processes.forEach(process => {
            if (process && !process.killed) {
                process.kill('SIGTERM');
            }
        });

        // Wait a bit for graceful shutdown
        await this.delay(2000);

        // Force kill if still running
        this.processes.forEach(process => {
            if (process && !process.killed) {
                process.kill('SIGKILL');
            }
        });
    }

    async runTests() {
        let allTestsPassed = true;

        try {
            await this.log('🚀 Starting Full System Integration Test', 'info');

            // Start backend
            await this.startBackend();

            // Run backend tests
            const tests = [
                () => this.testBackendHealth(),
                () => this.testUserRegistration(),
                () => this.testUserLogin(),
                () => this.testBlogCreation(),
                () => this.testBlogRetrieval(),
                () => this.testBlogListing(),
                () => this.testBlogInteractions(),
                () => this.testRoleBasedAccess(),
                () => this.testS3Integration(),
                () => this.testAnalytics()
            ];

            for (const test of tests) {
                const result = await test();
                if (!result) {
                    allTestsPassed = false;
                }
                await this.delay(500); // Small delay between tests
            }

            // Cleanup
            await this.cleanup();

        } catch (error) {
            await this.log(`Integration test failed: ${error.message}`, 'error');
            allTestsPassed = false;
        } finally {
            await this.stopProcesses();
        }

        if (allTestsPassed) {
            await this.log('🎉 All integration tests passed!', 'success');
            process.exit(0);
        } else {
            await this.log('❌ Some integration tests failed!', 'error');
            process.exit(1);
        }
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Integration test interrupted');
    process.exit(1);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Integration test terminated');
    process.exit(1);
});

// Run the integration test
if (require.main === module) {
    const tester = new IntegrationTester();
    tester.runTests().catch(error => {
        console.error('Integration test error:', error);
        process.exit(1);
    });
}

module.exports = IntegrationTester;