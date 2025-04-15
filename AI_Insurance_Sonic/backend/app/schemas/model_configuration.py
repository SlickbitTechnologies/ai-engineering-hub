from pydantic import BaseModel

class ModelConfigurationBase(BaseModel):
    provider: str
    model_name: str
    api_key: str
    max_tokens: int
    temperature: float
    top_p: float
    frequency_penalty: float
    presence_penalty: float
    system_prompt: str

class ModelConfigurationCreate(ModelConfigurationBase):
    pass

class ModelConfiguration(ModelConfigurationBase):
    id: int

    class Config:
        from_attributes = True 