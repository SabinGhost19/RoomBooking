#!/bin/bash
# Backend environment variables for local development

export DB_USER="postgres"
export DB_PASSWORD="postgres"
export DB_NAME="roombooking"
export DB_HOST="localhost"
export DB_PORT="5432"
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/roombooking"

export SECRET_KEY="dev-secret-key-change-in-production-min-32-chars-long"
export ALGORITHM="HS256"
export ACCESS_TOKEN_EXPIRE_MINUTES="30"
export REFRESH_TOKEN_EXPIRE_DAYS="7"

export FIRST_SUPERUSER_EMAIL="admin@example.com"
export FIRST_SUPERUSER_PASSWORD="Admin123!"
export FIRST_SUPERUSER_USERNAME="admin"

export BACKEND_CORS_ORIGINS='["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"]'

echo "✅ Environment variables loaded!"
echo "📦 Database: postgresql://postgres:***@localhost:5432/roombooking"
echo "🔑 Secret key configured"
echo "🌐 CORS origins configured for frontend"
