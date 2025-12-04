# Incident Response Training System

Et webbaseret træningssystem til incident response, hvor medarbejdere kan træne deres evner til at håndtere cybersikkerhedsincidenter gennem scenarie-baserede øvelser.

## 📋 Oversigt

Dette system giver mulighed for at:
- **Administratorer** kan oprette scenarier med spørgsmål og svar-optioner
- **Medarbejdere** kan deltage i incident-træning baseret på deres rolle
- **Rapporter** kan genereres med detaljerede resultater og statistikker
- **Rolle-baseret filtrering** sikrer at medarbejdere kun ser relevante spørgsmål

## 🛠️ Teknologier

### Backend
- **.NET 9.0** - C# backend API
- **Entity Framework Core** - ORM til databasehåndtering
- **SQLite** - Database
- **JWT Authentication** - Sikker autentificering
- **MediatR** - CQRS pattern implementering
- **BCrypt** - Password hashing

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool og dev server
- **React Router** - Routing
- **Axios** - HTTP client
- **jsPDF** - PDF generering

### Testing
- **Playwright** - E2E testing

##  Projektstruktur

```
incidentresponseplan/
├── API/                    # Backend API (Controllers, Program.cs)
├── Application/            # Business logic (Commands, Queries)
│   ├── Commands/          # CQRS Commands
│   └── Queries/           # CQRS Queries
├── Domain/                 # Domain entities og enums
│   ├── Entities/          # Domain models
│   └── Enum/              # Enumerationer
├── Persistence/            # Data access layer
│   ├── AppDbContext.cs    # EF Core context
│   ├── DbInitializer.cs   # Database seeding
│   └── Migrations/        # EF Core migrations
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # React komponenter
│   │   ├── auth/          # Authentication logic
│   │   ├── components/    # Genbrugelige komponenter
│   │   └── services/       # API services
│   └── package.json
└── e2e/                    # Playwright E2E tests
```

##  Forudsætninger

Før du starter, skal du have installeret:

- **.NET 9.0 SDK** - [Download her](https://dotnet.microsoft.com/download/dotnet/9.0)
- **Node.js** (v18 eller nyere) - [Download her](https://nodejs.org/)
- **npm** eller **yarn** - Kommer med Node.js

## Installation og Start

### 1. Klon repository

```bash
git clone <repository-url>
cd incidentresponseplan
```

### 2. Installer frontend dependencies

```bash
cd client
npm install
```

### 3. Konfigurer backend

Backend konfigurationen findes i `API/appsettings.json`. Standard indstillinger:

- **API Port:** `http://localhost:5000`
- **Database:** SQLite (`Incident.db` i API mappen)
- **JWT SecretKey:** Skal være mindst 32 karakterer (konfigureres i `appsettings.json`)

### 4. Start backend

```bash
cd API
dotnet restore
dotnet run
```

Backend API'en kører nu på `http://localhost:5000`

### 5. Start frontend

I en ny terminal:

```bash
cd client
npm run dev
```

Frontend'en kører nu på `http://localhost:5173`

### 6. Åbn browseren

Gå til `http://localhost:5173` for at se applikationen.

## Standard Brugere

Systemet seedes automatisk med følgende test-brugere ved første start:

### Admin
- **Email:** `admin@admin.dk`
- **Password:** `emir123`
- **Rolle:** Admin

### Developer
- **Email:** `asadi@asadi.dk`
- **Password:** `asadi123`
- **Rolle:** Developer

### Analyst
- **Email:** `emir@emir.dk`
- **Password:** `emir123`
- **Rolle:** Analyst

### Consultant
- **Email:** `hamudi@hamudi.dk`
- **Password:** `hamudi123`
- **Rolle:** Consultant

### Playwright Test Brugere
- **Email:** `admin@admin.com` / **Password:** `123` (Admin)
- **Email:** `employee@employee.com` / **Password:** `123` (Developer)

## ✨ Features

### For Administratorer
- ✅ Opret og rediger scenarier
- ✅ Opret incidents fra scenarier
- ✅ Administrer brugere, roller og afdelinger
- ✅ Se detaljerede resultater fra alle incidents
- ✅ Generer rapporter (CSV, JSON)
- ✅ Filtrer og gruppere resultater

### For Medarbejdere
- ✅ Se tilgængelige incidents
- ✅ Deltage i incident-træning
- ✅ Få feedback på svar
- ✅ Se score og resultater
- ✅ Rolle-baseret spørgsmålsfiltrering

### Sikkerhed
- ✅ JWT-baseret autentificering
- ✅ Rolle-baseret adgangskontrol (RBAC)
- ✅ Password hashing med BCrypt
- ✅ CORS konfiguration

## 🗄️ Database

Systemet bruger **SQLite** som database. Databasen oprettes automatisk ved første kørsel i `API/Incident.db`.

### Database Schema
- **Users** - Brugere med roller og afdelinger
- **Roles** - Roller (Admin, Developer, Analyst, Consultant)
- **Departments** - Afdelinger
- **Scenarios** - Træningsscenarier
- **Questions** - Spørgsmål til scenarier
- **AnswerOptions** - Svar-optioner til spørgsmål
- **QuestionRoles** - Mange-til-mange relation mellem spørgsmål og roller
- **Incidents** - Aktive incidents baseret på scenarier
- **Responses** - Brugeres svar på spørgsmål

### Migrations

Entity Framework Core migrations kører automatisk ved start. Hvis du skal oprette en ny migration:

```bash
cd Persistence
dotnet ef migrations add <MigrationName> --startup-project ../API
```

## Testing

### E2E Tests med Playwright

```bash
# Installer Playwright
npm install

# Kør tests
npx playwright test
```

Tests findes i `e2e/` mappen.

## 🔧 Konfiguration

### Backend Konfiguration

Rediger `API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=Incident.db"
  },
  "JwtSettings": {
    "SecretKey": "DinSuperHemmeligeNøgleHerMindst32Karakterer!",
    "Issuer": "IncidentResponseAPI",
    "Audience": "IncidentResponseClient",
    "ExpirationInMinutes": 60
  }
}
```

### Frontend Konfiguration

Frontend'en forventer at API'en kører på `http://localhost:5000` som standard. Hvis du skal ændre dette, opret en `.env` fil i `client/` mappen:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Hent aktuel bruger

### Scenarios
- `GET /api/scenarios` - Hent alle scenarier
- `GET /api/scenarios/{id}` - Hent specifik scenario
- `POST /api/scenarios` - Opret scenario
- `PUT /api/scenarios/{id}` - Opdater scenario
- `DELETE /api/scenarios/{id}` - Slet scenario

### Incidents
- `GET /api/incident` - Hent alle incidents
- `GET /api/incident/{id}` - Hent specifik incident
- `GET /api/incident/results` - Hent alle resultater
- `POST /api/incident` - Opret incident
- `PUT /api/incident/{id}` - Opdater incident

### Users
- `GET /api/user` - Hent alle brugere
- `POST /api/user` - Opret bruger
- `PUT /api/user/{id}` - Opdater bruger
- `DELETE /api/user/{id}` - Slet bruger

## 🏗️ Arkitektur

Systemet følger **Clean Architecture** principper:

- **Domain Layer** - Core business entities og regler
- **Application Layer** - Business logic (CQRS med MediatR)
- **Persistence Layer** - Data access med Entity Framework Core
- **API Layer** - REST API controllers
- **Client Layer** - React frontend

## Licens

MÅ IKKE BRUGES KOPIERES ELLER ANDET

## Bidragydere

FARUK EMIR DEGIRMENCI
MOHAMAD EL-ASADI
MUHAMED SBEIHI


