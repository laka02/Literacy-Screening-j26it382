# Literacy Screening — J26-IT-382

## AI-Assisted English Reading Difficulty Screening and Adaptive Learning Support

SLIIT IT4010 Final Year Research Project | 2026 | Topic ID: **J26-IT-382**

This repository contains an AI-assisted research system for screening general
English reading and literacy difficulties among Sri Lankan primary school
students in Grades 3–5 who are learning English. The wider system combines
reading fluency, spelling, behavioural, and intervention components.

The spelling analysis component documented in this README is **Spelling Error
Pattern Detection and Severity Indexing (DESI)**. It analyses a student's
written or typed English spelling performance, identifies granular cognitive
error patterns, calculates error severity metrics, and provides structured
evidence for the wider screening and intervention pipeline. Its primary
outputs are a **Spelling Accuracy Level** (`Low`, `Medium`, or `High`), a
continuous **DESI Composite Severity Score**, dominant error patterns, and
peer-normed weakness areas.

> **Supervisor:** Ms. Tharushi Rubasinghe  
> **Co-Supervisor:** Ms. Sanjivi Chandrasiri  
> **External Clinical Advisor:** Dr. N.G. Wijerathne (Registrar in Paediatrics)

---

## Project components

| Team member | Registration number | Component |
|---|---|---|
| Samarasinghe W.P.D.N. | IT23362680 | Voice & Reading Fluency Analysis (RFCS) |
| **Viduranga P.G.L.** | **IT23225060** | **Spelling Error Pattern Detection (DESI)** |
| Wijesinghe H.D.S. | IT23224834 | Behavioural Analytics & Risk Prediction (SHAP) |
| Hansamal H.K.S.S. | IT23166356 | Adaptive Intervention Engine (CAIRE) |

This README documents the repository and provides comprehensive implementation
details, current progress, and future roadmaps for the **Spelling Error Pattern
Detection (DESI)** component. This component serves as an evidence-gathering
subsystem within the overall dyslexia screening research project and must not
be interpreted as an isolated clinical diagnostic tool.

---

## Spelling Error Pattern Detection (DESI)

The DESI component addresses written literacy difficulties by processing student
spelling attempts across two distinct input channels:

1. **Digital Tablet Exercise Channel (Interactive NLP)**:
   A child-friendly, distraction-free tablet web interface where words and
   contextual sentences are dictated via audio prompts. Student typing is
   captured alongside keystroke dynamics (response latency, backspace counts,
   audio replays). Autocorrect and spellcheck are strictly disabled.
2. **Physical Worksheet Photo Channel (Vision LLM / OCR)**:
   Photographs of physical 30-word paper dictation worksheets (Form A) written
   by children in primary classrooms. An automated vision pipeline crops off
   student identification headers to preserve privacy, splits the two-column
   grid into individual words, and extracts written responses.

Both input streams converge into a unified linguistic and machine-learning
analysis engine that detects five established cognitive spelling error categories.

```
                  +-----------------------------------+
                  |  Physical Sheet Photo (Form A)    |
                  |  - 30 handwriting words           |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------------------------+
                  |  Vision OCR Pipeline (Ollama)     |
                  |  - Anonymization (top 6% crop)    |
                  |  - Two-column word extraction     |
                  +-----------------+-----------------+
                                    |
                                    v
+------------------------+  Draft Word Rows  +------------------------+
| Digital Tablet Test    |==================>| Human Reviewer Studio  |
| - Audio dictation      |                   | - Side-by-side audit   |
| - Keystroke telemetry  |                   | - Label verification   |
+-----------+------------+                   +-----------+------------+
            |                                            |
            +--------------------+-----------------------+
                                 | Verified / Standardised
                                 v
            +--------------------------------------------+
            |  DESI Core Linguistic Alignment & Analysis |
            |  - Custom-weighted Levenshtein alignment   |
            |  - Phonetic matching (NYSIIS, Metaphone)   |
            |  - 5-Category Rule & XGBoost Classifiers   |
            +--------------------+-----------------------+
                                 |
                                 v
            +--------------------------------------------+
            |  Student Profiling & Diagnostic Metrics    |
            |  - DESI Composite Severity Score           |
            |  - Spelling Accuracy Level (High/Med/Low)  |
            |  - Grade Peer Z-Score Focus Areas          |
            |  - Non-diagnostic "Possible Early Sign"    |
            +--------------------+-----------------------+
                                 |
                                 v
            +--------------------------------------------+
            |  MongoDB Persistence & Downstream APIs     |
            |  -> Member 3: Risk Prediction (SHAP)       |
            |  -> Member 4: Adaptive Interventions(CAIRE)|
            +--------------------------------------------+
```

