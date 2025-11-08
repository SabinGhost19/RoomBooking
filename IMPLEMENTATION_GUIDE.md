# Room Booking System - Implementation Guide

## Overview
Sistem complet de rezervare de săli cu funcționalități avansate:
- Gestionarea sălilor (rooms) cu capacitate, preț, amenități
- Rezervări cu interval orar 7:00-22:00
- Suport pentru multiple persoane în aceeași rezervare
- Vizualizare program pentru 3 săptămâni în avans
- Filtrare și sortare săli
- Anulare rezervări

## Backend Changes

### 1. Modele (Models)

#### User Model (`backend/app/models/user.py`)
- **Schimbat**: `is_superuser` → `is_manager`
- **Adăugat**: Relații către bookings și participant_bookings

#### Room Model (`backend/app/models/room.py`) - NOU
```python
- id: int
- name: str (unique)
- description: str
- capacity: int
- price: float
- amenities: JSON (list)
- image: str (URL)
- svg_id: str
- coordinates: JSON {x, y}
- is_available: bool
```

#### Booking Model (`backend/app/models/booking.py`) - NOU
```python
- id: int
- room_id: int (FK)
- user_id: int (FK - organizer)
- booking_date: date
- start_time: time
- end_time: time
- status: str (upcoming/completed/cancelled)
- participants: Many-to-Many relationship cu User
```

#### Association Table (`booking_participants`)
- TabelăMany-to-Many pentru participanți în rezervări

### 2. Schemas (Pydantic)

#### Room Schemas (`backend/app/schemas/room.py`) - NOU
- `RoomBase`, `RoomCreate`, `RoomUpdate`, `RoomInDB`, `Room`

#### Booking Schemas (`backend/app/schemas/booking.py`) - NOU
- `BookingBase`, `BookingCreate`, `BookingUpdate`, `BookingInDB`
- `BookingWithDetails`, `AvailabilityCheck`, `UserSchedule`
- Validare: timpul trebuie să fie între 7:00 și 22:00

#### User Schemas (`backend/app/schemas/user.py`)
- **Schimbat**: `is_superuser` → `is_manager`

### 3. CRUD Operations

#### Room CRUD (`backend/app/crud/room.py`) - NOU
- `get_room()`, `get_room_by_name()`
- `get_rooms()` - cu filtre: search, capacity, price, availability
- `create_room()`, `update_room()`, `delete_room()`
- `count_rooms()` - pentru paginare

#### Booking CRUD (`backend/app/crud/booking.py`) - NOU
- `get_booking()`, `get_bookings_by_user()`, `get_bookings_by_room()`
- `check_room_availability()` - verifică conflicte
- `check_user_availability()` - verifică dacă userul e liber
- `create_booking()` - cu validare capacitate și disponibilitate
- `update_booking()`, `cancel_booking()`, `delete_booking()`

### 4. API Routes

#### Rooms Routes (`backend/app/api/routes/rooms.py`) - NOU
```
GET    /api/v1/rooms              - Lista săli (cu filtre)
GET    /api/v1/rooms/count        - Număr total săli
GET    /api/v1/rooms/{id}         - Detalii sală
POST   /api/v1/rooms              - Creare sală (manager only)
PUT    /api/v1/rooms/{id}         - Update sală (manager only)
DELETE /api/v1/rooms/{id}         - Ștergere sală (manager only)
```

#### Bookings Routes (`backend/app/api/routes/bookings.py`) - NOU
```
GET    /api/v1/bookings/my-bookings        - Rezervările mele
GET    /api/v1/bookings/my-schedule        - Programul meu
GET    /api/v1/bookings/room/{id}          - Rezervări pentru o sală
POST   /api/v1/bookings/check-availability - Verifică disponibilitate
GET    /api/v1/bookings/{id}               - Detalii rezervare
POST   /api/v1/bookings                    - Creare rezervare
PUT    /api/v1/bookings/{id}               - Update rezervare
POST   /api/v1/bookings/{id}/cancel        - Anulare rezervare
DELETE /api/v1/bookings/{id}               - Ștergere rezervare
```

### 5. Dependencies

#### Updated `backend/app/api/deps.py`
- **Schimbat**: `get_current_superuser()` → `get_current_manager()`
- Verifică `user.is_manager` în loc de `user.is_superuser`

## Frontend Changes

### 1. API Client

#### New API File (`sage-reserve/src/lib/roomsApi.ts`)
Toate funcțiile pentru interacțiune cu backend:
- Room functions: `getRooms()`, `getRoom()`, `createRoom()`, etc.
- Booking functions: `createBooking()`, `getMyBookings()`, `cancelBooking()`, etc.
- TypeScript interfaces pentru Room, Booking, etc.

### 2. Pages

#### Updated `sage-reserve/src/pages/Rooms.tsx`
- **Schimbat**: Folosește API real în loc de mockData
- **Adăugat**: Loading state, error handling
- **Adăugat**: useEffect pentru fetch rooms
- Filtre live cu debounce implicit

