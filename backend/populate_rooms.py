"""
Script to populate database with rooms from JSON file.
Reads rooms_data.json and inserts all rooms into the database.
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.database import AsyncSessionLocal
from app.crud.room import create_room, get_room_by_name
from app.schemas.room import RoomCreate


async def populate_rooms():
    """Load rooms from JSON and insert into database."""
    
    # Load rooms data
    json_file = 'rooms_data.json'
    print(f"Loading rooms from: {json_file}")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        rooms_data = json.load(f)
    
    print(f"Found {len(rooms_data)} rooms to insert")
    print("=" * 80)
    
    async with AsyncSessionLocal() as db:
        success_count = 0
        skip_count = 0
        error_count = 0
        
        for room_data in rooms_data:
            try:
                # Check if room already exists
                existing_room = await get_room_by_name(db, room_data['name'])
                if existing_room:
                    print(f"⊘ Skipping {room_data['name']} - already exists")
                    skip_count += 1
                    continue
                
                # Create room schema
                room_create = RoomCreate(
                    name=room_data['name'],
                    description=room_data['description'],
                    capacity=room_data['capacity'],
                    price=room_data['price'],
                    amenities=room_data['amenities'],
                    svg_id=room_data['svg_id'],
                    coordinates=room_data['coordinates'],
                    is_available=room_data['is_available']
                )
                
                # Insert into database
                room = await create_room(db, room_create)
                print(f"✓ Created: {room.name} (ID: {room.id}, SVG ID: {room.svg_id})")
                success_count += 1
                
            except Exception as e:
                print(f"✗ Failed to create {room_data['name']}: {e}")
                error_count += 1
        
        print("\n" + "=" * 80)
        print(f"Summary:")
        print(f"  ✓ Successfully created: {success_count} rooms")
        print(f"  ⊘ Skipped (already exist): {skip_count} rooms")
        print(f"  ✗ Errors: {error_count} rooms")
        print(f"  Total processed: {len(rooms_data)} rooms")
        print("=" * 80)


if __name__ == "__main__":
    asyncio.run(populate_rooms())
