"""
Database migration script - Creates all tables
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.database import engine, Base
from app.models import User, Room, Booking, booking_participants


async def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    async with engine.begin() as conn:
        # Drop all tables first (use with caution in production!)
        await conn.run_sync(Base.metadata.drop_all)
        print("Dropped existing tables")
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("Created all tables successfully!")


if __name__ == "__main__":
    asyncio.run(create_tables())
