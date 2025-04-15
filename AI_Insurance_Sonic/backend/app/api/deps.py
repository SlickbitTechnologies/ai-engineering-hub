from typing import Generator
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db

# Database dependency - already implemented in db.session but repeated here for clarity
def get_db_dependency() -> Generator:
    db = next(get_db())
    try:
        yield db
    finally:
        db.close() 