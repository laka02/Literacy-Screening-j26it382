import json, re
from pathlib import Path
import pandas as pd

BASE = Path(r"D:\Research\Reading_Fluency")
TR = BASE / "pipeline" / "transcripts"
PASS = BASE / "pipeline" / "passages"
XLSX = BASE / "06_Quality_Check_completed.xlsx"
PASSAGES = ["P1"]      # PP2 එකේදී ["P1", "P2"] කරන්න
PAUSE_MIN = 0.30       # seconds; gap this long between words counts as a pause
LONG_PAUSE = 1.0

def norm(t):
    t = t.lower().replace("’", "'")
    t = re.sub(r"[^a-z0-9' ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def window_align(ref, hyp):
    """Align the whole reference to the best-matching stretch of hyp.
    Extra words before/after that stretch are ignored (free)."""
    n, m = len(ref), len(hyp)
    D = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        D[i][0] = i
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = 0 if ref[i - 1] == hyp[j - 1] else 1
            D[i][j] = min(D[i - 1][j - 1] + cost, D[i - 1][j] + 1, D[i][j - 1] + 1)
    end = min(range(m + 1), key=lambda j: D[n][j])
    i, j = n, end
    hits = sub = dele = ins = 0
    while i > 0:
        cost = 0 if (j > 0 and ref[i - 1] == hyp[j - 1]) else 1
        if j > 0 and D[i][j] == D[i - 1][j - 1] + cost:
            if cost == 0: hits += 1
            else: sub += 1
            i -= 1; j -= 1
        elif D[i][j] == D[i - 1][j] + 1:
            dele += 1; i -= 1
        else:
            ins += 1; j -= 1
    return hits, sub, dele, ins, j, end

refs = {p: norm((PASS / f"{p}.txt").read_text(encoding="utf-8")).split() for p in PASSAGES}
meta = pd.read_excel(XLSX, sheet_name="Quality_Check")
meta = meta[meta["Audio_File"].notna() & meta["Passage_ID"].isin(PASSAGES)]

rows = []
for _, m in meta.iterrows():
    stem = Path(m["Audio_File"]).stem
    jf = TR / (stem + ".json")
    if not jf.exists():
        print("no transcript:", stem); continue
    d = json.loads(jf.read_text(encoding="utf-8"))
    words = []
    for w in d["words"]:
        for tok in norm(w["word"]).split():
            words.append((tok, w["start"], w["end"]))
    ref = refs[m["Passage_ID"]]
    N = len(ref)
    if words:
        hits, sub, dele, ins, s, e = window_align(ref, [w[0] for w in words])
    else:
        hits, sub, dele, ins, s, e = 0, 0, N, 0, 0, 0
    win = words[s:e]
    if len(win) > 1:
        dur = win[-1][2] - win[0][1]
        gaps = [win[i + 1][1] - win[i][2] for i in range(len(win) - 1)]
    else:
        dur, gaps = 0.0, []
    pauses = [g for g in gaps if g >= PAUSE_MIN]
    mins = dur / 60 if dur > 0 else None
    rows.append({
        "Audio_File": m["Audio_File"], "Student_ID": m["Student_ID"], "Passage_ID": m["Passage_ID"],
        "ref_words": N, "window_words": len(win), "extra_words": len(words) - len(win),
        "wpm": len(win) / mins if mins else 0,
        "wcpm": hits / mins if mins else 0,
        "accuracy": hits / N, "skip_rate": dele / N, "sub_rate": sub / N, "ins_rate": ins / N,
        "pause_count": len(pauses),
        "avg_pause": sum(pauses) / len(pauses) if pauses else 0,
        "total_pause": sum(pauses),
        "long_pauses": sum(g >= LONG_PAUSE for g in gaps),
        "duration": dur,
        "Teacher_Score": m["Teacher_Score"], "Teacher_Label": m["Teacher_Label"],
    })
df = pd.DataFrame(rows)
df.to_csv(BASE / "pipeline" / "features.csv", index=False, encoding="utf-8-sig")
print(df.shape)
print(df["Teacher_Label"].value_counts(dropna=False))
print(df.describe().T[["mean", "min", "max"]])