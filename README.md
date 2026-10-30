# Literacy Screening — J26-IT-382

## AI-Assisted English Reading Difficulty Screening and Adaptive Learning Support

SLIIT IT4010 Final Year Research Project | 2026 | Topic ID: **J26-IT-382**

This repository contains an AI-assisted research system for screening general
English reading and literacy difficulties among Sri Lankan primary school
students in Grades 3–5 who are learning English. The wider system combines
reading fluency, spelling, behavioural, and intervention components.

The reading fluency component documented in this README is **Voice & Reading
Fluency Analysis (RFCS)**. It analyses a student's recorded reading and
provides evidence about reading performance for the wider screening system.
Its machine-learning output is a **teacher-labelled reading fluency level**:
`Low`, `Medium`, or `High`. These labels are not equivalent to low, medium, or
high dyslexia risk.

> **Supervisor:** Ms. Tharushi Rubasinghe
> **Co-Supervisor:** Ms. Sanjivi Chandrasiri

## Project components

| Team member | Registration number | Component |
|---|---|---|
| Samarasinghe W.P.D.N. | IT23362680 | Voice & Reading Fluency Analysis (RFCS) |
| Viduranga P.G.L. | IT23225060 | Spelling Error Pattern Detection (DESI) |
| Wijesinghe H.D.S. | IT23224834 | Behavioural Analytics & Risk Prediction (SHAP) |
| Hansamal H.K.S.S. | IT23166356 | Adaptive Intervention Engine (CAIRE) |

This README documents the repository and gives additional implementation
details for the Voice & Reading Fluency Analysis component. The component
should be interpreted as one supporting part of the overall dyslexia
risk-screening research system, not as a standalone clinical assessment.

## Voice & Reading Fluency Analysis

The implemented assessment pipeline:

1. Receives an audio recording and a reference passage ID.
2. Converts audio to 16 kHz mono with FFmpeg when conversion is required.
3. Uses the Whisper `small` model for English transcription with word-level
   timestamps.
4. Aligns recognised words with the reference passage using windowed
   Levenshtein alignment.
5. Extracts 11 fluency features from recognised words, alignment results, and
   timestamp-based pauses.
6. Calculates the Reading Fluency Composite Score (RFCS) from 0 to 100.
7. Uses the trained classifier to predict a teacher-labelled reading fluency
   level: `Low`, `Medium`, or `High`.
8. Builds word-level alignment data for the frontend.
9. Persists the assessment session in MongoDB when the database is available.

The implementation reports audio, transcription, alignment, and model errors
instead of replacing failed inference with simulated data or reference text.

### Reading fluency levels

The backend response field is `metrics.fluencyLevel`. Its values describe
reading fluency performance:

- **Low Fluency** — weaker reading performance indicators.
- **Medium Fluency** — developing reading performance.
- **High Fluency** — stronger reading performance indicators.

These levels are based on teacher-labelled reading-fluency data and the
trained model. They must not be described as dyslexia severity or as a
clinical diagnosis. A qualified teacher or professional should interpret
the result together with other evidence.

## RFCS methodology

The RFCS combines four interpretable signals:

```text
RFCS = 100 × (
    0.35 × accuracy
  + 0.30 × speed
  + 0.20 × completion
  + 0.15 × pausing
)
```

The implementation defines:

- `accuracy` as the proportion of reference words recognised correctly.
- `speed` as `min(wcpm / 110, 1.0)`.
- `completion` as `1 - skip_rate`.
- `pausing` as `1 - min(avg_pause / 2.0, 1.0)`.

The 11 model features, in the training and inference order, are:

```text
wpm, wcpm, accuracy, skip_rate, sub_rate, ins_rate,
pause_count, avg_pause, total_pause, long_pauses, duration
```

The shared implementation in
[`ml/fluency_features.py`](ml/fluency_features.py) is used by both offline
feature generation and the backend inference router. This keeps feature
definitions consistent between training and live assessment.

## Repository structure

```text
backend/
  main.py                 FastAPI application and router registration
  routers/fluency.py      Reading fluency API and inference pipeline
  database.py             MongoDB connection management
  requirements.txt        Backend and inference dependencies
  .env.example            Environment-variable template
frontend/
  vite.config.ts          Frontend port and API proxy configuration
  src/services/fluencyService.ts
                          Frontend fluency API client
ml/
  fluency_features.py     Shared alignment, features, and RFCS logic
  passages/               Reference passages (P1, P2, ...)
  models/model.pkl        Trained model artifact used by the backend
  requirements.txt        ML and evaluation dependencies
  scripts/
    transcribe_all.py     Batch Whisper transcription
    extract_features.py   Build the training feature table
    train_models.py       Train and compare classifiers
    evaluate_charts.py    Generate evaluation charts
    test_pipeline.py      Automated feature and RFCS checks
    benchmark_assessment.py
                          End-to-end latency benchmark
    ML_Model_Evaluation.ipynb
                          Interactive model-evaluation notebook
```

## Requirements

- Windows 10 or 11
- Python 3.12 recommended
- Node.js and npm
- FFmpeg on `PATH` for audio conversion when required
- MongoDB, either local or MongoDB Atlas
- A working microphone for live browser assessment

Whisper downloads the selected model the first time it is loaded. The first
assessment can therefore take longer than subsequent assessments.

## Installation

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `MONGODB_URI` in `backend\.env` using your own local or hosted MongoDB
connection. Do not commit the `.env` file or any credentials.

Install frontend dependencies:

```powershell
cd ..\frontend
npm install
```