### The 5 Spelling Error Categories

The classification engine maps spelling mistakes to five theoretically grounded
error categories:

1. **Reversal (`reversal`)**: Mirrored or flipped letter forms characteristic
   of visual-spatial processing difficulties (e.g., `b` $\leftrightarrow$ `d`,
   `p` $\leftrightarrow$ `q`, `b` $\leftrightarrow$ `p`, `d` $\leftrightarrow$ `q`),
   or complete word sequence reversals (e.g., `was` $\rightarrow$ `saw`).
2. **Transposition (`transposition`)**: Adjacent letter inversion within the word
   body without altering the constituent letters (e.g., `friend` $\rightarrow$
   `freind`).
3. **Morphological (`morphological`)**: Errors occurring on bound inflectional
   or derivational suffixes, such as past tense `-ed`, progressive `-ing`,
   plural `-es`/`-ies`, comparative `-er`/`-ier`, or consonant doubling errors
   preceding inflection (e.g., `stopped` $\rightarrow$ `stoped`, `babies`
   $\rightarrow$ `badys`).
4. **Omission (`omission`)**: Omission of constituent letters from the base word
   resulting in a phonologically degraded token (e.g., `milk` $\rightarrow$
   `mlk`, `camp` $\rightarrow$ `cap`).
5. **Phonological (`phonological`)**: Sound-alike phonetic spelling where the
   child transcribes English phonemes into plausible graphemes, indicating
   orthographic memory difficulty rather than auditory processing impairment
   (e.g., `night` $\rightarrow$ `nite`, `phone` $\rightarrow$ `fone`, `school`
   $\rightarrow$ `skool`, `elephant` $\rightarrow$ `elefant`).

Words can exhibit compound errors (e.g., `babies` written as `badys` contains
both a letter **reversal** `b` $\rightarrow$ `d` and a **morphological**
suffix error `ies` $\rightarrow$ `ys`).

---

## DESI Scoring and Methodology

### 1. Weighted Levenshtein Alignment

Letter-level alignment between the target word $T$ and written response $W$ is
calculated using an asymmetrical Levenshtein distance matrix where confusable
letter pairs (such as `b`/`d`) carry a reduced substitution penalty ($0.6$
rather than $1.0$). This ensures the aligner correctly identifies letter
flips rather than misinterpreting them as an omission plus an insertion.

### 2. DESI Composite Severity Score

The continuous DESI score models the weighted severity of detected errors
relative to the total number of words attempted ($N$):

```text
DESI Score = (1.5 × reversals + 1.2 × phonological + 1.0 × omissions + 1.0 × transpositions + 1.0 × morphological) / max(N, 1)
```

- **Reversals** receive the highest weight ($1.5$) due to their strong
  correlation with visual-spatial orthographic deficits.
- **Phonological substitutions** receive an elevated weight ($1.2$) reflecting
  orthographic lexical storage difficulties.
- **Omissions, transpositions, and morphological errors** receive standard
  weight ($1.0$).

### 3. Spelling Accuracy Level

The system assigns a categorical spelling performance level based on the
proportion of perfectly spelled target words:

- **High Accuracy** ($\ge 80\%$) — Strong age-appropriate spelling performance.
- **Medium Accuracy** ($50\% - 79\%$) — Developing spelling performance;
  isolated error patterns present.
- **Low Accuracy** ($< 50\%$) — Significant spelling performance deficit;
  marked vulnerability across error categories.

> **Important Boundary:** The Spelling Accuracy Level and DESI Score reflect
> orthographic mastery. They are **not** clinical dyslexia scores and must not
> be used in isolation for clinical diagnoses.

### 4. Cohort-Normed Relative Weak Areas

