"""
ml/scripts/benchmark_assessment.py
───────────────────────────────────
Benchmark individual stages of the Reading Fluency Assessment pipeline.
Measures:
  1. Audio file reading & ffmpeg normalization
  2. Whisper model loading (cold vs warm)
  3. Whisper transcription with word timestamps
  4. Levenshtein alignment & 11 ML feature extraction
  5. ML prediction (Logistic Regression model.pkl)
  6. Database persistence (MongoDB Atlas)
  7. Total response time
"""

import sys
import time
import subprocess
import shutil
import tempfile
import os
from pathlib import Path

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ML_DIR = BASE_DIR / "ml"
BACKEND_DIR = BASE_DIR / "backend"
sys.path.insert(0, str(ML_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

from fluency_features import (
    norm,
    extract_features_from_words,
    calculate_rfcs,
    build_word_alignment_from_traceback,
    FEATURES,
    ORDER,
    TARGET_WCPM,
)

TEST_WAV = r"D:\Research\Reading_Fluency\04_Standardized_WAV\S001_G4_P1_S2.wav"
PASSAGE_FILE = ML_DIR / "passages" / "P1.txt"

def run_benchmark():
    print("=" * 80)
    print("READING FLUENCY ASSESSMENT: STEP-BY-STEP LATENCY AUDIT")
    print("=" * 80)

    if not os.path.exists(TEST_WAV):
        print(f"Error: {TEST_WAV} does not exist!")
        return

    wav_bytes = open(TEST_WAV, "rb").read()
    print(f"Test Audio: {os.path.basename(TEST_WAV)} ({len(wav_bytes) / 1024:.1f} KB)")
    
    # Passage
    raw_ref = PASSAGE_FILE.read_text(encoding="utf-8")
    import re
    clean_ref = re.sub(r"^\d+\.\s*", "", raw_ref, flags=re.MULTILINE)
    clean_ref = re.sub(r"\s+", " ", clean_ref).strip()
    ref_tokens = clean_ref.split()
    ref_norm_tks = norm(clean_ref).split()
    N = len(ref_norm_tks)

    timings = {}

    # ── 1. Audio write & FFmpeg normalization ─────────────────────────────────
    t0 = time.perf_counter()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(wav_bytes)
        src_path = tmp.name

    norm_path = src_path.replace(".wav", "_norm.wav")
    converted = False
    if shutil.which("ffmpeg"):
        res = subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", src_path, "-ar", "16000", "-ac", "1", norm_path],
            capture_output=True
        )
        if res.returncode == 0:
            wav_input = norm_path
            converted = True
        else:
            wav_input = src_path
    else:
        wav_input = src_path
    timings["1_audio_and_ffmpeg_ms"] = (time.perf_counter() - t0) * 1000

    # ── 2. Whisper Model Load (Cold) ──────────────────────────────────────────
    t0 = time.perf_counter()
    import whisper
    whisper_model = whisper.load_model("small")
    timings["2_whisper_load_cold_ms"] = (time.perf_counter() - t0) * 1000

    # ── 3. Whisper Transcription (Run 1) ──────────────────────────────────────
    t0 = time.perf_counter()
    result = whisper_model.transcribe(
        wav_input,
        language="en",
        word_timestamps=True,
        condition_on_previous_text=False,
        fp16=False,
        hallucination_silence_threshold=2.0,
    )
    words = [
        {"word": w["word"].strip(), "start": float(w["start"]), "end": float(w["end"])}
        for seg in result["segments"]
        for w in seg.get("words", [])
        if w["word"].strip()
    ]
    timings["3_whisper_transcribe_run1_ms"] = (time.perf_counter() - t0) * 1000

    # ── 3b. Whisper Transcription (Run 2 - Warm) ──────────────────────────────
    t0 = time.perf_counter()
    result2 = whisper_model.transcribe(
        wav_input,
        language="en",
        word_timestamps=True,
        condition_on_previous_text=False,
        fp16=False,
        hallucination_silence_threshold=2.0,
    )
    timings["3b_whisper_transcribe_warm_ms"] = (time.perf_counter() - t0) * 1000

    # ── 4. Feature Extraction & Levenshtein Alignment ─────────────────────────
    t0 = time.perf_counter()
    feat = extract_features_from_words(ref_norm_tks, words)
    clean_feat = {k: feat[k] for k in FEATURES}
    rfcs = calculate_rfcs(clean_feat["accuracy"], clean_feat["wcpm"], clean_feat["skip_rate"], clean_feat["avg_pause"])
    aln = build_word_alignment_from_traceback(
        ref_tokens, ref_norm_tks, feat["_win_timed"], feat["_win_s"], feat["_win_e"], feat["_hyp_norm"]
    )
    timings["4_alignment_features_ms"] = (time.perf_counter() - t0) * 1000

    # ── 5. ML Model Prediction ────────────────────────────────────────────────
    t0 = time.perf_counter()
    import joblib, pandas as pd
    model_obj = joblib.load(ML_DIR / "models" / "model.pkl")
    row = pd.DataFrame([clean_feat])[FEATURES]
    pred = model_obj["model"].predict(row)[0]
    classes = model_obj.get("classes", ORDER)
    idx = int(pred) if str(pred).isdigit() else 0
    level = classes[idx] if idx < len(classes) else str(pred)
    timings["5_ml_prediction_ms"] = (time.perf_counter() - t0) * 1000

    # ── 6. Database Save (MongoDB Atlas) ──────────────────────────────────────
    t0 = time.perf_counter()
    db_save_time = 0.0
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio
        async def save():
            uri = os.getenv("MONGODB_URI")
            if uri:
                client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=4000)
                db = client["PersonalizedEnglish"]
                await db["test_pings"].insert_one({"test": True, "ts": time.time()})
                await db["test_pings"].delete_one({"test": True})
        asyncio.run(save())
        db_save_time = (time.perf_counter() - t0) * 1000
    except Exception as exc:
        db_save_time = -1.0
        print(f"DB ping failed or timed out: {exc}")
    timings["6_db_save_ms"] = db_save_time

    # Clean up temp files
    try:
        os.unlink(src_path)
        if converted:
            os.unlink(norm_path)
    except Exception:
        pass

    print("\nSTAGE LATENCY MEASUREMENTS:")
    print("-" * 60)
    print(f"1. Audio temp write + FFmpeg 16kHz conversion: {timings['1_audio_and_ffmpeg_ms']:.1f} ms ({timings['1_audio_and_ffmpeg_ms']/1000:.2f} s)")
    print(f"2. Whisper 'small' Cold Load from Disk:        {timings['2_whisper_load_cold_ms']:.1f} ms ({timings['2_whisper_load_cold_ms']/1000:.2f} s)")
    print(f"3. Whisper Transcription (Word Timestamps):   {timings['3_whisper_transcribe_run1_ms']:.1f} ms ({timings['3_whisper_transcribe_run1_ms']/1000:.2f} s)")
    print(f"   Whisper Transcription (Warm Cache):        {timings['3b_whisper_transcribe_warm_ms']:.1f} ms ({timings['3b_whisper_transcribe_warm_ms']/1000:.2f} s)")
    print(f"4. Word Alignment (Levenshtein) + Features:   {timings['4_alignment_features_ms']:.1f} ms ({timings['4_alignment_features_ms']/1000:.4f} s)")
    print(f"5. ML Prediction (Logistic Regression):       {timings['5_ml_prediction_ms']:.1f} ms ({timings['5_ml_prediction_ms']/1000:.4f} s)")
    print(f"6. Database Save (MongoDB Atlas Cloud ping):  {timings['6_db_save_ms']:.1f} ms ({timings['6_db_save_ms']/1000:.2f} s)")
    print("-" * 60)
    total_cold = timings['1_audio_and_ffmpeg_ms'] + timings['2_whisper_load_cold_ms'] + timings['3_whisper_transcribe_run1_ms'] + timings['4_alignment_features_ms'] + timings['5_ml_prediction_ms'] + max(0, timings['6_db_save_ms'])
    total_warm = timings['1_audio_and_ffmpeg_ms'] + timings['3b_whisper_transcribe_warm_ms'] + timings['4_alignment_features_ms'] + timings['5_ml_prediction_ms'] + max(0, timings['6_db_save_ms'])
    print(f"Total API Latency (Cold Start):               {total_cold:.1f} ms ({total_cold/1000:.2f} s)")
    print(f"Total API Latency (Warm Preloaded):           {total_warm:.1f} ms ({total_warm/1000:.2f} s)")
    print("=" * 80)

if __name__ == "__main__":
    run_benchmark()
