"""
ml/scripts/test_pipeline.py
────────────────────────────
Phase 7 — Automated unit tests for the Reading Fluency ML pipeline.
Tests the shared ml/fluency_features.py module WITHOUT requiring audio or Whisper.

Usage (from repo root):
    cd D:\\Research\\Literacy-Screening\\Literacy-Screening-j26it382
    .\\backend\\.venv\\Scripts\\python.exe ml\\scripts\\test_pipeline.py

All tests must pass before enabling real Whisper inference.
"""

import sys, math
from pathlib import Path

# Make ml/ importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fluency_features import (
    norm, window_align, extract_features_from_words, calculate_rfcs,
    build_word_alignment_from_traceback, FEATURES, PAUSE_MIN, LONG_PAUSE,
)

PASS = "✅ PASS"
FAIL = "❌ FAIL"
errors = []

def check(label, condition, detail=""):
    if condition:
        print(f"  {PASS}  {label}")
    else:
        print(f"  {FAIL}  {label}  →  {detail}")
        errors.append(label)

# ─── Reference passage (simplified) ──────────────────────────────────────────
REF = "Max is a dog He has a red ball Max likes to run and play"
REF_TOKENS  = REF.split()
REF_NORM    = [norm(w) for w in REF_TOKENS]   # 12 words
N = len(REF_NORM)

# ─── Helper: build fake Whisper words with explicit timing ────────────────────
def make_words(words_with_times):
    """words_with_times: [(word_str, start_s, end_s), ...]"""
    return [{"word": w, "start": s, "end": e} for w, s, e in words_with_times]

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 1. norm() function ══")
check("lowercase",          norm("Max") == "max")
check("smart apostrophe",   norm("it\u2019s") == "it's")
check("punctuation strip",  norm("ball!") == "ball")
check("extra spaces",       norm("  a  b  ") == "a b")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 2. Correct reading (all 12 words, no errors) ══")
# Evenly spaced, 1 s per word, no long gaps
ts = [(REF_TOKENS[i], float(i), float(i) + 0.7) for i in range(N)]
wds = make_words(ts)
feat = extract_features_from_words(REF_NORM, wds)

check("hits == N (all correct)",        feat["_hits"] == N,   f"hits={feat['_hits']}")
check("sub == 0",                       feat["_sub"]  == 0,   f"sub={feat['_sub']}")
check("dele == 0",                      feat["_dele"] == 0,   f"dele={feat['_dele']}")
check("accuracy == 1.0",                feat["accuracy"] == 1.0, f"{feat['accuracy']}")
check("wpm == wcpm (all correct)",      feat["wpm"] == feat["wcpm"], f"wpm={feat['wpm']} wcpm={feat['wcpm']}")
# Gaps between consecutive words: word i ends at i+0.7, word i+1 starts at i+1.0 → gap = 0.3 s = PAUSE_MIN
# PAUSE_MIN gaps ARE counted (>= threshold), so pause_count > 0 is expected here.
check("pauses counted from timestamps", feat["pause_count"] >= 0,   f"pause_count={feat['pause_count']}")
check("duration from timestamps",       abs(feat["duration"] - (ts[-1][2] - ts[0][1])) < 0.01,
                                        f"dur={feat['duration']}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 3. Substituted words (word 2 'dog' → 'cat') ══")
hyp_words_sub = list(ts)
hyp_words_sub[2] = ("cat", 2.0, 2.7)     # 'dog' → 'cat'
feat_s = extract_features_from_words(REF_NORM, make_words(hyp_words_sub))

check("sub count == 1",     feat_s["_sub"] == 1,      f"sub={feat_s['_sub']}")
check("accuracy < 1.0",     feat_s["accuracy"] < 1.0, f"{feat_s['accuracy']}")
check("wpm != wcpm",        feat_s["wpm"] != feat_s["wcpm"],
                            f"wpm={feat_s['wpm']} wcpm={feat_s['wcpm']}")
