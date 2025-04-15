from pydantic import BaseModel
from typing import List
from .model_configuration import ModelConfiguration
from .analysis_settings import AnalysisSettings
from .user import User

class CompleteConfiguration(BaseModel):
    ai_model_config: ModelConfiguration
    analysis_settings: AnalysisSettings
    users: List[User] 