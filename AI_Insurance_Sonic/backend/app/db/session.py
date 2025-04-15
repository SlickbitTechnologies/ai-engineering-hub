import databases
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ..core.config import settings

# Create a Database instance
database = databases.Database(settings.DATABASE_URL)

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

# Create a session local class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 