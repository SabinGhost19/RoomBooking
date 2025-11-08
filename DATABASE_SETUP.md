# Database Setup Guide

Acest ghid explică cum să configurezi și să populezi baza de date PostgreSQL pentru aplicația de booking camere.

## Prerequisite

- Docker și Docker Compose instalate
- Python 3.8+ (pentru scripturile de migrare)
- Git (pentru clonarea repository-ului)

## 📋 Structura Bazei de Date

Aplicația folosește următoarele tabele:

- **users** - Utilizatori ai aplicației (cu rol de user sau manager)
- **rooms** - Camerele disponibile pentru rezervare
- **bookings** - Rezervările efectuate
- **booking_participants** - Tabel de legătură pentru participanții la rezervări

---

## 🚀 Setup Complet - Pas cu Pas

### 1. Pornire PostgreSQL cu Docker

PostgreSQL rulează într-un container Docker. Pentru a-l porni:

```bash
# Din directorul root al proiectului
cd /path/to/SMARTHACK

# Pornește containerul PostgreSQL
docker-compose up -d postgres
```

**Verifică că PostgreSQL rulează:**

```bash
docker ps
```

Ar trebui să vezi un container numit `roombooking_postgres` în status `Up`.

**Verifică conexiunea:**

```bash
docker exec -it roombooking_postgres psql -U postgres -d roombooking -c "SELECT version();"
```

### 2. Configurare Environment Variables

Creează fișierul `.env` în directorul `backend/`:

```bash
cd backend
```

Conținutul fișierului `.env`:

```env
# Database Configuration (for local scripts)
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=roombooking
DB_PORT=5432

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

**IMPORTANT:** Când rulezi scripturi locale (migrate.py, populate_rooms.py), folosește `DB_HOST=localhost`. Când backend-ul rulează în Docker, folosește `DB_HOST=postgres`.

### 3. Setup Virtual Environment

Creează și activează un mediu virtual Python:

```bash
cd backend

# Creează virtual environment
python3 -m venv venv

# Activează virtual environment
source venv/bin/activate  # Linux/Mac
# SAU
venv\Scripts\activate  # Windows

# Instalează dependențele
pip install -r requirements.txt
```

### 4. Rulează Migrarea Bazei de Date

Scriptul `migrate.py` creează toate tabelele necesare:

```bash
# Asigură-te că ești în directorul backend/ și că venv este activat
cd backend
source venv/bin/activate

# Rulează migrarea
python migrate.py
```

**Output așteptat:**

```
Creating database tables...
Dropped existing tables
Created all tables successfully!
```

**Ce face acest script:**

- Șterge tabelele existente (dacă există)
- Creează tabelele: `users`, `rooms`, `bookings`, `booking_participants`
- Setează indexuri și relații foreign key

### 5. Extragere Date din SVG (Opțional)

Dacă vrei să re-generezi fișierul `rooms_data.json` din SVG:

```bash
# Din directorul backend/
python extract_rooms_from_svg.py
```

Acest script:
- Parsează fișierul `OBJECTS.svg` din root
- Extrage toate camerele pe baza elementelor `<title>`
- Generează `rooms_data.json` cu 134 de camere

**Output așteptat:**

```
🔄 Loading SVG: OBJECTS.svg
📊 Found 134 rooms:
  - DeskSeat: 65 rooms
  - SoloDesk: 24 rooms
  - TrainingSeat: 16 rooms
  ...
✅ Saved to backend/rooms_data.json
```

### 6. Populare Baza de Date cu Camere

Scriptul `populate_rooms.py` inserează toate camerele din JSON în baza de date:

```bash
# Din directorul backend/ cu venv activat
python populate_rooms.py
```

**Output așteptat:**

```
Loading rooms from: rooms_data.json
Found 134 rooms to insert
================================================================================
✓ Created: DeskSeat 1 (ID: 1, SVG ID: rect1)
✓ Created: DeskSeat 2 (ID: 2, SVG ID: rect2)
...
✓ Created: CoffeePoint 2 (ID: 134, SVG ID: rect407)

================================================================================
Summary:
  ✓ Successfully created: 134 rooms
  ⊘ Skipped (already exist): 0 rooms
  ✗ Errors: 0 rooms
  Total processed: 134 rooms
================================================================================
```

**Ce face acest script:**

- Citește `rooms_data.json`
- Pentru fiecare cameră:
  - Verifică dacă deja există (după nume)
  - Inserează în baza de date cu toate detaliile:
    - Nume, descriere, capacitate, preț
    - Amenități (WiFi, Projector, etc.)
    - SVG ID pentru corespondență cu harta
    - Coordonate X,Y din SVG
    - Status disponibilitate

---

## 🔍 Verificare Bază de Date

### Conectare la PostgreSQL

```bash
# Conectează-te la containerul PostgreSQL
docker exec -it roombooking_postgres psql -U postgres -d roombooking
```

### Query-uri Utile

```sql
-- Verifică toate tabelele
\dt

-- Număr total de camere
SELECT COUNT(*) FROM rooms;

-- Primele 5 camere
SELECT id, name, capacity, price, svg_id FROM rooms LIMIT 5;

