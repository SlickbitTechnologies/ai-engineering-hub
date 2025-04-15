from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from ...db.crud import (
    get_model_configuration, create_model_configuration, update_model_configuration,
    get_analysis_settings, create_analysis_settings, update_analysis_settings,
    get_user, get_user_by_email, get_users, create_user, update_user, delete_user
)
from ...schemas import (
    ModelConfiguration, ModelConfigurationCreate,
    AnalysisSettings, AnalysisSettingsCreate,
    User, UserCreate, CompleteConfiguration
)
from ...api.deps import get_db_dependency

# Create router without a prefix, as the prefix will be added in __init__.py
router = APIRouter(
    tags=["configuration"],
    responses={404: {"description": "Not found"}},
)

# Get complete configuration
@router.get("/", response_model=CompleteConfiguration)
async def get_complete_configuration(db: Session = Depends(get_db_dependency)):
    model_config = get_model_configuration(db)
    analysis_settings = get_analysis_settings(db)
    users = get_users(db)
    
    if not model_config:
        # Create default model configuration if it doesn't exist
        model_config = create_model_configuration(
            db,
            ModelConfigurationCreate(
                provider="",
                model_name="GPT-4",
                api_key="12••••••••••••••••••••••••••••",
                max_tokens=2048,
                temperature=0.7,
                top_p=0.95,
                frequency_penalty=0.5,
                presence_penalty=0.6,
                system_prompt="You are a helpful AI assistant that analyzes insurance call transcripts."
            )
        )
    
    if not analysis_settings:
        # Create default analysis settings if they don't exist
        analysis_settings = create_analysis_settings(
            db,
            AnalysisSettingsCreate(
                sentiment_analysis_enabled=True,
                keyword_extraction_enabled=True,
                topic_detection_enabled=False
            )
        )
    
    return {
        "ai_model_config": model_config,
        "analysis_settings": analysis_settings,
        "users": users
    }

# Model Configuration Endpoints
@router.get("/model", response_model=ModelConfiguration)
async def get_model_config(db: Session = Depends(get_db_dependency)):
    model_config = get_model_configuration(db)
    if not model_config:
        raise HTTPException(status_code=404, detail="Model configuration not found")
    return model_config

@router.put("/model", response_model=ModelConfiguration)
async def update_model_config(
    config: ModelConfigurationCreate, db: Session = Depends(get_db_dependency)
):
    model_config = get_model_configuration(db)
    if not model_config:
        # Create if it doesn't exist
        return create_model_configuration(db, config)
    else:
        # Update existing configuration
        return update_model_configuration(db, model_config.id, config)

# Analysis Settings Endpoints
@router.get("/analysis-settings", response_model=AnalysisSettings)
async def get_analysis_config(db: Session = Depends(get_db_dependency)):
    settings = get_analysis_settings(db)
    if not settings:
        raise HTTPException(status_code=404, detail="Analysis settings not found")
    return settings

@router.put("/analysis-settings", response_model=AnalysisSettings)
async def update_analysis_config(
    settings: AnalysisSettingsCreate, db: Session = Depends(get_db_dependency)
):
    existing_settings = get_analysis_settings(db)
    if not existing_settings:
        # Create if it doesn't exist
        return create_analysis_settings(db, settings)
    else:
        # Update existing settings
        return update_analysis_settings(db, existing_settings.id, settings)

# User Endpoints
@router.get("/users", response_model=List[User])
async def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db_dependency)):
    users = get_users(db, skip=skip, limit=limit)
    return users

@router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def add_user(user: UserCreate, db: Session = Depends(get_db_dependency)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db, user)

@router.get("/users/{user_id}", response_model=User)
async def read_user(user_id: int, db: Session = Depends(get_db_dependency)):
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/users/{user_id}", response_model=User)
async def update_existing_user(
    user_id: int, user: UserCreate, db: Session = Depends(get_db_dependency)
):
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return update_user(db, user_id, user)

@router.delete("/users/{user_id}", response_model=User)
async def remove_user(user_id: int, db: Session = Depends(get_db_dependency)):
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return delete_user(db, user_id) 