# Room Booking System - Full Stack Application

A professional full-stack room booking application built with **FastAPI** backend and **React + TypeScript** frontend.

## 🚀 Features

### Backend (FastAPI)
- ✅ **JWT Authentication** with access and refresh tokens
- ✅ **PostgreSQL Database** with SQLAlchemy 2.0+ async
- ✅ **User Management** - CRUD operations with role-based access
- ✅ **Auto Database Creation** - Automatic database and table creation
- ✅ **Password Security** - Bcrypt hashing with strength validation
- ✅ **CORS Configuration** - Secure cross-origin requests
- ✅ **Docker Support** - Complete containerization
- ✅ **API Documentation** - Auto-generated Swagger/ReDoc docs

### Frontend (React + TypeScript)
- ✅ **Modern UI** - Built with shadcn/ui components
- ✅ **Authentication Flow** - Login, Signup, Logout with JWT
- ✅ **Protected Routes** - Automatic redirect for unauthenticated users
- ✅ **Auto Token Refresh** - Seamless token renewal
- ✅ **User Profile** - View and edit user information
- ✅ **Error Handling** - Comprehensive error messages
- ✅ **Loading States** - User-friendly loading indicators

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** 18+ and **npm** (for local frontend development)
- **Python** 3.11+ (for local backend development)

## 🛠️ Quick Start with Docker

### 1. Clone the repository

```bash
cd /home/tavi/RoomBooking_Project/RoomBooking
```

### 2. Create environment file

```bash
cp .env.example .env
```

Edit `.env` and set your secure values:

```env
# Database
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=roombooking

# Security - CHANGE THESE!
SECRET_KEY=your-super-secret-key-min-32-chars-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# First Superuser
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=Admin123!
FIRST_SUPERUSER_USERNAME=admin
```

### 3. Start the application

```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** on port `5432`
- **FastAPI Backend** on port `8000`

### 4. Install frontend dependencies

```bash
cd sage-reserve
npm install axios
```

### 5. Start the frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📚 API Documentation

Once the backend is running, access the interactive API docs:

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

## 🔐 API Endpoints

### Authentication

#### Sign Up
```bash
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "full_name": "John Doe"
}
```

#### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

#### Refresh Token
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGc..."
}
```

#### Logout
```bash
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refresh_token": "eyJhbGc..."
}
```

### User Management

All user endpoints require authentication (Bearer token in Authorization header).

#### Get Current User
```bash
GET /api/v1/users/me
Authorization: Bearer <access_token>
```

#### Update Current User
```bash
PUT /api/v1/users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "full_name": "Jane Doe",
  "email": "jane@example.com"
}
```

#### Delete Current User
```bash
DELETE /api/v1/users/me
Authorization: Bearer <access_token>
```

#### Get User by ID
```bash
GET /api/v1/users/{user_id}
Authorization: Bearer <access_token>
```

## 🧪 Testing the API with cURL

### 1. Sign up a new user
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!",
    "full_name": "Test User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

Save the `access_token` from the response.

### 3. Get current user
```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <your_access_token>"
```

### 4. Update user profile
```bash
curl -X PUT http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Updated Name"
  }'
```

## 🏗️ Project Structure

```
RoomBooking/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── database.py          # Database configuration
│   │   ├── models/              # SQLAlchemy models
│   │   │   └── user.py
│   │   ├── schemas/             # Pydantic schemas
│   │   │   └── user.py
│   │   ├── crud/                # CRUD operations
│   │   │   └── user.py
│   │   ├── api/                 # API routes
│   │   │   ├── deps.py          # Dependencies
│   │   │   └── routes/
│   │   │       ├── auth.py
│   │   │       └── users.py
│   │   └── core/                # Core utilities
│   │       ├── config.py        # Settings
│   │       └── security.py      # Security functions
│   ├── requirements.txt
│   └── Dockerfile
├── sage-reserve/                # React frontend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts          # API client
│   │   │   ├── apiClient.ts    # Axios configuration
│   │   │   └── apiConfig.ts    # API configuration
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Auth state management
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx
│   │   └── pages/
│   │       ├── Login.tsx
│   │       ├── Signup.tsx
│   │       └── Profile.tsx
│   └── .env
├── docker-compose.yml
└── .env.example
```

## 🔒 Security Features

1. **Password Requirements**:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one digit

2. **JWT Tokens**:
   - Access token: 30 minutes expiration
   - Refresh token: 7 days expiration
   - Automatic refresh on expiration

3. **Database**:
   - Passwords hashed with bcrypt
   - SQL injection prevention via SQLAlchemy ORM
   - Unique constraints on email and username

4. **CORS**:
   - Configured for specific origins
   - Credentials support enabled

## 🐛 Troubleshooting

### Backend won't start

**Issue**: Database connection error

**Solution**: Ensure PostgreSQL container is healthy
```bash
docker-compose ps
docker-compose logs postgres
```

### Frontend can't connect to backend

**Issue**: CORS error or connection refused

**Solution**: 
1. Check if backend is running on port 8000
2. Verify `VITE_API_URL` in `sage-reserve/.env` is set to `http://localhost:8000`
3. Check CORS origins in backend configuration

### Token expired errors

**Solution**: The refresh token mechanism should handle this automatically. If issues persist:
1. Clear browser localStorage
2. Login again

## 📦 Installing Axios

The frontend requires axios for API calls. Install it with:

```bash
cd sage-reserve
npm install axios
```

## 🚀 Production Deployment

### Backend Environment Variables

For production, ensure you set:
- `SECRET_KEY`: A strong, random secret key (min 32 characters)
- `DB_PASSWORD`: A secure database password
- `BACKEND_CORS_ORIGINS`: Your production frontend URL

### Frontend Build

```bash
cd sage-reserve
npm run build
```

The built files will be in `sage-reserve/dist/`

## 📝 Default Admin Account

After first startup, a superuser account is automatically created:

- **Email**: admin@example.com (or your configured value)
- **Password**: Admin123! (or your configured value)
- **Username**: admin

**⚠️ Change these credentials in production!**

## 🤝 Contributing

Feel free to submit issues and pull requests.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Development

### Backend Local Development (without Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/roombooking"
export SECRET_KEY="your-secret-key"

# Run
uvicorn app.main:app --reload
```

### Frontend Local Development

```bash
cd sage-reserve
npm install
npm run dev
```

## 🔧 Technologies Used

### Backend
- FastAPI
- SQLAlchemy 2.0+
- PostgreSQL
- Pydantic v2
- Python-JOSE (JWT)
- Passlib + Bcrypt
- Uvicorn
- Docker

### Frontend
- React 18
- TypeScript
- Vite
- Axios
- Tailwind CSS
- shadcn/ui
- React Router

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Happy Coding! 🎉**
