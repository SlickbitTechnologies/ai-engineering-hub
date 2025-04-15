import os
from pydantic_settings import BaseSettings
from typing import Optional, List, Union

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Insurance API"
    
    # CORS settings
    # The BACKEND_CORS_ORIGINS is a string separated by commas in the .env file
    # Example: "http://localhost:3000,http://localhost:4000"
    BACKEND_CORS_ORIGINS_CSV: str = "http://localhost:3000,http://localhost:5174"
    
    # Database settings
    DATABASE_URL: Optional[str] = None
    
    # JWT settings
    SECRET_KEY: str = "supersecretkey"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Firebase settings
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: Optional[str] = None
    MOCK_FIREBASE: Optional[bool] = False
    MOCK_STORAGE_URL: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        # Parses the comma separated string from .env
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS_CSV.split(",") if origin]


settings = Settings()

# If DATABASE_URL is not set in environment, use a default SQLite URL
if settings.DATABASE_URL is None:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    settings.DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'app/sql_app.db')}" 