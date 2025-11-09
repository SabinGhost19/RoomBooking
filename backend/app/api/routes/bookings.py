"""
Booking API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import date, timedelta

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_active_user
from app.schemas.booking import (
    Booking, BookingCreate, BookingUpdate, BookingWithDetails,
    AvailabilityCheck, UserSchedule
)
from app.crud import booking as crud_booking
from app.crud import room as crud_room

router = APIRouter()


@router.get("/my-bookings", response_model=List[BookingWithDetails])
async def get_my_bookings(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None, regex="^(upcoming|completed|cancelled)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all bookings for the current user (as organizer or participant).
    If dates not provided, defaults to today + 3 weeks.
    """
    if not start_date:
        start_date = date.today()
    if not end_date:
        end_date = start_date + timedelta(weeks=3)
    
    bookings = await crud_booking.get_bookings_by_user(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        status=status
    )
    
    # Convert to BookingWithDetails format
    bookings_with_details = []
    for booking in bookings:
        # Fetch room name
        room = await crud_room.get_room(db, booking.room_id)
        
        booking_dict = {
            "id": booking.id,
            "room_id": booking.room_id,
            "user_id": booking.user_id,
            "booking_date": booking.booking_date,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "status": booking.status,
            "approval_status": booking.approval_status,
            "approved_by_id": booking.approved_by_id,
            "approved_at": booking.approved_at,
            "rejection_reason": booking.rejection_reason,
            "created_at": booking.created_at,
            "updated_at": booking.updated_at,
            "room_name": room.name if room else None,
            "organizer_name": booking.user.full_name if hasattr(booking, 'user') and booking.user else None,
            "participant_ids": [p.id for p in booking.participants] if hasattr(booking, 'participants') and booking.participants else []
        }
        bookings_with_details.append(booking_dict)
    
    return bookings_with_details


@router.get("/my-schedule", response_model=UserSchedule)
async def get_my_schedule(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user's schedule (all bookings) for the given period.
    """
    if not start_date:
        start_date = date.today()
    if not end_date:
        end_date = start_date + timedelta(weeks=3)
    
    bookings = await crud_booking.get_bookings_by_user(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        status='upcoming'
    )
    
    # Convert to BookingWithDetails
    bookings_with_details = []
    for booking in bookings:
        bookings_with_details.append(
            BookingWithDetails(
                **booking.__dict__,
                room_name=booking.room.name if booking.room else None,
                organizer_name=booking.user.full_name if booking.user else None,
                participant_ids=[p.id for p in booking.participants] if booking.participants else []
            )
        )
    
    return UserSchedule(user_id=current_user.id, bookings=bookings_with_details)


@router.get("/room/{room_id}", response_model=List[Booking])
async def get_room_bookings(
    room_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None, regex="^(upcoming|completed|cancelled)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all bookings for a specific room.
    If dates not provided, defaults to today + 3 weeks.
    """
    # Check if room exists
    room = await crud_room.get_room(db=db, room_id=room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    if not start_date:
        start_date = date.today()
    if not end_date:
        end_date = start_date + timedelta(weeks=3)
    
    bookings = await crud_booking.get_bookings_by_room(
        db=db,
        room_id=room_id,
        start_date=start_date,
        end_date=end_date,
        status=status
    )
    return bookings


@router.post("/check-availability")
async def check_availability(
    availability: AvailabilityCheck,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check if a room is available for booking at the specified time.
    """
    is_available = await crud_booking.check_room_availability(
        db=db,
        room_id=availability.room_id,
        booking_date=availability.booking_date,
        start_time=availability.start_time,
        end_time=availability.end_time
    )
    
    return {"available": is_available}


# ============================================
# APPROVAL ROUTES (must be BEFORE /{booking_id})
# ============================================

@router.get("/pending", response_model=List[BookingWithDetails])
async def get_pending_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all pending bookings that need manager approval.
    Only accessible by managers (is_manager).
    """
    if not current_user.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can view pending bookings"
        )
    
    bookings = await crud_booking.get_pending_bookings_for_manager(
        db=db,
        skip=skip,
        limit=limit
    )
    
    # Convert to BookingWithDetails format
    bookings_with_details = []
    for booking in bookings:
        # Fetch room name
        room = await crud_room.get_room(db, booking.room_id)
        
        booking_dict = {
            "id": booking.id,
            "room_id": booking.room_id,
            "user_id": booking.user_id,
            "booking_date": booking.booking_date,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "status": booking.status,
            "approval_status": booking.approval_status,
            "approved_by_id": booking.approved_by_id,
            "approved_at": booking.approved_at,
            "rejection_reason": booking.rejection_reason,
            "created_at": booking.created_at,
            "updated_at": booking.updated_at,
            "room_name": room.name if room else None,
            "organizer_name": booking.user.full_name if booking.user else None,
            "participant_ids": [p.id for p in booking.participants] if booking.participants else []
        }
        bookings_with_details.append(booking_dict)
    
    return bookings_with_details


@router.get("/pending/count")
async def get_pending_bookings_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get count of pending bookings. Only accessible by managers.
    """
    if not current_user.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can view pending bookings count"
        )
    
    count = await crud_booking.get_pending_bookings_count(db)
    return {"pending_count": count}


@router.post("/{booking_id}/approve", response_model=Booking)
async def approve_booking_endpoint(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Approve a pending booking. Only accessible by managers.
    """
    if not current_user.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can approve bookings"
        )
    
    booking = await crud_booking.approve_booking(
        db=db,
        booking_id=booking_id,
        manager_id=current_user.id
    )
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found or not in pending status"
        )
    
    return booking


