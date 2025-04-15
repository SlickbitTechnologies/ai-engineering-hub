# Import all models here to ensure they are registered with SQLAlchemy
from ..models.batch import Batch, AudioFile
from ..models.user import User
from ..models.analysis_settings import AnalysisSettings
from ..models.model_configuration import ModelConfiguration
 
# This file is imported in main.py before Base.metadata.create_all() is called 