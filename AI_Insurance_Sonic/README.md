# Insurance Application

A full-stack insurance application with FastAPI backend and React frontend.

## Project Structure

```
.
├── backend/           # FastAPI backend
│   ├── app/          # Application code
│   ├── venv/         # Python virtual environment
│   └── requirements.txt
└── frontend/         # React frontend
    ├── src/          # Source code
    ├── public/       # Static files
    └── package.json
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Follow the instructions in `backend/README.md`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Follow the instructions in `frontend/README.md`

## Development

1. Start the backend server:
```bash
cd backend
uvicorn app.main:app --reload
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs 