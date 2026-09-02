# Literacy-Screening-j26it382
AI-Assisted English Dyslexia Screening and Adaptive Learning Support — SLIIT, J26-IT-382


# AI-Assisted English Reading Difficulty Screening and Adaptive Learning Support

**SLIIT IT4010 Research Project — 2026 Jul | Topic ID: J26-IT-382**

An explainable, multi-modal AI system for screening general reading and
literacy difficulties — including dyslexia-linked patterns — in Grade 3-5
students in English-medium Sri Lankan primary schools. Produces a
three-tier risk classification (Low/Moderate/High) and generates adaptive,
targeted intervention plans for teachers and parents.

The system targets **all primary students with reading difficulties**, not
only those with a dyslexia diagnosis — dyslexia-specific error patterns
(phonological, reversal, transposition) are one part of a broader literacy
risk profile built from reading fluency, spelling accuracy, and behavioral
signals.

## Team
| Member | Reg No | Component |
|---|---|---|
| Samarasinghe W.P.D.N. | IT23362680 | Voice & Reading Fluency Analysis (RFCS) |
| Viduranga P.G.L. | IT23225060 | Spelling Error Pattern Detection (DESI) |
| Wijesinghe H.D.S. | IT23224834 | Behavioral Analytics & Risk Prediction (SHAP) |
| Hansamal H.K.S.S. | IT23166356 | Adaptive Intervention Engine (CAIRE) |

**Supervisor:** Ms. Tharushi Rubasinghe
**Co-Supervisor:** Ms. Sanjivi Chandrosiri

## Architecture
Four connected FastAPI/React microservices — see `docs/conceptual-diagram.png`.

## Running locally

The frontend runs on Vite and the backend runs on FastAPI. MongoDB must be
running locally or be provided through `MONGODB_URI`.

### Backend

```powershell
cd backend
Copy-Item .env.example .env
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000` and its interactive
documentation is at `http://127.0.0.1:8000/docs`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend is available at `http://localhost:5174`. Its Vite configuration
proxies `/api` requests to the backend.
