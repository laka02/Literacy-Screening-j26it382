import json, sys
from pathlib import Path
import whisper

AUDIO_DIR = Path(r"D:\Research\Reading_Fluency\04_Standardized_WAV")
OUT_DIR = Path(r"D:\Research\Reading_Fluency\pipeline\transcripts")
OUT_DIR.mkdir(parents=True, exist_ok=True)
LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else None

model = whisper.load_model("small")
files = sorted(AUDIO_DIR.glob("*.wav"))[:LIMIT]
for i, f in enumerate(files, 1):
    out = OUT_DIR / (f.stem + ".json")
    if out.exists():
        continue
    r = model.transcribe(str(f), language="en", word_timestamps=True,
                         condition_on_previous_text=False, fp16=False,
                         hallucination_silence_threshold=2.0)
    words = [{"word": w["word"].strip(), "start": w["start"], "end": w["end"]}
             for s in r["segments"] for w in s.get("words", [])]
    out.write_text(json.dumps({"file": f.name, "text": r["text"].strip(), "words": words},
                              ensure_ascii=False), encoding="utf-8")
    print(i, len(files), f.name, len(words), flush=True)