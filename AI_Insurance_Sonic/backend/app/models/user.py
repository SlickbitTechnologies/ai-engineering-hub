from sqlalchemy import Column, Integer, String
from ..db.base import Base

class User(Base):
    __tablename__ = "users"
 
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(String) 