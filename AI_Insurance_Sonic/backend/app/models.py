from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from .database import Base

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

class AnalysisSettings(Base):
    __tablename__ = "analysis_settings"

    id = Column(Integer, primary_key=True, index=True)
    sentiment_analysis_enabled = Column(Boolean, default=True)
    keyword_extraction_enabled = Column(Boolean, default=True)
    topic_detection_enabled = Column(Boolean, default=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(String) 