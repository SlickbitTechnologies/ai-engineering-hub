from sqlalchemy import Boolean, Column, Integer
from ..db.base import Base

class AnalysisSettings(Base):
    __tablename__ = "analysis_settings"

    id = Column(Integer, primary_key=True, index=True)
    sentiment_analysis_enabled = Column(Boolean, default=True)
    keyword_extraction_enabled = Column(Boolean, default=True)
    topic_detection_enabled = Column(Boolean, default=False) 