#!/usr/bin/env node

/**
 * System Validation Script
 * Validates the complete blogging system setup and configuration
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class SystemValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.validations = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);

        if (type === 'error') {
            this.errors.push(message);
        } else if (type === 'warning') {
            this.warnings.push(message);
        } else if (type === 'success') {
            this.validations.push(message);
        }
    }

    checkFileExists(filePath, description) {
        if (fs.existsSync(filePath)) {
            this.log(`${description} exists`, 'success');
            return true;
        } else {
            this.log(`${description} missing: ${filePath}`, 'error');
            return false;
        }
    }

    checkDirectoryStructure() {
        this.log('Validating directory structure...');

        const requiredDirs = [
            { path: 'backend', desc: 'Backend directory' },
            { path: 'admin-panel', desc: 'Admin panel directory' },
            { path: 'public-frontend', desc: 'Public frontend directory' },
            { path: 'backend/models', desc: 'Backend models directory' },
            { path: 'backend/controllers', desc: 'Backend controllers directory' },
            { path: 'backend/routes', desc: 'Backend routes directory' },
            { path: 'backend/middleware', desc: 'Backend middleware directory' },
            { path: 'backend/services', desc: 'Backend services directory' },
            { path: 'backend/config', desc: 'Backend config directory' },
            { path: 'admin-panel/src', desc: 'Admin panel source directory' },
            { path: 'admin-panel/src/components', desc: 'Admin panel components directory' },
            { path: 'admin-panel/src/pages', desc: 'Admin panel pages directory' },
            { path: 'admin-panel/src/services', desc: 'Admin panel services directory' },
            { path: 'public-frontend/src', desc: 'Public frontend source directory' },
            { path: 'public-frontend/src/components', desc: 'Public frontend components directory' },
            { path: 'public-frontend/src/pages', desc: 'Public frontend pages directory' },
            { path: 'public-frontend/src/services', desc: 'Public frontend services directory' }
        ];

        let allDirsExist = true;
        requiredDirs.forEach(dir => {
            if (!this.checkFileExists(dir.path, dir.desc)) {
                allDirsExist = false;
            }
        });

        return allDirsExist;
    }

    checkPackageFiles() {
        this.log('Validating package.json files...');

        const packageFiles = [
            { path: 'package.json', desc: 'Root package.json' },
            { path: 'backend/package.json', desc: 'Backend package.json' },
            { path: 'admin-panel/package.json', desc: 'Admin panel package.json' },
            { path: 'public-frontend/package.json', desc: 'Public frontend package.json' }
        ];

        let allPackagesExist = true;
        packageFiles.forEach(pkg => {
            if (this.checkFileExists(pkg.path, pkg.desc)) {
                try {
                    const content = JSON.parse(fs.readFileSync(pkg.path, 'utf8'));
                    if (content.dependencies || content.devDependencies) {
                        this.log(`${pkg.desc} has valid dependencies`, 'success');
                    } else {
                        this.log(`${pkg.desc} missing dependencies`, 'warning');
                    }
                } catch (error) {
                    this.log(`${pkg.desc} has invalid JSON: ${error.message}`, 'error');
                    allPackagesExist = false;
                }
            } else {
                allPackagesExist = false;
            }
        });

        return allPackagesExist;
    }

    checkEnvironmentFiles() {
        this.log('Validating environment files...');

        const envFiles = [
            { path: 'backend/.env', desc: 'Backend environment file' },
            { path: 'admin-panel/.env', desc: 'Admin panel environment file' },
            { path: 'public-frontend/.env', desc: 'Public frontend environment file' }
        ];

        let allEnvFilesExist = true;
        envFiles.forEach(env => {
            if (this.checkFileExists(env.path, env.desc)) {
                const content = fs.readFileSync(env.path, 'utf8');
                if (content.trim().length > 0) {
                    this.log(`${env.desc} has content`, 'success');
                } else {
                    this.log(`${env.desc} is empty`, 'warning');
                }
            } else {
                allEnvFilesExist = false;
            }
        });

        return allEnvFilesExist;
    }

    checkBackendFiles() {
        this.log('Validating backend files...');

        const backendFiles = [
            { path: 'backend/server.js', desc: 'Backend server file' },
            { path: 'backend/models/Blog.js', desc: 'Blog model' },
            { path: 'backend/models/User.js', desc: 'User model' },
            { path: 'backend/models/Category.js', desc: 'Category model' },
            { path: 'backend/controllers/blogController.js', desc: 'Blog controller' },
            { path: 'backend/controllers/authController.js', desc: 'Auth controller' },
            { path: 'backend/controllers/userController.js', desc: 'User controller' },
            { path: 'backend/controllers/categoryController.js', desc: 'Category controller' },
            { path: 'backend/controllers/analyticsController.js', desc: 'Analytics controller' },
            { path: 'backend/routes/blogRoutes.js', desc: 'Blog routes' },
            { path: 'backend/routes/authRoutes.js', desc: 'Auth routes' },
            { path: 'backend/routes/categoryRoutes.js', desc: 'Category routes' },
            { path: 'backend/middleware/auth.js', desc: 'Auth middleware' },
            { path: 'backend/middleware/roles.js', desc: 'Roles middleware' },
            { path: 'backend/config/database.js', desc: 'Database config' },
            { path: 'backend/config/s3.js', desc: 'S3 config' },
            { path: 'backend/services/authService.js', desc: 'Auth service' },
            { path: 'backend/services/s3Service.js', desc: 'S3 service' }
        ];

        let allBackendFilesExist = true;
        backendFiles.forEach(file => {
            if (!this.checkFileExists(file.path, file.desc)) {
                allBackendFilesExist = false;
            }
        });

        return allBackendFilesExist;
    }

    checkAdminPanelFiles() {
        this.log('Validating admin panel files...');

        const adminFiles = [
            { path: 'admin-panel/src/App.jsx', desc: 'Admin App component' },
            { path: 'admin-panel/src/pages/Login.jsx', desc: 'Login page' },
            { path: 'admin-panel/src/pages/BlogManagement.jsx', desc: 'Blog management page' },
            { path: 'admin-panel/src/pages/CategoryManagement.jsx', desc: 'Category management page' },
            { path: 'admin-panel/src/pages/Analytics.jsx', desc: 'Analytics page' },
            { path: 'admin-panel/src/pages/UserManagement.jsx', desc: 'User management page' },
            { path: 'admin-panel/src/components/blog/BlogForm.jsx', desc: 'Blog form component' },
            { path: 'admin-panel/src/components/blog/BlogList.jsx', desc: 'Blog list component' },
            { path: 'admin-panel/src/components/blog/CategoryManager.jsx', desc: 'Category manager component' },
            { path: 'admin-panel/src/components/blog/RichTextEditor.jsx', desc: 'Rich text editor component' },
            { path: 'admin-panel/src/services/api.js', desc: 'API service' },
            { path: 'admin-panel/src/services/auth.js', desc: 'Auth service' },
            { path: 'admin-panel/src/services/blog.js', desc: 'Blog service' },
            { path: 'admin-panel/src/services/category.js', desc: 'Category service' },
            { path: 'admin-panel/src/contexts/AuthContext.jsx', desc: 'Auth context' }
        ];

        let allAdminFilesExist = true;
        adminFiles.forEach(file => {
            if (!this.checkFileExists(file.path, file.desc)) {
                allAdminFilesExist = false;
            }
        });

        return allAdminFilesExist;
    }

    checkPublicFrontendFiles() {
        this.log('Validating public frontend files...');

        const publicFiles = [
            { path: 'public-frontend/src/App.jsx', desc: 'Public App component' },
            { path: 'public-frontend/src/pages/Home.jsx', desc: 'Home page' },
            { path: 'public-frontend/src/pages/BlogListPage.jsx', desc: 'Blog list page' },
            { path: 'public-frontend/src/components/blog/BlogCard.jsx', desc: 'Blog card component' },
            { path: 'public-frontend/src/components/blog/BlogList.jsx', desc: 'Blog list component' },
            { path: 'public-frontend/src/components/blog/BlogPost.jsx', desc: 'Blog post component' },
            { path: 'public-frontend/src/components/blog/BlogSearch.jsx', desc: 'Blog search component' },
            { path: 'public-frontend/src/components/common/Header.jsx', desc: 'Header component' },
            { path: 'public-frontend/src/components/common/Footer.jsx', desc: 'Footer component' },
            { path: 'public-frontend/src/components/common/SEOHead.jsx', desc: 'SEO head component' },
            { path: 'public-frontend/src/services/blogApi.js', desc: 'Blog API service' }
        ];

        let allPublicFilesExist = true;
        publicFiles.forEach(file => {
            if (!this.checkFileExists(file.path, file.desc)) {
                allPublicFilesExist = false;
            }
        });

        return allPublicFilesExist;
    }

    checkEnvironmentVariables() {
        this.log('Validating environment variables...');

        // Check backend .env
        if (fs.existsSync('backend/.env')) {
            const backendEnv = fs.readFileSync('backend/.env', 'utf8');
            const requiredBackendVars = [
                'MONGODB_URI',
                'JWT_SECRET',
                'AWS_ACCESS_KEY_ID',
                'AWS_SECRET_ACCESS_KEY',
                'S3_BUCKET_NAME',
                'AWS_REGION'
            ];

            requiredBackendVars.forEach(varName => {
                if (backendEnv.includes(varName)) {
                    this.log(`Backend has ${varName}`, 'success');
                } else {
                    this.log(`Backend missing ${varName}`, 'error');
                }
            });
        }

        // Check admin panel .env
        if (fs.existsSync('admin-panel/.env')) {
            const adminEnv = fs.readFileSync('admin-panel/.env', 'utf8');
            if (adminEnv.includes('REACT_APP_API_URL') || adminEnv.includes('VITE_API_BASE_URL')) {
                this.log('Admin panel has API URL configured', 'success');
            } else {
                this.log('Admin panel missing API URL configuration', 'error');
            }
        }

        // Check public frontend .env
        if (fs.existsSync('public-frontend/.env')) {
            const publicEnv = fs.readFileSync('public-frontend/.env', 'utf8');
            if (publicEnv.includes('VITE_API_BASE_URL')) {
                this.log('Public frontend has API URL configured', 'success');
            } else {
                this.log('Public frontend missing API URL configuration', 'error');
            }
        }
    }

    checkDependencies() {
        this.log('Validating key dependencies...');

        // Check backend dependencies
        if (fs.existsSync('backend/package.json')) {
            const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
            const requiredBackendDeps = [
                'express',
                'mongoose',
                'jsonwebtoken',
                'bcryptjs',
                'aws-sdk',
                'cors',
                'helmet',
                'dotenv'
            ];

            requiredBackendDeps.forEach(dep => {
                if (backendPkg.dependencies && backendPkg.dependencies[dep]) {
                    this.log(`Backend has ${dep}`, 'success');
                } else {
                    this.log(`Backend missing ${dep}`, 'error');
                }
            });
        }

        // Check admin panel dependencies
        if (fs.existsSync('admin-panel/package.json')) {
            const adminPkg = JSON.parse(fs.readFileSync('admin-panel/package.json', 'utf8'));
            const requiredAdminDeps = ['react', 'react-dom', 'react-router-dom', 'axios'];

            requiredAdminDeps.forEach(dep => {
                if (adminPkg.dependencies && adminPkg.dependencies[dep]) {
                    this.log(`Admin panel has ${dep}`, 'success');
                } else {
                    this.log(`Admin panel missing ${dep}`, 'error');
                }
            });
        }

        // Check public frontend dependencies
        if (fs.existsSync('public-frontend/package.json')) {
            const publicPkg = JSON.parse(fs.readFileSync('public-frontend/package.json', 'utf8'));
            const requiredPublicDeps = ['react', 'react-dom', 'react-router-dom', 'axios'];

            requiredPublicDeps.forEach(dep => {
                if (publicPkg.dependencies && publicPkg.dependencies[dep]) {
                    this.log(`Public frontend has ${dep}`, 'success');
                } else {
                    this.log(`Public frontend missing ${dep}`, 'error');
                }
            });
        }
    }

    async checkAPIEndpoints() {
        this.log('Validating API endpoint configuration...');

        // Check if backend routes are properly configured
        const routeFiles = [
            'backend/routes/blogRoutes.js',
            'backend/routes/authRoutes.js',
            'backend/routes/categoryRoutes.js',
            'backend/routes/analyticsRoutes.js',
            'backend/routes/userRoutes.js'
        ];

        routeFiles.forEach(routeFile => {
            if (fs.existsSync(routeFile)) {
                const content = fs.readFileSync(routeFile, 'utf8');
                if (content.includes('router.get') || content.includes('router.post')) {
                    this.log(`${routeFile} has route definitions`, 'success');
                } else {
                    this.log(`${routeFile} missing route definitions`, 'warning');
                }
            }
        });
    }

    checkTestFiles() {
        this.log('Validating test files...');

        const testDirs = [
            'backend/tests',
            'admin-panel/src/tests',
            'admin-panel/src/components/__tests__',
            'public-frontend/src/tests',
            'public-frontend/src/components/__tests__'
        ];

        testDirs.forEach(testDir => {
            if (fs.existsSync(testDir)) {
                const files = fs.readdirSync(testDir);
                const testFiles = files.filter(file => file.includes('.test.') || file.includes('.spec.'));
                if (testFiles.length > 0) {
                    this.log(`${testDir} has ${testFiles.length} test files`, 'success');
                } else {
                    this.log(`${testDir} has no test files`, 'warning');
                }
            } else {
                this.log(`${testDir} directory missing`, 'warning');
            }
        });
    }

    generateReport() {
        this.log('\n📊 VALIDATION REPORT', 'info');
        this.log('='.repeat(50), 'info');

        this.log(`✅ Successful validations: ${this.validations.length}`, 'success');
        this.log(`⚠️  Warnings: ${this.warnings.length}`, 'warning');
        this.log(`❌ Errors: ${this.errors.length}`, 'error');

        if (this.warnings.length > 0) {
            console.log('\nWarnings:');
            this.warnings.forEach(warning => console.log(`  - ${warning}`));
        }

        if (this.errors.length > 0) {
            console.log('\nErrors:');
            this.errors.forEach(error => console.log(`  - ${error}`));
        }

        const overallStatus = this.errors.length === 0 ? 'PASSED' : 'FAILED';
        this.log(`\n🎯 Overall Status: ${overallStatus}`, overallStatus === 'PASSED' ? 'success' : 'error');

        return this.errors.length === 0;
    }

    async validate() {
        this.log('🔍 Starting System Validation', 'info');
        this.log('='.repeat(50), 'info');

        // Run all validations
        this.checkDirectoryStructure();
        this.checkPackageFiles();
        this.checkEnvironmentFiles();
        this.checkBackendFiles();
        this.checkAdminPanelFiles();
        this.checkPublicFrontendFiles();
        this.checkEnvironmentVariables();
        this.checkDependencies();
        await this.checkAPIEndpoints();
        this.checkTestFiles();

        // Generate report
        return this.generateReport();
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new SystemValidator();
    validator.validate().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Validation error:', error);
        process.exit(1);
    });
}

module.exports = SystemValidator;