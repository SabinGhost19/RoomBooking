"""
Database migration script to add avatar_url column to users table.
Run this script to update existing database.
"""
import asyncio
from sqlalchemy import text
from app.database import engine


async def add_avatar_column():
    """Add avatar_url column to users table."""
    async with engine.begin() as conn:
        # Check if column already exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='avatar_url';
        """)
        result = await conn.execute(check_query)
        exists = result.fetchone()
        
        if not exists:
            print("Adding avatar_url column to users table...")
            alter_query = text("""
                ALTER TABLE users 
                ADD COLUMN avatar_url VARCHAR;
            """)
            await conn.execute(alter_query)
            print("✓ avatar_url column added successfully!")
        else:
            print("✓ avatar_url column already exists.")


async def main():
    """Run migration."""
    print("Starting database migration...")
    try:
        await add_avatar_column()
        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
