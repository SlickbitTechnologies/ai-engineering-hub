from sqlalchemy import Column, Float, Integer, String, Text
from ..db.base import Base

class ModelConfiguration(Base):
    __tablename__ = "model_configurations"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, index=True)
    model_name = Column(String)
    api_key = Column(String)
    max_tokens = Column(Integer)
    temperature = Column(Float)
    top_p = Column(Float)
    frequency_penalty = Column(Float)
    presence_penalty = Column(Float)
    system_prompt = Column(Text) 