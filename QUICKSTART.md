# 🚀 Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed

## Step 1: Setup Environment

```bash
# Navigate to project root
cd /home/tavi/RoomBooking_Project/RoomBooking

# Copy environment file
cp .env.example .env

# Edit .env and set secure values (IMPORTANT!)
# Change: SECRET_KEY, DB_PASSWORD, FIRST_SUPERUSER_PASSWORD
nano .env
```

## Step 2: Start Backend with Docker

```bash
# Start PostgreSQL and FastAPI backend
docker-compose up -d

# Check if containers are running
docker-compose ps

# View logs (if needed)
docker-compose logs -f backend
```

**Backend will be available at:** http://localhost:8000

**API Documentation:** http://localhost:8000/api/v1/docs

## Step 3: Start Frontend

```bash
# Navigate to frontend directory
cd sage-reserve

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

**Frontend will be available at:** http://localhost:5173

## Step 4: Test the Application

1. **Open Browser:** http://localhost:5173
2. **Sign Up:** Create a new account
3. **Login:** Authenticate with your credentials
4. **Explore:** Navigate through protected routes

## Default Admin Account

After first startup, an admin account is created:
- **Email:** admin@example.com
- **Password:** Admin123! (or your configured value)

## Common Commands

### Backend
```bash
# Stop services
docker-compose down

# View backend logs
docker-compose logs -f backend

# View database logs
docker-compose logs -f postgres

# Restart backend only
docker-compose restart backend

# Rebuild and start
docker-compose up --build
```

### Frontend
```bash
# Install new package
npm install <package-name>

# Build for production
npm run build

# Run linter
npm run lint
```

## Test API with cURL

```bash
# Sign up
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!",
    "full_name": "Test User"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

## Troubleshooting

### Frontend can't connect to backend
```bash
# Check backend is running
curl http://localhost:8000/health

# Check frontend .env file
cat sage-reserve/.env
# Should contain: VITE_API_URL=http://localhost:8000
```

### Database connection errors
```bash
# Check PostgreSQL is healthy
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres
```

### Port already in use
```bash
# Check what's using port 8000
sudo lsof -i :8000

# Or use different port in docker-compose.yml
```

## Next Steps

1. ✅ Review API documentation at http://localhost:8000/api/v1/docs
2. ✅ Check `API_EXAMPLES.md` for detailed API usage
3. ✅ Read `SETUP_README.md` for comprehensive documentation
4. ✅ Customize the frontend components in `sage-reserve/src/pages/`
5. ✅ Add more models and endpoints to the backend

## Project Structure

```
RoomBooking/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── core/        # Security & config
│   │   ├── crud/        # Database operations
│   │   ├── models/      # SQLAlchemy models
│   │   └── schemas/     # Pydantic schemas
│   ├── Dockerfile
│   └── requirements.txt
├── sage-reserve/         # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Auth context
│   │   ├── lib/         # API client
│   │   └── pages/       # Page components
│   └── .env
├── docker-compose.yml
├── .env.example
├── SETUP_README.md      # Full documentation
└── API_EXAMPLES.md      # API examples

```

## 🎉 You're Ready!

The application is now fully set up and running. Happy coding!

For detailed documentation, see:
- **SETUP_README.md** - Complete setup guide
- **API_EXAMPLES.md** - API endpoint examples
