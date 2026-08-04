# Google-Drive-Backend
A robust, full-stack application that emulates the core functionalities of Google Drive. This project allows users to authenticate, manage files and folders, share content securely, and track activities.
## Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup and Installation](#setup-and-installation)
5. [Configuration](#configuration)
6. [API Documentation](#api-documentation)
## Features
- **User Authentication**: 
  - Local authentication with email and password
  - Google OAuth integration for seamless sign-in
  - JWT-based session management
- **File Management**:
  - Upload files with progress tracking
  - Download files securely
  - Delete files with proper authorization checks
  - Rename files while maintaining version history
- **Folder Operations**:
  - Create nested folder structures
  - Move files between folders
  - Rename folders with cascading effects on file paths
- **Sharing Capabilities**:
  - Share files and folders with other users
  - Set granular permissions (view, edit, admin)
  - Generate shareable links with optional password protection
- **Activity Logging**:
  - Track user actions for auditing purposes
  - Generate activity reports and statistics
- **Search Functionality**:
  - Full-text search across files and folders
  - Advanced filtering options (date, size, type)
- **Responsive Design**:
  - Seamless experience across desktop and mobile devices
## Tech Stack
- **Backend**: 
  - Node.js (v14+) for the runtime environment
  - Express.js (v4.17+) as the web application framework
  - MongoDB (v4+) for the database
  - Mongoose (v6+) as the ODM for MongoDB
- **Authentication**: 
  - Passport.js for authentication strategies
  - JSON Web Tokens (JWT) for secure, stateless authentication
- **File Storage**: 
  - AWS S3 for scalable and reliable file storage
  - Multer for handling multipart/form-data
- **Frontend** (ongoing):
  - React.js (v17+) for building the user interface
  - Redux for state management
  - Axios for HTTP requests
## Project Structure
```bash
google-drive-backend/
│
├── config/
│ ├── database.js
│ ├── passport.js
│ ├── s3.js
│ └── multer.js
│
├── controllers/
│ ├── authController.js
│ ├── fileController.js
│ ├── folderController.js
│ ├── shareController.js
│ └── activityController.js
│
├── models/
│ ├── User.js
│ ├── File.js
│ ├── Folder.js
│ ├── SharedFile.js
│ ├── SharedFolder.js
│ └── Activity.js
│
├── routes/
│ ├── authRoutes.js
│ ├── fileRoutes.js
│ ├── folderRoutes.js
│ ├── shareRoutes.js
│ └── activityRoutes.js
│
├── services/
│ ├── s3Service.js
│ ├── searchService.js
│ └── activityService.js
│
├── middleware/
│ ├── auth.js
│ └── errorHandler.js
│
├── utils/
│ └── helpers.js
│
├── .env
├── .gitignore
├── package.json
└── server.js
```

## Setup and Installation
1. **Clone the repository**:
    - `git clone  https://github.com/Vrchsav/Google-Drive-Backend.git`
    - `cd google-drive-clone`

2. **Install dependencies**:
    - `npm install`

3. **Set up environment variables**:
    - Copy `.env.example` to `.env`
- Fill in the required variables:
  ```
  NODE_ENV=development
  PORT=3000
  MONGODB_URI=mongodb://localhost:27017/google_drive_backend
  JWT_SECRET=your_jwt_secret_here
  AWS_ACCESS_KEY_ID=your_aws_access_key
  AWS_SECRET_ACCESS_KEY=your_aws_secret_key
  AWS_REGION=your_aws_region
  S3_BUCKET_NAME=your_s3_bucket_name
  GOOGLE_CLIENT_ID=your_google_client_id
  GOOGLE_CLIENT_SECRET=your_google_client_secret
  ```
4. **Start the development server**:
    - `npm run dev`
    - This will start the server with nodemon for auto-reloading on file changes.
## Configuration
### Database (config/database.js)
Manages the MongoDB connection using Mongoose. It includes:
- Connection error handling
- Debugging options for development
- Proper indexing for optimized queries
### Passport (config/passport.js)
Configures authentication strategies:
- Local strategy for email/password login
- Google OAuth strategy for social login
- JWT strategy for token-based authentication
### AWS S3 (config/s3.js)
Sets up the AWS SDK for S3 file storage:
- Configures AWS credentials and region
- Initializes S3 client with proper error handling
- Implements utility functions for common S3 operations
### Multer (config/multer.js)
Configures file upload handling:
- Sets file size limits
- Defines allowed file types
- Implements storage strategy
## API Documentation
### Authentication Routes
- `POST /api/auth/register`: Register a new user
  - Body: `{ email, password, name }`
  - Returns: User object and JWT token
- `POST /api/auth/login`: Login user
  - Body: `{ email, password }`
  - Returns: User object and JWT token
- `GET /api/auth/google`: Initiate Google OAuth flow
  - Redirects to Google login page
- `GET /api/auth/google/callback`: Google OAuth callback URL
  - Handles OAuth response and returns JWT token
### File Routes
- `POST /api/files`: Upload a file
  - Header: `Authorization: Bearer <token>`
  - Body: `FormData` with file and optional folder ID
  - Returns: Uploaded file object
- `GET /api/files`: Get all files for the user
  - Header: `Authorization: Bearer <token>`
  - Query params: `page`, `limit`, `sort`, `folder`
  - Returns: Paginated list of file objects
- `GET /api/files/:id`: Get a specific file
  - Header: `Authorization: Bearer <token>`
  - Returns: File object with details
- `PUT /api/files/:id`: Update file details
  - Header: `Authorization: Bearer <token>`
  - Body: `{ name, folderId }`
  - Returns: Updated file object
- `DELETE /api/files/:id`: Delete a file
  - Header: `Authorization: Bearer <token>`
  - Returns: Success message
### Folder Routes
- `POST /api/folders`: Create a new folder
  - Header: `Authorization: Bearer <token>`
  - Body: `{ name, parentId }`
  - Returns: Created folder object
- `GET /api/folders`: Get all folders for the user
  - Header: `Authorization: Bearer <token>`
  - Query params: `page`, `limit`, `sort`, `parent`
  - Returns: Paginated list of folder objects
- `GET /api/folders/:id`: Get a specific folder
  - Header: `Authorization: Bearer <token>`
  - Returns: Folder object with details
- `PUT /api/folders/:id`: Update folder details
  - Header: `Authorization: Bearer <token>`
  - Body: `{ name, parentId }`
  - Returns: Updated folder object
- `DELETE /api/folders/:id`: Delete a folder
  - Header: `Authorization: Bearer <token>`
  - Returns: Success message
### Share Routes
- `POST /api/share`: Share a file or folder
  - Header: `Authorization: Bearer <token>`
  - Body: `{ resourceId, resourceType, email, permission }`
  - Returns: Share object
- `GET /api/share`: Get all shared items for the user
  - Header: `Authorization: Bearer <token>`
  - Returns: List of shared items
- `PUT /api/share/:id`: Update sharing permissions
  - Header: `Authorization: Bearer <token>`
  - Body: `{ permission }`
  - Returns: Updated share object
- `DELETE /api/share/:id`: Remove sharing
  - Header: `Authorization: Bearer <token>`
  - Returns: Success message
### Activity Routes
- `GET /api/activities`: Get user activities
  - Header: `Authorization: Bearer <token>`
  - Query params: `page`, `limit`, `sort`, `type`
  - Returns: Paginated list of activity objects
- `GET /api/activities/stats`: Get activity statistics
  - Header: `Authorization: Bearer <token>`
  - Query params: `startDate`, `endDate`
  - Returns: Activity statistics object
- `GET /api/activities/:id`: Get activity details
  - Header: `Authorization: Bearer <token>`
  - Returns: Detailed activity object
- `POST /api/activities/:id/read`: Mark activity as read
  - Header:` Authorization: Bearer <token>`
  - Returns: Updated activity object
- `GET /api/activities/recent`: Get recent activities
  - Header: `Authorization: Bearer <token>`
  - Returns: List of recent activity objects

## Deployment
### This application is designed to be deployed on cloud platforms. Here are the steps for deploying to Heroku:
1. Prepare for deployment:
  - Ensure all environment variables are set for production in your .env file
	- Update config/database.js to use the production MongoDB URI
2. Create a Heroku app:
  - heroku create your-app-name
3. Set up environment variables on Heroku:
  - heroku config:`set NODE_ENV=production`
  - heroku config:`set MONGODB_URI=your_production_mongodb_uri`
4. Deploy the application:
  - git push heroku main
5. Ensure at least one dyno is running:
  - heroku ps:scale web=1
6. Open the deployed application:
  - heroku open
## Reporting Issues
If you find a bug or have a suggestion for improvement, please open an issue on GitHub. Provide as much detail as possible.

