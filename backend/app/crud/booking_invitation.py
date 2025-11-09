"""
CRUD operations for booking invitations.
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import joinedload
from datetime import datetime

from app.models.booking_invitation import BookingInvitation
from app.models.booking import Booking
from app.models.room import Room
from app.models.user import User
from app.schemas.booking_invitation import BookingInvitationCreate, BookingInvitationUpdate


async def create_invitation(
    db: AsyncSession,
    invitation: BookingInvitationCreate
) -> BookingInvitation:
    """
    Create a new booking invitation.
    """
    db_invitation = BookingInvitation(
        booking_id=invitation.booking_id,
        inviter_id=invitation.inviter_id,
        invitee_id=invitation.invitee_id,
        status='pending'
    )
    db.add(db_invitation)
    await db.commit()
    await db.refresh(db_invitation)
    return db_invitation


async def get_invitation(
    db: AsyncSession,
    invitation_id: int
) -> Optional[BookingInvitation]:
    """
    Get invitation by ID.
    """
    result = await db.execute(
        select(BookingInvitation)
        .where(BookingInvitation.id == invitation_id)
    )
    return result.scalar_one_or_none()


async def get_user_invitations(
    db: AsyncSession,
    user_id: int,
    status: Optional[str] = None,
    is_read: Optional[bool] = None
) -> List[BookingInvitation]:
    """
    Get all invitations for a user with optional filters.
    """
    query = select(BookingInvitation).where(
        BookingInvitation.invitee_id == user_id
    )
    
    if status:
        query = query.where(BookingInvitation.status == status)
    
    if is_read is not None:
        query = query.where(BookingInvitation.is_read == is_read)
    
    query = query.order_by(BookingInvitation.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


async def get_user_invitations_with_details(
    db: AsyncSession,
    user_id: int,
    status: Optional[str] = None,
    is_read: Optional[bool] = None
) -> List[dict]:
    """
    Get all invitations for a user with booking and room details.
    """
    query = (
        select(
            BookingInvitation,
            User.full_name.label('inviter_name'),
            User.email.label('inviter_email'),
            Room.name.label('room_name'),
            Room.id.label('room_id'),
            Booking.booking_date,
            Booking.start_time,
            Booking.end_time
        )
        .join(Booking, BookingInvitation.booking_id == Booking.id)
        .join(User, BookingInvitation.inviter_id == User.id)
        .join(Room, Booking.room_id == Room.id)
        .where(BookingInvitation.invitee_id == user_id)
    )
    
    if status:
        query = query.where(BookingInvitation.status == status)
    
    if is_read is not None:
        query = query.where(BookingInvitation.is_read == is_read)
    
    query = query.order_by(BookingInvitation.created_at.desc())
    
    result = await db.execute(query)
    rows = result.all()
    
    invitations_with_details = []
    for row in rows:
        invitation_dict = {
            'id': row.BookingInvitation.id,
            'booking_id': row.BookingInvitation.booking_id,
            'inviter_id': row.BookingInvitation.inviter_id,
            'invitee_id': row.BookingInvitation.invitee_id,
            'status': row.BookingInvitation.status,
            'is_read': row.BookingInvitation.is_read,
            'response_message': row.BookingInvitation.response_message,
            'created_at': row.BookingInvitation.created_at,
            'updated_at': row.BookingInvitation.updated_at,
            'responded_at': row.BookingInvitation.responded_at,
            'inviter_name': row.inviter_name,
            'inviter_email': row.inviter_email,
            'room_name': row.room_name,
            'room_id': row.room_id,
            'booking_date': str(row.booking_date),
            'start_time': str(row.start_time),
            'end_time': str(row.end_time)
        }
        invitations_with_details.append(invitation_dict)
    
    return invitations_with_details


async def update_invitation(
    db: AsyncSession,
    invitation_id: int,
    invitation_update: BookingInvitationUpdate
) -> Optional[BookingInvitation]:
    """
    Update invitation status (accept/reject).
    """
    db_invitation = await get_invitation(db, invitation_id)
    if not db_invitation:
        return None
    
    db_invitation.status = invitation_update.status
    if invitation_update.response_message:
        db_invitation.response_message = invitation_update.response_message
    db_invitation.responded_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_invitation)
    return db_invitation


async def mark_invitation_as_read(
    db: AsyncSession,
    invitation_id: int
) -> Optional[BookingInvitation]:
    """
    Mark invitation as read.
    """
    db_invitation = await get_invitation(db, invitation_id)
    if not db_invitation:
        return None
    
    db_invitation.is_read = True
    await db.commit()
    await db.refresh(db_invitation)
    return db_invitation


async def mark_all_as_read(
    db: AsyncSession,
    user_id: int
) -> int:
    """
    Mark all user's invitations as read.
    Returns count of updated invitations.
    """
    result = await db.execute(
        select(BookingInvitation)
        .where(
            and_(
                BookingInvitation.invitee_id == user_id,
                BookingInvitation.is_read == False
            )
        )
    )
    invitations = result.scalars().all()
    
    for invitation in invitations:
        invitation.is_read = True
    
    await db.commit()
    return len(invitations)


async def get_unread_count(
    db: AsyncSession,
    user_id: int
) -> int:
    """
    Get count of unread invitations for a user.
    """
    result = await db.execute(
        select(func.count(BookingInvitation.id))
        .where(
            and_(
                BookingInvitation.invitee_id == user_id,
                BookingInvitation.is_read == False
            )
        )
    )
    return result.scalar() or 0


async def get_pending_count(
    db: AsyncSession,
    user_id: int
) -> int:
    """
    Get count of pending invitations for a user.
    """
    result = await db.execute(
        select(func.count(BookingInvitation.id))
        .where(
            and_(
                BookingInvitation.invitee_id == user_id,
                BookingInvitation.status == 'pending'
            )
        )
    )
    return result.scalar() or 0


async def delete_invitation(
    db: AsyncSession,
    invitation_id: int
) -> bool:
    """
    Delete an invitation.
    """
    db_invitation = await get_invitation(db, invitation_id)
    if not db_invitation:
        return False
    
    await db.delete(db_invitation)
    await db.commit()
    return True


async def get_booking_invitations(
    db: AsyncSession,
    booking_id: int
) -> List[BookingInvitation]:
    """
    Get all invitations for a specific booking.
    """
    result = await db.execute(
        select(BookingInvitation)
        .where(BookingInvitation.booking_id == booking_id)
        .order_by(BookingInvitation.created_at.desc())
    )
    return result.scalars().all()