@router.post("/{booking_id}/reject", response_model=Booking)
async def reject_booking_endpoint(
    booking_id: int,
    reason: Optional[str] = Query(None, max_length=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Reject a pending booking with optional reason. Only accessible by managers.
    """
    if not current_user.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can reject bookings"
        )
    
    booking = await crud_booking.reject_booking(
        db=db,
        booking_id=booking_id,
        manager_id=current_user.id,
        reason=reason
    )
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found or not in pending status"
        )
    
    return booking


# ============================================
# GENERIC BOOKING ROUTES
# ============================================

@router.get("/{booking_id}", response_model=Booking)
async def get_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get booking by ID.
    """
    booking = await crud_booking.get_booking(db=db, booking_id=booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check if user has access to this booking
    participant_ids = [p.id for p in booking.participants]
    if booking.user_id != current_user.id and current_user.id not in participant_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this booking"
        )
    
    return booking


@router.post("/", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new booking.
    """
    # Validate that end_time is after start_time
    if booking.end_time <= booking.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time"
        )
    
    # Check if room exists
    room = await crud_room.get_room(db=db, room_id=booking.room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Create booking
    created_booking = await crud_booking.create_booking(
        db=db,
        booking=booking,
        user_id=current_user.id
    )
    
    if not created_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create booking. Room may be occupied, participants unavailable, or capacity exceeded."
        )
    
    return created_booking


@router.put("/{booking_id}", response_model=Booking)
async def update_booking(
    booking_id: int,
    booking_update: BookingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a booking. Only the organizer can update.
    """
    # Validate time if provided
    if booking_update.start_time and booking_update.end_time:
        if booking_update.end_time <= booking_update.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End time must be after start time"
            )
    
    updated_booking = await crud_booking.update_booking(
        db=db,
        booking_id=booking_id,
        booking_update=booking_update,
        user_id=current_user.id
    )
    
    if not updated_booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found or you don't have permission to update it"
        )
    
    return updated_booking


@router.post("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Cancel a booking. Only the organizer can cancel.
    """
    success = await crud_booking.cancel_booking(
        db=db,
        booking_id=booking_id,
        user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found or you don't have permission to cancel it"
        )
    
    return {"message": "Booking cancelled successfully"}


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a booking. Only the organizer can delete.
    """
    success = await crud_booking.delete_booking(
        db=db,
        booking_id=booking_id,
        user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found or you don't have permission to delete it"
        )
    
    return None
