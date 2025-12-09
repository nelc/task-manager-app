# Docker Deployment Guide

## Quick Start (Under 2 Minutes)

```bash
docker-compose up -d
```

That's it! The application will be available at **http://localhost:8080**

## What Gets Deployed

- ✅ Complete Task Manager application
- ✅ SQLite database with automatic schema initialization
- ✅ Persistent data storage (survives restarts)
- ✅ Health monitoring
- ✅ Production-optimized build

## System Requirements Met

### Port Configuration
- Application listens on **port 8080**
- Binds to **0.0.0.0** (accessible from all interfaces)
- Configurable via `PORT` environment variable

### Health Endpoint
- **URL:** `http://localhost:8080/health`
- **Response:** `{"status":"healthy"}`
- Used by Docker healthchecks and orchestration systems

### Database
- **Type:** SQLite (embedded, no separate DB service needed)
- **Location:** `/app/data/tasks.db` (in Docker volume)
- **Connection:** Parses `DATABASE_URL` environment variable
- **Schema:** Auto-initializes on first run
- **Persistence:** All data persists across restarts via Docker volume

### Admin User
- **First registered user becomes admin automatically**
- Admin users can access Settings page
- Admin status checked when users table is empty

### Settings Management
- All system configuration stored in database
- Managed via Settings Page UI (admin only)
- Default settings auto-initialized:
  - `app_name`: Application name
  - `max_tasks_per_user`: Task limits
  - `session_timeout`: JWT token expiration
  - `allow_registration`: Control new signups

## Architecture

```
┌─────────────────────────────────────┐
│     Docker Container (8080)         │
│  ┌───────────────────────────────┐  │
│  │   Node.js + Express Server    │  │
│  │   (Backend API + Frontend)    │  │
│  └───────────────────────────────┘  │
│                │                     │
│                ▼                     │
│  ┌───────────────────────────────┐  │
│  │     SQLite Database           │  │
│  │  /app/data/tasks.db           │  │
│  │  (Mounted to Docker Volume)   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         ▼
  ┌──────────────┐
  │ Docker Volume│
  │ (Persistent) │
  └──────────────┘
```

## Environment Variables

Configured in `docker-compose.yml`:

```yaml
- NODE_ENV=production
- PORT=8080
- DATABASE_URL=sqlite:///app/data/tasks.db
- JWT_SECRET=change-this-to-a-secure-random-string-in-production
```

**⚠️ IMPORTANT:** Change `JWT_SECRET` in production!

## Container Management

### Check Status
```bash
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f
```

### Restart Container
```bash
docker-compose restart
```

### Stop Application
```bash
docker-compose down
```

### Stop and Remove All Data
```bash
docker-compose down -v
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

## Testing the Deployment

### 1. Check Health
```bash
curl http://localhost:8080/health
# Expected: {"status":"healthy"}
```

### 2. Register First User (becomes admin)
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"secure123"}'
```

### 3. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secure123"}'
```

### 4. Create a Task
```bash
TOKEN="your-token-from-login"
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Task","description":"Testing","priority":"high"}'
```

### 5. Access Settings (Admin Only)
```bash
curl http://localhost:8080/api/settings \
  -H "Authorization: Bearer $TOKEN"
```

## Data Persistence Verification

Data persists across container restarts. Test it:

```bash
# 1. Create some data (register, add tasks)
# 2. Restart container
docker-compose restart

# 3. Verify data is still there
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secure123"}'
```

## Production Considerations

### 1. Security
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Implement rate limiting
- [ ] Regular security updates

### 2. Backups
```bash
# Backup database
docker cp task-manager-app:/app/data/tasks.db ./backup-$(date +%Y%m%d).db

# Restore database
docker cp ./backup.db task-manager-app:/app/data/tasks.db
docker-compose restart
```

### 3. Monitoring
- Health check runs every 30 seconds
- Monitor logs for errors: `docker-compose logs -f`
- Set up external monitoring (e.g., Prometheus, Datadog)

### 4. Scaling
- For horizontal scaling, use external database (PostgreSQL/MySQL)
- Update `DATABASE_URL` to point to external DB
- Deploy behind load balancer

## Troubleshooting

### Container won't start
```bash
docker-compose logs
```

### Port already in use
```bash
# Change port in docker-compose.yml
ports:
  - "8081:8080"  # Use 8081 instead
```

### Health check failing
```bash
# Check if app is responding
docker exec task-manager-app wget -O- http://localhost:8080/health

# Check logs
docker-compose logs -f
```

### Data not persisting
```bash
# Verify volume exists
docker volume ls | grep task-data

# Inspect volume
docker volume inspect testapp2_task-data
```

### Permission issues
```bash
# App runs as 'node' user (non-root)
# Volume permissions are automatically set
docker-compose down
docker volume rm testapp2_task-data
docker-compose up -d
```

## CI/CD Integration

GitHub Actions workflow included at `.github/workflows/deploy-to-gke.yaml` for automated deployment to Google Kubernetes Engine.

### Required Secrets
- `GCP_PROJECT_ID`
- `GCP_SA_KEY`
- `GKE_CLUSTER_NAME`
- `GKE_ZONE`

## Performance

- **Build time:** ~30-60 seconds (cached: ~5 seconds)
- **Start time:** ~3-5 seconds
- **Cold start to ready:** Under 2 minutes total
- **Memory usage:** ~150-200 MB
- **Image size:** ~200 MB

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify health: `curl http://localhost:8080/health`
3. Review this guide
4. Check GitHub issues

## File Structure

```
.
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Orchestration config
├── .dockerignore          # Build optimization
├── backend/               # API server
│   ├── server.js         # Main server (PORT=8080)
│   ├── database.js       # SQLite with DATABASE_URL support
│   ├── routes/
│   │   ├── auth.js       # Login/register (first user = admin)
│   │   ├── tasks.js      # Task CRUD
│   │   └── settings.js   # DB-backed settings
│   └── middleware/
│       ├── auth.js       # JWT verification
│       └── admin.js      # Admin access control
└── frontend/             # React SPA
    └── src/
        └── components/
            ├── Login.jsx
            ├── TaskManager.jsx
            └── Settings.jsx  # Admin settings UI
```

