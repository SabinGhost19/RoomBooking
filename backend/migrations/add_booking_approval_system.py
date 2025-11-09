"""
Migration: Add approval system to bookings
Adds approval_status, approved_by_id, approved_at, rejection_reason columns
"""

import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal


async def upgrade():
    """Add approval columns to bookings table."""
    
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Add approval_status column (pending, approved, rejected)
            await session.execute(text("""
                ALTER TABLE bookings 
                ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' NOT NULL
            """))
            
            # Add approved_by_id foreign key to users
            await session.execute(text("""
                ALTER TABLE bookings 
                ADD COLUMN IF NOT EXISTS approved_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL
            """))
            
            # Add approved_at timestamp
            await session.execute(text("""
                ALTER TABLE bookings 
                ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE
            """))
            
            # Add rejection_reason text field
            await session.execute(text("""
                ALTER TABLE bookings 
                ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500)
            """))
            
            # Create indexes for performance
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_bookings_approval_status 
                ON bookings(approval_status)
            """))
            
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_bookings_approved_by_id 
                ON bookings(approved_by_id)
            """))
            
            # Update existing bookings to 'approved' status (backward compatibility)
            await session.execute(text("""
                UPDATE bookings 
                SET approval_status = 'approved' 
                WHERE approval_status = 'pending'
            """))
            
            await session.commit()
            
    print("✅ Migration completed: Added booking approval system")


async def downgrade():
    """Remove approval columns from bookings table."""
    
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Drop indexes
            await session.execute(text("DROP INDEX IF EXISTS idx_bookings_approval_status"))
            await session.execute(text("DROP INDEX IF EXISTS idx_bookings_approved_by_id"))
            
            # Drop columns
            await session.execute(text("ALTER TABLE bookings DROP COLUMN IF EXISTS rejection_reason"))
            await session.execute(text("ALTER TABLE bookings DROP COLUMN IF EXISTS approved_at"))
            await session.execute(text("ALTER TABLE bookings DROP COLUMN IF EXISTS approved_by_id"))
            await session.execute(text("ALTER TABLE bookings DROP COLUMN IF EXISTS approval_status"))
            
            await session.commit()
            
    print("✅ Migration rolled back: Removed booking approval system")


if __name__ == "__main__":
    print("Running migration: add_booking_approval_system")
    asyncio.run(upgrade())
