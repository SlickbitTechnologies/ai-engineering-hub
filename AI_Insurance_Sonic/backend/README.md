# Insurance API Backend

This is the FastAPI backend for the Insurance application.

## Project Structure

```
backend/
│
├── app/                    # Main application package
│   ├── __init__.py
│   ├── main.py             # Entry point
│   ├── api/                # All API routes grouped by module
│   │   ├── __init__.py
│   │   ├── deps.py         # Dependencies for routes
│   │   └── v1/             # Version 1 API endpoints
│   │       ├── __init__.py
│   │       ├── configuration.py  # Configuration routes
│   │       └── health.py   # Health check routes
│   │
│   ├── core/               # Core app config and constants
│   │   ├── __init__.py
│   │   └── config.py       # Environment configs
│   │
│   ├── models/             # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── model_configuration.py
│   │   ├── analysis_settings.py
│   │   └── user.py
│   │
│   ├── schemas/            # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── model_configuration.py
│   │   ├── analysis_settings.py
│   │   ├── user.py
│   │   └── configuration.py
│   │
│   ├── services/           # Business logic
│   │   └── __init__.py
│   │
│   ├── db/                 # Database session, init, CRUD
│   │   ├── __init__.py
│   │   ├── base.py         # SQLAlchemy base
│   │   ├── session.py      # DB connection
│   │   └── crud.py         # CRUD operations
│   │
│   └── utils/              # Helper functions
│       └── __init__.py
│
├── tests/                  # Unit & integration tests
│   └── __init__.py
│
├── .env                    # Environment variables
├── requirements.txt
└── README.md
```

## Setup

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

1. Start the server:
```bash
# Default port (8000)
uvicorn app.main:app --reload

# Custom port (4000)
uvicorn app.main:app --reload --port 4000
```

The API will be available at http://localhost:8000 or http://localhost:4000 (when using custom port)

## API Documentation

- Swagger UI: http://localhost:8000/docs or http://localhost:4000/docs
- ReDoc: http://localhost:8000/redoc or http://localhost:4000/redoc

## API Endpoints

### Health Check
- GET /api/v1/health - Check API health

### Configuration
- GET /api/v1/configuration - Get all configuration settings
- GET /api/v1/configuration/model - Get model configuration
- PUT /api/v1/configuration/model - Update model configuration
- GET /api/v1/configuration/analysis-settings - Get analysis settings
- PUT /api/v1/configuration/analysis-settings - Update analysis settings

### Users
- GET /api/v1/configuration/users - List all users
- POST /api/v1/configuration/users - Create a new user
- GET /api/v1/configuration/users/{user_id} - Get a specific user
- PUT /api/v1/configuration/users/{user_id} - Update a user
- DELETE /api/v1/configuration/users/{user_id} - Delete a user 