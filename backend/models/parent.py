"""Parent Pydantic models for registration, login, and response."""
import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime


class ParentRegister(BaseModel):
    parent_name: str = Field(..., min_length=2, max_length=100, description="Parent's full name")
    parent_email: str = Field(..., description="Parent's email address ending with @gmail.com")
    password: str = Field(..., min_length=6, description="Password (minimum 6 characters)")
    # Child information
    school: str = Field(..., min_length=2, max_length=200, description="Child's school name")
    child_age: int = Field(..., ge=7, le=12, description="Child's age (7 to 12)")
    grade: Literal["3", "4", "5"] = Field(..., description="Child's grade — 3, 4, or 5")
    gender: Literal["male", "female"] = Field(..., description="Child's gender")
    child_image: Optional[str] = Field(None, description="Child's photo as base64-encoded string (optional)")

    @field_validator("parent_name")
    @classmethod
    def validate_parent_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Parent name is required.")
        # Allow only English letters and spaces (no numbers, no special characters)
        if not re.match(r"^[a-zA-Z\s]+$", v):
            raise ValueError("Parent name can only contain letters and spaces. Numbers and special characters are not allowed.")
        return v

    @field_validator("parent_email")
    @classmethod
    def validate_parent_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Email address is required.")
        # Check for forbidden characters (#, !, <, >)
        if any(char in v for char in ["#", "!", "<", ">"]):
            raise ValueError("Email address cannot contain '#', '!', '<', or '>'.")
        # Must strictly end with @gmail.com
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


class ParentLogin(BaseModel):
    parent_email: str
    password: str

    @field_validator("parent_email")
    @classmethod
    def validate_parent_email(cls, v: str) -> str:
        return v.strip().lower()


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
