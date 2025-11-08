"""
CRUD operations for Room model.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import Optional, List
from app.models.room import Room
from app.schemas.room import RoomCreate, RoomUpdate


async def get_room(db: AsyncSession, room_id: int) -> Optional[Room]:
    """
    Get room by ID.
    """
    result = await db.execute(select(Room).where(Room.id == room_id))
    return result.scalar_one_or_none()


async def get_room_by_name(db: AsyncSession, name: str) -> Optional[Room]:
    """
    Get room by name.
    """
    result = await db.execute(select(Room).where(Room.name == name))
    return result.scalar_one_or_none()


async def get_rooms(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    min_capacity: Optional[int] = None,
    max_capacity: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_available: Optional[bool] = None,
    sort_by: str = "name",
    sort_order: str = "asc"
) -> List[Room]:
    """
    Get list of rooms with optional filters and sorting.
    """
    query = select(Room)
    
    # Apply filters
    filters = []
    
    if search:
        search_filter = or_(
            Room.name.ilike(f"%{search}%"),
            Room.description.ilike(f"%{search}%")
        )
        filters.append(search_filter)
    
    if min_capacity is not None:
        filters.append(Room.capacity >= min_capacity)
    
    if max_capacity is not None:
        filters.append(Room.capacity <= max_capacity)
    
    if min_price is not None:
        filters.append(Room.price >= min_price)
    
    if max_price is not None:
        filters.append(Room.price <= max_price)
    
    if is_available is not None:
        filters.append(Room.is_available == is_available)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Apply sorting
    if sort_order.lower() == "desc":
        query = query.order_by(getattr(Room, sort_by).desc())
    else:
        query = query.order_by(getattr(Room, sort_by).asc())
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


async def create_room(db: AsyncSession, room: RoomCreate) -> Room:
    """
    Create a new room.
    """
    db_room = Room(
        name=room.name,
        description=room.description,
        capacity=room.capacity,
        price=room.price,
        amenities=room.amenities,
        image=room.image,
        svg_id=room.svg_id,
        coordinates=room.coordinates,
        is_available=room.is_available
    )
    db.add(db_room)
    await db.commit()
    await db.refresh(db_room)
    return db_room


async def update_room(db: AsyncSession, room_id: int, room_update: RoomUpdate) -> Optional[Room]:
    """
    Update an existing room.
    """
    db_room = await get_room(db, room_id)
    if not db_room:
        return None
    
    update_data = room_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_room, field, value)
    
    await db.commit()
    await db.refresh(db_room)
    return db_room


async def delete_room(db: AsyncSession, room_id: int) -> bool:
    """
    Delete a room.
    """
    db_room = await get_room(db, room_id)
    if not db_room:
        return False
    
    await db.delete(db_room)
    await db.commit()
    return True


async def count_rooms(
    db: AsyncSession,
    search: Optional[str] = None,
    min_capacity: Optional[int] = None,
    max_capacity: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_available: Optional[bool] = None
) -> int:
    """
    Count total rooms matching filters.
    """
    from sqlalchemy import func
    
    query = select(func.count(Room.id))
    
    filters = []
    
    if search:
        search_filter = or_(
            Room.name.ilike(f"%{search}%"),
            Room.description.ilike(f"%{search}%")
        )
        filters.append(search_filter)
    
    if min_capacity is not None:
        filters.append(Room.capacity >= min_capacity)
    
    if max_capacity is not None:
        filters.append(Room.capacity <= max_capacity)
    
    if min_price is not None:
        filters.append(Room.price >= min_price)
    
    if max_price is not None:
        filters.append(Room.price <= max_price)
    
    if is_available is not None:
        filters.append(Room.is_available == is_available)
    
    if filters:
        query = query.where(and_(*filters))
    
    result = await db.execute(query)
    return result.scalar_one()
