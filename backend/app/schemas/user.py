"""
User Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


# Base schema with common attributes
class UserBase(BaseModel):
    """Base user schema with common attributes."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None


# Schema for creating a new user
class UserCreate(UserBase):
    """Schema for user registration/signup."""
    password: str = Field(..., min_length=8, max_length=100)
    is_manager: bool = Field(default=False, description="Whether the user is a manager")


# Schema for user login
class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


# Schema for updating user
class UserUpdate(BaseModel):
    """Schema for updating user information."""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)


# Schema for user in database (with all fields)
class UserInDB(UserBase):
    """Schema representing user as stored in database."""
    id: int
    is_active: bool
    is_manager: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Schema for user response (without sensitive data)
class UserResponse(UserBase):
    """Schema for user response (public data)."""
    id: int
    is_active: bool
    is_manager: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Token schemas
class Token(BaseModel):
    """Schema for authentication token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for token payload."""
    sub: Optional[int] = None
    exp: Optional[int] = None
    type: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


# Message schema for responses
class Message(BaseModel):
    """Generic message response schema."""
    message: str
