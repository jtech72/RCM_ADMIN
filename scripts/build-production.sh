#!/bin/bash

# Production Build Script for Blogging System
# Builds the admin panel for production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
BUILD_DIR="build-output"

echo -e "${GREEN}🔨 Building Blogging System for ${DEPLOY_ENV}${NC}"

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

# Function to clean previous builds
clean_build() {
    echo "Cleaning previous builds..."
    
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
    fi
    
    if [ -d "admin-panel/dist" ]; then
        rm -rf "admin-panel/dist"
    fi
    
    print_status "Previous builds cleaned"
}

# Function to install dependencies
install_dependencies() {
    echo "Installing dependencies..."
    
    # Backend dependencies
    echo "Installing backend dependencies..."
    cd backend
    npm ci --production
    cd ..
    
    # Admin panel dependencies
    echo "Installing admin panel dependencies..."
    cd admin-panel
    npm ci
    cd ..
    
    print_status "Dependencies installed"
}

# Function to build admin panel
build_admin_panel() {
    echo "Building admin panel..."
    
    # Copy production environment file
    cp "admin-panel/.env.${DEPLOY_ENV}" "admin-panel/.env"
    
    # Build the admin panel
    cd admin-panel
    npm run build
    cd ..
    
    # Verify build output
    if [ ! -d "admin-panel/dist" ]; then
        print_error "Admin panel build failed - dist directory not found"
        exit 1
    fi
    
    print_status "Admin panel built successfully"
}

# Function to prepare backend
prepare_backend() {
    echo "Preparing backend..."
    
    # Copy production environment file
    cp "backend/.env.${DEPLOY_ENV}" "backend/.env"
    
    # Create logs directory
    mkdir -p backend/logs
    
    print_status "Backend prepared"
}

# Function to create build output
create_build_output() {
    echo "Creating build output..."
    
    mkdir -p "$BUILD_DIR"
    
    # Copy backend files (excluding node_modules, logs, and test files)
    echo "Copying backend files..."
    rsync -av \
        --exclude='node_modules' \
        --exclude='logs' \
        --exclude='tests' \
        --exclude='*.test.js' \
        --exclude='.env.example' \
        backend/ "$BUILD_DIR/backend/"
    
    # Copy admin panel build
    echo "Copying admin panel build..."
    cp -r admin-panel/dist "$BUILD_DIR/admin-panel"
    
    # Copy configuration files
    cp docker-compose.prod.yml "$BUILD_DIR/"
    cp Dockerfile.backend "$BUILD_DIR/"
    cp Dockerfile.admin "$BUILD_DIR/"
    cp nginx.conf "$BUILD_DIR/"
    cp nginx.admin.conf "$BUILD_DIR/"
    
    # Copy deployment documentation
    cp DEPLOYMENT.md "$BUILD_DIR/"
    
    print_status "Build output created in $BUILD_DIR"
}

# Function to validate build
validate_build() {
    echo "Validating build..."
    
    # Check backend files
    if [ ! -f "$BUILD_DIR/backend/server.js" ]; then
        print_error "Backend server.js not found"
        exit 1
    fi
    
    if [ ! -f "$BUILD_DIR/backend/.env" ]; then
        print_error "Backend .env not found"
        exit 1
    fi
    
    # Check admin panel build
    if [ ! -f "$BUILD_DIR/admin-panel/index.html" ]; then
        print_error "Admin panel index.html not found"
        exit 1
    fi
    
    # Validate environment variables
    cd "$BUILD_DIR/backend"
    node -e "
        require('dotenv').config();
        const required = ['MONGODB_URI', 'JWT_SECRET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
        const missing = required.filter(v => !process.env[v]);
        if (missing.length > 0) {
            console.error('Missing environment variables:', missing.join(', '));
            process.exit(1);
        }
        console.log('Environment validation passed');
    "
    cd ../..
    
    print_status "Build validation passed"
}

# Function to create deployment archive
create_archive() {
    echo "Creating deployment archive..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    ARCHIVE_NAME="blogging-system-${DEPLOY_ENV}-${TIMESTAMP}.tar.gz"
    
    tar -czf "$ARCHIVE_NAME" -C "$BUILD_DIR" .
    
    # Calculate archive size
    ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)
    
    print_status "Deployment archive created: $ARCHIVE_NAME ($ARCHIVE_SIZE)"
}

