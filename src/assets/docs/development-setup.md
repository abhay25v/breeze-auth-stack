
# Development Setup

## Frontend Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open http://localhost:8080

### Environment Variables
Create a `.env.local` file:
```
VITE_API_URL=http://localhost:8000/api
```

## Backend Development (FastAPI)

### Prerequisites
- Python 3.8+
- pip

### Setup
1. Create virtual environment: `python -m venv venv`
2. Activate: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
3. Install dependencies: `pip install -r requirements.txt`
4. Start server: `uvicorn main:app --reload --port 8000`

### FastAPI Structure
```
backend/
├── main.py              # FastAPI app entry point
├── requirements.txt     # Python dependencies
├── api/
│   ├── __init__.py
│   ├── auth.py         # Authentication routes
│   └── users.py        # User management routes
├── models/
│   ├── __init__.py
│   ├── user.py         # User model
│   └── database.py     # Database setup
└── utils/
    ├── __init__.py
    ├── jwt.py          # JWT utilities
    └── security.py     # Security helpers
```

## Database
- PostgreSQL for production
- SQLite for development
- Alembic for migrations

## Proxy Configuration
The frontend dev server proxies API requests to `http://localhost:8000`