To identify actionable weaknesses, a child's error rate per category is
converted into a $Z$-score against their grade cohort (Grades 3, 4, or 5).
An error type is flagged as a primary **Focus Area** if:
$$Z \ge +1.0 \quad \text{and} \quad \text{Count} \ge 2$$
The top two highest deviating categories are presented to educators.

### 5. Rule-Based "Possible Early Sign" Flag

A non-diagnostic advisory flag is triggered strictly when **both** criteria
are met:
1. The student's overall DESI score is significantly elevated ($> 1.0$ standard
   deviations above the grade mean).
2. The error profile is predominantly composed of reversals, phonological
   substitutions, or transpositions ($> 60\%$ of total errors).

This advisory output serves purely as an early alert for educators and feeds
Member 3's authoritative machine learning risk prediction model.

---

## Repository Structure

```text
backend/
  main.py                     FastAPI backend application and endpoint handlers
  requirements.txt            Backend dependencies (FastAPI, Motor, Uvicorn, etc.)
  .env                        Local MongoDB and OCR environment configurations
  .env.example                Environment variable template
desi-ui/
  package.json                React 19 & Vite frontend dependencies
  vite.config.ts              Vite server and API proxy configuration
  src/
    App.tsx                   Main application router and global layout
    types.ts                  TypeScript data contracts (DESI profiles, reviews)
    config.ts                 Environment configuration and service URLs
    api/
      client.ts               Frontend API client supporting live and mock modes
    features/
      exercise/               Child-facing digital dictation test components
      handwriting/            Worksheet upload, rotation, and camera interface
      results/                Comprehensive DESI report and visual analytics
      review/                 Side-by-side human-in-the-loop audit studio
desi_ml/
  desi_core.py                Core Levenshtein aligner, rule classifier, 29 ML features
  fast_ocr.py                 Two-column accelerated vision OCR using Ollama
  ocr_ollama.py               Full worksheet OCR, automatic 6% name cropping, row cuts
  check_view.py               Visual HTML verification dashboard generator
  train.py                    Multi-label XGBoost/Random Forest training script
  make_profiles.py            Cohort norming, z-score computation, profile builder
  wordlist.py                 Forms A, B, and C dictation word banks
  prepare_verified_data.py    Dataset split utility for verified ground truth
  import_verified_results.py  Bulk import script from verified CSV to MongoDB
  requirements.txt            ML and NLP dependencies (Jellyfish, Scikit-learn, XGBoost)
data/
  exercise_results.csv        Cumulative digital exercise response repository
  ocr_results.csv             Cumulative handwriting OCR response repository
```

---

## Detailed Progress: What Has Been Done vs. What Needs to Be Done

### What Has Been Done (Completed Work)

#### 1. Dictation Material Design and Field Standardization
- [x] Standardized the **Form A 30-word graded dictation list** tailored for
      Sri Lankan primary school students in Grades 3–5 (with Grade 3 scoped
      to words 1–24).
- [x] Designed custom two-column student answer sheets with formatted line
      spacers and standardized numbering.
- [x] Prepared contextual spoken sentences for each target word to disambiguate
      homophones (e.g., *night* vs. *knight*, *sea* vs. *see*).

#### 2. Field Data Collection
- [x] Collected over **54 physical handwriting sheets** from primary classrooms
      under anonymous school identification codes (`IC_001` through `IC_054`).
- [x] Maintained privacy safeguards by physically separating student name strips
      from research evaluation datasets.

#### 3. Core NLP and Machine Learning Architecture (`desi_ml`)
- [x] Implemented `desi_core.py` with custom-weighted Levenshtein alignment
      addressing mirror letter flips (`b`/`d`, `p`/`q`).
- [x] Integrated phonetic distance algorithms (`jellyfish.metaphone`,
      `jellyfish.nysiis`, and custom phonetic reduction `simple_phon`) to
      reliably distinguish phonological errors from arbitrary omissions.
- [x] Formulated inflectional suffix extraction rules targeting past tense
      `-ed`, progressive `-ing`, plurals `-ies`/`-es`, and consonant doubling.
- [x] Engineered **29 numeric features** per word-response pair (edit distances,
      operation ratios, phonetic similarity booleans, n-gram overlap, suffix
      edits) for machine learning classification.
- [x] Developed student-grouped cross-validation scripts (`train.py`) to prevent
      data leakage across training and test partitions.
- [x] Built the cohort profiling engine (`make_profiles.py`) computing mean
      baselines, $Z$-scores, and educator recommendation templates.

#### 4. Automated Vision and Handwriting OCR Pipeline
- [x] Developed `ocr_ollama.py` utilizing the local **Qwen2.5-VL (3B)** vision
      model via Ollama.
- [x] Automated automated privacy redaction by cropping the top 6% of sheet
      images before processing.
- [x] Implemented `fast_ocr.py` using parallel two-column batch analysis to
      substantially reduce transcription latency.
- [x] Built `check_view.py` generating an interactive `check.html` visual grid
      pairing cropped handwriting snippets directly with model transcriptions.

#### 5. Backend Microservice Architecture (`backend`)
- [x] Built a high-performance **FastAPI** backend service with full asynchronous
      MongoDB integration using `Motor`.
- [x] Developed asynchronous background task processing (`_run_handwriting_ocr_job`)
      enabling instant upload responses without blocking client threads.
- [x] Embedded full image persistence in MongoDB (`handwriting_images` collection
      with Base64 encoding) ensuring decoupled, portable data storage.
- [x] Implemented atomic CSV synchronization (`refresh_cumulative_results_csv`)
      guaranteeing local backups of all digital exercises and handwriting sessions.
- [x] Implemented student ID uniqueness checks across both testing modalities.

#### 6. Tablet-First Frontend Application (`desi-ui`)
- [x] Built a tablet-first **React 19 + TypeScript + Vite** user interface.
- [x] **Child Dictation Screen (`/exercise`)**: Built an engaging, non-punitive
      typing environment featuring Text-to-Speech audio dictation, hidden
      autocorrect, and subtle behavioral telemetry (response time in ms,
      backspace counters, audio replay tracking).
- [x] **Handwriting Upload Screen (`/handwriting`)**: Built image upload with
      camera support, 90-degree image rotation, aspect ratio validation, and
      real-time OCR background status polling.
- [x] **Student Results Dashboard (`/results/:studentId`)**: Developed an
      interactive analytics dashboard presenting the DESI score, accuracy badge,
      5-category breakdown chart, dominant error indicators, peer-normed
      focus areas, and word-by-word audits.
- [x] **Reviewer and Annotation Studio (`/review`)**: Created a human-in-the-loop
      validation console allowing educators or researchers to view uploaded
      handwriting sheets side-by-side with OCR rows, edit transcribed text,
      toggle error category chips, and mark sessions as `verified`.

---

### What Needs to Be Done (Future Work & Next Steps)

#### 1. Complete Dataset Annotation and Inter-Rater Reliability
- [ ] **Hand-Verify Full Primary Dataset**: Audit all collected handwriting
      sheets through the `/review` interface to correct any vision model
      transcription hallucinations and confirm multi-label error tags.
