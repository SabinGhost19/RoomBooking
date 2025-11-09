"""
API routes for booking invitations/notifications.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.booking import Booking, booking_participants
from app.schemas.booking_invitation import (
    BookingInvitation,
    BookingInvitationUpdate,
    BookingInvitationWithDetails,
    NotificationCount
)
from app.crud import booking_invitation as invitation_crud
from sqlalchemy import select, delete

router = APIRouter()


@router.get("/notifications", response_model=List[BookingInvitationWithDetails])
async def get_notifications(
    status: Optional[str] = None,
    is_read: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all notifications/invitations for current user.
    Optional filters: status (pending/accepted/rejected), is_read (true/false)
    """
    invitations = await invitation_crud.get_user_invitations_with_details(
        db, 
        user_id=current_user.id,
        status=status,
        is_read=is_read
    )
    return invitations


@router.get("/notifications/count", response_model=NotificationCount)
async def get_notification_count(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get count of unread and pending notifications.
    """
    unread_count = await invitation_crud.get_unread_count(db, current_user.id)
    pending_count = await invitation_crud.get_pending_count(db, current_user.id)
    
    return NotificationCount(
        unread_count=unread_count,
        pending_count=pending_count
    )


@router.post("/notifications/{invitation_id}/accept")
async def accept_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept a booking invitation.
    User becomes confirmed participant in the booking.
    """
    # Get invitation
    invitation = await invitation_crud.get_invitation(db, invitation_id)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Check if user is the invitee
    if invitation.invitee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to respond to this invitation"
        )
    
    # Check if already responded
    if invitation.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation already {invitation.status}"
        )
    
    # Update invitation status
    invitation_update = BookingInvitationUpdate(status='accepted')
    await invitation_crud.update_invitation(db, invitation_id, invitation_update)
    
    # Mark as read
    await invitation_crud.mark_invitation_as_read(db, invitation_id)
    
    return {"message": "Invitation accepted successfully", "invitation_id": invitation_id}


@router.post("/notifications/{invitation_id}/reject")
async def reject_invitation(
    invitation_id: int,
    response_message: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject a booking invitation.
    User will be removed from booking participants.
    """
    # Get invitation
    invitation = await invitation_crud.get_invitation(db, invitation_id)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Check if user is the invitee
    if invitation.invitee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to respond to this invitation"
        )
    
    # Check if already responded
    if invitation.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation already {invitation.status}"
        )
    
    # Update invitation status
    invitation_update = BookingInvitationUpdate(
        status='rejected',
        response_message=response_message
    )
    await invitation_crud.update_invitation(db, invitation_id, invitation_update)
    
    # Remove user from booking participants
    await db.execute(
        delete(booking_participants).where(
            booking_participants.c.booking_id == invitation.booking_id,
            booking_participants.c.user_id == current_user.id
        )
    )
    await db.commit()
    
    # Mark as read
    await invitation_crud.mark_invitation_as_read(db, invitation_id)
    
    return {"message": "Invitation rejected successfully", "invitation_id": invitation_id}


@router.post("/notifications/{invitation_id}/mark-read")
async def mark_notification_read(
    invitation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a notification as read.
    """
    invitation = await invitation_crud.get_invitation(db, invitation_id)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    if invitation.invitee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    await invitation_crud.mark_invitation_as_read(db, invitation_id)
    return {"message": "Notification marked as read"}


@router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark all notifications as read for current user.
    """
    count = await invitation_crud.mark_all_as_read(db, current_user.id)
    return {"message": f"Marked {count} notifications as read", "count": count}
