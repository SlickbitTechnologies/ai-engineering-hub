from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from .. import models, schemas, crud
from ..database import get_db

router = APIRouter(
    prefix="/api/configuration",
    tags=["configuration"],
    responses={404: {"description": "Not found"}},
)

# Get complete configuration
@router.get("/", response_model=schemas.CompleteConfiguration)
async def get_complete_configuration(db: Session = Depends(get_db)):
    model_config = crud.get_model_configuration(db)
    analysis_settings = crud.get_analysis_settings(db)
    users = crud.get_users(db)
    
    if not model_config:
        # Create default model configuration if it doesn't exist
        model_config = crud.create_model_configuration(
            db,
            schemas.ModelConfigurationCreate(
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
        analysis_settings = crud.create_analysis_settings(
            db,
            schemas.AnalysisSettingsCreate(
                sentiment_analysis_enabled=True,
                keyword_extraction_enabled=True,
                topic_detection_enabled=False
            )
        )
    
    return {
        "model_config": model_config,
        "analysis_settings": analysis_settings,
        "users": users
    }

# Model Configuration Endpoints
@router.get("/model", response_model=schemas.ModelConfiguration)
async def get_model_configuration(db: Session = Depends(get_db)):
    model_config = crud.get_model_configuration(db)
    if not model_config:
        raise HTTPException(status_code=404, detail="Model configuration not found")
    return model_config

@router.put("/model", response_model=schemas.ModelConfiguration)
async def update_model_configuration(
    config: schemas.ModelConfigurationCreate, db: Session = Depends(get_db)
):
    model_config = crud.get_model_configuration(db)
    if not model_config:
        # Create if it doesn't exist
        return crud.create_model_configuration(db, config)
    else:
        # Update existing configuration
        return crud.update_model_configuration(db, model_config.id, config)

# Analysis Settings Endpoints
@router.get("/analysis-settings", response_model=schemas.AnalysisSettings)
async def get_analysis_settings(db: Session = Depends(get_db)):
    settings = crud.get_analysis_settings(db)
    if not settings:
        raise HTTPException(status_code=404, detail="Analysis settings not found")
    return settings

@router.put("/analysis-settings", response_model=schemas.AnalysisSettings)
async def update_analysis_settings(
    settings: schemas.AnalysisSettingsCreate, db: Session = Depends(get_db)
):
    existing_settings = crud.get_analysis_settings(db)
    if not existing_settings:
        # Create if it doesn't exist
        return crud.create_analysis_settings(db, settings)
    else:
        # Update existing settings
        return crud.update_analysis_settings(db, existing_settings.id, settings)

# User Endpoints
@router.get("/users", response_model=List[schemas.User])
async def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.post("/users", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)

@router.get("/users/{user_id}", response_model=schemas.User)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/users/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int, user: schemas.UserCreate, db: Session = Depends(get_db)
):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.update_user(db, user_id, user)

@router.delete("/users/{user_id}", response_model=schemas.User)
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.delete_user(db, user_id) 