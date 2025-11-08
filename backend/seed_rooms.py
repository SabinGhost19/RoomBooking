"""
Seed script to create sample rooms in the database.
Run this after migration to populate the database with test data.
"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.database import AsyncSessionLocal
from app.crud.room import create_room
from app.schemas.room import RoomCreate


async def seed_rooms():
    """Create sample rooms."""
    
    sample_rooms = [
        RoomCreate(
            name="Executive Meeting Room",
            description="Perfect for team meetings and presentations. Equipped with state-of-the-art technology.",
            capacity=12,
            price=75.0,
            amenities=["Projector", "Whiteboard", "Video Conference", "Coffee Machine", "WiFi"],
            image="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
            svg_id="room-1",
            coordinates={"x": 200, "y": 150},
            is_available=True
        ),
        RoomCreate(
            name="Creative Studio",
            description="Inspiring space for creative brainstorming and collaborative work.",
            capacity=8,
            price=60.0,
            amenities=["Natural Light", "Whiteboard", "Smart TV", "Plants", "WiFi"],
            image="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
            svg_id="room-2",
            coordinates={"x": 400, "y": 150},
            is_available=True
        ),
        RoomCreate(
            name="Small Conference Room",
            description="Cozy room ideal for small team discussions and one-on-one meetings.",
            capacity=4,
            price=35.0,
            amenities=["TV Screen", "Whiteboard", "WiFi"],
            image="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
            svg_id="room-3",
            coordinates={"x": 600, "y": 150},
            is_available=True
        ),
        RoomCreate(
            name="Training Room",
            description="Large training room with flexible seating arrangements and excellent AV equipment.",
            capacity=20,
            price=100.0,
            amenities=["Projector", "Sound System", "Multiple Whiteboards", "Video Conference", "WiFi"],
            image="https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=800",
            svg_id="room-4",
            coordinates={"x": 200, "y": 350},
            is_available=True
        ),
        RoomCreate(
            name="Focus Pod",
            description="Private quiet space for individual focused work or phone calls.",
            capacity=1,
            price=20.0,
            amenities=["Desk", "Ergonomic Chair", "Power Outlets", "WiFi"],
            image="https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800",
            svg_id="room-5",
            coordinates={"x": 400, "y": 350},
            is_available=True
        ),
        RoomCreate(
            name="Board Room",
            description="Premium board room for executive meetings and important presentations.",
            capacity=16,
            price=120.0,
            amenities=["Large Conference Table", "Premium Chairs", "Dual Screens", "Video Conference", "Catering Service", "WiFi"],
            image="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800",
            svg_id="room-6",
            coordinates={"x": 600, "y": 350},
            is_available=True
        ),
    ]
    
    async with AsyncSessionLocal() as db:
        print("Creating sample rooms...")
        for room_data in sample_rooms:
            try:
                room = await create_room(db, room_data)
                print(f"✓ Created room: {room.name} (ID: {room.id})")
            except Exception as e:
                print(f"✗ Failed to create room {room_data.name}: {e}")
        
        print("\nSample rooms created successfully!")


if __name__ == "__main__":
    asyncio.run(seed_rooms())
