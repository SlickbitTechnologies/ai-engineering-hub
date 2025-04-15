from fastapi import APIRouter

# Create router without a prefix, as the prefix will be added in __init__.py
router = APIRouter()

@router.get("/")
async def health_check():
    return {"status": "healthy"} 