"""
Event suggestion routes for managers using OpenAI.
"""
from datetime import datetime, date, timedelta
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from openai import OpenAI

from app.database import get_db
from app.models.user import User
from app.models.booking import Booking
from app.models.room import Room
from app.api.deps import get_current_user
from app.core.config import settings
from pydantic import BaseModel

router = APIRouter()


class BookingAnalysis(BaseModel):
    """Booking analysis data."""
    date: date
    total_bookings: int
    occupied_hours: List[int]
    available_hours: List[int]


class EventSuggestion(BaseModel):
    """Event suggestion from AI."""
    suggested_date: date
    suggested_time: str
    event_title: str
    event_description: str
    reasoning: str
    booking_analysis: List[BookingAnalysis]


def get_openai_client() -> OpenAI:
    """Get OpenAI client instance."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OpenAI API key not configured"
        )
    return OpenAI(api_key=settings.OPENAI_API_KEY)


async def analyze_bookings_next_7_days(db: AsyncSession) -> List[BookingAnalysis]:
    """
    Analyze bookings for the next 7 days.
    
    Returns:
        List of BookingAnalysis with booking statistics per day
    """
    today = date.today()
    end_date = today + timedelta(days=7)
    
    # Get all bookings for next 7 days
    result = await db.execute(
        select(Booking)
        .where(Booking.booking_date >= today)
        .where(Booking.booking_date <= end_date)
        .where(Booking.status == "upcoming")
    )
    bookings = result.scalars().all()
    
    # Analyze each day
    analysis = []
    for i in range(7):
        current_date = today + timedelta(days=i)
        day_bookings = [b for b in bookings if b.booking_date == current_date]
        
        # Get occupied hours
        occupied_hours = set()
        for booking in day_bookings:
            start_hour = booking.start_time.hour
            end_hour = booking.end_time.hour
            occupied_hours.update(range(start_hour, end_hour))
        
        # Working hours: 9 AM to 6 PM (9-18)
        working_hours = set(range(9, 18))
        available_hours = sorted(working_hours - occupied_hours)
        
        analysis.append(BookingAnalysis(
            date=current_date,
            total_bookings=len(day_bookings),
            occupied_hours=sorted(list(occupied_hours)),
            available_hours=available_hours
        ))
    
    return analysis


def generate_event_suggestion_with_ai(analysis: List[BookingAnalysis]) -> dict:
    """
    Use OpenAI to generate an event suggestion based on booking analysis.
    
    Args:
        analysis: List of booking analysis for next 7 days
    
    Returns:
        Dictionary with AI-generated event suggestion
    """
    # Filter out weekends (Saturday=5, Sunday=6) - we want work days only
    weekday_analysis = [day for day in analysis if day.date.weekday() < 5]
    
    # Find day with least bookings (excluding weekends)
    sorted_analysis = sorted(weekday_analysis, key=lambda x: x.total_bookings)
    best_day = sorted_analysis[0]
    
    print(f"📊 Analysis: {len(analysis)} total days, {len(weekday_analysis)} weekdays")
    print(f"🎯 Best weekday: {best_day.date.strftime('%A, %B %d')} with {best_day.total_bookings} bookings")
    
    # Try to use OpenAI, fallback to rule-based if fails
    try:
        client = get_openai_client()
        
        # Prepare context for AI
        context = f"""Ești un asistent AI super cool și miștocar care ajută managerii să organizeze evenimente recreative de echipă. 
Vorbești în română, ești prietenos și faci glume. Stilul tău e relaxat și amuzant, nu corporate boring! 😎

Analizează datele de booking pentru următoarele 7 zile:

"""
        for day_data in analysis:
            context += f"""
Data: {day_data.date.strftime('%A, %d %B %Y')}
Număr Bookings: {day_data.total_bookings}
Ore Ocupate: {day_data.occupied_hours if day_data.occupied_hours else 'Niciuna'}
Ore Libere: {day_data.available_hours if day_data.available_hours else 'Niciuna'}
"""
        
        context += f"""

Compania are o cameră specială numită "BeerPoint" - perfect pentru team building cu bere la draft și billiard! 🍺🎱

Pe baza acestor date, sugerează:
1. Cea mai tare zi pentru un eveniment recreativ (alege ziua cu cele mai puține bookings)
2. Cel mai fain interval orar (2-3 ore în orele libere, preferabil după-amiaza când lumea e mai relaxată)
3. Un titlu SUPER creative și catchy pentru eveniment (fă-l amuzant!)
4. O descriere detaliată a activității (2-3 propoziții, fii miștocar și entuziast!)
5. Explică de ce această zi și oră sunt perfecte (2-3 propoziții, adaugă niște glume subtile)

IMPORTANT: Răspunde DOAR cu JSON valid, folosind aceste chei exacte:
- suggested_date: data în format YYYY-MM-DD
- suggested_time: interval orar gen "14:00-16:00"
- event_title: titlu creative și amuzant
- event_description: descriere detaliată în română (2-3 propoziții, fii entuziast și miștocar)
- reasoning: de ce e cea mai bună alegere (2-3 propoziții, adaugă humor)
"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Ești un asistent AI super friendly și miștocar care ajută managerii să organizeze evenimente de echipă. Vorbești în română, faci glume și ai un stil relaxat. Răspunzi ÎNTOTDEAUNA în format JSON valid."
                },
                {
                    "role": "user",
                    "content": context
                }
            ],
            temperature=0.9,
            response_format={"type": "json_object"}
        )
        
        import json
        suggestion = json.loads(response.choices[0].message.content)
        print(f"✅ OpenAI SUCCESS! Generated suggestion: {suggestion}")
        return suggestion
        
    except Exception as e:
        # Log the error for debugging
        print(f"❌ OpenAI FAILED: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Fallback suggestion if OpenAI fails
        fallback = {
            "suggested_date": best_day.date.isoformat(),
            "suggested_time": f"{best_day.available_hours[0] if best_day.available_hours else 14}:00-{best_day.available_hours[0]+2 if best_day.available_hours else 16}:00",
            "event_title": "BeerPoint Team Social (Fallback)",
            "event_description": "Join us at the BeerPoint for an afternoon of team bonding, casual games, and refreshments. A perfect opportunity to unwind and connect with colleagues in a relaxed atmosphere.",
            "reasoning": f"This day has the fewest bookings ({best_day.total_bookings}) and the most available time slots, making it ideal for a team event without disrupting work schedules."
        }
        print(f"⚠️  Using FALLBACK suggestion: {fallback}")
        return fallback


@router.get("/suggest-event", response_model=EventSuggestion)
async def suggest_event(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Generate event suggestion for managers based on booking analysis.
    Only accessible by managers.
    
    Args:
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Event suggestion with AI-generated recommendations
    
    Raises:
        HTTPException: If user is not a manager
    """
    # Check if user is a manager
    if not current_user.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can access event suggestions"
        )
    
    # Analyze bookings for next 7 days
    analysis = await analyze_bookings_next_7_days(db)
    
    # Generate AI suggestion
    ai_suggestion = generate_event_suggestion_with_ai(analysis)
    
    # Combine results
    return EventSuggestion(
        suggested_date=ai_suggestion["suggested_date"],
        suggested_time=ai_suggestion["suggested_time"],
        event_title=ai_suggestion["event_title"],
        event_description=ai_suggestion["event_description"],
        reasoning=ai_suggestion["reasoning"],
        booking_analysis=analysis
    )
