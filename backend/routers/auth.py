"""Authentication router — Teacher and Parent register/login endpoints."""
from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import random
from database import get_db
from models.teacher import TeacherRegister, TeacherLogin
from models.parent import ParentRegister, ParentLogin
from utils.auth import hash_password, verify_password, create_access_token

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════
#  TEACHER ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@router.post("/teacher/register", status_code=status.HTTP_201_CREATED)
async def register_teacher(teacher: TeacherRegister):
    """Register a new teacher account in the 'teachers' collection."""
    db = get_db()

    # Prevent duplicate email
    existing = await db["teachers"].find_one({"email": teacher.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered. Please log in instead.",
        )

    teacher_doc = {
        "name": teacher.name,
        "school": teacher.school,
        "email": teacher.email,
        "phone": teacher.phone,
        "password": hash_password(teacher.password),  # Never store plain text
        "image": teacher.image,
        "role": "teacher",
        "created_at": datetime.utcnow(),
    }

    result = await db["teachers"].insert_one(teacher_doc)
    teacher_id = str(result.inserted_id)

    token = create_access_token({
        "sub": teacher_id,
        "role": "teacher",
        "email": teacher.email,
        "name": teacher.name,
    })

    return {
        "success": True,
        "message": f"Welcome to CAIRE, {teacher.name}! 🎉",
        "token": token,
        "user": {
            "id": teacher_id,
            "name": teacher.name,
            "email": teacher.email,
            "school": teacher.school,
            "phone": teacher.phone,
            "image": teacher.image,
            "role": "teacher",
        },
    }


@router.post("/teacher/login")
async def login_teacher(credentials: TeacherLogin):
    """Login an existing teacher using email and password."""
    db = get_db()

    teacher = await db["teachers"].find_one({"email": credentials.email})
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No teacher account found with this email address.",
        )

    if not verify_password(credentials.password, teacher["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again.",
        )

    teacher_id = str(teacher["_id"])
    token = create_access_token({
        "sub": teacher_id,
        "role": "teacher",
        "email": teacher["email"],
        "name": teacher["name"],
    })

    return {
        "success": True,
        "message": f"Welcome back, {teacher['name']}! 👋",
        "token": token,
        "user": {
            "id": teacher_id,
            "name": teacher["name"],
            "email": teacher["email"],
            "school": teacher["school"],
            "phone": teacher["phone"],
            "image": teacher.get("image"),
            "role": "teacher",
        },
    }


# ═══════════════════════════════════════════════════════════════════
#  PARENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@router.post("/parent/register", status_code=status.HTTP_201_CREATED)
async def register_parent(parent: ParentRegister):
    """Register a new parent account with child details in the 'parents' collection."""
    db = get_db()

    existing = await db["parents"].find_one({"parent_email": parent.parent_email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered. Please log in instead.",
        )

    # Generate random baseline screening scores for new registrants across all skills
    random_scores = {
        "writing": random.randint(30, 85),
        "reading": random.randint(30, 85),
        "speaking": random.randint(30, 85),
        "listening": random.randint(30, 85),
        "vocabulary": random.randint(30, 85),
    }

    parent_doc = {
        "parent_name": parent.parent_name,
        "parent_email": parent.parent_email,
        "password": hash_password(parent.password),
        "school": parent.school,
        "child_age": parent.child_age,
        "grade": parent.grade,
        "gender": parent.gender,
        "child_image": parent.child_image,
        "role": "parent",
        "skill_scores": random_scores,
        "created_at": datetime.utcnow(),
    }

    result = await db["parents"].insert_one(parent_doc)
    parent_id = str(result.inserted_id)

    token = create_access_token({
        "sub": parent_id,
        "role": "parent",
        "email": parent.parent_email,
        "name": parent.parent_name,
    })

    return {
        "success": True,
        "message": f"Welcome to CAIRE, {parent.parent_name}! 🌟",
        "token": token,
        "user": {
            "id": parent_id,
            "name": parent.parent_name,
            "email": parent.parent_email,
            "school": parent.school,
            "grade": parent.grade,
            "child_age": parent.child_age,
            "gender": parent.gender,
            "child_image": parent.child_image,
            "role": "parent",
            "skill_scores": random_scores,
        },
    }


@router.post("/parent/login")
async def login_parent(credentials: ParentLogin):
    """Login an existing parent using email and password."""
    db = get_db()

    parent = await db["parents"].find_one({"parent_email": credentials.parent_email})
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No parent account found with this email address.",
        )

    if not verify_password(credentials.password, parent["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again.",
        )

    parent_id = str(parent["_id"])
    token = create_access_token({
        "sub": parent_id,
        "role": "parent",
        "email": parent["parent_email"],
        "name": parent["parent_name"],
    })

    return {
        "success": True,
        "message": f"Welcome back, {parent['parent_name']}! 👨‍👩‍👧",
        "token": token,
        "user": {
            "id": parent_id,
            "name": parent["parent_name"],
            "email": parent["parent_email"],
            "school": parent["school"],
            "grade": parent["grade"],
            "child_age": parent["child_age"],
            "gender": parent["gender"],
            "child_image": parent.get("child_image"),
            "role": "parent",
            "skill_scores": parent.get("skill_scores"),
        },
    }
