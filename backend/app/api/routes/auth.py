"""
Authentication routes (signup, login, refresh, logout).
"""
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import (
    UserCreate, 
    UserResponse, 
    UserLogin, 
    Token,
    RefreshTokenRequest,
    Message
)
from app.crud.user import user_crud
from app.core.security import (
    create_access_token, 
    create_refresh_token,
    decode_token
)
from app.core.config import settings

router = APIRouter()

# In-memory storage for blacklisted tokens (in production, use Redis)
blacklisted_tokens = set()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Register a new user.
    
    Args:
        user_in: User registration data
        db: Database session
    
    Returns:
        Created user data
    
    Raises:
        HTTPException: If email or username already exists
    """
    user = await user_crud.create(db, obj_in=user_in)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(
    user_in: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Login user and return access and refresh tokens.
    
    Args:
        user_in: User login credentials
        db: Database session
    
    Returns:
        Access and refresh tokens
    
    Raises:
        HTTPException: If credentials are invalid
    """
    user = await user_crud.authenticate(
        db, 
        email=user_in.email, 
        password=user_in.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create tokens
    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(
        subject=user.id,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Refresh access token using refresh token.
    
    Args:
        token_request: Refresh token
        db: Database session
    
    Returns:
        New access and refresh tokens
    
    Raises:
        HTTPException: If refresh token is invalid or expired
    """
    # Check if token is blacklisted
    if token_request.refresh_token in blacklisted_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = decode_token(token_request.refresh_token)
        user_id: int = int(payload.get("sub"))
        token_type: str = payload.get("type")
        
        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = await user_crud.get(db, user_id=user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Blacklist old refresh token
    blacklisted_tokens.add(token_request.refresh_token)
    
    # Create new tokens
    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    new_refresh_token = create_refresh_token(
        subject=user.id,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout", response_model=Message)
async def logout(
    token_request: RefreshTokenRequest
) -> Any:
    """
    Logout user by blacklisting refresh token.
    
    Args:
        token_request: Refresh token to blacklist
    
    Returns:
        Success message
    """
    # Add token to blacklist
    blacklisted_tokens.add(token_request.refresh_token)
    
    return {"message": "Successfully logged out"}
