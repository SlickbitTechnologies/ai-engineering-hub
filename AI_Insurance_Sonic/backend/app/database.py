import os
import databases
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get the directory of the current file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# SQLite database URL
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'sql_app.db')}"

# Create a Database instance
database = databases.Database(DATABASE_URL)

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create a session local class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for declarative models
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 