"""
Room API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_active_user, get_current_manager
from app.schemas.room import Room, RoomCreate, RoomUpdate
from app.crud import room as crud_room

router = APIRouter()


@router.get("/", response_model=List[Room])
async def list_rooms(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    min_capacity: Optional[int] = Query(None, ge=1),
    max_capacity: Optional[int] = Query(None, ge=1),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    is_available: Optional[bool] = Query(None),
    sort_by: str = Query("name", regex="^(name|capacity|price|id)$"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db)
    # Removed authentication requirement for public access to rooms list
    # current_user: User = Depends(get_current_active_user)
):
    """
    Get list of rooms with optional filters and sorting.
    Public endpoint - no authentication required.
    """
    rooms = await crud_room.get_rooms(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        min_capacity=min_capacity,
        max_capacity=max_capacity,
        min_price=min_price,
        max_price=max_price,
        is_available=is_available,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return rooms


@router.get("/count")
async def count_rooms(
    search: Optional[str] = Query(None),
    min_capacity: Optional[int] = Query(None, ge=1),
    max_capacity: Optional[int] = Query(None, ge=1),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    is_available: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Count total rooms matching filters.
    """
    total = await crud_room.count_rooms(
        db=db,
        search=search,
        min_capacity=min_capacity,
        max_capacity=max_capacity,
        min_price=min_price,
        max_price=max_price,
        is_available=is_available
    )
    return {"total": total}


@router.get("/{room_id}", response_model=Room)
async def get_room(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get room by ID.
    """
    room = await crud_room.get_room(db=db, room_id=room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    return room


@router.post("/", response_model=Room, status_code=status.HTTP_201_CREATED)
async def create_room(
    room: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    """
    Create a new room. Only managers can create rooms.
    """
    # Check if room with same name exists
    existing_room = await crud_room.get_room_by_name(db=db, name=room.name)
    if existing_room:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room with this name already exists"
        )
    
    return await crud_room.create_room(db=db, room=room)


@router.put("/{room_id}", response_model=Room)
async def update_room(
    room_id: int,
    room_update: RoomUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    """
    Update a room. Only managers can update rooms.
    """
    # If updating name, check for duplicates
    if room_update.name:
        existing_room = await crud_room.get_room_by_name(db=db, name=room_update.name)
        if existing_room and existing_room.id != room_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Room with this name already exists"
            )
    
    updated_room = await crud_room.update_room(db=db, room_id=room_id, room_update=room_update)
    if not updated_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    return updated_room


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    """
    Delete a room. Only managers can delete rooms.
    """
    success = await crud_room.delete_room(db=db, room_id=room_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    return None