The ML dependencies are included in `backend\requirements.txt`. For a
separate ML environment, use:

```powershell
cd ..\ml
..\backend\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Run the application

The backend is configured to run on port **8001**, and the Vite proxy targets
that port.

Start the backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8001
```

Backend URLs:

- API root: [http://127.0.0.1:8001](http://127.0.0.1:8001/)
- Interactive API documentation:
  [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

Start the frontend in a second PowerShell window:

```powershell
cd frontend
npm run dev
```

The Vite configuration sets the frontend development server to
`http://localhost:5174` and proxies `/api` requests to
`http://127.0.0.1:8001`.

## API usage

The fluency router is registered with the prefix `/api/fluency`.

### Submit an assessment

```text
POST /api/fluency/assess
Content-Type: multipart/form-data
```

Required multipart form field:

- `audio`: uploaded audio file (`UploadFile`). This field is required.

Optional form fields:

- `passage_id`: reference passage ID (`str`); optional, default `P1`.
- `duration`: recording duration in seconds (`float`); optional, default `0.0`.
  The backend accepts this value as a wall-clock fallback, but pause timing is
  derived from Whisper word timestamps.
- `student_id`: optional student identifier (`str` or `null`), default `None`.
  It is used when saving and retrieving sessions.

Example request using `curl`:

```powershell
curl.exe -X POST http://127.0.0.1:8001/api/fluency/assess `
  -F "audio=@reading.wav" `
  -F "passage_id=P1" `
  -F "duration=30" `
  -F "student_id=student-001"
```

The response contains `metrics.rfcs`, `metrics.fluencyLevel`,
`metrics.classProbabilities`, fluency metrics, `wordAlignment`, feedback
fields, and reward/progress fields used by the current frontend. The
`fluencyLevel` field represents reading fluency performance, not dyslexia
risk.

### Other implemented fluency endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/fluency/passages` | List available reference passages |
| `GET` | `/api/fluency/sessions/{student_id}` | Retrieve saved sessions for a student |
| `GET` | `/api/fluency/model/info` | Return loaded model metadata |
| `GET` | `/api/fluency/whisper/status` | Check whether Whisper is loaded |

The assessment endpoint returns:

- `422 Unprocessable Entity` when the required audio field is missing, the
  file is empty or too small, the audio cannot be decoded, or Whisper returns
  no words.
- `404 Not Found` when the requested passage does not exist.
- `503 Service Unavailable` when the Whisper model cannot be loaded.
- `500 Internal Server Error` for unexpected transcription or ML prediction
  failures.

The session-history endpoint returns `503 Service Unavailable` when MongoDB is
not connected. Other endpoint errors are handled by FastAPI and the underlying
application configuration.

## Training and evaluation

The offline scripts use audio recordings, transcripts, reference passages, and
teacher labels from a local dataset directory. The dataset is not included in
this repository and may require configuring the paths in the scripts for the
local machine. Existing scripts currently refer to a local path such as
`D:\Research\Reading_Fluency`; this is an example of a machine-specific
dataset location, not a required repository path.

### Create Whisper transcripts

```powershell
.\backend\.venv\Scripts\python.exe ml\scripts\transcribe_all.py
```

To process only the first `N` audio files:

```powershell
.\backend\.venv\Scripts\python.exe ml\scripts\transcribe_all.py N
```

### Extract features

```powershell
.\backend\.venv\Scripts\python.exe ml\scripts\extract_features.py
```

This produces a feature table containing reading-speed, accuracy, alignment,
and pause metrics together with teacher labels, subject to the configured
local dataset paths.

### Train and compare models

```powershell
.\backend\.venv\Scripts\python.exe ml\scripts\train_models.py
```

The training script compares:

- Logistic Regression
- Random Forest
- XGBoost

It uses student-grouped stratified cross-validation and reports accuracy,
macro-F1, and confusion matrices in its console output. The selected model is
serialised with its feature order and class labels for backend inference.
The repository includes the current artifact at
[`ml/models/model.pkl`](ml/models/model.pkl).

### Generate evaluation charts

```powershell
.\backend\.venv\Scripts\python.exe ml\scripts\evaluate_charts.py
```

The script writes model-comparison, confusion-matrix, and Random Forest
feature-importance charts to the configured evaluation output directory.
The interactive evaluation notebook is
[`ml/scripts/ML_Model_Evaluation.ipynb`](ml/scripts/ML_Model_Evaluation.ipynb).

This README does not claim model accuracy or other research results; those
values should be reported only from a reproducible evaluation run and its
stored outputs.

## Tests and benchmarking

Run the automated feature-pipeline checks without audio or Whisper inference:

```powershell
.\backend\.venv\Scripts\python.exe ml\scripts\test_pipeline.py
```

The test script covers text normalisation, correct words, substitutions,
skipped words, inserted words, pause detection, empty recordings, RFCS
calculation, and word alignment. The repository contains the test code; no
test result is claimed here.

To measure the latency of the live-assessment stages:

```powershell
.\backend\.venv\Scripts\python.exe ml\scripts\benchmark_assessment.py
```

The benchmark measures audio preparation, Whisper cold and warm inference,
feature extraction, model prediction, optional MongoDB persistence, and total
response time. It requires a locally configured test WAV file and model.

## Data, privacy, and research scope

Audio recordings, transcripts, teacher labels, and MongoDB credentials are
not documented or committed here. Keep private student data outside version
control and use environment variables for credentials.

Reading fluency assessment is a supporting research component for identifying
possible reading difficulties. It is not a clinical dyslexia diagnosis and
must not be used as the sole basis for educational or clinical decisions.
