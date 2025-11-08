"""
Booking Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import date, time, datetime


# Base schema with common attributes
class BookingBase(BaseModel):
    """Base booking schema with common attributes."""
    room_id: int
    booking_date: date
    start_time: time
    end_time: time
    
    @field_validator('start_time', 'end_time')
    @classmethod
    def validate_time_range(cls, v):
        """Validate that times are within working hours (7:00 - 22:00)"""
        if v.hour < 7 or v.hour >= 22:
            raise ValueError('Time must be between 7:00 and 22:00')
        return v


# Schema for creating a new booking
class BookingCreate(BookingBase):
    """Schema for booking creation."""
    participant_ids: Optional[List[int]] = Field(default=[], description="List of user IDs to add as participants")
    
    @field_validator('participant_ids')
    @classmethod
    def validate_participants(cls, v):
        """Ensure no duplicate participant IDs"""
        if v and len(v) != len(set(v)):
            raise ValueError('Duplicate participant IDs are not allowed')
        return v


# Schema for updating booking
class BookingUpdate(BaseModel):
    """Schema for updating booking information."""
    booking_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[str] = Field(None, pattern='^(upcoming|completed|cancelled)$')
    participant_ids: Optional[List[int]] = None


# Schema for booking in database (with all fields)
class BookingInDB(BookingBase):
    """Schema representing booking as stored in database."""
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Schema for booking response with room and user details
class Booking(BookingInDB):
    """Schema for booking response."""
    pass


# Schema for booking with related data
class BookingWithDetails(Booking):
    """Schema for booking with room name and participants."""
    room_name: Optional[str] = None
    organizer_name: Optional[str] = None
    participant_ids: List[int] = []


# Schema for availability check
class AvailabilityCheck(BaseModel):
    """Schema for checking room availability."""
    room_id: int
    booking_date: date
    start_time: time
    end_time: time


# Schema for user's schedule response
class UserSchedule(BaseModel):
    """Schema for user's schedule."""
    user_id: int
    bookings: List[BookingWithDetails]
