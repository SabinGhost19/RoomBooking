"""
CRUD operations for User model.
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password, validate_password_strength


class CRUDUser:
    """
    CRUD operations for User model.
    """
    
    async def get(self, db: AsyncSession, user_id: int) -> Optional[User]:
        """
        Get a user by ID.
        
        Args:
            db: Database session
            user_id: User ID
        
        Returns:
            User object or None if not found
        """
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """
        Get a user by email.
        
        Args:
            db: Database session
            email: User email
        
        Returns:
            User object or None if not found
        """
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
    
    async def get_by_username(self, db: AsyncSession, username: str) -> Optional[User]:
        """
        Get a user by username.
        
        Args:
            db: Database session
            username: Username
        
        Returns:
            User object or None if not found
        """
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()
    
    async def create(self, db: AsyncSession, obj_in: UserCreate) -> User:
        """
        Create a new user.
        
        Args:
            db: Database session
            obj_in: User creation schema
        
        Returns:
            Created user object
        
        Raises:
            HTTPException: If email or username already exists or password is weak
        """
        # Validate password strength
        validate_password_strength(obj_in.password)
        
        # Check if email already exists
        existing_user = await self.get_by_email(db, obj_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username already exists
        existing_username = await self.get_by_username(db, obj_in.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create user
        db_obj = User(
            email=obj_in.email,
            username=obj_in.username,
            hashed_password=get_password_hash(obj_in.password),
            full_name=obj_in.full_name,
            is_active=True,
            is_superuser=getattr(obj_in, 'is_superuser', False)
        )
        
        try:
            db.add(db_obj)
            await db.flush()
            await db.refresh(db_obj)
            return db_obj
        except IntegrityError:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists"
            )
    
    async def update(
        self, 
        db: AsyncSession, 
        db_obj: User, 
        obj_in: UserUpdate
    ) -> User:
        """
        Update a user.
        
        Args:
            db: Database session
            db_obj: Existing user object
            obj_in: User update schema
        
        Returns:
            Updated user object
        
        Raises:
            HTTPException: If email or username already taken by another user
        """
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Check if email is being updated and if it's already taken
        if "email" in update_data and update_data["email"] != db_obj.email:
            existing_user = await self.get_by_email(db, update_data["email"])
            if existing_user and existing_user.id != db_obj.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Check if username is being updated and if it's already taken
        if "username" in update_data and update_data["username"] != db_obj.username:
            existing_user = await self.get_by_username(db, update_data["username"])
            if existing_user and existing_user.id != db_obj.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # Hash password if it's being updated
        if "password" in update_data:
            validate_password_strength(update_data["password"])
            update_data["hashed_password"] = get_password_hash(update_data["password"])
            del update_data["password"]
        
        # Update user fields
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        try:
            await db.flush()
            await db.refresh(db_obj)
            return db_obj
        except IntegrityError:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Update failed due to constraint violation"
            )
    
    async def delete(self, db: AsyncSession, user_id: int) -> bool:
        """
        Delete a user.
        
        Args:
            db: Database session
            user_id: User ID to delete
        
        Returns:
            True if deleted successfully
        
        Raises:
            HTTPException: If user not found
        """
        user = await self.get(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        await db.delete(user)
        await db.flush()
        return True
    
    async def authenticate(
        self, 
        db: AsyncSession, 
        email: str, 
        password: str
    ) -> Optional[User]:
        """
        Authenticate a user.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
        
        Returns:
            User object if authentication successful, None otherwise
        """
        user = await self.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user
    
    async def is_active(self, user: User) -> bool:
        """
        Check if user is active.
        
        Args:
            user: User object
        
        Returns:
            True if user is active
        """
        return user.is_active
    
    async def is_superuser(self, user: User) -> bool:
        """
        Check if user is superuser.
        
        Args:
            user: User object
        
        Returns:
            True if user is superuser
        """
        return user.is_superuser


# Create a singleton instance
user_crud = CRUDUser()
