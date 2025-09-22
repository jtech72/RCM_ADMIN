#!/usr/bin/env node

/**
 * Frontend Integration Test
 * Tests both admin panel and public frontend integration with backend
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const { spawn } = require('child_process');
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

// Test credentials
const testAdmin = {
    email: 'test@example.com',
    password: 'testpassword123'
};

class FrontendIntegrationTester {
    constructor() {
        this.processes = [];
        this.browser = null;
        this.adminPage = null;
        this.publicPage = null;
    }

    async log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async waitForServer(url, maxAttempts = 60) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await axios.get(url, { timeout: 5000 });
                if (response.status === 200) {
                    return true;
                }
            } catch (error) {
                await this.delay(2000);
            }
        }
        return false;
    }

    async startServers() {
        await this.log('Starting all servers...');

        // Start backend
        await this.log('Starting backend server...');
        const backendProcess = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'backend'),
            stdio: 'pipe',
            shell: true
        });
        this.processes.push(backendProcess);

        // Start admin panel
        await this.log('Starting admin panel...');
        const adminProcess = spawn('npm', ['run', 'dev', '--', '--port', '3001'], {
            cwd: path.join(__dirname, 'admin-panel'),
            stdio: 'pipe',
            shell: true
        });
        this.processes.push(adminProcess);

        // Start public frontend
        await this.log('Starting public frontend...');
        const publicProcess = spawn('npm', ['run', 'dev', '--', '--port', '3000'], {
            cwd: path.join(__dirname, 'public-frontend'),
            stdio: 'pipe',
            shell: true
        });
        this.processes.push(publicProcess);

        // Wait for all servers to be ready
        await this.log('Waiting for backend to be ready...');
        const backendReady = await this.waitForServer(`${config.backend.url}/health`);
        if (!backendReady) {
            throw new Error('Backend server failed to start');
        }

        await this.log('Waiting for admin panel to be ready...');
        const adminReady = await this.waitForServer(config.adminPanel.url);
        if (!adminReady) {
            throw new Error('Admin panel failed to start');
        }

        await this.log('Waiting for public frontend to be ready...');
        const publicReady = await this.waitForServer(config.publicFrontend.url);
        if (!publicReady) {
            throw new Error('Public frontend failed to start');
        }

        await this.log('All servers started successfully', 'success');
    }

    async setupBrowser() {
        await this.log('Setting up browser...');

        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // Create pages for both applications
        this.adminPage = await this.browser.newPage();
        this.publicPage = await this.browser.newPage();

        // Set viewport
        await this.adminPage.setViewport({ width: 1280, height: 720 });
        await this.publicPage.setViewport({ width: 1280, height: 720 });

        await this.log('Browser setup complete', 'success');
    }

    async testAdminPanelLogin() {
        await this.log('Testing admin panel login...');

        try {
            await this.adminPage.goto(config.adminPanel.url);

            // Wait for login form
            await this.adminPage.waitForSelector('input[type="email"]', { timeout: 10000 });

            // Fill login form
            await this.adminPage.type('input[type="email"]', testAdmin.email);
            await this.adminPage.type('input[type="password"]', testAdmin.password);

            // Submit form
            await this.adminPage.click('button[type="submit"]');

            // Wait for redirect to dashboard/blogs
            await this.adminPage.waitForNavigation({ timeout: 10000 });

            // Check if we're on the dashboard or blogs page
            const currentUrl = this.adminPage.url();
            if (currentUrl.includes('/blogs') || currentUrl.includes('/dashboard')) {
                await this.log('Admin panel login successful', 'success');
                return true;
            } else {
                await this.log('Admin panel login failed - unexpected redirect', 'error');
                return false;
            }
        } catch (error) {
            await this.log(`Admin panel login failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testBlogCreationWorkflow() {
        await this.log('Testing blog creation workflow...');

        try {
            // Navigate to blog management if not already there
            const currentUrl = this.adminPage.url();
            if (!currentUrl.includes('/blogs')) {
                await this.adminPage.goto(`${config.adminPanel.url}/blogs`);
            }

            // Wait for blog list to load
            await this.adminPage.waitForSelector('[data-testid="blog-list"]', { timeout: 10000 });

            // Click create new blog button
            await this.adminPage.click('[data-testid="create-blog-btn"]');

            // Wait for blog form
            await this.adminPage.waitForSelector('[data-testid="blog-form"]', { timeout: 10000 });

            // Fill blog form
            await this.adminPage.type('input[name="title"]', 'Frontend Integration Test Blog');
            await this.adminPage.type('textarea[name="excerpt"]', 'This is a test blog created during frontend integration testing.');
            await this.adminPage.type('input[name="category"]', 'Technology');

            // Add content using the rich text editor
            const editorSelector = '.ql-editor, [data-testid="editor-content"]';
            await this.adminPage.waitForSelector(editorSelector, { timeout: 5000 });
            await this.adminPage.click(editorSelector);
            await this.adminPage.type(editorSelector, 'This is the content of our integration test blog post.');

            // Set status to published
            await this.adminPage.select('select[name="status"]', 'published');

            // Submit form
            await this.adminPage.click('button[type="submit"]');

            // Wait for success message or redirect
            await this.delay(3000);

            await this.log('Blog creation workflow completed', 'success');
            return true;
        } catch (error) {
            await this.log(`Blog creation workflow failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testPublicFrontendBlogDisplay() {
        await this.log('Testing public frontend blog display...');

        try {
            // Navigate to public frontend
            await this.publicPage.goto(config.publicFrontend.url);

            // Wait for blog list to load
            await this.publicPage.waitForSelector('[data-testid="blog-list"], .blog-card', { timeout: 10000 });

            // Check if blogs are displayed
            const blogCards = await this.publicPage.$$('.blog-card, [data-testid="blog-card"]');
            if (blogCards.length > 0) {
                await this.log(`Found ${blogCards.length} blog cards on public frontend`, 'success');

                // Click on the first blog to test individual blog page
                await blogCards[0].click();

                // Wait for blog post page to load
                await this.publicPage.waitForSelector('[data-testid="blog-post"], .blog-content', { timeout: 10000 });

                await this.log('Individual blog post page loaded successfully', 'success');
                return true;
            } else {
                await this.log('No blog cards found on public frontend', 'error');
                return false;
            }
        } catch (error) {
            await this.log(`Public frontend blog display test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testSearchFunctionality() {
        await this.log('Testing search functionality...');

        try {
            // Go back to blog list
            await this.publicPage.goto(`${config.publicFrontend.url}/blog`);

            // Wait for search input
            await this.publicPage.waitForSelector('input[type="search"], [data-testid="search-input"]', { timeout: 10000 });

            // Perform search
            await this.publicPage.type('input[type="search"], [data-testid="search-input"]', 'test');
            await this.publicPage.keyboard.press('Enter');

            // Wait for search results
            await this.delay(2000);

            await this.log('Search functionality test completed', 'success');
            return true;
        } catch (error) {
            await this.log(`Search functionality test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testResponsiveDesign() {
        await this.log('Testing responsive design...');

        try {
            // Test mobile viewport
            await this.publicPage.setViewport({ width: 375, height: 667 });
            await this.publicPage.reload();
            await this.delay(2000);

            // Test tablet viewport
            await this.publicPage.setViewport({ width: 768, height: 1024 });
            await this.publicPage.reload();
            await this.delay(2000);

            // Reset to desktop
            await this.publicPage.setViewport({ width: 1280, height: 720 });

            await this.log('Responsive design test completed', 'success');
            return true;
        } catch (error) {
            await this.log(`Responsive design test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testAnalyticsDashboard() {
        await this.log('Testing analytics dashboard...');

        try {
            // Navigate to analytics page
            await this.adminPage.goto(`${config.adminPanel.url}/dashboard`);

            // Wait for analytics dashboard to load
            await this.adminPage.waitForSelector('[data-testid="analytics-dashboard"], .analytics-card', { timeout: 10000 });

            await this.log('Analytics dashboard loaded successfully', 'success');
            return true;
        } catch (error) {
            await this.log(`Analytics dashboard test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testUserManagement() {
        await this.log('Testing user management...');

        try {
            // Navigate to user management page
            await this.adminPage.goto(`${config.adminPanel.url}/users`);

            // Wait for user list to load
            await this.adminPage.waitForSelector('[data-testid="user-list"], .user-table', { timeout: 10000 });

            await this.log('User management page loaded successfully', 'success');
            return true;
        } catch (error) {
            await this.log(`User management test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async cleanup() {
        await this.log('Cleaning up...');

        if (this.browser) {
            await this.browser.close();
        }

        this.processes.forEach(process => {
            if (process && !process.killed) {
                process.kill('SIGTERM');
            }
        });

        // Wait for graceful shutdown
        await this.delay(3000);

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
            await this.log('🚀 Starting Frontend Integration Test', 'info');

            // Setup
            await this.startServers();
            await this.setupBrowser();

            // Run tests
            const tests = [
                () => this.testAdminPanelLogin(),
                () => this.testBlogCreationWorkflow(),
                () => this.testPublicFrontendBlogDisplay(),
                () => this.testSearchFunctionality(),
                () => this.testResponsiveDesign(),
                () => this.testAnalyticsDashboard(),
                () => this.testUserManagement()
            ];

            for (const test of tests) {
                const result = await test();
                if (!result) {
                    allTestsPassed = false;
                }
                await this.delay(1000);
            }

        } catch (error) {
            await this.log(`Frontend integration test failed: ${error.message}`, 'error');
            allTestsPassed = false;
        } finally {
            await this.cleanup();
        }

        if (allTestsPassed) {
            await this.log('🎉 All frontend integration tests passed!', 'success');
            process.exit(0);
        } else {
            await this.log('❌ Some frontend integration tests failed!', 'error');
            process.exit(1);
        }
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Frontend integration test interrupted');
    process.exit(1);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Frontend integration test terminated');
    process.exit(1);
});

// Run the test
if (require.main === module) {
    const tester = new FrontendIntegrationTester();
    tester.runTests().catch(error => {
        console.error('Frontend integration test error:', error);
        process.exit(1);
    });
}

module.exports = FrontendIntegrationTester;