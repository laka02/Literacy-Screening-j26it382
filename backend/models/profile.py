"""Profile Pydantic models for viewing, updating details, and viewing KPIs & progress."""
import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Literal


class ParentProfileUpdate(BaseModel):
    parent_name: str = Field(..., min_length=2, max_length=100)
    school: str = Field(..., min_length=2, max_length=200)
    child_age: int = Field(..., ge=7, le=12)
    grade: Literal["3", "4", "5"]
    gender: Literal["male", "female"]
    child_image: Optional[str] = None

    @field_validator("parent_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Parent name cannot be empty.")
        if not re.match(r"^[a-zA-Z\s]+$", v):
            raise ValueError("Parent name can only contain letters and spaces (no numbers or special characters).")
        return v

    @field_validator("school")
    @classmethod
    def validate_school(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("School name is required.")
        return v


class TeacherProfileUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    school: str = Field(..., min_length=2, max_length=200)
    phone: str = Field(..., min_length=10, max_length=15)
    image: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Teacher name cannot be empty.")
        if not re.match(r"^[a-zA-Z\s]+$", v):
            raise ValueError("Name can only contain letters and spaces (no numbers or special characters).")
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


class MetricItem(BaseModel):
    label: str
    value: str


class ComponentKPI(BaseModel):
    component_name: str
    member_title: str
    score_percentage: int
    risk_level: str
    color: str
    icon: str
    metrics: List[MetricItem]


class BadgeItem(BaseModel):
    name: str
    icon: str
    description: str
    unlocked: bool


class ExerciseItem(BaseModel):
    id: str
    title: str
    skill_category: str
    status: str
    score: int
    date: str


class RecordExerciseRequest(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=2, max_length=150)
    skill_category: str = Field(..., min_length=2, max_length=100)
    score: int = Field(..., ge=0, le=100)
    status: Optional[str] = "Completed"
    date: Optional[str] = None


class InterventionProgressResponse(BaseModel):
    plan_title: str
    student_name: str
    grade: str
    overall_score: int
    total_exercises: int
    completed_exercises: int
    completion_rate: int
    xp_points: int
    stars_count: int
    streak_days: int
    kpis: List[ComponentKPI]
    badges: List[BadgeItem] = []
    recent_exercises: List[ExerciseItem] = []
