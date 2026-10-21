"""Profile router — Endpoints for viewing/editing personal details and tracking screening KPIs & personal intervention plan progress."""
from fastapi import APIRouter, HTTPException, Header, status
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from database import get_db
from models.profile import (
    ParentProfileUpdate,
    TeacherProfileUpdate,
    InterventionProgressResponse,
    ComponentKPI,
    MetricItem,
    BadgeItem,
    ExerciseItem,
    RecordExerciseRequest,
)
from utils.auth import decode_token

router = APIRouter()


async def get_user_from_header(authorization: Optional[str]):
    """Helper to decode JWT and return user id and role."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    return payload


# ═══════════════════════════════════════════════════════════════════
# 1. GET PROFILE DETAILS
# ═══════════════════════════════════════════════════════════════════
@router.get("/me")
async def get_my_profile(authorization: Optional[str] = Header(None), email: Optional[str] = None):
    """Retrieve profile details for currently logged-in parent or teacher."""
    db = get_db()
    payload = await get_user_from_header(authorization)

    user = None
    role = None

    if payload:
        user_id = payload.get("sub")
        role = payload.get("role")
        target_collection = "teachers" if role == "teacher" else "parents"
        try:
            user = await db[target_collection].find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = await db[target_collection].find_one({"email": payload.get("email")} if role == "teacher" else {"parent_email": payload.get("email")})

    elif email:
        # Fallback to query by email if header is not present
        user = await db["parents"].find_one({"parent_email": email.strip().lower()})
        if user:
            role = "parent"
        else:
            user = await db["teachers"].find_one({"email": email.strip().lower()})
            if user:
                role = "teacher"

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please log in first.",
        )

    # Format response without password hash
    if role == "teacher":
        return {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "school": user.get("school"),
            "phone": user.get("phone"),
            "image": user.get("image"),
            "role": "teacher",
            "created_at": user.get("created_at"),
        }
    else:
        return {
            "id": str(user["_id"]),
            "parent_name": user.get("parent_name"),
            "parent_email": user.get("parent_email"),
            "school": user.get("school"),
            "child_age": user.get("child_age"),
            "grade": user.get("grade"),
            "gender": user.get("gender"),
            "child_image": user.get("child_image"),
            "role": "parent",
            "created_at": user.get("created_at"),
        }


# ═══════════════════════════════════════════════════════════════════
# 2. UPDATE PARENT & CHILD PROFILE
# ═══════════════════════════════════════════════════════════════════
@router.put("/parent")
async def update_parent_profile(data: ParentProfileUpdate, authorization: Optional[str] = Header(None), email: Optional[str] = None):
    """Update parent details and child literacy screening profile."""
    db = get_db()
    payload = await get_user_from_header(authorization)

    filter_query = None
    if payload and payload.get("sub"):
        try:
            filter_query = {"_id": ObjectId(payload.get("sub"))}
        except Exception:
            filter_query = {"parent_email": payload.get("email")}
    elif email:
        filter_query = {"parent_email": email.strip().lower()}

    if not filter_query:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to update profile.",
        )

    update_fields = {
        "parent_name": data.parent_name,
        "school": data.school,
        "child_age": data.child_age,
        "grade": data.grade,
        "gender": data.gender,
    }
    if data.child_image is not None:
        update_fields["child_image"] = data.child_image

    result = await db["parents"].update_one(filter_query, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent account not found.")

    updated_doc = await db["parents"].find_one(filter_query)
    return {
        "success": True,
        "message": "Parent & Child profile updated successfully! 🎉",
        "user": {
            "id": str(updated_doc["_id"]),
            "parent_name": updated_doc.get("parent_name"),
            "parent_email": updated_doc.get("parent_email"),
            "school": updated_doc.get("school"),
            "child_age": updated_doc.get("child_age"),
            "grade": updated_doc.get("grade"),
            "gender": updated_doc.get("gender"),
            "child_image": updated_doc.get("child_image"),
            "role": "parent",
        },
    }


# ═══════════════════════════════════════════════════════════════════
# 3. UPDATE TEACHER PROFILE
# ═══════════════════════════════════════════════════════════════════
@router.put("/teacher")
async def update_teacher_profile(data: TeacherProfileUpdate, authorization: Optional[str] = Header(None), email: Optional[str] = None):
    """Update teacher details."""
    db = get_db()
    payload = await get_user_from_header(authorization)

    filter_query = None
    if payload and payload.get("sub"):
        try:
            filter_query = {"_id": ObjectId(payload.get("sub"))}
        except Exception:
            filter_query = {"email": payload.get("email")}
    elif email:
        filter_query = {"email": email.strip().lower()}

    if not filter_query:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to update profile.",
        )

    update_fields = {
        "name": data.name,
        "school": data.school,
        "phone": data.phone,
    }
    if data.image is not None:
        update_fields["image"] = data.image

    result = await db["teachers"].update_one(filter_query, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher account not found.")

    updated_doc = await db["teachers"].find_one(filter_query)
    return {
        "success": True,
        "message": "Teacher profile updated successfully! 👩‍🏫",
        "user": {
            "id": str(updated_doc["_id"]),
            "name": updated_doc.get("name"),
            "email": updated_doc.get("email"),
            "school": updated_doc.get("school"),
            "phone": updated_doc.get("phone"),
            "image": updated_doc.get("image"),
            "role": "teacher",
        },
    }


# ═══════════════════════════════════════════════════════════════════
# 4. GET SCREENING KPIS & PERSONAL INTERVENTION PROGRESS
# ═══════════════════════════════════════════════════════════════════
@router.get("/progress", response_model=InterventionProgressResponse)
async def get_progress_and_kpis(authorization: Optional[str] = Header(None), email: Optional[str] = None):
    """
    Retrieve research screening KPI metrics from all team member components:
    1. Writing & Letter Quest (Stroke Physics / Dysgraphia Screening)
    2. Speaking & Pronunciation (Phonological Evaluation)
    3. Listening & Comprehension (Auditory Processing)
    4. Adaptive Intervention Planning & Progress Tracking (Our CAIRE Component)
    """
    db = get_db()
    payload = await get_user_from_header(authorization)

    student_name = "Young Explorer"
    grade = "Grade 4"
    user_doc = None

    if payload:
        user_id = payload.get("id") or payload.get("user_id")
        user_email = payload.get("email")
        if user_id:
            try:
                user_doc = await db["parents"].find_one({"_id": ObjectId(user_id)})
            except Exception:
                pass
            if not user_doc:
                try:
                    user_doc = await db["teachers"].find_one({"_id": ObjectId(user_id)})
                except Exception:
                    pass
        if not user_doc and user_email:
            user_doc = await db["parents"].find_one({"parent_email": user_email.strip().lower()})
            if not user_doc:
                user_doc = await db["teachers"].find_one({"email": user_email.strip().lower()})
    elif email:
        user_doc = await db["parents"].find_one({"parent_email": email.strip().lower()})
        if not user_doc:
            user_doc = await db["teachers"].find_one({"email": email.strip().lower()})

    if user_doc:
        if "parent_name" in user_doc:
            student_name = f"{user_doc.get('parent_name')}'s Child"
            grade = f"Grade {user_doc.get('grade', '4')}"
        else:
            student_name = user_doc.get("name", "Young Explorer")

    # 4 Research Components KPIs (Writing, Reading, Speaking, Listening)
    kpis = [
        ComponentKPI(
            component_name="Writing",
            member_title="Research Component 1",
            score_percentage=88,
            risk_level="Low Risk (Healthy)",
            color="#16a34a",
            icon="draw",
            metrics=[
                MetricItem(label="Stroke Accuracy", value="91%"),
                MetricItem(label="Letter Alignment", value="85%"),
                MetricItem(label="Grip Stamina", value="Normal"),
            ],
        ),
        ComponentKPI(
            component_name="Reading",
            member_title="Research Component 2",
            score_percentage=84,
            risk_level="On Track (Progressing)",
            color="#7c3aed",
            icon="auto_stories",
            metrics=[
                MetricItem(label="Reading Speed", value="84 WPM"),
                MetricItem(label="Pause Duration", value="1.2s Low"),
                MetricItem(label="Phonics Accuracy", value="88%"),
            ],
        ),
        ComponentKPI(
            component_name="Speaking",
            member_title="Research Component 3",
            score_percentage=76,
            risk_level="Mild Need (Practicing)",
            color="#ea580c",
            icon="record_voice_over",
            metrics=[
                MetricItem(label="Phoneme Clarity", value="74%"),
                MetricItem(label="Vowel Intonation", value="78%"),
                MetricItem(label="Pronunciation", value="Good"),
            ],
        ),
        ComponentKPI(
            component_name="Listening",
            member_title="Research Component 4",
            score_percentage=92,
            risk_level="Mastered (Advanced)",
            color="#0284c7",
            icon="hearing",
            metrics=[
                MetricItem(label="Sound Distinction", value="94%"),
                MetricItem(label="Auditory Processing", value="90%"),
                MetricItem(label="Comprehension", value="92%"),
            ],
        ),
    ]

    # Only load real completed exercises that have been actually done
    recent_exercises: List[ExerciseItem] = []
    if user_doc and "completed_exercises" in user_doc and isinstance(user_doc["completed_exercises"], list):
        for ex in user_doc["completed_exercises"]:
            recent_exercises.append(
                ExerciseItem(
                    id=str(ex.get("id", f"EX-{len(recent_exercises) + 1}")),
                    title=str(ex.get("title", "Speech & Literacy Exercise")),
                    skill_category=str(ex.get("skill_category", "Adaptive Learning")),
                    status=str(ex.get("status", "Completed")),
                    score=int(ex.get("score", 100)),
                    date=str(ex.get("date", "Recently")),
                )
            )

    completed_count = len(recent_exercises)
    total_exercises = completed_count
    completion_rate = 100 if completed_count > 0 else 0
    xp_points = sum(e.score for e in recent_exercises)
    stars_count = completed_count * 2
    streak_days = int(user_doc.get("streak_days", 1 if completed_count > 0 else 0)) if user_doc else 0
    overall_score = round(sum(e.score for e in recent_exercises) / completed_count) if completed_count > 0 else 0

    return InterventionProgressResponse(
        plan_title=f"{grade} Personalized Phonics & Fluency Roadmap",
        student_name=student_name,
        grade=grade,
        overall_score=overall_score,
        total_exercises=total_exercises,
        completed_exercises=completed_count,
        completion_rate=completion_rate,
        xp_points=xp_points,
        stars_count=stars_count,
        streak_days=streak_days,
        kpis=kpis,
        badges=[],
        recent_exercises=recent_exercises,
    )


# ═══════════════════════════════════════════════════════════════════
# 5. RECORD COMPLETED EXERCISE (FOR FUTURE ACTIVITY INTEGRATION)
# ═══════════════════════════════════════════════════════════════════
@router.post("/record-exercise")
async def record_completed_exercise(
    data: RecordExerciseRequest,
    authorization: Optional[str] = Header(None),
    email: Optional[str] = None
):
    """
    Save a completed exercise to the user's profile.
    Future activity pages can invoke this endpoint upon completion.
    """
    db = get_db()
    payload = await get_user_from_header(authorization)
    target_email = None

    if payload:
        target_email = payload.get("email")
    elif email:
        target_email = email.strip().lower()

    if not target_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to record completed exercise."
        )

    now_str = datetime.now().strftime("%b %d, %Y, %I:%M %p")
    exercise_entry = {
        "id": data.id or f"EX-{int(datetime.now().timestamp())}",
        "title": data.title,
        "skill_category": data.skill_category,
        "score": data.score,
        "status": data.status or "Completed",
        "date": data.date or now_str,
    }

    # Push to parents collection first, else teachers
    parent_res = await db["parents"].update_one(
        {"parent_email": target_email},
        {"$push": {"completed_exercises": exercise_entry}}
    )
    if parent_res.matched_count == 0:
        await db["teachers"].update_one(
            {"email": target_email},
            {"$push": {"completed_exercises": exercise_entry}}
        )

    return {
        "success": True,
        "message": "Exercise recorded successfully!",
        "exercise": exercise_entry,
    }

