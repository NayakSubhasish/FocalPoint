# Project Management System

A modern project management web application with role-based access control.

## Features

- Role-based access (Admin, Project Manager, Team Member)
- User Management
- Project Management
- Task Management
- Time & Transaction Logging
- Responsive Design

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: SQL Server
- Authentication: JWT

## Project Structure

```
project-management/
├── frontend/          # React frontend application
├── backend/           # Node.js backend application
└── database/          # Database scripts and migrations
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- SQL Server
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure database connection in `config/database.js`

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=project_management
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

## License

MIT 