"""
Database configuration and session management.
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Create async engine for database operations
engine = create_async_engine(
    settings.async_database_url,
    echo=True,
    future=True,
    pool_pre_ping=True,
)

# Create async session maker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """
    Dependency to get database session.
    
    Yields:
        AsyncSession: Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize database: create all tables if they don't exist.
    This function is called on application startup.
    """
    try:
        # First, check if database exists and create if not
        await _ensure_database_exists()
        
        # Import all models here to ensure they are registered with Base
        from app.models.user import User  # noqa
        
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database tables created successfully")
        
        # Create first superuser if not exists
        await _create_first_superuser()
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


async def _ensure_database_exists() -> None:
    """
    Ensure the database exists, create it if it doesn't.
    """
    try:
        # Try to connect to the database
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection successful")
    except OperationalError:
        # Database doesn't exist, create it
        logger.info(f"Database {settings.DB_NAME} doesn't exist, creating it...")
        
        # Connect to postgres database to create our database
        temp_url = f"postgresql+asyncpg://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/postgres"
        temp_engine = create_async_engine(temp_url, isolation_level="AUTOCOMMIT")
        
        try:
            async with temp_engine.connect() as conn:
                await conn.execute(text(f"CREATE DATABASE {settings.DB_NAME}"))
            logger.info(f"Database {settings.DB_NAME} created successfully")
        finally:
            await temp_engine.dispose()


async def _create_first_superuser() -> None:
    """
    Create the first superuser if it doesn't exist.
    """
    from app.crud.user import user_crud
    from app.schemas.user import UserCreate
    
    try:
        async with AsyncSessionLocal() as session:
            # Check if superuser already exists
            existing_user = await user_crud.get_by_email(
                session, 
                email=settings.FIRST_SUPERUSER_EMAIL
            )
            
            if not existing_user:
                user_in = UserCreate(
                    email=settings.FIRST_SUPERUSER_EMAIL,
                    username=settings.FIRST_SUPERUSER_USERNAME,
                    password=settings.FIRST_SUPERUSER_PASSWORD,
                    full_name="System Administrator",
                    is_superuser=True,
                )
                await user_crud.create(session, obj_in=user_in)
                await session.commit()
                logger.info("First superuser created successfully")
            else:
                logger.info("Superuser already exists")
    except Exception as e:
        logger.error(f"Error creating first superuser: {e}")
