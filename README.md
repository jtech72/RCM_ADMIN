# Blogging System

A full-stack blogging system with Node.js backend and React.js admin panel for content management.

## Project Structure

```
blogging-system/
├── backend/                 # Node.js Express API server
│   ├── config/             # Database and service configurations
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   ├── tests/             # Backend tests
│   ├── .env.example       # Environment variables template
│   └── package.json       # Backend dependencies
├── admin-panel/            # React.js admin interface
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   ├── .env.example       # Environment variables template
│   └── package.json       # Admin panel dependencies
├── scripts/                # Deployment and build scripts
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- AWS S3 bucket for file storage

### Installation

1. Clone the repository
2. Set up environment variables by copying `.env.example` to `.env` in each directory
3. Install dependencies for each component:

```bash
# Backend
cd backend
npm install

# Admin Panel
cd ../admin-panel
npm install
```

4. Create initial admin user:

```bash
# Create admin user with default credentials
cd backend
npm run create-admin

# Or create with custom credentials
npm run create-admin myusername admin@example.com mypassword
```

### Development

Run each component in separate terminals:

```bash
# Backend (Port 5000)
cd backend
npm run dev

# Admin Panel (Port 3001 or 5173 with Vite)
cd admin-panel
npm run dev
```

### First Time Admin Access

After setting up the system:

1. **Create Admin User**: Run `npm run create-admin` in the backend directory
2. **Default Credentials** (if using defaults):
   - Username: `admin`
   - Email: `admin@localhost.com`
   - Password: `admin123`
3. **Access Admin Panel**: Navigate to `http://localhost:3001` or `http://localhost:5173`
4. **Change Password**: Please change the default password after first login

### Troubleshooting

#### CORS Errors

If you encounter CORS errors when trying to login:

- Make sure the backend is running on port 5000
- The backend is configured to accept requests from common development ports (3000, 3001, 5173, 4173)
- Check that your admin panel is running on one of these ports

#### Forgot Admin Password

Reset the admin password using:

```bash
cd backend
npm run reset-admin-password admin newpassword123
```

## Technology Stack

### Backend

- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- AWS S3 integration
- bcryptjs for password hashing

### Frontend (Both Admin & Public)

- React.js 18
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

### Admin Panel Specific

- React Query for state management
- React Hook Form for form handling
- Quill.js for WYSIWYG editing
- shadcn/ui components

### Public Frontend Specific

- React Helmet Async for SEO
- DOMPurify for content sanitization

## Features

- User authentication with role-based access control
- Blog CRUD operations with rich text editing
- File upload to AWS S3
- SEO optimization
- Responsive design
- Analytics dashboard
- Search and filtering
- Social sharing

## API Endpoints

The backend provides RESTful API endpoints for:

- Authentication (`/api/auth`)
- Blog management (`/api/blogs`)
- User management (`/api/users`)
- File uploads (`/api/s3`)

## Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Use consistent naming conventions
4. Update documentation as needed

## License

MIT License
"# RCM_ADMIN" 
