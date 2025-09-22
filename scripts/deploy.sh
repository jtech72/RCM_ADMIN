#!/bin/bash

# Production Deployment Script for Blogging System Backend & Admin Panel
# This script prepares the code for Git-based deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}

echo -e "${GREEN}🚀 Preparing deployment for environment: ${DEPLOY_ENV}${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check if Git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    # Check if required environment files exist
    if [ ! -f "backend/.env.${DEPLOY_ENV}" ]; then
        print_error "Backend environment file not found: backend/.env.${DEPLOY_ENV}"
        exit 1
    fi
    
    if [ ! -f "admin-panel/.env.${DEPLOY_ENV}" ]; then
        print_error "Admin panel environment file not found: admin-panel/.env.${DEPLOY_ENV}"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Function to prepare Git repository
prepare_git_repo() {
    echo "Preparing Git repository..."
    
    # Check if we're in a Git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_warning "Not in a Git repository. Initializing..."
        git init
        git add .
        git commit -m "Initial commit"
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes. Please commit or stash them before deployment."
        git status --porcelain
        exit 1
    fi
    
    print_status "Git repository is ready"
}

# Function to run tests
run_tests() {
    echo "Running tests..."
    
    # Install dependencies for backend and admin panel
    echo "Installing backend dependencies..."
    cd backend && npm ci && cd ..
    
    echo "Installing admin panel dependencies..."
    cd admin-panel && npm ci && cd ..
    
    # Run backend tests
    echo "Running backend tests..."
    cd backend && npm test && cd ..
    
    # Run admin panel tests
    echo "Running admin panel tests..."
    cd admin-panel && npm run test && cd ..
    
    print_status "All tests passed"
}

# Function to build applications
build_applications() {
    echo "Building applications..."
    
    # Copy environment files
    cp "backend/.env.${DEPLOY_ENV}" "backend/.env"
    cp "admin-panel/.env.${DEPLOY_ENV}" "admin-panel/.env"
    
    # Build admin panel
    echo "Building admin panel..."
    cd admin-panel && npm run build && cd ..
    
    print_status "Applications built successfully"
}

# Function to prepare deployment files
prepare_deployment() {
    echo "Preparing deployment files..."
    
    # Create deployment directory structure
    mkdir -p deployment/backend
    mkdir -p deployment/admin-panel
    
    # Copy backend files (excluding node_modules and logs)
    rsync -av --exclude='node_modules' --exclude='logs' --exclude='.env' backend/ deployment/backend/
    cp "backend/.env.${DEPLOY_ENV}" deployment/backend/.env
    
    # Copy admin panel build
    cp -r admin-panel/dist deployment/admin-panel/
    cp "admin-panel/.env.${DEPLOY_ENV}" deployment/admin-panel/.env
    
    # Copy package.json files
    cp backend/package.json deployment/backend/
    cp admin-panel/package.json deployment/admin-panel/
    
    print_status "Deployment files prepared in ./deployment directory"
}

# Function to validate deployment
validate_deployment() {
    echo "Validating deployment..."
    
    # Check if backend files are ready
    if [ ! -f "deployment/backend/server.js" ]; then
        print_error "Backend server.js not found in deployment"
        return 1
    fi
    
    if [ ! -f "deployment/backend/.env" ]; then
        print_error "Backend .env not found in deployment"
        return 1
    fi
    
    # Check if admin panel build exists
    if [ ! -d "deployment/admin-panel/dist" ]; then
        print_error "Admin panel build not found in deployment"
        return 1
    fi
    
    # Validate environment variables
    cd deployment/backend && node -e "
        require('dotenv').config();
        const required = ['MONGODB_URI', 'JWT_SECRET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
        const missing = required.filter(v => !process.env[v]);
        if (missing.length > 0) {
            console.error('Missing environment variables:', missing.join(', '));
            process.exit(1);
        }
        console.log('Environment validation passed');
    " && cd ../..
    
    print_status "Deployment validation passed"
}

# Function to create deployment archive
create_deployment_archive() {
    echo "Creating deployment archive..."
    
    # Create timestamped archive
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    ARCHIVE_NAME="blogging-system-${DEPLOY_ENV}-${TIMESTAMP}.tar.gz"
    
    tar -czf "$ARCHIVE_NAME" -C deployment .
    
    print_status "Deployment archive created: $ARCHIVE_NAME"
    echo "You can now upload this archive to your server and extract it."
}

# Main deployment process
main() {
    echo -e "${GREEN}🔧 Blogging System Deployment Preparation${NC}"
    echo "Environment: $DEPLOY_ENV"
    echo "Timestamp: $(date)"
    echo "----------------------------------------"
    
    # Check prerequisites
    check_prerequisites
    
    # Prepare Git repository
    prepare_git_repo
    
    # Run tests
    if ! run_tests; then
        print_error "Tests failed. Deployment preparation aborted."
        exit 1
    fi
    
    # Build applications
    if ! build_applications; then
        print_error "Build failed. Deployment preparation aborted."
        exit 1
    fi
    
    # Prepare deployment files
    if ! prepare_deployment; then
        print_error "Deployment preparation failed."
        exit 1
    fi
    
    # Validate deployment
    if ! validate_deployment; then
        print_error "Deployment validation failed."
        exit 1
    fi
    
    # Create deployment archive
    create_deployment_archive
    
    echo "----------------------------------------"
    print_status "Deployment preparation completed successfully!"
    echo -e "${GREEN}🎉 Your blogging system is ready for deployment${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Push your code to Git repository"
    echo "  2. Upload the deployment archive to your server"
    echo "  3. Extract and run: npm install && npm start (in backend directory)"
    echo "  4. Serve admin panel build files from a web server"
    echo ""
    echo "Files prepared in ./deployment directory"
}

# Handle script arguments
case "${1:-prepare}" in
    "prepare")
        main
        ;;
    "validate")
        validate_deployment
        ;;
    "build")
        build_applications
        ;;
    *)
        echo "Usage: $0 [prepare|validate|build] [environment]"
        echo "  prepare   - Prepare full deployment (default)"
        echo "  validate  - Validate deployment files"
        echo "  build     - Build applications only"
        echo "  environment - production (default) or staging"
        exit 1
        ;;
esac