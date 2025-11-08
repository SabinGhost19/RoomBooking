"""
AI-powered event suggestion service using OpenAI.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Dict, Any, Optional
from datetime import date, time, datetime, timedelta
import json
from openai import AsyncOpenAI

from app.core.config import settings
from app.models.room import Room
from app.models.booking import Booking
from app.schemas.event_suggestion import (
    EventSuggestionRequest,
    ActivityRequest,
    EventSuggestionResponse,
    ActivitySuggestion,
    RoomSuggestion,
)
from app.crud.booking import check_room_availability


class EventSuggestionService:
    """Service for AI-powered room booking suggestions."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def get_available_rooms_for_slot(
        self,
        db: AsyncSession,
        booking_date: date,
        start_time: time,
        end_time: time,
    ) -> List[Room]:
        """
        Get all rooms available for a specific time slot.
        Only returns rooms that are:
        1. Marked as available (is_available = True)
        2. Not already booked for the requested time slot
        """
        # Get all rooms marked as available
        result = await db.execute(
            select(Room).where(Room.is_available == True)
        )
        all_rooms = result.scalars().all()
        
        # Filter by actual booking availability
        available_rooms = []
        for room in all_rooms:
            is_available = await check_room_availability(
                db=db,
                room_id=room.id,
                booking_date=booking_date,
                start_time=start_time,
                end_time=end_time,
            )
            if is_available:
                available_rooms.append(room)
        
        return available_rooms
    
    def _prepare_rooms_context(self, rooms: List[Room]) -> str:
        """Prepare room data for AI context."""
        rooms_info = []
        for room in rooms:
            room_info = {
                "id": room.id,
                "name": room.name,
                "description": room.description or "No description",
                "capacity": room.capacity,
                "amenities": room.amenities or [],
            }
            rooms_info.append(room_info)
        
        return json.dumps(rooms_info, indent=2)
    
    def _prepare_activity_context(self, activity: ActivityRequest) -> Dict[str, Any]:
        """Prepare activity data for AI context."""
        return {
            "name": activity.name,
            "start_time": activity.start_time.strftime("%H:%M"),
            "end_time": activity.end_time.strftime("%H:%M"),
            "participants_count": activity.participants_count,
            "required_amenities": activity.required_amenities or [],
            "preferences": activity.preferences or "None specified",
        }
    
    async def _get_ai_room_suggestion(
        self,
        activity: ActivityRequest,
        available_rooms: List[Room],
        general_preferences: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Use OpenAI to suggest the best room for an activity."""
        
        if not available_rooms:
            return {
                "suggested_room_id": None,
                "alternatives": [],
                "reasoning": "No rooms available for this time slot.",
                "confidence": 0.0,
            }
        
        rooms_context = self._prepare_rooms_context(available_rooms)
        activity_context = self._prepare_activity_context(activity)
        
        system_prompt = """You are an intelligent room booking assistant. Your task is to analyze activities and suggest the most appropriate meeting rooms based on:
1. Capacity requirements (room must fit all participants)
2. Required amenities/equipment
3. Activity type and characteristics
4. User preferences
5. Overall suitability

IMPORTANT: All rooms provided to you are ALREADY VERIFIED as available for the requested time slot. 
You only need to select the BEST room based on the activity requirements and characteristics.

You must respond with valid JSON only, following this exact structure:
{
    "suggested_room_id": <number>,
    "confidence_score": <number between 0 and 1>,
    "reasoning": "<explanation why this room is best>",
    "alternative_room_ids": [<array of room IDs as alternatives>]
}"""

        user_prompt = f"""Given the following activity and available rooms, suggest the best room.

ACTIVITY DETAILS:
{json.dumps(activity_context, indent=2)}

GENERAL PREFERENCES: {general_preferences or "None"}

AVAILABLE ROOMS (All verified as available for the time slot):
{rooms_context}

Analyze and suggest the best room. Consider:
- Room capacity must be >= participants count (if specified)
- Required amenities must be present
- Activity type matches room characteristics
- Overall room suitability

Note: All rooms listed are confirmed available for booking at the requested time.
Respond with JSON only."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=500,
                response_format={"type": "json_object"},
            )
            
            ai_response = json.loads(response.choices[0].message.content)
            return ai_response
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            # Fallback to simple logic
            return self._fallback_room_selection(activity, available_rooms)
    
    def _fallback_room_selection(
        self,
        activity: ActivityRequest,
        available_rooms: List[Room],
    ) -> Dict[str, Any]:
        """Fallback logic if AI fails."""
        # Filter by capacity if specified
        suitable_rooms = available_rooms
        if activity.participants_count:
            suitable_rooms = [r for r in available_rooms if r.capacity >= activity.participants_count]
        
        if not suitable_rooms:
            suitable_rooms = available_rooms
        
        # Filter by required amenities
        if activity.required_amenities:
            filtered = []
            for room in suitable_rooms:
                room_amenities = room.amenities or []
                if all(amenity in room_amenities for amenity in activity.required_amenities):
                    filtered.append(room)
            if filtered:
                suitable_rooms = filtered
        
        # Sort by capacity (closest match first)
        suitable_rooms.sort(key=lambda r: r.capacity)
        
        best_room = suitable_rooms[0] if suitable_rooms else available_rooms[0]
        alternatives = [r.id for r in suitable_rooms[1:4]]  # Top 3 alternatives
        
        return {
            "suggested_room_id": best_room.id,
            "confidence_score": 0.7,
            "reasoning": "Selected based on capacity and amenities match.",
            "alternative_room_ids": alternatives,
        }
    
    def _create_room_suggestion(
        self,
        room: Room,
        confidence: float,
        reasoning: str,
    ) -> RoomSuggestion:
        """Create a RoomSuggestion object."""
        return RoomSuggestion(
            room_id=room.id,
            room_name=room.name,
            capacity=room.capacity,
            amenities=room.amenities or [],
            confidence_score=confidence,
            reasoning=reasoning,
        )
    
    async def generate_suggestions(
        self,
        db: AsyncSession,
        request: EventSuggestionRequest,
    ) -> EventSuggestionResponse:
        """Generate AI-powered room suggestions for all activities."""
        
        suggestions = []
        warnings = []
        
        for activity in request.activities:
            # Get available rooms for this time slot
            available_rooms = await self.get_available_rooms_for_slot(
                db=db,
                booking_date=request.booking_date,
                start_time=activity.start_time,
                end_time=activity.end_time,
            )
            
            if not available_rooms:
                warnings.append(
                    f"No available rooms for '{activity.name}' on {request.booking_date} "
                    f"between {activity.start_time.strftime('%H:%M')}-{activity.end_time.strftime('%H:%M')}. "
                    f"All rooms are either booked or unavailable for this time slot."
                )
                continue
            
            # Get AI suggestion
            ai_result = await self._get_ai_room_suggestion(
                activity=activity,
                available_rooms=available_rooms,
                general_preferences=request.general_preferences,
            )
            
            if not ai_result.get("suggested_room_id"):
                warnings.append(f"Could not find suitable room for '{activity.name}'")
                continue
            
            # Create room suggestion objects
            suggested_room_obj = next(
                (r for r in available_rooms if r.id == ai_result["suggested_room_id"]),
                None
            )
            
            if not suggested_room_obj:
                continue
            
            suggested_room = self._create_room_suggestion(
                room=suggested_room_obj,
                confidence=ai_result.get("confidence_score", 0.8),
                reasoning=ai_result.get("reasoning", "Suggested by AI"),
            )
            
            # Get alternatives
            alternative_rooms = []
            for alt_id in ai_result.get("alternative_room_ids", [])[:3]:
                alt_room = next((r for r in available_rooms if r.id == alt_id), None)
                if alt_room:
                    alternative_rooms.append(
                        self._create_room_suggestion(
                            room=alt_room,
                            confidence=ai_result.get("confidence_score", 0.7) - 0.1,
                            reasoning="Alternative option",
                        )
                    )
            
            # Create activity suggestion
            activity_suggestion = ActivitySuggestion(
                activity_name=activity.name,
                start_time=activity.start_time,
                end_time=activity.end_time,
                suggested_room=suggested_room,
                alternative_rooms=alternative_rooms,
                participants_count=activity.participants_count,
            )
            
            suggestions.append(activity_suggestion)
        
        overall_notes = None
        if warnings:
            overall_notes = " | ".join(warnings)
        
        return EventSuggestionResponse(
            booking_date=request.booking_date,
            suggestions=suggestions,
            overall_notes=overall_notes,
        )


# Singleton instance
event_suggestion_service = EventSuggestionService()
