"""
backend/routers/fluency.py
──────────────────────────
Reading Fluency Assessment Router — CAIRE
Component : Voice & Reading Fluency Analysis (RFCS)
Author    : W.P.D.N. Samarasinghe — IT23362680
Project   : AI-Assisted Adaptive English Learning System (Sri Lanka, Grade 3-5)

Pipeline (per request)
──────────────────────
 1. Load reference passage text
 2. Receive audio upload → Whisper small → word-level timestamps
 3. window_align(ref, hyp) — Levenshtein (shared with training script)
 4. Derive WPM, WCPM, accuracy, skip/sub/ins rates, pause metrics
    — duration = win[-1].end − win[0].start  (same definition as training)
 5. RFCS = 100 × (0.35·accuracy + 0.30·speed + 0.20·completion + 0.15·pausing)
 6. ML predict(feature_vector) → Low | Medium | High
 7. Build word-alignment from SAME Levenshtein traceback (UI matches metrics)
 8. Save to MongoDB
 9. Return JSON response

Important constraints
─────────────────────
• Audio is NEVER ignored — transcription failure returns HTTP 422, not fake data.
• Reference passage is NEVER used as the hypothesis transcript.
• Pause metrics come exclusively from Whisper word timestamps.
• Feature definitions exactly match ml/scripts/extract_features.py via shared
  ml/fluency_features.py module.
"""

import os
import re
import sys
import tempfile
import logging
from pathlib import Path
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from database import get_db

# ── Shared feature logic (training ↔ inference parity) ─────────────────────
# Add ml/ to Python path so the shared module is importable from the backend
_ML_DIR = Path(__file__).resolve().parent.parent.parent / "ml"
if str(_ML_DIR) not in sys.path:
    sys.path.insert(0, str(_ML_DIR))

from fluency_features import (          # noqa: E402
    FEATURES, ORDER, TARGET_WCPM, PAUSE_MIN, LONG_PAUSE,
    norm,
    window_align,
    extract_features_from_words,
    calculate_rfcs,
    build_word_alignment_from_traceback,
)

logger = logging.getLogger("fluency")
router = APIRouter()

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR     = Path(__file__).resolve().parent.parent.parent
ML_DIR       = BASE_DIR / "ml"
MODELS_DIR   = ML_DIR / "models"
PASSAGES_DIR = ML_DIR / "passages"

# ── Whisper model (loaded once at first request) ───────────────────────────────
_whisper_model = None

def _get_whisper():
    """Load Whisper 'small' model once and cache it."""
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper as _whisper
            logger.info("[Whisper] Loading 'small' model …")
            _whisper_model = _whisper.load_model("small")
            logger.info("[Whisper] Model loaded successfully.")
        except Exception as exc:
            logger.error(f"[Whisper] Failed to load model: {exc}")
            raise RuntimeError(f"Whisper model could not be loaded: {exc}") from exc
    return _whisper_model


def _transcribe_audio(audio_bytes: bytes) -> list[dict]:
    """
    Write audio bytes to a temp file, optionally convert to 16 kHz mono WAV
    with ffmpeg if available, then run Whisper with word-level timestamps.

    Returns list of {"word": str, "start": float, "end": float} dicts.
    Raises ValueError for silent / empty / hallucinated results.
    """
    import subprocess, shutil

    suffix = ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        src_path = tmp.name

    wav_path = src_path
    converted = False
    try:
        # Try to normalise to 16 kHz mono WAV (best for Whisper)
        if shutil.which("ffmpeg"):
            norm_path = src_path.replace(".wav", "_norm.wav")
            result = subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-i", src_path,
                    "-ar", "16000", "-ac", "1",
                    norm_path,
                ],
                capture_output=True, timeout=30,
            )
            if result.returncode == 0:
                wav_path = norm_path
                converted = True
            else:
                logger.warning(f"[ffmpeg] conversion failed: {result.stderr.decode()}")

        whisper_model = _get_whisper()
        result = whisper_model.transcribe(
            wav_path,
            language="en",
            word_timestamps=True,
            condition_on_previous_text=False,
            fp16=False,
            hallucination_silence_threshold=2.0,  # matches transcribe_all.py
        )

        words = [
            {
                "word":  w["word"].strip(),
                "start": float(w["start"]),
                "end":   float(w["end"]),
            }
            for seg in result["segments"]
            for w in seg.get("words", [])
            if w["word"].strip()
        ]

        if not words:
            raise ValueError(
                "Whisper returned no words. The recording may be silent, "
                "too short, or contain non-English speech."
            )

        full_text = result.get("text", "").strip()
        logger.info(
            f"[Whisper] Transcribed {len(words)} words: '{full_text[:80]}…'"
        )
        return words

    finally:
        # Clean up temp files
        try:
            os.unlink(src_path)
        except OSError:
            pass
        if converted:
            try:
                os.unlink(wav_path)
            except OSError:
                pass


# ── ML model (loaded once) ─────────────────────────────────────────────────────
_model_cache = None

def _load_model():
    """Load ml/models/model.pkl (joblib dict) once and cache it."""
    global _model_cache
    if _model_cache is not None:
        return _model_cache
    model_path = MODELS_DIR / "model.pkl"
    if not model_path.exists():
        logger.warning(f"[Model] model.pkl not found at {model_path}. Using RFCS heuristic.")
        return None
    try:
        import joblib
        _model_cache = joblib.load(model_path)
        logger.info(f"[Model] Loaded: {_model_cache.get('name', 'unknown')}")
        return _model_cache
    except Exception as exc:
        logger.warning(f"[Model] Failed to load model.pkl: {exc}")
        return None


def _predict_level(feat: dict, rfcs: float) -> tuple[str, dict]:
    """
    Run ML prediction.  Returns (level_str, class_probabilities_dict).
    Falls back to RFCS threshold only if model.pkl is unavailable.
    """
    mdl = _load_model()
    if mdl is not None:
        try:
            import pandas as pd
            row = pd.DataFrame([feat])[FEATURES]
            classes = mdl.get("classes", ORDER)
            try:
                idx = int(raw_pred)
                level = classes[idx] if 0 <= idx < len(classes) else str(raw_pred)
            except (ValueError, TypeError):
                level = str(raw_pred)
            # Predict probabilities if available
            proba_dict: dict = {}
            if hasattr(mdl["model"], "predict_proba"):
                proba = mdl["model"].predict_proba(row)[0]
                proba_dict = {cls: round(float(p), 3) for cls, p in zip(classes, proba)}
            return level, proba_dict
        except Exception as exc:
            logger.warning(f"[Model] Prediction failed: {exc} — using RFCS heuristic.")
    # Heuristic fallback
    if rfcs >= 82:
        level = "High"
    elif rfcs < 60:
        level = "Low"
    else:
        level = "Medium"
    return level, {}


# ── Feedback generator ─────────────────────────────────────────────────────────
def _build_feedback(rfcs: float, wpm: int, accuracy: float, level: str):
    strengths, areas, recs = [], [], []
    if accuracy >= 0.90:
        strengths.append(f"Excellent word accuracy at {round(accuracy * 100)}%! Great pronunciation.")
    elif accuracy >= 0.75:
        strengths.append(f"Good accuracy at {round(accuracy * 100)}%! Keep reading aloud daily.")
    else:
        areas.append("Focus on decoding multi-syllable words carefully. Slow down on difficult words.")

    if wpm >= 90:
        strengths.append(f"Reading pace of {wpm} WPM meets Grade 3-5 benchmarks. Keep it up!")
    elif wpm >= 65:
        areas.append("Reading speed is developing. Aim for 90+ WPM with regular practice.")
    else:
        areas.append("Reading speed needs improvement. Practice with shorter passages first.")

    if level == "High":
        recs.append("Challenge yourself with Chapter 5 — you are ready!")
        recs.append("Try reading aloud to a friend or family member for extra confidence.")
    elif level == "Medium":
        recs.append("Listen to Professor Hoot's guided narration once before re-reading.")
        recs.append("Practice 3-word phrase chunks to improve reading flow.")
    else:
        recs.append("Start with shorter passages and read slowly with clear pronunciation.")
        recs.append("Ask a parent or teacher to read the passage with you.")
    recs.append("Read aloud for 5 minutes every day — small practice builds super reading powers!")
    return strengths, areas, recs


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/passages")
async def get_passages():
    """List available research passages (P1, P2)."""
    passages = []
    if PASSAGES_DIR.exists():
        for f in sorted(PASSAGES_DIR.glob("*.txt")):
            passages.append({
                "id":       f.stem,
                "filename": f.name,
                "text":     f.read_text(encoding="utf-8").strip(),
            })
    return {"passages": passages, "count": len(passages)}


