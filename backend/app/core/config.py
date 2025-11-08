"""
Application configuration using Pydantic Settings.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import secrets


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    # Project Info
    PROJECT_NAME: str = "Room Booking API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_NAME: str = "roombooking"
    DB_HOST: str = "localhost"  # Changed from "postgres" to "localhost" for Docker port mapping
    DB_PORT: int = 5432
    DATABASE_URL: Optional[str] = None
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    
    # CORS - Permisive for development
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "*",  # Allow all origins in development
    ]
    
    # Superuser
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"
    FIRST_SUPERUSER_USERNAME: str = "admin"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def async_database_url(self) -> str:
        """
        Construct async database URL for SQLAlchemy.
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def sync_database_url(self) -> str:
        """
        Construct sync database URL for initial setup.
        """
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


settings = Settings()
