"""Teacher Pydantic models for registration, login, and response."""
import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class TeacherRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Teacher's full name")
    school: str = Field(..., min_length=2, max_length=200, description="School name")
    email: str = Field(..., description="Teacher's email address ending with @gmail.com")
    phone: str = Field(..., min_length=10, max_length=15, description="Phone number (10-15 digits)")
    password: str = Field(..., min_length=6, description="Password (minimum 6 characters)")
    image: Optional[str] = Field(None, description="Profile photo as base64-encoded string (optional)")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full name is required.")
        if not re.match(r"^[a-zA-Z\s]+$", v):
            raise ValueError("Name can only contain letters and spaces. Numbers and special characters are not allowed.")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Email address is required.")
        if any(char in v for char in ["#", "!", "<", ">"]):
            raise ValueError("Email address cannot contain '#', '!', '<', or '>'.")
        if not re.match(r"^[a-zA-Z0-9._%+-]+@gmail\.com$", v):
            raise ValueError("Email must be a valid address ending with @gmail.com.")
        return v

    @field_validator("school")
    @classmethod
    def validate_school(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("School name is required.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^\+?[0-9]{10,15}$", v):
            raise ValueError("Phone number must contain between 10 and 15 digits.")
        return v


class TeacherLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()


class TeacherResponse(BaseModel):
    id: str
    name: str
    school: str
    email: str
    phone: str
    image: Optional[str] = None
    role: str = "teacher"
    created_at: datetime
