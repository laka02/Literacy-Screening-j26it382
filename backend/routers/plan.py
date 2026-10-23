"""
Personalized Intervention Plan Router
Evaluates student scores using Rules/expert_rules.py to dynamically
generate 3-stage adaptive adventure maps for Grade 3-5 students.
"""
from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from database import get_db
from utils.auth import decode_token
from Rules.expert_rules import evaluate_skill, generate_adaptive_plan, classify_performance, RULES

router = APIRouter()


async def get_user_from_header(authorization: Optional[str]):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    return decode_token(token)


class GeneratePlanRequest(BaseModel):
    skill: Optional[str] = Field(None, description="Skill category: writing, speaking, reading, vocabulary")
    skill_type: Optional[str] = None
    score: Optional[Any] = None
    current_score: Optional[Any] = None
    previous_score: Optional[Any] = None
    grade: Optional[Any] = "4"


class CompleteStageRequest(BaseModel):
    skill: Optional[str] = "writing"
    skill_type: Optional[str] = None
    stage_number: Optional[Any] = 1
    stage_title: Optional[str] = "Stage 1"
    score: Optional[Any] = 100
    xp_earned: Optional[Any] = 50
    hints_used: Optional[Any] = 0
    attempts: Optional[Any] = 1


@router.get("/skills")
async def get_available_skills(
    authorization: Optional[str] = Header(None),
    email: Optional[str] = None
):
    """Return available skill options with current assessment baselines."""
    db = get_db()
    payload = await get_user_from_header(authorization)
    target_email = payload.get("email") if payload else (email.strip().lower() if email else None)

    grade = "4"
    child_name = "Young Explorer"
    scores = {
        "writing": 38,
        "reading": 42,
        "speaking": 35,
        "listening": 40,
        "vocabulary": 36,
    }

    if target_email:
        parent = await db["parents"].find_one({"parent_email": target_email})
        if parent:
            grade = str(parent.get("grade", "4"))
            child_name = f"{parent.get('parent_name', 'Student')}'s Child"
            # Prioritize screening skill_scores stored on the parent account
            stored_scores = parent.get("skill_scores")
            if stored_scores and isinstance(stored_scores, dict):
                for k, v in stored_scores.items():
                    if k in scores and v is not None:
                        scores[k] = int(v)
            else:
                # If no scores exist yet, initialize with low scores (< 50) and persist
                low_scores = {
                    "writing": 38,
                    "reading": 42,
                    "speaking": 35,
                    "listening": 40,
                    "vocabulary": 36,
                }
                await db["parents"].update_one(
                    {"_id": parent["_id"]},
                    {"$set": {"skill_scores": low_scores}}
                )
                scores.update(low_scores)

    skills_data = [
        {
            "id": "writing",
            "name": "Writing",
            "animal_guide": "Leo the Lion",
            "guide_avatar": "🦁",
            "icon": "draw",
            "color": "#16a34a",
            "current_score": scores["writing"],
            "performance_band": classify_performance(scores["writing"]),
            "tagline": "Master letter alignment, smooth stroke physics & neat handwriting!",
            "rules_applied": ["R01", "R04", "R08", "R09"],
        },
        {
            "id": "reading",
            "name": "Reading",
            "animal_guide": "Ruby the Deer",
            "guide_avatar": "🦌",
            "icon": "auto_stories",
            "color": "#7c3aed",
            "current_score": scores["reading"],
            "performance_band": classify_performance(scores["reading"]),
            "tagline": "Read playful Sri Lankan adventure tales with minimal hesitation pauses!",
            "rules_applied": ["R03", "R07", "R16", "R33"],
        },
        {
            "id": "listening",
            "name": "Listening",
            "animal_guide": "Barnaby the Bear",
            "guide_avatar": "🐻",
            "icon": "hearing",
            "color": "#0284c7",
            "current_score": scores["listening"],
            "performance_band": classify_performance(scores["listening"]),
            "tagline": "Auditory processing, sound distinction & story comprehension challenges!",
            "rules_applied": ["R02", "R06", "R18", "R22"],
        },
    ]

    return {
        "child_name": child_name,
        "grade": grade,
        "skills": skills_data
    }


