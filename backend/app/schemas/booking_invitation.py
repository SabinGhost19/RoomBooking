"""
BookingInvitation Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


# Base schema
class BookingInvitationBase(BaseModel):
    """Base invitation schema."""
    booking_id: int
    invitee_id: int


# Schema for creating invitation (internal use, not exposed to users)
class BookingInvitationCreate(BookingInvitationBase):
    """Schema for creating invitation."""
    inviter_id: int


# Schema for updating invitation status
class BookingInvitationUpdate(BaseModel):
    """Schema for responding to invitation."""
    status: str = Field(..., pattern='^(accepted|rejected)$')
    response_message: Optional[str] = Field(None, max_length=500)


# Schema for invitation in database
class BookingInvitationInDB(BookingInvitationBase):
    """Schema representing invitation as stored in database."""
    id: int
    inviter_id: int
    status: str
    is_read: bool
    response_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    responded_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


# Schema for invitation response with details
class BookingInvitation(BookingInvitationInDB):
    """Schema for invitation response."""
    pass


# Schema for invitation with full details (for notifications)
class BookingInvitationWithDetails(BookingInvitation):
    """Schema for invitation with booking and user details."""
    inviter_name: Optional[str] = None
    inviter_email: Optional[str] = None
    room_name: Optional[str] = None
    room_id: Optional[int] = None
    booking_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


# Schema for notification count response
class NotificationCount(BaseModel):
    """Schema for unread notification count."""
    unread_count: int
    pending_count: int
