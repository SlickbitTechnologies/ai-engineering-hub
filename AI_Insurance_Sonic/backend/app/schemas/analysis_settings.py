from pydantic import BaseModel

class AnalysisSettingsBase(BaseModel):
    sentiment_analysis_enabled: bool
    keyword_extraction_enabled: bool
    topic_detection_enabled: bool

class AnalysisSettingsCreate(AnalysisSettingsBase):
    pass

class AnalysisSettings(AnalysisSettingsBase):
    id: int

    class Config:
        from_attributes = True 