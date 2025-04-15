from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.v1 import api_router
from .db.session import engine, database
from .db.base import Base

# Import all models to ensure they are registered with SQLAlchemy
from .db import __all_models

from .config.firebase import initialize_firebase

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    # Add OpenAPI docs configuration if needed
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["Content-Length", "X-Total-Count"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Include API routes with version prefix
app.include_router(api_router, prefix=settings.API_V1_STR)

# Setup database connection events
@app.on_event("startup")
async def startup():
    # Connect to database
    await database.connect()
    
    # Initialize Firebase
    try:
        initialize_firebase()
        print("Firebase initialized during app startup")
    except Exception as e:
        print(f"Error initializing Firebase during startup: {e}")

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"} 