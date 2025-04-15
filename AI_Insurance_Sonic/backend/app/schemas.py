from pydantic import BaseModel, EmailStr
from typing import List, Optional

# Model Configuration Schemas
class ModelConfigurationBase(BaseModel):
    provider: str
    model_name: str
    api_key: str
    max_tokens: int
    temperature: float
    top_p: float
    frequency_penalty: float
    presence_penalty: float
    system_prompt: str

class ModelConfigurationCreate(ModelConfigurationBase):
    pass

class ModelConfiguration(ModelConfigurationBase):
    id: int

    class Config:
        from_attributes = True

# Analysis Settings Schemas
class AnalysisSettingsBase(BaseModel):
    sentiment_analysis_enabled: bool
    keyword_extraction_enabled: bool
    topic_detection_enabled: bool

class AnalysisSettingsCreate(AnalysisSettingsBase):
    pass

class AnalysisSettings(AnalysisSettingsBase):
    id: int

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

# Complete Configuration Schema (for frontend)
class CompleteConfiguration(BaseModel):
    model_config: ModelConfiguration
    analysis_settings: AnalysisSettings
    users: List[User] 