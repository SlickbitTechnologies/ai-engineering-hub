# API v1 package initialization 
from fastapi import APIRouter
from .configuration import router as configuration_router
from .health import router as health_router
from .routes.analyze import router as analyze_router

# Create API router with empty prefix
api_router = APIRouter()

# Include routers with their specific prefixes
api_router.include_router(health_router, prefix="/health")
api_router.include_router(configuration_router, prefix="/configuration")
api_router.include_router(analyze_router, prefix="/analyze")

# Debug information
print("API Routes initialized:")
print(f"- Health check: /health")
print(f"- Configuration: /configuration")
print(f"- Analyze: /analyze") 