# Deployment Guide - Blogging System

This guide covers the production deployment of the blogging system consisting of a Node.js backend and React.js admin panel.

## Architecture Overview

The system consists of:

- **Backend API**: Node.js/Express server with MongoDB
- **Admin Panel**: React.js application for content management
- **Database**: MongoDB (cloud or self-hosted)
- **File Storage**: AWS S3 for media files

## Prerequisites

### System Requirements

- Node.js 18+
- npm 8+
- Git
- MongoDB access (Atlas or self-hosted)
- AWS S3 bucket and credentials

### Environment Setup

- Production server (Linux recommended)
- Domain names configured:
  - `api.yourdomain.com` - Backend API
  - `admin.yourdomain.com` - Admin panel
- SSL certificates (Let's Encrypt recommended)

## Configuration Files

### Backend Environment (.env.production)

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blogging-system-prod

# JWT Configuration
JWT_SECRET=your-super-secure-production-jwt-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-s3-bucket-prod
AWS_REGION=your-aws-region

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
ADMIN_URL=https://admin.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Security Configuration
HELMET_CSP_ENABLED=true
TRUST_PROXY=true

# Logging Configuration
LOG_LEVEL=error
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/app.log

# Performance Configuration
CACHE_TTL=3600
ENABLE_COMPRESSION=true
```

### Admin Panel Environment (.env.production)

```bash
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_API_TIMEOUT=15000

# App Configuration
VITE_APP_NAME=Blog Admin Panel
VITE_APP_VERSION=1.0.0

# File Upload Configuration
VITE_MAX_FILE_SIZE=5242880
VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Environment
VITE_NODE_ENV=production

# Security Configuration
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_CONSOLE_LOGS=false
```

## Deployment Methods

### Method 1: Docker Deployment (Recommended)

1. **Prepare the environment files**:

   ```bash
   cp backend/.env.production backend/.env
   cp admin-panel/.env.production admin-panel/.env
   ```

2. **Build and deploy with Docker Compose**:

   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Verify deployment**:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs
   ```

### Method 2: Manual Deployment

1. **Prepare deployment**:

   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh prepare production
   ```

2. **Upload to server**:

   ```bash
   scp blogging-system-production-*.tar.gz user@server:/path/to/deployment/
   ```

3. **Extract and setup on server**:

   ```bash
   tar -xzf blogging-system-production-*.tar.gz
   cd backend && npm install --production
   ```

4. **Start services**:

   ```bash
   # Backend (using PM2 recommended)
   npm install -g pm2
   pm2 start server.js --name "blogging-backend"

   # Admin Panel (serve with nginx)
   # Copy admin-panel/dist/* to nginx web root
   ```

## Nginx Configuration

### Backend API (api.yourdomain.com)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Admin Panel (admin.yourdomain.com)

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/admin-panel;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Security Considerations

### Environment Variables

- Use strong, unique JWT secrets (minimum 32 characters)
- Rotate AWS credentials regularly
- Use environment-specific database names
- Enable MongoDB authentication

### Network Security

- Use HTTPS for all endpoints
- Configure proper CORS origins
- Implement rate limiting
- Use security headers (handled by Helmet)

### Application Security

- Keep dependencies updated
- Use PM2 or similar process manager
- Implement proper logging
- Regular security audits

## Monitoring and Maintenance

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/api/health

# Admin panel health
curl https://admin.yourdomain.com/health
```

### Logging

- Backend logs: `./logs/app.log`
- PM2 logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`

### Backup Strategy

- Database: Regular MongoDB backups
- Files: S3 versioning enabled
- Code: Git repository backups

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Check MongoDB URI and credentials
   - Verify network connectivity
   - Check IP whitelist in MongoDB Atlas

2. **S3 Upload Errors**

   - Verify AWS credentials
   - Check S3 bucket permissions
   - Confirm bucket region

3. **CORS Errors**

   - Verify ADMIN_URL in backend environment
   - Check nginx proxy headers
   - Confirm domain configuration

4. **Build Failures**
   - Check Node.js version compatibility
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

### Performance Optimization

1. **Backend**

   - Enable MongoDB indexing
   - Use Redis for caching
   - Optimize database queries
   - Enable gzip compression

2. **Admin Panel**
   - Enable nginx gzip
   - Use CDN for static assets
   - Implement lazy loading
   - Optimize bundle size

## Scaling Considerations

### Horizontal Scaling

- Load balancer for multiple backend instances
- Database read replicas
- CDN for static assets
- Container orchestration (Kubernetes)

### Vertical Scaling

- Increase server resources
- Optimize database performance
- Use faster storage (SSD)
- Increase connection limits

## Support and Maintenance

### Regular Tasks

- Update dependencies monthly
- Monitor error logs daily
- Backup database weekly
- Security patches as needed

### Emergency Procedures

- Database restore process
- Rollback deployment steps
- Emergency contact information
- Incident response plan

For additional support, refer to the application logs and monitoring dashboards.
