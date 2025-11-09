"""
Event Suggestion API routes for AI-powered room booking.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_active_user
from app.schemas.event_suggestion import (
    EventSuggestionRequest,
    EventSuggestionResponse,
    BulkBookingConfirmation,
    BulkBookingResponse,
)
from app.schemas.booking import BookingCreate
from app.crud.event_suggestion import event_suggestion_service
from app.crud import booking as crud_booking
from app.crud import room as crud_room

router = APIRouter()


@router.post("/suggest", response_model=EventSuggestionResponse)
async def get_event_suggestions(
    request: EventSuggestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get AI-powered room suggestions for multiple activities.
    
    The AI analyzes:
    - Activity requirements (participants, amenities)
    - Room availability
    - User preferences
    - Cost efficiency
    
    Returns suggestions with confidence scores and alternatives.
    """
    try:
        print(f"[EVENT SUGGESTIONS] Request received from user {current_user.id}")
        print(f"[EVENT SUGGESTIONS] Prompt: {request.prompt[:100] if request.prompt else 'None'}...")
        print(f"[EVENT SUGGESTIONS] Date: {request.booking_date}")
        print(f"[EVENT SUGGESTIONS] Activities count: {len(request.activities) if request.activities else 0}")
        
        suggestions = await event_suggestion_service.generate_suggestions(
            db=db,
            request=request,
            user_id=current_user.id,
        )
        
        print(f"[EVENT SUGGESTIONS] Generated {len(suggestions.suggestions)} suggestions")
        return suggestions
    except ValueError as e:
        print(f"[EVENT SUGGESTIONS] ValueError: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"[EVENT SUGGESTIONS] Unexpected error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate suggestions: {str(e)}"
        )


@router.post("/confirm-bulk", response_model=BulkBookingResponse)
async def confirm_bulk_bookings(
    confirmation: BulkBookingConfirmation,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Confirm and create multiple bookings at once from AI suggestions.
    
    Creates all valid bookings and reports any failures.
    """
    created_ids = []
    failed_bookings = []
    
    # Track time slots being booked in this bulk operation to avoid conflicts
    user_time_slots = []  # List of (start_time, end_time) tuples
    
    for booking_conf in confirmation.bookings:
        try:
            # Verify room exists
            room = await crud_room.get_room(db, booking_conf.room_id)
            if not room:
                failed_bookings.append({
                    "activity": booking_conf.activity_name,
                    "error": f"Room {booking_conf.room_id} not found"
                })
                continue
            
            # Check availability
            is_available = await crud_booking.check_room_availability(
                db=db,
                room_id=booking_conf.room_id,
                booking_date=confirmation.booking_date,
                start_time=booking_conf.start_time,
                end_time=booking_conf.end_time,
            )
            
            if not is_available:
                failed_bookings.append({
                    "activity": booking_conf.activity_name,
                    "error": f"Room {room.name} is no longer available for this time slot"
                })
                continue
            
            # Check if user has time conflict with bookings being created in this batch
            has_time_conflict = False
            for existing_start, existing_end in user_time_slots:
                # Check if times overlap
                if (booking_conf.start_time < existing_end and booking_conf.end_time > existing_start):
                    has_time_conflict = True
                    break
            
            if has_time_conflict:
                failed_bookings.append({
                    "activity": booking_conf.activity_name,
                    "error": "Time conflict with another activity in this batch"
                })
                continue
            
            # Check user availability in database (existing bookings)
            user_available = await crud_booking.check_user_availability(
                db=db,
                user_id=current_user.id,
                booking_date=confirmation.booking_date,
                start_time=booking_conf.start_time,
                end_time=booking_conf.end_time,
            )
            
            if not user_available:
                failed_bookings.append({
                    "activity": booking_conf.activity_name,
                    "error": "You have an existing booking at this time"
                })
                continue
            
            # Create booking
            booking_data = BookingCreate(
                room_id=booking_conf.room_id,
                booking_date=confirmation.booking_date,
                start_time=booking_conf.start_time,
                end_time=booking_conf.end_time,
                participant_ids=booking_conf.participant_ids or [],
            )
            
            new_booking = await crud_booking.create_booking(
                db=db,
                booking=booking_data,
                user_id=current_user.id,
                skip_organizer_availability_check=True,  # We already checked above
            )
            
            if new_booking:
                created_ids.append(new_booking.id)
                # Add this time slot to our tracking list
                user_time_slots.append((booking_conf.start_time, booking_conf.end_time))
            else:
                failed_bookings.append({
                    "activity": booking_conf.activity_name,
                    "error": "Failed to create booking - room or user may be unavailable"
                })

        except Exception as e:
            failed_bookings.append({
                "activity": booking_conf.activity_name,
                "error": str(e)
            })
    
    # No need to commit here - create_booking already commits each booking
    
    return BulkBookingResponse(
        created_bookings=created_ids,
        failed_bookings=failed_bookings,
        success_count=len(created_ids),
        failure_count=len(failed_bookings),
    )
