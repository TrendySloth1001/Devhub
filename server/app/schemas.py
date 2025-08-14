from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SessionCreate(BaseModel):
    name: str


class SessionOut(BaseModel):
    id: int
    name: str
    code: str
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SessionInfoOut(BaseModel):
    id: int
    name: str
    code: str
    owner_email: EmailStr | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentUpsert(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    language: Optional[str] = None


class DocumentOut(BaseModel):
    id: int
    session_id: int
    title: str
    content: str
    language: str
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentCreate(BaseModel):
    title: str
    language: Optional[str] = "typescript"


class ChatMessageIn(BaseModel):
    content: str


class ChatMessageOut(BaseModel):
    id: int
    session_id: int
    user_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageViewOut(BaseModel):
    content: str
    created_at: datetime
    user_email: EmailStr | None = None