#### New `sage-reserve/src/pages/RoomDetails.tsx`
Pagină completă pentru detalii sală și rezervări:
- Afișează detalii complete despre sală
- Calendar pentru selectare dată
- Time slots (7:00-22:00) cu validare disponibilitate
- Vizualizare program sală pentru ziua selectată
- Form de rezervare cu validare
- Suport pentru adăugare participanți (dacă capacity > 1)

### 3. Components

#### Updated `sage-reserve/src/components/RoomCard.tsx`
- **Schimbat**: Import Room din `roomsApi.ts`
- **Schimbat**: `room.available` → `room.is_available`
- **Schimbat**: Link către `/rooms/{id}` pentru detalii
- Fallback pentru imagine și description

#### Updated `sage-reserve/src/App.tsx`
- **Adăugat**: Route pentru `/rooms/:roomId` → RoomDetails

## Database Migration

### Run Migration
```bash
cd backend
python migrate.py
```

Acest script:
1. Drop toate tabelele existente
2. Creează toate tabelele noi (users, rooms, bookings, booking_participants)

## Setup Instructions

### Backend Setup

1. **Activate virtual environment** (dacă există):
```bash
cd backend
source venv/bin/activate  # Linux/Mac
# sau
venv\Scripts\activate  # Windows
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Run migration**:
```bash
python migrate.py
```

4. **Start backend**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. **Install dependencies**:
```bash
cd sage-reserve
npm install
```

2. **Start frontend**:
```bash
npm run dev
```

## Testing the System

### 1. Create Test Users
- Signup ca user normal
- Signup ca manager (setează `is_manager=true` direct în DB)

### 2. Create Test Rooms (as Manager)
```bash
curl -X POST http://localhost:8000/api/v1/rooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conference Room A",
    "description": "Large conference room with projector",
    "capacity": 12,
    "price": 50.0,
    "amenities": ["Projector", "Whiteboard", "WiFi"],
    "image": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    "is_available": true
  }'
```

### 3. Test Booking Flow
1. Browse rooms la `/rooms`
2. Click pe o sală pentru detalii
3. Selectează dată și timp
4. Creează rezervare
5. Vezi programul în My Bookings

## Key Features Implemented

### ✅ Room Management
- CRUD complet pentru săli
- Filtrare după: nume, capacitate, preț, disponibilitate
- Sortare după: nume, capacitate, preț
- Paginare

### ✅ Booking System
- Interval orar: 7:00 - 22:00
- Validare conflicte automat
- Multiple persoane în aceeași rezervare (până la capacitate)
- Program pentru 3 săptămâni în avans
- Status: upcoming, completed, cancelled

### ✅ User Experience
- Loading states
- Error handling cu toast notifications
- Responsive design
- Validare client-side și server-side

### ✅ Security
- Protected routes
- Manager-only endpoints pentru CRUD rooms
- User poate modifica doar propriile rezervări
- Validare disponibilitate înainte de booking

## Database Schema

```
users
├── id (PK)
├── email (unique)
├── username (unique)
├── hashed_password
├── full_name
├── is_active
├── is_manager  ← CHANGED
├── created_at
└── updated_at

rooms
├── id (PK)
├── name (unique)
├── description
├── capacity
├── price
├── amenities (JSON)
├── image
├── svg_id
├── coordinates (JSON)
└── is_available

bookings
├── id (PK)
├── room_id (FK → rooms)
├── user_id (FK → users)
├── booking_date
├── start_time
├── end_time
├── status
├── created_at
└── updated_at

booking_participants (Many-to-Many)
├── booking_id (FK → bookings)
└── user_id (FK → users)
```

## Next Steps / Future Enhancements

1. **User Management UI for Participants**
   - Fetch and display list of users
   - Multi-select pentru adăugare participanți

2. **Calendar View**
   - Week/Month view pentru toate rezervările
   - Drag-and-drop pentru modificare rezervări

3. **Notifications**
   - Email notifications pentru rezervări
   - Reminder înainte de booking

4. **Reports**
   - Room usage statistics
   - Most popular rooms
   - User booking history

5. **Advanced Features**
   - Recurring bookings
   - Booking approval workflow
   - Room equipment management

## Troubleshooting

### Backend Issues

**Error: "Could not connect to database"**
- Verifică că PostgreSQL rulează
- Verifică credentials în `.env`

**Error: "Table already exists"**
- Rulează migration script din nou cu drop tables

### Frontend Issues

**Error: "Failed to fetch rooms"**
- Verifică că backend-ul rulează
- Verifică CORS settings
- Verifică authentication token

**Calendar nu se încarcă**
- Verifică că librăria `react-day-picker` e instalată
- Verifică import-urile în component

## API Documentation

Backend-ul are documentație automată Swagger:
- Docs: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc
