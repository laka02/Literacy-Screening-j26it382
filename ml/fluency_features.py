"""
ml/fluency_features.py
──────────────────────
Shared feature extraction module — used by BOTH:
  • ml/scripts/extract_features.py  (offline training pipeline)
  • backend/routers/fluency.py      (live inference)

This guarantees training and inference use IDENTICAL definitions for
every feature fed into model.pkl.

Author : W.P.D.N. Samarasinghe — IT23362680
"""
import re

# ── Constants (match train_models.py exactly) ─────────────────────────────────
FEATURES = [
    "wpm", "wcpm", "accuracy", "skip_rate", "sub_rate", "ins_rate",
    "pause_count", "avg_pause", "total_pause", "long_pauses", "duration",
]
ORDER        = ["Low", "Medium", "High"]
TARGET_WCPM  = 110.0   # wcpm that earns full speed credit
PAUSE_MIN    = 0.30    # seconds — gap ≥ this counts as a pause
LONG_PAUSE   = 1.0     # seconds — gap ≥ this counts as a long pause


# ── Text normalisation (identical to extract_features.py) ────────────────────
def norm(t: str) -> str:
    """Lowercase, smart-apostrophe → ASCII, strip non-alphanum."""
    t = t.lower().replace("\u2019", "'").replace("'", "'")
    t = re.sub(r"[^a-z0-9' ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


# ── Window-align Levenshtein (identical to extract_features.py) ──────────────
def window_align(ref: list, hyp: list):
    """
    Align the whole reference to the best-matching stretch of hyp.
    Extra hypothesis words before/after the aligned window are free
    (treated as insertions outside the scored region).

    Returns: hits, sub, dele, ins, window_start, window_end
    """
    n, m = len(ref), len(hyp)
    D = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        D[i][0] = i
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = 0 if ref[i - 1] == hyp[j - 1] else 1
            D[i][j] = min(
                D[i - 1][j - 1] + cost,
                D[i - 1][j] + 1,
                D[i][j - 1] + 1,
            )
    end = min(range(m + 1), key=lambda j: D[n][j])
    i, j = n, end
    hits = sub = dele = ins = 0
    while i > 0:
        cost = 0 if (j > 0 and ref[i - 1] == hyp[j - 1]) else 1
        if j > 0 and D[i][j] == D[i - 1][j - 1] + cost:
            if cost == 0:
                hits += 1
            else:
                sub += 1
            i -= 1
            j -= 1
        elif D[i][j] == D[i - 1][j] + 1:
            dele += 1
            i -= 1
        else:
            ins += 1
            j -= 1
    return hits, sub, dele, ins, j, end


# ── Feature extraction from a Whisper word-timestamp list ────────────────────
def extract_features_from_words(
    ref_norm_tokens: list,
    whisper_words: list,
) -> dict:
    """
    Given:
      ref_norm_tokens : list[str]  — normalised reference words
      whisper_words   : list[dict] — [{"word": str, "start": float, "end": float}, ...]

    Returns a feature dict with all 11 keys in FEATURES, plus alignment metadata.

    Duration definition **matches extract_features.py**:
        dur = window[-1].end − window[0].start
    (i.e. measured from the first to last aligned hypothesis word, NOT total recording length)
    """
    N = len(ref_norm_tokens)

    # Flatten multi-token whisper words to (norm_token, start, end)
    timed: list[tuple[str, float, float]] = []
    for w in whisper_words:
        for tok in norm(w["word"]).split():
            timed.append((tok, float(w["start"]), float(w["end"])))

    hyp_norm = [t[0] for t in timed]

    if timed:
        hits, sub, dele, ins, s, e = window_align(ref_norm_tokens, hyp_norm)
    else:
        hits, sub, dele, ins, s, e = 0, 0, N, 0, 0, 0

    win = timed[s:e]

    if len(win) > 1:
        dur  = win[-1][2] - win[0][1]                                   # ← same as training
        gaps = [win[k + 1][1] - win[k][2] for k in range(len(win) - 1)]
    else:
        dur  = win[0][2] - win[0][1] if win else 0.0
        gaps = []

    pauses      = [g for g in gaps if g >= PAUSE_MIN]
    long_pauses = sum(1 for g in gaps if g >= LONG_PAUSE)
    mins        = dur / 60.0 if dur > 0 else 1.0 / 60.0

    wpm       = round(len(win) / mins) if mins > 0 else 0
    wcpm      = round(hits / mins)     if mins > 0 else 0
    accuracy  = hits / N               if N   > 0 else 0.0
    skip_rate = dele / N               if N   > 0 else 0.0
    sub_rate  = sub  / N               if N   > 0 else 0.0
    ins_rate  = ins  / N               if N   > 0 else 0.0

    pause_count = len(pauses)
    avg_pause   = round(sum(pauses) / pause_count, 2) if pause_count > 0 else 0.0
    total_pause = round(sum(pauses), 2)

    return {
        # 11 ML features (must match FEATURES order)
        "wpm":         wpm,
        "wcpm":        wcpm,
        "accuracy":    accuracy,
        "skip_rate":   skip_rate,
        "sub_rate":    sub_rate,
        "ins_rate":    ins_rate,
        "pause_count": pause_count,
        "avg_pause":   avg_pause,
        "total_pause": total_pause,
        "long_pauses": long_pauses,
        "duration":    dur,
        # Alignment counts (for RFCS & response)
        "_hits":  hits,
        "_sub":   sub,
        "_dele":  dele,
        "_ins":   ins,
        "_N":     N,
        "_win_s": s,
        "_win_e": e,
        "_win_timed": win,
        "_hyp_norm":  hyp_norm,
    }


# ── RFCS formula (exact copy from train_models.py) ───────────────────────────
def calculate_rfcs(accuracy: float, wcpm: float, skip_rate: float, avg_pause: float) -> float:
    """
    Reading Fluency Composite Score (0 – 100).
    Weights: 35% accuracy, 30% speed, 20% completion, 15% pausing.
    """
    speed      = min(wcpm / TARGET_WCPM, 1.0)
    completion = 1.0 - skip_rate
    pausing    = 1.0 - min(avg_pause / 2.0, 1.0)
    score = 100.0 * (0.35 * accuracy + 0.30 * speed + 0.20 * completion + 0.15 * pausing)
    return round(max(0.0, min(100.0, score)), 1)


# ── Word alignment for the UI ─────────────────────────────────────────────────
def build_word_alignment_from_traceback(
    ref_tokens: list,
    ref_norm_tokens: list,
    timed_win: list,
    s: int,
    e: int,
    hyp_norm: list,
) -> list:
    """
    Build per-word alignment using the SAME window_align Levenshtein result
    that was used to compute features.  This guarantees the UI alignment
    matches the metric calculations (hits/sub/dele).

    The traceback re-runs window_align only on the aligned window slice
    so it is cheap (O(N × window)).

    Each entry: {id, word, status, recognizedAs?, confidence?}
    status values: "correct" | "substitution" | "skipped" | "insertion"
    """
    n = len(ref_norm_tokens)
    win_hyp_norm   = hyp_norm[s:e]
    win_hyp_tokens = [t[0] for t in timed_win]  # already norm
    m = len(win_hyp_norm)

    # Full DP on the window slice
    D = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        D[i][0] = i
    for j in range(1, m + 1):
        D[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = 0 if ref_norm_tokens[i - 1] == win_hyp_norm[j - 1] else 1
            D[i][j] = min(
                D[i - 1][j - 1] + cost,
                D[i - 1][j] + 1,
                D[i][j - 1] + 1,
            )

    # Traceback
    ops: list[tuple[str, int | None, int | None]] = []  # (op, ref_idx, hyp_idx)
    i, j = n, m
    while i > 0 or j > 0:
        if i == 0:
            ops.append(("ins", None, j - 1))
            j -= 1
        elif j == 0:
            ops.append(("del", i - 1, None))
            i -= 1
        else:
            cost = 0 if ref_norm_tokens[i - 1] == win_hyp_norm[j - 1] else 1
            if D[i][j] == D[i - 1][j - 1] + cost:
                ops.append(("match" if cost == 0 else "sub", i - 1, j - 1))
                i -= 1
                j -= 1
            elif D[i][j] == D[i - 1][j] + 1:
                ops.append(("del", i - 1, None))
                i -= 1
            else:
                ops.append(("ins", None, j - 1))
                j -= 1
    ops.reverse()

    alignment = []
    entry_id  = 0
    for op, ri, hi in ops:
        if op == "match":
            alignment.append({
                "id":          f"w-{entry_id}",
                "word":        ref_tokens[ri],
                "status":      "correct",
                "recognizedAs": timed_win[hi][0] if hi is not None else None,
                "confidence":  0.95,
            })
            entry_id += 1
        elif op == "sub":
            alignment.append({
                "id":          f"w-{entry_id}",
                "word":        ref_tokens[ri],
                "status":      "substitution",
                "recognizedAs": timed_win[hi][0] if hi is not None else None,
                "confidence":  0.65,
            })
            entry_id += 1
        elif op == "del":
            alignment.append({
                "id":          f"w-{entry_id}",
                "word":        ref_tokens[ri],
                "status":      "skipped",
                "recognizedAs": None,
                "confidence":  None,
            })
            entry_id += 1
        else:  # insertion — extra word the student said
            alignment.append({
                "id":          f"ins-{entry_id}",
                "word":        timed_win[hi][0] if hi is not None else "?",
                "status":      "insertion",
                "recognizedAs": None,
                "confidence":  None,
            })
            entry_id += 1
    return alignment
