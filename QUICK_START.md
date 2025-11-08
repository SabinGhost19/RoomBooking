# 🚀 Quick Start Guide - Room Booking System

## Setup și Pornire Rapidă

### 1. Backend Setup

```bash
cd backend

# Rulează migrarea bazei de date
python migrate.py

# (Opțional) Populează cu date test
python seed_rooms.py

# Pornește serverul
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend va rula pe: **http://localhost:8000**
- API Docs: http://localhost:8000/api/v1/docs

### 2. Frontend Setup

```bash
cd sage-reserve

# Instalează dependențele (doar prima dată)
npm install

# Pornește aplicația
npm run dev
```

Frontend va rula pe: **http://localhost:5173** (sau alt port disponibil)

## Testare Rapidă

### 1. Creează un cont
- Mergi la http://localhost:5173/signup
- Înregistrează-te cu email și parolă

### 2. Browse Rooms
- După login, mergi la `/rooms`
- Vei vedea lista de săli disponibile (dacă ai rulat `seed_rooms.py`)

### 3. Rezervă o sală
- Click pe o sală
- Selectează data și intervalul orar
- Click "Confirm Booking"

### 4. Vezi rezervările tale
- Mergi la Profile sau My Bookings (în dezvoltare)

## Funcționalități Principale

✅ **Rooms Management**
- Lista săli cu filtrare (capacitate, preț, disponibilitate)
- Detalii complete pentru fiecare sală
- Amenități și caracteristici

✅ **Booking System**
- Rezervări cu interval orar 7:00-22:00
- Validare automată disponibilitate
- Suport multiple persoane (dacă capacitate > 1)
- Program pentru 3 săptămâni în avans

✅ **User Features**
- Autentificare securizată (JWT)
- Profil utilizator
- Istoric rezervări

✅ **Manager Features** (is_manager=true)
- CRUD complet pentru săli
- Gestionare capacități și prețuri

## Structură API

### Rooms Endpoints
```
GET    /api/v1/rooms              - Lista săli
GET    /api/v1/rooms/{id}         - Detalii sală
POST   /api/v1/rooms              - Creare sală (manager)
PUT    /api/v1/rooms/{id}         - Update sală (manager)
DELETE /api/v1/rooms/{id}         - Ștergere sală (manager)
```

### Bookings Endpoints
```
GET    /api/v1/bookings/my-bookings        - Rezervările mele
GET    /api/v1/bookings/room/{id}          - Rezervări sală
POST   /api/v1/bookings                    - Creare rezervare
POST   /api/v1/bookings/{id}/cancel        - Anulare rezervare
DELETE /api/v1/bookings/{id}               - Ștergere rezervare
```

## Troubleshooting

**Backend nu pornește:**
- Verifică că PostgreSQL rulează
- Verifică fișierul `.env` cu credentialele corecte

**Frontend nu se conectează:**
- Verifică că backend-ul rulează pe port 8000
- Verifică CORS settings în backend

**Erori la migrare:**
- Asigură-te că database-ul există
- Verifică connection string în `app/core/config.py`

## Pentru mai multe detalii

Vezi `IMPLEMENTATION_GUIDE.md` pentru documentație completă despre:
- Arhitectura sistemului
- Modele de date
- API endpoints
- Frontend components
- Advanced features

## Comenzi Utile

```bash
# Backend
cd backend
python migrate.py              # Migrare DB
python seed_rooms.py          # Populare date test
uvicorn app.main:app --reload # Start server

# Frontend
cd sage-reserve
npm run dev                   # Start dev server
npm run build                 # Build pentru production
npm run preview               # Preview production build
```

## Support

Pentru probleme sau întrebări, verifică:
1. Console logs (frontend)
2. Terminal logs (backend)
3. API documentation (http://localhost:8000/api/v1/docs)
