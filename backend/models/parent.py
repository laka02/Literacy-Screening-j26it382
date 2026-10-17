"""Parent Pydantic models for registration, login, and response."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime


class ParentRegister(BaseModel):
    parent_name: str = Field(..., min_length=2, max_length=100, description="Parent's full name")
    parent_email: EmailStr
    password: str = Field(..., min_length=6, description="Password (minimum 6 characters)")
    # Child information
    school: str = Field(..., min_length=2, max_length=200, description="Child's school name")
    child_age: int = Field(..., ge=7, le=12, description="Child's age (7 to 12)")
    grade: Literal["3", "4", "5"] = Field(..., description="Child's grade — 3, 4, or 5")
    gender: Literal["male", "female"] = Field(..., description="Child's gender")
    child_image: Optional[str] = Field(None, description="Child's photo as base64-encoded string (optional)")


class ParentLogin(BaseModel):
    parent_email: EmailStr
    password: str


class ParentResponse(BaseModel):
    id: str
    parent_name: str
    parent_email: str
    school: str
    child_age: int
    grade: str
    gender: str
    child_image: Optional[str] = None
    role: str = "parent"
    created_at: datetime
