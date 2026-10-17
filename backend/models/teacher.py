"""Teacher Pydantic models for registration, login, and response."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class TeacherRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Teacher's full name")
    school: str = Field(..., min_length=2, max_length=200, description="School name")
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15, description="Phone number (10-15 digits)")
    password: str = Field(..., min_length=6, description="Password (minimum 6 characters)")
    image: Optional[str] = Field(None, description="Profile photo as base64-encoded string (optional)")


class TeacherLogin(BaseModel):
    email: EmailStr
    password: str


class TeacherResponse(BaseModel):
    id: str
    name: str
    school: str
    email: str
    phone: str
    image: Optional[str] = None
    role: str = "teacher"
    created_at: datetime
