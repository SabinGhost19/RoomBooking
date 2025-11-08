"""
User management routes.
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserResponse, UserUpdate, Message
from app.crud.user import user_crud
from app.api.deps import get_current_active_user, get_current_superuser
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current user information.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        Current user data
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update current user information.
    
    Args:
        user_update: Updated user data
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        Updated user data
    """
    user = await user_crud.update(db, db_obj=current_user, obj_in=user_update)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/me", response_model=Message)
async def delete_current_user(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Delete current user account.
    
    Args:
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        Success message
    """
    await user_crud.delete(db, user_id=current_user.id)
    await db.commit()
    return {"message": "User account deleted successfully"}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get user by ID (requires authentication).
    
    Args:
        user_id: User ID to retrieve
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        User data
    
    Raises:
        HTTPException: If user not found
    """
    user = await user_crud.get(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Users can only view their own data unless they are superusers
    if user.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough privileges"
        )
    
    return user


@router.delete("/{user_id}", response_model=Message)
async def delete_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Delete user by ID (superuser only).
    
    Args:
        user_id: User ID to delete
        db: Database session
        current_user: Current superuser
    
    Returns:
        Success message
    
    Raises:
        HTTPException: If user not found
    """
    await user_crud.delete(db, user_id=user_id)
    await db.commit()
    return {"message": f"User {user_id} deleted successfully"}
