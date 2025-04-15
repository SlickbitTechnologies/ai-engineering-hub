from pydantic import BaseModel

class UserBase(BaseModel):
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

    class Config:
        from_attributes = True 