# Project Setup Guide

This guide will walk you through setting up the Fleet Telematics Platform for local development.

## Prerequisites

Before you start, ensure you have installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker & Docker Compose** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

Verify installations:
```bash
node --version      # Should be v18+
docker --version    # Should be 20+
docker-compose --version  # Should be 2.0+
git --version       # Should be 2.0+
```

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/fleet-telematics-platform.git

# Navigate to project directory
cd fleet-telematics-platform
```

## Step 2: Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# For local development, you can use the defaults, but update:
# - JWT_SECRET (generate a random string)
# - Telematics API keys (if you have them)
nano .env  # or use your favorite editor
```

### Generate JWT_SECRET

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([byte[]]$(Get-Random -Count 32))
```

## Step 3: Start Docker Services

```bash
# Start all services (backend, frontend, postgres, redis)
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Wait for services to be ready:**
- Backend: "Server running on port 5000" ✅
- Frontend: "Webpack compiled successfully" ✅
- Postgres: "listening on" ✅
- Redis: "Ready to accept connections" ✅

## Step 4: Initialize Database

```bash
# Run database migrations
docker-compose exec backend npm run migrate

# Seed sample data (optional)
docker-compose exec backend npm run seed

# Check database
docker-compose exec postgres psql -U fleet_user -d fleet_platform
```

## Step 5: Access the Application

Open your browser and navigate to:

- **Frontend Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Documentation:** http://localhost:5000/api/docs
- **Database (pgAdmin):** http://localhost:5050 (if configured)

### Default Login Credentials
```
Email: admin@example.com
Password: password123
```

⚠️ **IMPORTANT:** Change these in production!

## Step 6: Verify Everything Works

### Test Backend API
```bash
# Get health status
curl http://localhost:5000/api/health

# Get API docs
curl http://localhost:5000/api/docs
```

### Test Frontend
```bash
# Open http://localhost:3000 in browser
# Login with admin credentials
# Verify dashboard loads
```

### Test Database
```bash
# Connect to database
docker-compose exec postgres psql -U fleet_user -d fleet_platform

# List tables
\dt

# Check users table
SELECT id, email, role FROM users;

# Exit
\q
```

## Development Workflow

### Working on Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Add new package
npm install package-name

# Start development server (auto-reload)
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Working on Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Add new package
npm install package-name

# Start development server (auto-reload)
npm start

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

## Common Development Tasks

### Add a New Environment Variable

1. Add to `.env.example` with description
2. Add to `.env` with value
3. Add to `docker-compose.yml` under environment
4. Use in code: `process.env.YOUR_VARIABLE_NAME`

### Add a New Database Table

1. Create migration: `npm run migration:create add_new_table`
2. Edit migration file: `database/migrations/XXX_add_new_table.sql`
3. Run migration: `npm run migrate`
4. Create model: `backend/src/models/NewTable.js`
5. Create controller: `backend/src/controllers/newTableController.js`
6. Create route: `backend/src/routes/newTable.js`

### Test API Endpoint

```bash
# Using curl
curl -X GET http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Using Postman
# 1. Import API collection
# 2. Set base URL: http://localhost:5000
# 3. Create requests
```

### Debug Issues

```bash
# View Docker logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Connect to running container
docker-compose exec backend sh

# Check port usage (macOS/Linux)
lsof -i :5000
lsof -i :3000

# Kill process using port
kill -9 PID
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 PID

# Or change port in docker-compose.yml
```

### Database Connection Error

```bash
# Check postgres is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up
```

### Frontend Not Loading

```bash
# Clear npm cache
npm cache clean --force

# Rebuild frontend
docker-compose exec frontend npm install
docker-compose exec frontend npm start
```

### Docker Not Running

```bash
# Restart Docker
# - macOS: Applications → Docker
# - Windows: Start Docker Desktop
# - Linux: sudo systemctl start docker
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# In containers
docker-compose exec backend npm install
docker-compose exec frontend npm install
```

## Environment Setup by Use Case

### For API Integration Testing
```bash
# .env
MOCK_EXTERNAL_APIS=false
SENNDER_API_KEY=your_test_key
TOMTOM_API_KEY=your_test_key
GEOTAB_USERNAME=your_test_username
```

### For UI Development
```bash
# .env
SEED_DATABASE=true
MOCK_EXTERNAL_APIS=true
DEBUG=true
```

### For Security Testing
```bash
# .env
RATE_LIMIT_MAX_REQUESTS=10
PASSWORD_MIN_LENGTH=12
ENABLE_2FA=true
```

## IDE Setup (VS Code)

### Recommended Extensions

```
- ESLint
- Prettier - Code formatter
- Docker
- Thunder Client (API testing)
- Git Lens
- JavaScript (ES6) code snippets
- REST Client
- Markdown All in One
```

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact"
  ]
}
```

### VS Code Debugging

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.js",
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

## Next Steps

1. ✅ Setup complete!
2. 📚 Read [API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md)
3. 🏗️ Read [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
4. 🔒 Read [SECURITY_GUIDE.md](../docs/SECURITY_GUIDE.md)
5. 💾 Read [DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md)
6. 🚀 Start building features!

## Getting Help

- 📖 Check [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)
- 🐛 Open an issue on GitHub
- 💬 Check project documentation
- 🆘 Email: support@fleetplatform.com

---

**Happy coding! 🚀**
