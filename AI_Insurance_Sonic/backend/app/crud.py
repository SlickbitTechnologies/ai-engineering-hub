from sqlalchemy.orm import Session
from . import models, schemas

# Model Configuration CRUD
def get_model_configuration(db: Session, config_id: int = 1):
    return db.query(models.ModelConfiguration).filter(models.ModelConfiguration.id == config_id).first()

def create_model_configuration(db: Session, config: schemas.ModelConfigurationCreate):
    db_config = models.ModelConfiguration(**config.dict())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

def update_model_configuration(db: Session, config_id: int, config: schemas.ModelConfigurationCreate):
    db_config = get_model_configuration(db, config_id)
    for key, value in config.dict().items():
        setattr(db_config, key, value)
    db.commit()
    db.refresh(db_config)
    return db_config

# Analysis Settings CRUD
def get_analysis_settings(db: Session, settings_id: int = 1):
    return db.query(models.AnalysisSettings).filter(models.AnalysisSettings.id == settings_id).first()

def create_analysis_settings(db: Session, settings: schemas.AnalysisSettingsCreate):
    db_settings = models.AnalysisSettings(**settings.dict())
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings

def update_analysis_settings(db: Session, settings_id: int, settings: schemas.AnalysisSettingsCreate):
    db_settings = get_analysis_settings(db, settings_id)
    for key, value in settings.dict().items():
        setattr(db_settings, key, value)
    db.commit()
    db.refresh(db_settings)
    return db_settings

# User CRUD
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: schemas.UserCreate):
    db_user = get_user(db, user_id)
    for key, value in user.dict().items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    db.delete(db_user)
    db.commit()
    return db_user 