# Function to generate deployment instructions
generate_instructions() {
    echo "Generating deployment instructions..."
    
    cat > "$BUILD_DIR/DEPLOY_INSTRUCTIONS.md" << EOF
# Deployment Instructions

## Quick Start

1. **Extract the archive**:
   \`\`\`bash
   tar -xzf blogging-system-${DEPLOY_ENV}-*.tar.gz
   cd blogging-system-${DEPLOY_ENV}
   \`\`\`

2. **Install backend dependencies**:
   \`\`\`bash
   cd backend
   npm install --production
   cd ..
   \`\`\`

3. **Start the backend**:
   \`\`\`bash
   cd backend
   npm start
   # Or with PM2: pm2 start server.js --name "blogging-backend"
   \`\`\`

4. **Serve the admin panel**:
   - Copy \`admin-panel/*\` to your web server root
   - Configure nginx to serve the files
   - Ensure client-side routing works (try_files directive)

## Docker Deployment

1. **Build and run with Docker Compose**:
   \`\`\`bash
   docker-compose -f docker-compose.prod.yml up --build -d
   \`\`\`

2. **Check status**:
   \`\`\`bash
   docker-compose -f docker-compose.prod.yml ps
   \`\`\`

## Health Checks

- Backend: http://localhost:5000/api/health
- Admin Panel: http://localhost:3001/health

## Troubleshooting

See DEPLOYMENT.md for detailed troubleshooting guide.
EOF
    
    print_status "Deployment instructions generated"
}

# Main build process
main() {
    echo -e "${GREEN}🏗️ Production Build Process${NC}"
    echo "Environment: $DEPLOY_ENV"
    echo "Timestamp: $(date)"
    echo "----------------------------------------"
    
    # Clean previous builds
    clean_build
    
    # Install dependencies
    if ! install_dependencies; then
        print_error "Dependency installation failed"
        exit 1
    fi
    
    # Build admin panel
    if ! build_admin_panel; then
        print_error "Admin panel build failed"
        exit 1
    fi
    
    # Prepare backend
    if ! prepare_backend; then
        print_error "Backend preparation failed"
        exit 1
    fi
    
    # Create build output
    if ! create_build_output; then
        print_error "Build output creation failed"
        exit 1
    fi
    
    # Validate build
    if ! validate_build; then
        print_error "Build validation failed"
        exit 1
    fi
    
    # Generate deployment instructions
    generate_instructions
    
    # Create deployment archive
    create_archive
    
    echo "----------------------------------------"
    print_status "Production build completed successfully!"
    echo -e "${GREEN}🎉 Your blogging system is ready for deployment${NC}"
    echo ""
    echo "Build artifacts:"
    echo "  - Build directory: $BUILD_DIR/"
    echo "  - Deployment archive: blogging-system-${DEPLOY_ENV}-*.tar.gz"
    echo ""
    echo "Next steps:"
    echo "  1. Upload the archive to your production server"
    echo "  2. Extract and follow DEPLOY_INSTRUCTIONS.md"
    echo "  3. Configure your domain and SSL certificates"
}

# Handle script arguments
case "${1:-build}" in
    "build"|"production"|"staging")
        main
        ;;
    "clean")
        clean_build
        ;;
    *)
        echo "Usage: $0 [build|production|staging|clean]"
        echo "  build/production - Build for production (default)"
        echo "  staging         - Build for staging"
        echo "  clean          - Clean build artifacts"
        exit 1
        ;;
esac