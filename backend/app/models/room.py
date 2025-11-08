"""
Room model for database.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Room(Base):
    """
    Room model representing meeting rooms/spaces in the system.
    """
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    capacity = Column(Integer, nullable=False)  # Number of people the room can accommodate
    price = Column(Float, nullable=False, default=0.0)  # Price per hour
    amenities = Column(JSON, nullable=True)  # List of amenities (stored as JSON array)
    image = Column(String(500), nullable=True)  # URL to room image
    svg_id = Column(String(50), nullable=True)  # ID in SVG floor plan
    coordinates = Column(JSON, nullable=True)  # {x: number, y: number} for positioning
    is_available = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    bookings = relationship("Booking", back_populates="room", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Room(id={self.id}, name={self.name}, capacity={self.capacity})>"