- [ ] **Inter-Rater Reliability Testing (Cohen's Kappa)**: Have an independent
      second educator/linguist label a randomized 20% sample of student words.
      Compute Cohen's Kappa to formally validate annotation consistency.
- [ ] **Target Dataset Expansion**: Continue field data collection to reach
      the target benchmark of approximately 100 primary school students across
      diverse socio-economic learning environments.

#### 2. Final Machine Learning Model Training and Benchmarking
- [ ] Generate the canonical ground-truth dataset (`training_labels.csv`)
      using `prepare_verified_data.py`.
- [ ] Train final multi-label **XGBoost** and **Random Forest** models on
      verified data and compare performance against the rule baseline.
- [ ] Produce publication-ready evaluation artifacts: confusion matrices,
      per-class Precision, Recall, Macro-F1 scores, and ROC-AUC curves.
- [ ] Serialise the trained model artifact (`desi_models.joblib`) and deploy it
      into the backend inference router.

#### 3. Inter-Service Integration (Components 1, 3, and 4)
- [ ] **Interface with Member 3 (Risk Prediction - XGBoost + SHAP)**:
      Finalize the schema to stream `desi_score`, category frequencies,
      accuracy level, and behavioural telemetry (backspaces, latency) into
      Member 3's composite risk model.
- [ ] **Interface with Member 4 (Adaptive Intervention - CAIRE)**:
      Transmit identified weakness patterns (`focus_areas` and error types)
      to trigger tailored morphological, phonological, or orthographic
      remedial exercises.
- [ ] Connect with the central student session management service for seamless
      transition between reading fluency (Member 1) and spelling tests (Member 2).

#### 4. Clinical & Pedagogical Review
- [ ] Conduct a formal evaluation session with **Dr. N.G. Wijerathne**
      (External Clinical Advisor) to review generated DESI profiles, clinical
      validity of error weightings, and the ethical framing of the early-sign flag.
- [ ] Gather structured qualitative feedback from primary English educators
      regarding the usability of the `/review` audit screen and student response
      during the `/exercise` tablet sessions.

#### 5. Classroom Usability and Field Hardware Benchmarking
- [ ] Conduct on-site tablet usability evaluations across Sri Lankan primary
      schools to verify browser compatibility, audio playback clarity, and
      virtual keyboard ergonomics.
- [ ] Test vision pipeline resilience under challenging classroom photography
      conditions (uneven lighting, minor page tilts, shadows, mixed paper backgrounds).

---

## Technical Requirements

- **Operating System:** Windows 10 or 11 (64-bit)
- **Programming Languages & Runtimes:**
  - Python 3.12 (recommended for `backend` and `desi_ml`)
  - Node.js (v18.x or v20.x LTS) & npm
- **Database:** MongoDB (Local community instance or MongoDB Atlas cluster)
- **Local Vision Model Infrastructure:**
  - [Ollama](https://ollama.com/) installed and running locally
  - Vision model: `qwen2.5vl:3b` (`ollama pull qwen2.5vl:3b`)

---

## Installation & Setup

### 1. Clone and Configure Backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend\.env` and configure your MongoDB connection string and Ollama parameters:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=pafproject
OCR_MODEL=qwen2.5vl:3b
OCR_URL=http://127.0.0.1:11434
OCR_TIMEOUT=90
```

### 2. Configure Machine Learning Environment (`desi_ml`)

```powershell
cd ..\desi_ml
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
ollama pull qwen2.5vl:3b
```

### 3. Install Frontend Dependencies (`desi-ui`)

```powershell
cd ..\desi-ui
npm install
Copy-Item .env.example .env
```

Ensure `desi-ui\.env` points to the active backend instance:

```env
VITE_USE_MOCK=false
VITE_DESI_API_URL=http://localhost:8002
VITE_ENABLE_HANDWRITING=true
```

---

## Running the Services

### 1. Start Ollama

Ensure Ollama is running in the background to serve vision inference:

```powershell
ollama serve
```

### 2. Start the FastAPI Backend

Run the backend on dedicated port **8002**:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8002
```

- API Base URL: [http://127.0.0.1:8002](http://127.0.0.1:8002)
- Interactive Swagger Documentation: [http://127.0.0.1:8002/docs](http://127.0.0.1:8002/docs)

### 3. Start the Frontend Application

In a separate terminal window:

```powershell
cd desi-ui
npm run dev
```

The frontend application will be accessible at [http://localhost:5173](http://localhost:5173).

---

## API Reference

The DESI backend exposes the following primary endpoints on port `8002`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint returning backend status |
| `POST` | `/errors/responses` | Submit a single typed spelling attempt with telemetry |
| `GET` | `/errors/profile` | Retrieve student profile, DESI score, accuracy, and focus areas |
| `GET` | `/errors/students/check` | Verify whether a student ID already exists in the system |
| `POST` | `/errors/handwriting` | Upload a handwriting worksheet photo for asynchronous OCR |
| `GET` | `/errors/handwriting/status/{session_id}` | Poll the background processing status of a handwriting upload |
| `GET` | `/errors/images/{session_id}` | Retrieve the raw uploaded worksheet image from MongoDB |
| `GET` | `/errors/ocr-csv/{session_id}` | Download the OCR transcription CSV for a specific session |
| `GET` | `/errors/responses-csv` | Export all typed and OCR responses for a student as CSV |
| `GET` | `/review/manifest` | Retrieve all pending and completed review sheets for audit |
| `POST` | `/review/save` | Persist verified reviewer edits, recalculate profile, and update CSVs |

### Example cURL Commands

#### 1. Submit a Digital Spelling Attempt

```powershell
curl.exe -X POST http://127.0.0.1:8002/errors/responses `
  -H "Content-Type: application/json" `
  -d '{
    "student_id": "IC_033",
    "grade": 4,
    "session_id": "session-101",
    "word_no": 1,
    "target": "bed",
    "response": "ded",
    "response_time_ms": 3200,
    "backspace_count": 1,
    "replay_count": 0,
    "skipped": false,
    "timestamp": "2026-10-30T10:00:00Z"
  }'
```

#### 2. Retrieve Student DESI Profile

```powershell
curl.exe -X GET "http://127.0.0.1:8002/errors/profile?student_id=IC_033"
```

*Sample Response Body:*

```json
{
  "student_id": "IC_033",
  "grade": 4,
  "date": "2026-10-30",
  "desi_score": 1.45,
  "reversal_count": 3,
  "omission_count": 2,
  "transposition_count": 0,
  "phonological_count": 4,
  "morphological_count": 1,
  "dominant_error_type": "phonological",
  "correct_count": 20,
  "wrong_count": 10,
  "accuracy": 0.667,
  "spelling_accuracy_level": "Medium",
  "focus_areas": ["phonological", "reversal"],
  "analysis_status": "verified"
}
```

#### 3. Upload a Handwriting Worksheet Photo

```powershell
curl.exe -X POST http://127.0.0.1:8002/errors/handwriting `
  -F "file=@worksheet_sample.jpg;type=image/jpeg" `
  -F "student_id=IC_055" `
  -F "grade=4" `
  -F "form=A" `
  -F "fast_mode=true"
```

---

## Offline Machine Learning & Data Processing Pipelines

All standalone data processing, OCR audit, and model training routines reside
in `desi_ml/`.

### 1. Batch Handwriting OCR Processing

Process raw worksheet photographs in batch:

```powershell
cd desi_ml
.\.venv\Scripts\Activate.ps1
python ocr_ollama.py --images "..\data\raw_sheets" --index "..\sheets_index.csv" --out "ocr_out" --model qwen2.5vl:3b --save-crops
```

### 2. Visual OCR Audit Tool

Generate a visual audit report to verify OCR transcription against word crops:

```powershell
python check_view.py --out ocr_out
```

This generates `ocr_out/check.html`, allowing side-by-side inspection of
handwritten word image segments and extracted text.

### 3. Generate Verified Training Splits

Once labels are confirmed via the `/review` interface or CSV edits:

```powershell
python prepare_verified_data.py --labels ocr_out/ocr_results.csv --out verified_data
```

Generates clean partitions: `verified_data/training_labels.csv`,
`verified_data/profiles.csv`, and individual student profiles in
`verified_data/students/<student_code>/profile.json`.

### 4. Train Classifiers and Benchmark Baselines

```powershell
python train.py --labels verified_data/training_labels.csv --out model/
```

Trains multi-label classifiers across all five error categories using
student-grouped cross-validation, reporting precision, recall, and Macro-F1
against the rule-based baseline.

---

## Data Privacy, Ethics, and Research Scope

1. **Student Anonymisation**: Student names are strictly excluded from research
   databases. All physical worksheets undergo an automated 6% top-strip
   header removal before image archiving. Students are tracked exclusively via
   pseudonymised research identifiers (e.g., `IC_001`, `IC_002`).
2. **Local AI Inference**: Vision OCR models run locally through Ollama on
   local hardware. Student handwriting photographs are never transmitted to
   external commercial cloud vision APIs without explicit ethics board consent.
3. **Non-Diagnostic Research Scope**: The DESI component produces educational
   evidence indicating relative orthographic difficulty and cognitive error
   patterns. It does **not** provide a clinical dyslexia diagnosis. All flags
   and accuracy levels must be interpreted by qualified educators, educational
   psychologists, or pediatric medical professionals in conjunction with the
   accompanying speech, behavioural, and cognitive screening components.
