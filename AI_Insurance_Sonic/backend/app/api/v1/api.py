from fastapi import APIRouter

from .routes import configuration, analyze

api_router = APIRouter()

api_router.include_router(configuration.router, prefix="/configuration", tags=["configuration"])
api_router.include_router(analyze.router, prefix="/analyze", tags=["analyze"]) 