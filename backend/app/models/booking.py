"""
Booking model for database.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, Time, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# Association table for many-to-many relationship between bookings and participants
booking_participants = Table(
    'booking_participants',
    Base.metadata,
    Column('booking_id', Integer, ForeignKey('bookings.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
)


class Booking(Base):
    """
    Booking model representing room reservations.
    A booking can have multiple participants if room capacity > 1.
    """
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey('rooms.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)  # Main organizer
    
    # Date and time information
    booking_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Status: 'upcoming', 'completed', 'cancelled'
    status = Column(String(20), default='upcoming', nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    room = relationship("Room", back_populates="bookings")
    user = relationship("User", back_populates="bookings", foreign_keys=[user_id])
    participants = relationship(
        "User",
        secondary=booking_participants,
        back_populates="participant_bookings"
    )
    
    def __repr__(self) -> str:
        return f"<Booking(id={self.id}, room_id={self.room_id}, user_id={self.user_id}, date={self.booking_date})>"