@router.post("/assess")
async def assess_speech(
    audio:      UploadFile        = File(...),
    passage_id: str               = Form("P1"),
    duration:   float             = Form(0.0),   # wall-clock fallback — not used for pause timing
    student_id: Optional[str]     = Form(None),
):
    """
    AI Reading Fluency Assessment.

    Accepts a real audio file (multipart/form-data).
    Runs Whisper ASR → word alignment → feature extraction → ML prediction.
    Returns RFCS score, fluency level, all metrics, and word alignment.
    Saves session to MongoDB: PersonalizedEnglish.fluency_sessions.

    Errors (HTTP 422) are returned if:
      • Audio is missing / empty
      • Whisper finds no words (silent / non-English recording)
      • Audio format cannot be decoded
    """

    # ── 1. Validate and read audio bytes ──────────────────────────────────────
    if audio is None:
        raise HTTPException(status_code=422, detail="Audio file is required. No recording received.")

    audio_bytes = await audio.read()
    if not audio_bytes or len(audio_bytes) < 1024:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Audio file is too small ({len(audio_bytes)} bytes). "
                "The recording may be empty or corrupt. Please try again."
            ),
        )

    # ── 2. Load reference passage ──────────────────────────────────────────────
    ref_file = PASSAGES_DIR / f"{passage_id}.txt"
    if ref_file.exists():
        raw_ref = ref_file.read_text(encoding="utf-8")
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Passage '{passage_id}' not found. Available passages are in ml/passages/.",
        )

    clean_ref      = re.sub(r"^\d+\.\s*", "", raw_ref, flags=re.MULTILINE)
    clean_ref      = re.sub(r"\s+", " ", clean_ref).strip()
    ref_tokens     = clean_ref.split()
    ref_norm_tks   = norm(clean_ref).split()
    N              = len(ref_norm_tks)

    # ── 3. Whisper transcription ───────────────────────────────────────────────
    try:
        whisper_words = _transcribe_audio(audio_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("[Whisper] Unexpected error")
        raise HTTPException(status_code=500, detail=f"Transcription error: {exc}")

    # ── 4. Feature extraction (shared with training) ───────────────────────────
    feat = extract_features_from_words(ref_norm_tks, whisper_words)

    # Unpack alignment metadata
    hits  = feat["_hits"]
    sub   = feat["_sub"]
    dele  = feat["_dele"]
    ins   = feat["_ins"]
    s     = feat["_win_s"]
    e     = feat["_win_e"]
    win_timed = feat["_win_timed"]
    hyp_norm  = feat["_hyp_norm"]

    # Clean feature dict (remove private keys before model input)
    clean_feat = {k: feat[k] for k in FEATURES}

    # ── 5. RFCS score (exact formula from train_models.py) ────────────────────
    rfcs = calculate_rfcs(
        clean_feat["accuracy"],
        clean_feat["wcpm"],
        clean_feat["skip_rate"],
        clean_feat["avg_pause"],
    )

    # ── 6. ML prediction ──────────────────────────────────────────────────────
    level, class_proba = _predict_level(clean_feat, rfcs)

    # ── 7. Word alignment (from same Levenshtein traceback as features) ───────
    word_alignment = build_word_alignment_from_traceback(
        ref_tokens, ref_norm_tks, win_timed, s, e, hyp_norm
    )

    # ── 8. Feedback ───────────────────────────────────────────────────────────
    strengths, areas, recs = _build_feedback(rfcs, clean_feat["wpm"], clean_feat["accuracy"], level)

    # ── 9. Display metrics ─────────────────────────────────────────────────────
    accuracy_pct   = round(clean_feat["accuracy"] * 100, 1)
    wpm_pct        = min(100, round((clean_feat["wpm"] / TARGET_WCPM) * 100))
    wer            = round((sub + dele) / N, 3) if N > 0 else 0.0
    smoothness_pct = min(100, max(30, 100 - clean_feat["pause_count"] * 5
                                     - round(clean_feat["avg_pause"] * 10)))
    confidence_badge = (
        "High Spirit ⚡"     if rfcs >= 82 else
        "Growing Strong 🌱"  if rfcs >= 60 else
        "Keep Practicing 💛"
    )
    stars = 30 if level == "Low" else (50 if level == "Medium" else 75)

    # ── 10. Save to MongoDB ────────────────────────────────────────────────────
    db = get_db()
    if db is not None:
        try:
            await db["fluency_sessions"].insert_one({
                "student_id":          student_id,
                "passage_id":          passage_id,
                "rfcs":                rfcs,
                "fluency_level":       level,
                "class_probabilities": class_proba,
                "wpm":                 clean_feat["wpm"],
                "wcpm":                clean_feat["wcpm"],
                "accuracy_percent":    accuracy_pct,
                "word_error_rate":     wer,
                "skip_rate":           round(clean_feat["skip_rate"] * 100, 1),
                "sub_rate":            round(clean_feat["sub_rate"]  * 100, 1),
                "pause_count":         clean_feat["pause_count"],
                "avg_pause_sec":       clean_feat["avg_pause"],
                "total_pause_sec":     clean_feat["total_pause"],
                "long_pauses":         clean_feat["long_pauses"],
                "duration_sec":        round(clean_feat["duration"], 2),
                "stars_earned":        stars,
                "feature_vector":      clean_feat,
                "whisper_word_count":  len(whisper_words),
                "recorded_at":         datetime.now(timezone.utc),
            })
        except Exception as exc:
            logger.warning(f"[DB] MongoDB save failed: {exc}")

    # ── 11. Return report ──────────────────────────────────────────────────────
    return {
        "studentName":   "Leo Explorer",
        "studentAvatar": "Lion",
        "passageId":     passage_id,
        "passageTitle":  f"Passage {passage_id}",
        "date":          datetime.now(timezone.utc).strftime("%b %d, %Y"),
        "metrics": {
            "rfcs":              rfcs,
            "fluencyLevel":      level,
            "classProbabilities": class_proba,
            "confidenceBadge":   confidence_badge,
            "wpm":               clean_feat["wpm"],
            "wpmScore":          min(5.0, round(clean_feat["wpm"] / 22, 1)),
            "wpmPercent":        wpm_pct,
            "wcpm":              clean_feat["wcpm"],
            "accuracyPercent":   accuracy_pct,
            "accuracyScore":     min(5.0, round(accuracy_pct / 20, 1)),
            "wordErrorRate":     wer,
            "smoothnessScore":   min(5.0, round(smoothness_pct / 20, 1)),
            "smoothnessPercent": smoothness_pct,
            "pauseCount":        clean_feat["pause_count"],
            "avgPauseDuration":  clean_feat["avg_pause"],
            "totalDuration":     round(clean_feat["duration"], 1),
            "featureVector": {
                "wpm":                     clean_feat["wpm"],
                "wcpm":                    clean_feat["wcpm"],
                "readingAccuracyPercent":  accuracy_pct,
                "wordErrorRate":           wer,
                "skipRatePercent":         round(clean_feat["skip_rate"] * 100, 1),
                "subRatePercent":          round(clean_feat["sub_rate"]  * 100, 1),
                "pauseCount":              clean_feat["pause_count"],
                "avgPauseDurationSec":     clean_feat["avg_pause"],
                "totalPauseSec":           clean_feat["total_pause"],
                "longPauses":              clean_feat["long_pauses"],
                "totalReadingDurationSec": round(clean_feat["duration"], 1),
            },
        },
        "wordAlignment":   word_alignment,
        "strengths":       strengths,
        "areasToImprove":  areas,
        "recommendations": recs,
        "starsEarned":     stars,
        "totalStars":      500,
        "streakDays":      4,
    }


@router.get("/sessions/{student_id}")
async def get_student_sessions(student_id: str, limit: int = 10):
    """Retrieve past fluency sessions from MongoDB."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected.")
    cursor   = db["fluency_sessions"].find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("recorded_at", -1).limit(limit)
    sessions = await cursor.to_list(length=limit)
    return {"student_id": student_id, "sessions": sessions, "count": len(sessions)}


@router.get("/model/info")
async def model_info():
    """Return info about the loaded ML model."""
    mdl = _load_model()
    if mdl is None:
        return {
            "status":  "not_loaded",
            "path":    str(MODELS_DIR / "model.pkl"),
            "message": "model.pkl not found — RFCS threshold fallback active.",
        }
    return {
        "status":      "loaded",
        "name":        mdl.get("name", "unknown"),
        "features":    mdl.get("features", FEATURES),
        "classes":     mdl.get("classes", ORDER),
        "target_wcpm": mdl.get("target_wcpm", TARGET_WCPM),
        "path":        str(MODELS_DIR / "model.pkl"),
    }


@router.get("/whisper/status")
async def whisper_status():
    """Check if Whisper model is loaded (useful for frontend health check)."""
    try:
        _ = _get_whisper()
        return {"status": "ready", "model": "small"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}