@router.post("/generate")
async def generate_plan(
    data: GeneratePlanRequest,
    authorization: Optional[str] = Header(None),
    email: Optional[str] = None
):
    """
    Generate an interactive 3-stage adventure map using Rules/expert_rules.py
    Stage 1: Foundational / Easy
    Stage 2: Guided Practice / Medium
    Stage 3: Challenge / Stretch Goal
    """
    db = get_db()
    payload = await get_user_from_header(authorization)
    target_email = payload.get("email") if payload else (email.strip().lower() if email else None)

    target_skill = (data.skill or data.skill_type or "writing").strip().lower()

    # Safely parse user score
    raw_score = data.score if data.score is not None else data.current_score
    try:
        user_score = float(raw_score) if raw_score is not None else None
    except (ValueError, TypeError):
        user_score = None

    # Safely parse previous score
    raw_prev = data.previous_score
    try:
        prev_score = float(raw_prev) if raw_prev is not None else None
    except (ValueError, TypeError):
        prev_score = None

    # Safely parse grade
    grade = str(data.grade).strip() if data.grade is not None else "4"

    # Check database for student's score and completed stages if not passed
    completed_stages = []
    user_skill_scores = None
    if target_email:
        parent = await db["parents"].find_one({"parent_email": target_email})
        user_doc = parent
        if not user_doc:
            user_doc = await db["teachers"].find_one({"email": target_email})

        if user_doc:
            if parent:
                grade = str(parent.get("grade", grade))
                user_skill_scores = parent.get("skill_scores")
                if user_score is None and user_skill_scores and isinstance(user_skill_scores, dict):
                    user_score = float(user_skill_scores.get(target_skill, 40.0))

            for ex in user_doc.get("completed_exercises", []):
                cat = str(ex.get("skill_category", "")).lower()
                ex_id = str(ex.get("id", "")).lower()
                title = str(ex.get("title", "")).lower()
                if target_skill in cat or f"map-{target_skill}" in ex_id or target_skill in title:
                    for s_num in [1, 2, 3]:
                        if f"stage {s_num}" in title or f"stage-{s_num}" in ex_id or f"-{s_num}-" in ex_id:
                            if s_num not in completed_stages:
                                completed_stages.append(s_num)

    if user_score is None:
        user_score = 40.0

    # Execute Hybrid Inference (Random Forest ML Model + Expert Rules Engine)
    plan_output = generate_adaptive_plan(
        skill_type=target_skill,
        current_score=user_score,
        previous_score=prev_score,
        grade=grade,
        scores_dict=user_skill_scores
    )

    plan_output["completed_stages"] = completed_stages
    for stage in plan_output.get("stages", []):
        s_num = stage.get("stage_number")
        if s_num in completed_stages:
            stage["status"] = "Completed"
            stage["locked"] = False
        elif s_num == 1 or (s_num - 1) in completed_stages:
            stage["status"] = "Ready"
            stage["locked"] = False
        else:
            stage["status"] = "Locked"
            stage["locked"] = True

    return plan_output


@router.post("/complete-stage")
async def complete_stage(
    data: CompleteStageRequest,
    authorization: Optional[str] = Header(None),
    email: Optional[str] = None
):
    """
    Record completed stage activity.
    Applies expert rule R25 (Adapt next activity using recorded progress)
    and saves to completed_exercises array in MongoDB for Profile sync.
    """
    db = get_db()
    payload = await get_user_from_header(authorization)
    target_email = payload.get("email") if payload else (email.strip().lower() if email else None)

    if not target_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User email required.")

    target_skill = (data.skill or data.skill_type or "writing").strip().lower()
    stage_num = int(data.stage_number) if data.stage_number is not None else 1
    stage_ttl = str(data.stage_title or f"Stage {stage_num}")
    score_val = int(float(data.score)) if data.score is not None else 100
    xp_val = int(data.xp_earned) if data.xp_earned is not None else 50
    hints_val = int(data.hints_used) if data.hints_used is not None else 0
    attempts_val = int(data.attempts) if data.attempts is not None else 1

    now_str = datetime.now().strftime("%b %d, %Y, %I:%M %p")
    exercise_entry = {
        "id": f"MAP-{target_skill.upper()}-{stage_num}-{int(datetime.now().timestamp())}",
        "title": f"{stage_ttl} (Stage {stage_num})",
        "skill_category": f"{target_skill.capitalize()} Adaptive Plan",
        "score": score_val,
        "status": "Completed",
        "date": now_str,
        "xp_earned": xp_val,
        "hints_used": hints_val,
        "attempts": attempts_val,
    }

    # Push to parent document
    update_res = await db["parents"].update_one(
        {"parent_email": target_email},
        {
            "$push": {"completed_exercises": exercise_entry},
            "$inc": {"xp_points": xp_val, "stars_count": 3}
        }
    )

    if update_res.matched_count == 0:
        await db["teachers"].update_one(
            {"email": target_email},
            {
                "$push": {"completed_exercises": exercise_entry},
                "$inc": {"xp_points": data.xp_earned, "stars_count": 3}
            }
        )

    return {
        "success": True,
        "message": f"Stage {data.stage_number} completed and recorded!",
        "exercise": exercise_entry,
        "unlocked_next_stage": data.stage_number + 1 if data.stage_number < 3 else None,
    }
