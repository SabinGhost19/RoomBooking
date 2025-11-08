"""
Room Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict


# Base schema with common attributes
class RoomBase(BaseModel):
    """Base room schema with common attributes."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    capacity: int = Field(..., gt=0, description="Number of people the room can accommodate")
    price: float = Field(..., ge=0.0, description="Price per hour")
    amenities: Optional[List[str]] = None
    image: Optional[str] = Field(None, max_length=500)
    svg_id: Optional[str] = Field(None, max_length=50)
    coordinates: Optional[Dict[str, float]] = None  # {x: float, y: float}
    is_available: bool = True


# Schema for creating a new room
class RoomCreate(RoomBase):
    """Schema for room creation."""
    pass


# Schema for updating room
class RoomUpdate(BaseModel):
    """Schema for updating room information."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    capacity: Optional[int] = Field(None, gt=0)
    price: Optional[float] = Field(None, ge=0.0)
    amenities: Optional[List[str]] = None
    image: Optional[str] = Field(None, max_length=500)
    svg_id: Optional[str] = Field(None, max_length=50)
    coordinates: Optional[Dict[str, float]] = None
    is_available: Optional[bool] = None


# Schema for room in database (with all fields)
class RoomInDB(RoomBase):
    """Schema representing room as stored in database."""
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# Schema for room response with additional computed fields
class Room(RoomInDB):
    """Schema for room response."""
    pass