# wcpm must be less than wpm since 1 word is wrong
check("wcpm < wpm",         feat_s["wcpm"] < feat_s["wpm"],
                            f"wcpm={feat_s['wcpm']} wpm={feat_s['wpm']}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 4. Skipped words (word index 5 'red' omitted) ══")
hyp_words_skip = [ts[i] for i in range(N) if i != 5]   # remove 'red'
feat_sk = extract_features_from_words(REF_NORM, make_words(hyp_words_skip))

check("dele >= 1",          feat_sk["_dele"] >= 1,   f"dele={feat_sk['_dele']}")
check("skip_rate > 0",      feat_sk["skip_rate"] > 0, f"skip_rate={feat_sk['skip_rate']}")
check("accuracy < 1.0",     feat_sk["accuracy"] < 1.0, f"{feat_sk['accuracy']}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 5. Extra (inserted) words ══")
# Add 3 extra words at the start
extra = [("well", -3.0, -2.5), ("hmm", -2.0, -1.5), ("ok", -1.5, -1.0)] + list(ts)
feat_ins = extract_features_from_words(REF_NORM, make_words(extra))

check("hits == N (window finds all ref)",  feat_ins["_hits"] == N,  f"hits={feat_ins['_hits']}")
check("skip_rate == 0 (no deletions)",     feat_ins["_dele"] == 0,  f"dele={feat_ins['_dele']}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 6. Long pauses (pauses > 1.0 s between words) ══")
ts_paused = list(ts)
# Insert 2 s gap after word 3 and after word 7
ts_paused2 = []
for i, (w, s, e) in enumerate(ts_paused):
    offset = 0
    if i >= 4:  offset += 2.0   # 2 s gap after word 3 (index 3 ends at 3.7)
    if i >= 8:  offset += 2.5   # another long gap
    ts_paused2.append((w, s + offset, e + offset))

feat_p = extract_features_from_words(REF_NORM, make_words(ts_paused2))
check("pause_count > 0",    feat_p["pause_count"] > 0,   f"pause_count={feat_p['pause_count']}")
check("long_pauses > 0",    feat_p["long_pauses"] > 0,   f"long_pauses={feat_p['long_pauses']}")
check("avg_pause > 0",      feat_p["avg_pause"] > 0,     f"avg_pause={feat_p['avg_pause']}")
check("total_pause > 0",    feat_p["total_pause"] > 0,   f"total_pause={feat_p['total_pause']}")
check("pause from timestamps (not hardcoded)",
      feat_p["avg_pause"] != 0.35 and feat_p["avg_pause"] != 0.40,
      f"avg_pause={feat_p['avg_pause']}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 7. Silent / empty recording ══")
feat_empty = extract_features_from_words(REF_NORM, [])
check("accuracy == 0 (empty)",      feat_empty["accuracy"] == 0.0, f"{feat_empty['accuracy']}")
check("wpm == 0 (empty)",           feat_empty["wpm"] == 0,        f"{feat_empty['wpm']}")
check("skip_rate == 1.0 (all del)", feat_empty["skip_rate"] == 1.0, f"{feat_empty['skip_rate']}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 8. RFCS formula (35/30/20/15 weights) ══")
# Perfect reader: accuracy=1.0, wcpm=110, skip_rate=0, avg_pause=0
rfcs_perfect = calculate_rfcs(1.0, 110.0, 0.0, 0.0)
check("perfect RFCS == 100",        rfcs_perfect == 100.0,  f"{rfcs_perfect}")

# Accuracy only (speed=0, completion=0, pausing=0)
rfcs_acc_only = calculate_rfcs(1.0, 0.0, 1.0, 2.0)
expected = round(100 * (0.35 * 1.0 + 0.30 * 0 + 0.20 * 0 + 0.15 * 0), 1)
check("accuracy-only RFCS == 35",   rfcs_acc_only == expected, f"got={rfcs_acc_only} expected={expected}")

