# API Examples - Postman Collection

This document contains example API requests for testing the Room Booking API.

## Base URL

```
http://localhost:8000/api/v1
```

## 1. Authentication Endpoints

### 1.1 Sign Up

Create a new user account.

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2025-11-08T10:00:00Z",
  "updated_at": "2025-11-08T10:00:00Z"
}
```

**Error Responses:**
- 400: Email already registered
- 400: Username already taken
- 400: Password doesn't meet requirements

---

### 1.2 Login

Authenticate and receive tokens.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- 401: Incorrect email or password
- 403: User account is inactive

---

### 1.3 Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- 401: Token has been revoked
- 401: Invalid token type
- 401: Could not validate credentials

---

### 1.4 Logout

Invalidate refresh token.

**Endpoint:** `POST /auth/logout`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

---

## 2. User Management Endpoints

All these endpoints require authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### 2.1 Get Current User

Get information about the authenticated user.

**Endpoint:** `GET /users/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2025-11-08T10:00:00Z",
  "updated_at": "2025-11-08T10:00:00Z"
}
```

**Error Responses:**
- 401: Could not validate credentials
- 403: Inactive user

---

### 2.2 Update Current User

Update user profile information.

**Endpoint:** `PUT /users/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body (all fields optional):**
```json
{
  "full_name": "John Smith",
  "email": "john.smith@example.com",
  "username": "johnsmith",
  "password": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "john.smith@example.com",
  "username": "johnsmith",
  "full_name": "John Smith",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2025-11-08T10:00:00Z",
  "updated_at": "2025-11-08T11:30:00Z"
}
```

**Error Responses:**
- 400: Email already registered
- 400: Username already taken
- 401: Could not validate credentials

---

### 2.3 Delete Current User

Delete the authenticated user's account.

**Endpoint:** `DELETE /users/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "message": "User account deleted successfully"
}
```

**Error Responses:**
- 401: Could not validate credentials
- 404: User not found

---

### 2.4 Get User by ID

Get information about a specific user (requires authentication).

**Endpoint:** `GET /users/{user_id}`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:** `GET /users/1`

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2025-11-08T10:00:00Z",
  "updated_at": "2025-11-08T10:00:00Z"
}
```

**Error Responses:**
- 401: Could not validate credentials
- 403: Not enough privileges (can only view own data unless superuser)
- 404: User not found

---

### 2.5 Delete User by ID (Superuser Only)

Delete a user account (requires superuser privileges).

**Endpoint:** `DELETE /users/{user_id}`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:** `DELETE /users/5`

**Response (200 OK):**
```json
{
  "message": "User 5 deleted successfully"
}
```

**Error Responses:**
- 401: Could not validate credentials
- 403: Not enough privileges
- 404: User not found

---

## 3. Health Check Endpoints

### 3.1 Root

**Endpoint:** `GET /`

**Response (200 OK):**
```json
{
  "message": "Welcome to Room Booking API",
  "version": "1.0.0",
  "docs": "/api/v1/docs"
}
```

---

### 3.2 Health Check

**Endpoint:** `GET /health`

**Response (200 OK):**
```json
{
  "status": "healthy"
}
```

---

## Complete cURL Examples

### Sign Up
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "username": "janedoe",
    "password": "SecurePass123!",
    "full_name": "Jane Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Profile
```bash
curl -X PUT http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith"
  }'
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

### Logout
```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

---

## Password Requirements

All passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit

**Valid examples:**
- `Password123`
- `SecureP@ss1`
- `MyPass2024!`

**Invalid examples:**
- `short` (too short)
- `alllowercase123` (no uppercase)
- `ALLUPPERCASE123` (no lowercase)
- `NoNumbers!` (no digit)

---

## Postman Collection Import

You can import this into Postman by:
1. Copy the JSON below
2. Open Postman
3. Click Import → Raw Text
4. Paste and import

```json
{
  "info": {
    "name": "Room Booking API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Sign Up",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"username\": \"testuser\",\n  \"password\": \"Test123!\",\n  \"full_name\": \"Test User\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": "{{baseUrl}}/auth/signup"
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"Test123!\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": "{{baseUrl}}/auth/login"
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8000/api/v1"
    }
  ]
}
```

---

## Testing Flow

1. **Sign Up** a new user
2. **Login** with the credentials
3. Save the `access_token` and `refresh_token`
4. Use `access_token` in Authorization header for protected endpoints
5. When token expires, use **Refresh Token** endpoint
6. Use **Logout** to invalidate the refresh token

---

**Note**: Replace `YOUR_ACCESS_TOKEN` and `YOUR_REFRESH_TOKEN` with actual tokens received from login/refresh endpoints.
