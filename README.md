# Task Manager App

A production-ready task manager application with user authentication, built with React and Node.js.

## Features

- 🔐 User authentication (Login/Register)
- 👑 Admin functionality (first user becomes admin)
- ⚙️ Database-backed settings management
- ✅ Create, read, update, and delete tasks
- 🎯 Task priorities (Low, Medium, High)
- 📊 Task status tracking (Pending, In Progress, Completed)
- 🔍 Filter tasks by status
- 💾 SQLite database for data persistence
- 🐳 Docker support with docker-compose
- 🎨 Beautiful and responsive UI
- 🏥 Health check endpoint

## Tech Stack

**Frontend:**
- React 18
- Vite
- Axios
- Modern CSS

**Backend:**
- Node.js
- Express
- SQLite (better-sqlite3)
- JWT for authentication
- bcryptjs for password hashing

## Quick Start with Docker (Recommended)

The easiest way to run this application is using Docker. The app will be fully operational in under 2 minutes.

### Prerequisites

- Docker and Docker Compose installed

### Run the Application

1. Clone the repository
2. Navigate to the project directory
3. Run the application:

```bash
docker-compose up -d
```

That's it! The application will be available at **http://localhost:8080**

The first user to register will automatically become the admin.

### Check Application Status

```bash
# Check if the container is running
docker-compose ps

# Check application health
curl http://localhost:8080/health

# View logs
docker-compose logs -f
```

### Stop the Application

```bash
docker-compose down
```

### Data Persistence

All data (users, tasks, settings) is persisted in a Docker volume and will survive container restarts.

To completely remove all data:
```bash
docker-compose down -v
```

## Development Setup (Alternative)

If you want to run the application in development mode:

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Install all dependencies:
```bash
npm run install-all
```

This will install dependencies for the root, backend, and frontend.

### Running the Application

1. Start both backend and frontend servers:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend server on `http://localhost:3000`

### Running Servers Separately

If you prefer to run the servers separately:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Usage

1. Open your browser and go to `http://localhost:8080` (Docker) or `http://localhost:3000` (Dev)
2. Create a new account by clicking "Sign Up" (first user becomes admin)
3. Log in with your credentials
4. Start managing your tasks!
5. Admin users can access Settings page to manage system configuration

## Admin Features

The first user to register automatically becomes the admin. Admin users can:

- Access the Settings page via the "Settings" button in the header
- View and manage all system settings
- Add, update, and delete configuration values
- Control features like registration allowance, session timeout, etc.

All system configuration is stored in the database, not in environment variables (except for database connection and JWT secret).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Tasks (Protected Routes)
- `GET /api/tasks` - Get all tasks for the logged-in user
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

## Project Structure

```
testapp2/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── tasks.js
│   ├── database.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   └── TaskManager.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
└── package.json
```

## Production Configuration

### Environment Variables

The application requires the following environment variables (already configured in docker-compose.yml):

- `PORT` - Port to run the application on (default: 8080)
- `DATABASE_URL` - SQLite database path (default: sqlite:///app/data/tasks.db)
- `JWT_SECRET` - Secret key for JWT token generation (change in production!)
- `NODE_ENV` - Environment mode (development/production)

### Health Check

The application exposes a health check endpoint at `/health` that returns:
```json
{"status": "healthy"}
```

This is used by Docker and orchestration systems to monitor application health.

## Security Notes

- Passwords are hashed using bcryptjs
- JWT tokens are used for authentication
- Protected routes require valid JWT token
- First user automatically becomes admin
- Admin can manage system settings through the database-backed Settings page
- **Important:** Change the JWT_SECRET in production!

## Deployment

The project includes a GitHub Actions workflow for deployment to Google Kubernetes Engine (GKE). See `.github/workflows/deploy-to-gke.yaml` for configuration.

## License

MIT