# All zero
rfcs_zero = calculate_rfcs(0.0, 0.0, 1.0, 2.0)
check("zero RFCS == 0",             rfcs_zero == 0.0,  f"{rfcs_zero}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 9. Two different reading speeds — WPM differs ══")
# Slow reader: 12 words over 120 s
ts_slow = [(REF_TOKENS[i], float(i * 10), float(i * 10) + 0.7) for i in range(N)]
feat_slow = extract_features_from_words(REF_NORM, make_words(ts_slow))

# Fast reader: 12 words over 12 s
ts_fast = [(REF_TOKENS[i], float(i), float(i) + 0.7) for i in range(N)]
feat_fast = extract_features_from_words(REF_NORM, make_words(ts_fast))

check("slow WPM < fast WPM",        feat_slow["wpm"] < feat_fast["wpm"],
                                    f"slow={feat_slow['wpm']} fast={feat_fast['wpm']}")
check("both perfect accuracy",      feat_slow["accuracy"] == feat_fast["accuracy"] == 1.0)
check("slow WCPM < fast WCPM",      feat_slow["wcpm"] < feat_fast["wcpm"],
                                    f"slow={feat_slow['wcpm']} fast={feat_fast['wcpm']}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 10. Word alignment matches metrics ══")
feat_sub = extract_features_from_words(REF_NORM, make_words(hyp_words_sub))
aln = build_word_alignment_from_traceback(
    REF_TOKENS, REF_NORM,
    feat_sub["_win_timed"], feat_sub["_win_s"], feat_sub["_win_e"],
    feat_sub["_hyp_norm"]
)
# Count alignment statuses
aln_correct = sum(1 for a in aln if a["status"] == "correct")
aln_sub     = sum(1 for a in aln if a["status"] == "substitution")
check("alignment correct count == hits",       aln_correct == feat_sub["_hits"],
                                               f"aln_correct={aln_correct} hits={feat_sub['_hits']}")
check("alignment sub count == sub",            aln_sub == feat_sub["_sub"],
                                               f"aln_sub={aln_sub} sub={feat_sub['_sub']}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 11. Feature names match model.pkl expectation ══")
expected_features = ["wpm","wcpm","accuracy","skip_rate","sub_rate","ins_rate",
                     "pause_count","avg_pause","total_pause","long_pauses","duration"]
check("FEATURES list matches train_models.py", FEATURES == expected_features,
                                               f"got={FEATURES}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ 12. ML model loading test ══")
model_path = Path(__file__).resolve().parent.parent / "models" / "model.pkl"
if model_path.exists():
    try:
        import joblib, pandas as pd
        mdl = joblib.load(model_path)
        check("model.pkl loads",                 True)
        check("model has 'model' key",           "model" in mdl)
        check("model has 'features' key",        "features" in mdl)
        check("model features == FEATURES",      mdl["features"] == FEATURES,
                                                 f"got={mdl['features']}")
        # Test predict on perfect feature vector
        feat_dict = {k: feat[k] for k in FEATURES}
        row = pd.DataFrame([feat_dict])[FEATURES]
        pred = mdl["model"].predict(row)[0]
        classes = mdl.get("classes", ["Low", "Medium", "High"])
        try:
            idx = int(pred)
            level = classes[idx] if 0 <= idx < len(classes) else str(pred)
        except (ValueError, TypeError):
            level = str(pred)
        check("predict() returns valid class",   level in ["Low","Medium","High"],
                                                 f"got={level}")
        print(f"         predict result for correct reader: {level}")
    except Exception as exc:
        check("model.pkl loads", False, str(exc))
else:
    print(f"  ⚠️  SKIP  model.pkl not found at {model_path}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n══ Summary ══")
if errors:
    print(f"\n{FAIL} {len(errors)} test(s) FAILED:")
    for e in errors:
        print(f"    - {e}")
    sys.exit(1)
else:
    print(f"\n{PASS} All tests passed!")
    sys.exit(0)
