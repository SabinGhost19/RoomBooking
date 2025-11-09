"""
CRUD operations for Booking model.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, insert, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import date, time, datetime, timedelta
from app.models.booking import Booking, booking_participants
from app.models.room import Room
from app.models.user import User
from app.models.booking_invitation import BookingInvitation
from app.schemas.booking import BookingCreate, BookingUpdate
from app.schemas.booking_invitation import BookingInvitationCreate


async def get_booking(db: AsyncSession, booking_id: int) -> Optional[Booking]:
    """
    Get booking by ID with loaded relationships.
    """
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.room), selectinload(Booking.user), selectinload(Booking.participants))
        .where(Booking.id == booking_id)
    )
    return result.scalar_one_or_none()


async def get_bookings_by_user(
    db: AsyncSession,
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None
) -> List[Booking]:
    """
    Get all bookings for a user (as organizer or participant).
    """
    # Get bookings where user is organizer
    query_organizer = select(Booking).options(
        selectinload(Booking.room),
        selectinload(Booking.participants)
    ).where(Booking.user_id == user_id)
    
    # Get bookings where user is participant
    query_participant = select(Booking).options(
        selectinload(Booking.room),
        selectinload(Booking.user),
        selectinload(Booking.participants)
    ).join(booking_participants).where(booking_participants.c.user_id == user_id)
    
    # Apply date filters
    filters = []
    if start_date:
        filters.append(Booking.booking_date >= start_date)
    if end_date:
        filters.append(Booking.booking_date <= end_date)
    if status:
        filters.append(Booking.status == status)
    
    if filters:
        query_organizer = query_organizer.where(and_(*filters))
        query_participant = query_participant.where(and_(*filters))
    
    # Execute both queries
    result_organizer = await db.execute(query_organizer)
    result_participant = await db.execute(query_participant)
    
    bookings_organizer = result_organizer.scalars().all()
    bookings_participant = result_participant.scalars().all()
    
    # Combine and deduplicate
    all_bookings = {b.id: b for b in bookings_organizer}
    for b in bookings_participant:
        if b.id not in all_bookings:
            all_bookings[b.id] = b
    
    return sorted(all_bookings.values(), key=lambda x: (x.booking_date, x.start_time))


async def get_bookings_by_room(
    db: AsyncSession,
    room_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None
) -> List[Booking]:
    """
    Get all bookings for a room.
    """
    query = select(Booking).options(
        selectinload(Booking.user),
        selectinload(Booking.participants)
    ).where(Booking.room_id == room_id)
    
    filters = []
    if start_date:
        filters.append(Booking.booking_date >= start_date)
    if end_date:
        filters.append(Booking.booking_date <= end_date)
    if status:
        filters.append(Booking.status == status)
    
    if filters:
        query = query.where(and_(*filters))
    
    query = query.order_by(Booking.booking_date, Booking.start_time)
    
    result = await db.execute(query)
    return result.scalars().all()


async def check_room_availability(
    db: AsyncSession,
    room_id: int,
    booking_date: date,
    start_time: time,
    end_time: time,
    exclude_booking_id: Optional[int] = None
) -> bool:
    """
    Check if a room is available for the given time slot.
    Returns True if available, False if there's a conflict.
    """
    query = select(Booking).where(
        and_(
            Booking.room_id == room_id,
            Booking.booking_date == booking_date,
            Booking.status == 'upcoming',
            or_(
                # New booking starts during existing booking
                and_(Booking.start_time <= start_time, Booking.end_time > start_time),
                # New booking ends during existing booking
                and_(Booking.start_time < end_time, Booking.end_time >= end_time),
                # New booking completely contains existing booking
                and_(Booking.start_time >= start_time, Booking.end_time <= end_time)
            )
        )
    )
    
    if exclude_booking_id:
        query = query.where(Booking.id != exclude_booking_id)
    
    result = await db.execute(query)
    conflicting_bookings = result.scalars().all()
    
    return len(conflicting_bookings) == 0


async def check_user_availability(
    db: AsyncSession,
    user_id: int,
    booking_date: date,
    start_time: time,
    end_time: time,
    exclude_booking_id: Optional[int] = None
) -> bool:
    """
    Check if a user is available for the given time slot (not in another booking).
    """
    # Check as organizer
    query_organizer = select(Booking).where(
        and_(
            Booking.user_id == user_id,
            Booking.booking_date == booking_date,
            Booking.status == 'upcoming',
            or_(
                and_(Booking.start_time <= start_time, Booking.end_time > start_time),
                and_(Booking.start_time < end_time, Booking.end_time >= end_time),
                and_(Booking.start_time >= start_time, Booking.end_time <= end_time)
            )
        )
    )
    
    # Check as participant
    query_participant = select(Booking).join(booking_participants).where(
        and_(
            booking_participants.c.user_id == user_id,
            Booking.booking_date == booking_date,
            Booking.status == 'upcoming',
            or_(
                and_(Booking.start_time <= start_time, Booking.end_time > start_time),
                and_(Booking.start_time < end_time, Booking.end_time >= end_time),
                and_(Booking.start_time >= start_time, Booking.end_time <= end_time)
            )
        )
    )
    
    if exclude_booking_id:
        query_organizer = query_organizer.where(Booking.id != exclude_booking_id)
        query_participant = query_participant.where(Booking.id != exclude_booking_id)
    
    result_organizer = await db.execute(query_organizer)
    result_participant = await db.execute(query_participant)
    
    conflicts = len(result_organizer.scalars().all()) + len(result_participant.scalars().all())
    
    return conflicts == 0


async def create_booking(
    db: AsyncSession,
    booking: BookingCreate,
    user_id: int,
    skip_organizer_availability_check: bool = False
) -> Optional[Booking]:
    """
    Create a new booking with participants.
    
    Args:
        db: Database session
        booking: Booking data
        user_id: ID of the user creating the booking (organizer)
        skip_organizer_availability_check: If True, skips checking if organizer is available
                                          (useful for bulk operations where we check manually)
    """
    print(f"🔍 Creating booking for user {user_id}")
    print(f"   Room: {booking.room_id}, Date: {booking.booking_date}")
    print(f"   Time: {booking.start_time} - {booking.end_time}")
    print(f"   Participants: {booking.participant_ids}")
    
    # Check room availability
    room_available = await check_room_availability(
        db, booking.room_id, booking.booking_date, booking.start_time, booking.end_time
    )
    print(f"   ✓ Room available: {room_available}")
    if not room_available:
        print("   ❌ Room not available!")
        return None
    
    # Check organizer availability (unless skipped for bulk operations)
    if not skip_organizer_availability_check:
        organizer_available = await check_user_availability(
            db, user_id, booking.booking_date, booking.start_time, booking.end_time
        )
        print(f"   ✓ Organizer available: {organizer_available}")
        if not organizer_available:
            print("   ❌ Organizer not available!")
            return None
    else:
        print(f"   ⏭️  Organizer availability check skipped (bulk operation)")
    
    # Get room to check capacity
    room_result = await db.execute(select(Room).where(Room.id == booking.room_id))
    room = room_result.scalar_one_or_none()
    if not room:
        print("   ❌ Room not found!")
        return None
    
    # Check if number of participants exceeds room capacity
    total_people = 1 + len(booking.participant_ids)  # Organizer + participants
    print(f"   ✓ Capacity check: {total_people}/{room.capacity}")
    if total_people > room.capacity:
        print("   ❌ Capacity exceeded!")
        return None
    
    # Check participants availability
    if booking.participant_ids:
        for participant_id in booking.participant_ids:
            participant_available = await check_user_availability(
                db, participant_id, booking.booking_date, booking.start_time, booking.end_time
            )
            print(f"   ✓ Participant {participant_id} available: {participant_available}")
            if not participant_available:
                print(f"   ❌ Participant {participant_id} not available!")
                return None
    
    print("   ✅ All checks passed, creating booking...")
    
    # Create booking
    db_booking = Booking(
        room_id=booking.room_id,
        user_id=user_id,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status='upcoming'
    )
    db.add(db_booking)
    await db.flush()  # To get the booking ID
    
    # Add participants and create invitations
    if booking.participant_ids:
        for participant_id in booking.participant_ids:
            # Add participant to booking_participants table directly
            await db.execute(
                booking_participants.insert().values(
                    booking_id=db_booking.id,
                    user_id=participant_id
                )
            )
            
            # Create invitation for this participant
            db_invitation = BookingInvitation(
                booking_id=db_booking.id,
                inviter_id=user_id,
                invitee_id=participant_id,
                status='pending',
                is_read=False
            )
            db.add(db_invitation)
            print(f"   📧 Created invitation for participant {participant_id}")
    
    await db.commit()
    await db.refresh(db_booking)
    
    # Load relationships
    await db.refresh(db_booking, ['room', 'user', 'participants'])
    
    return db_booking


async def update_booking(
    db: AsyncSession,
    booking_id: int,
    booking_update: BookingUpdate,
    user_id: int
) -> Optional[Booking]:
    """
    Update an existing booking.
    """
    db_booking = await get_booking(db, booking_id)
    if not db_booking or db_booking.user_id != user_id:
        return None
    
    update_data = booking_update.model_dump(exclude_unset=True)
    
    # If updating time/date, check availability
    new_date = update_data.get('booking_date', db_booking.booking_date)
    new_start = update_data.get('start_time', db_booking.start_time)
    new_end = update_data.get('end_time', db_booking.end_time)
    
    if (new_date != db_booking.booking_date or 
        new_start != db_booking.start_time or 
        new_end != db_booking.end_time):
        
        if not await check_room_availability(
            db, db_booking.room_id, new_date, new_start, new_end, exclude_booking_id=booking_id
        ):
            return None
    
    # Handle participant updates
    if 'participant_ids' in update_data:
        new_participant_ids = update_data.pop('participant_ids')
        
        # Get room capacity
        room_result = await db.execute(select(Room).where(Room.id == db_booking.room_id))
        room = room_result.scalar_one_or_none()
        
        total_people = 1 + len(new_participant_ids)
        if room and total_people > room.capacity:
            return None
        
        # Clear existing participants
        db_booking.participants.clear()
        
        # Add new participants
        for participant_id in new_participant_ids:
            if not await check_user_availability(
                db, participant_id, new_date, new_start, new_end, exclude_booking_id=booking_id
            ):
                return None
            
            participant_result = await db.execute(select(User).where(User.id == participant_id))
            participant = participant_result.scalar_one_or_none()
            if participant:
                db_booking.participants.append(participant)
    
    # Update other fields
    for field, value in update_data.items():
        setattr(db_booking, field, value)
    
    await db.commit()
    await db.refresh(db_booking)
    
    return db_booking


async def cancel_booking(db: AsyncSession, booking_id: int, user_id: int) -> bool:
    """
    Cancel a booking.
    """
    db_booking = await get_booking(db, booking_id)
    if not db_booking or db_booking.user_id != user_id:
        return False
    
    db_booking.status = 'cancelled'
    await db.commit()
    return True


async def delete_booking(db: AsyncSession, booking_id: int, user_id: int) -> bool:
    """
    Delete a booking.
    """
    db_booking = await get_booking(db, booking_id)
    if not db_booking or db_booking.user_id != user_id:
        return False
    
    await db.delete(db_booking)
    await db.commit()
    return True


async def get_pending_bookings_for_manager(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100
) -> List[Booking]:
    """
    Get all pending bookings that need manager approval.
    """
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.user))  # Eager load user relationship
        .options(selectinload(Booking.participants))  # Eager load participants
        .where(Booking.approval_status == 'pending')
        .order_by(Booking.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def approve_booking(
    db: AsyncSession,
    booking_id: int,
    manager_id: int
) -> Optional[Booking]:
    """
    Approve a pending booking.
    """
    from datetime import datetime
    
    db_booking = await get_booking(db, booking_id)
    if not db_booking or db_booking.approval_status != 'pending':
        return None
    
    db_booking.approval_status = 'approved'
    db_booking.approved_by_id = manager_id
    db_booking.approved_at = datetime.now()
    
    await db.commit()
    await db.refresh(db_booking)
    
    print(f"✅ Booking {booking_id} approved by manager {manager_id}")
    return db_booking


async def reject_booking(
    db: AsyncSession,
    booking_id: int,
    manager_id: int,
    reason: Optional[str] = None
) -> Optional[Booking]:
    """
    Reject a pending booking.
    """
    from datetime import datetime
    
    db_booking = await get_booking(db, booking_id)
    if not db_booking or db_booking.approval_status != 'pending':
        return None
    
    db_booking.approval_status = 'rejected'
    db_booking.approved_by_id = manager_id
    db_booking.approved_at = datetime.now()
    db_booking.rejection_reason = reason
    
    await db.commit()
    await db.refresh(db_booking)
    
    print(f"❌ Booking {booking_id} rejected by manager {manager_id}")
    return db_booking


async def get_pending_bookings_count(db: AsyncSession) -> int:
    """
    Get count of pending bookings.
    """
    result = await db.execute(
        select(func.count(Booking.id))
        .where(Booking.approval_status == 'pending')
    )
    return result.scalar() or 0