-- Camere pe tip (din SVG ID)
SELECT 
    CASE 
        WHEN svg_id LIKE 'rect%' AND name LIKE 'DeskSeat%' THEN 'DeskSeat'
        WHEN name LIKE 'MeetingRoom%' THEN 'MeetingRoom'
        WHEN name LIKE 'SoloDesk%' THEN 'SoloDesk'
        ELSE 'Other'
    END as room_type,
    COUNT(*) as count
FROM rooms
GROUP BY room_type;

-- Camere disponibile
SELECT name, capacity, price FROM rooms WHERE is_available = true;

-- Camere cu capacitate mare (4+ persoane)
SELECT name, capacity, price, amenities FROM rooms WHERE capacity >= 4;

-- Ieșire din psql
\q
```

---

## 🗄️ Structura Detaliată a Tabelelor

### Tabel: `users`

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    username VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_manager BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel: `rooms`

```sql
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    capacity INTEGER NOT NULL,
    price FLOAT NOT NULL,
    amenities JSON,  -- Array de string-uri
    image VARCHAR(500),
    svg_id VARCHAR(50),  -- ID-ul din SVG pentru corespondență cu harta
    coordinates JSON,  -- {x: number, y: number}
    is_available BOOLEAN NOT NULL DEFAULT TRUE
);
```

### Tabel: `bookings`

```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,  -- Interval: 07:00 - 22:00
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming',  -- upcoming, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel: `booking_participants`

```sql
CREATE TABLE booking_participants (
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (booking_id, user_id)
);
```

---

## 🔄 Re-populare Bază de Date

Dacă vrei să ștergi toate datele și să re-populezi baza de date:

```bash
cd backend
source venv/bin/activate

# Pas 1: Șterge și recreează tabelele
python migrate.py

# Pas 2: Re-populează cu camere
python populate_rooms.py
```

---

## 🐛 Troubleshooting

### Eroare: "ModuleNotFoundError: No module named 'sqlalchemy'"

**Soluție:** Activează virtual environment și instalează dependențele:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Eroare: "Connection refused" sau "could not connect to server"

**Cauze posibile:**

1. PostgreSQL nu rulează în Docker:
   ```bash
   docker-compose up -d postgres
   docker ps  # Verifică status
   ```

2. Port 5432 ocupat de altă instanță PostgreSQL:
   ```bash
   sudo lsof -i :5432  # Verifică ce folosește portul
   ```

3. `.env` are `DB_HOST=postgres` în loc de `localhost`:
   ```bash
   # Pentru scripturi locale, asigură-te că .env conține:
   DB_HOST=localhost
   ```

### Eroare: "relation does not exist"

**Soluție:** Rulează din nou migrarea:

```bash
python migrate.py
```

### Camere duplicate în baza de date

**Soluție:** Re-populează cu migrate clean:

```bash
python migrate.py  # Șterge toate tabelele
python populate_rooms.py  # Re-inserează camerele
```

---

## 📊 Statistici Camere Populate

După populare, baza de date conține **134 camere** distribuite astfel:

| Tip Cameră | Număr | Capacitate | Preț/oră |
|-----------|-------|-----------|---------|
| DeskSeat | 65 | 1 persoană | $10 |
| SoloDesk | 24 | 1 persoană | $12 |
| TrainingSeat | 16 | 1 persoană | $12 |
| Bubble | 9 | 2 persoane | $25 |
| MeetingRoom | 7 | 4 persoane | $45 |
| ElectricTable | 2 | 6 persoane | $50 |
| PhoneBoothArea | 2 | 1 persoană | $15 |
| CoffeePoint | 2 | 4 persoane | $20 |
| Deposit | 2 | 2 persoane | $15 |
| ManagerDesk | 2 | 1 persoană | $30 |
| BeerPoint | 1 | 8 persoane | $40 |
| DiscussionZone | 1 | 6 persoane | $35 |
| ServerRoom | 1 | 2 persoane | $100 |

**Total: 134 camere**

---

## 🎯 Next Steps

După setup-ul bazei de date:

1. **Pornește Backend-ul:**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Testează API-ul:**
   ```bash
   # Get all rooms
   curl http://localhost:8000/api/v1/rooms?limit=5
   
   # Get rooms count
   curl http://localhost:8000/api/v1/rooms/count
   ```

3. **Accesează Swagger Documentation:**
   ```
   http://localhost:8000/docs
   ```

4. **Pornește Frontend-ul:**
   ```bash
   cd sage-reserve
   npm run dev
   ```

---

## 📝 Notes

- **Backup Database:**
  ```bash
  docker exec roombooking_postgres pg_dump -U postgres roombooking > backup.sql
  ```

- **Restore Database:**
  ```bash
  docker exec -i roombooking_postgres psql -U postgres roombooking < backup.sql
  ```

- **Stop PostgreSQL:**
  ```bash
  docker-compose stop postgres
  ```

- **Remove PostgreSQL Container & Data:**
  ```bash
  docker-compose down -v
  ```

---

## 🤝 Support

Pentru probleme sau întrebări:
- Verifică log-urile Docker: `docker logs roombooking_postgres`
- Verifică log-urile backend: în terminal unde rulează uvicorn
- Verifică console-ul browser pentru erori frontend

---

**Created:** November 8, 2025  
**Version:** 1.0
