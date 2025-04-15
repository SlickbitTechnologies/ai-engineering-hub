import os
import sys

# Add the parent directory to the path so we can import the app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine
from app.db.base import Base
# Import all models to ensure they are registered with SQLAlchemy
from app.db import __all_models

def init_db():
    """Initialize the database by creating all the tables defined in the models."""
    try:
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        raise

if __name__ == "__main__":
    init_db() 