"""
BookingInvitation model for database.
Tracks invitations sent to users for participating in bookings.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class BookingInvitation(Base):
    """
    BookingInvitation model representing invitations to participate in bookings.
    When a user creates a booking with participants, invitations are sent to those users.
    """
    __tablename__ = "booking_invitations"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    inviter_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)  # User who created booking
    invitee_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)  # User being invited
    
    # Status: 'pending', 'accepted', 'rejected'
    status = Column(String(20), default='pending', nullable=False, index=True)
    
    # Notification status
    is_read = Column(Boolean, default=False, nullable=False)
    
    # Response message (optional, if user wants to add a note when rejecting)
    response_message = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)  # When user accepted/rejected
    
    # Relationships
    booking = relationship("Booking", backref="invitations")
    inviter = relationship("User", foreign_keys=[inviter_id], backref="sent_invitations")
    invitee = relationship("User", foreign_keys=[invitee_id], backref="received_invitations")
    
    def __repr__(self) -> str:
        return f"<BookingInvitation(id={self.id}, booking_id={self.booking_id}, invitee_id={self.invitee_id}, status={self.status})>"
