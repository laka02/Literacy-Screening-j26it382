# Literacy-Screening-j26it382

## AI-Assisted English Reading Difficulty Screening and Adaptive Learning Support

**SLIIT IT4010 Research Project — 2026 July | Topic ID: J26-IT-382**

---

## 1. Project Overview

This research project develops an explainable, AI-assisted system to support the screening of reading and literacy difficulties among Grade 3–5 students in English-medium Sri Lankan primary schools.

The system analyzes different literacy-related features and provides a three-tier risk classification: **Low**, **Moderate**, and **High**. It also supports teachers and parents by providing adaptive learning recommendations.

> **Note:** This system is designed to support students with reading difficulties — not to provide a medical diagnosis of dyslexia.

---

## 2. Problem Statement

Some primary school students experience difficulties with reading fluency, spelling, and other literacy skills. Identifying these difficulties and providing suitable learning support can be challenging.

This project supports early identification of possible reading difficulties and provides targeted learning recommendations based on student performance.

---

## 3. Project Objectives

- Analyze reading fluency and related reading performance.
- Identify spelling errors and relevant error patterns.
- Predict literacy risk levels using behavioral and other available features.
- Recommend personalized learning activities based on student needs.
- Track student progress and support teachers in planning interventions.
- Provide understandable reasons for system recommendations where possible.

---

## 4. Main System Components

### 4.1 Voice and Reading Fluency Analysis (RFCS)
Analyzes voice and reading-related features such as reading fluency and pronunciation to support the identification of reading difficulties.

### 4.2 Spelling Error Pattern Detection (DESI)
Identifies spelling errors and relevant error patterns to support the analysis of students' literacy difficulties.

### 4.3 Behavioral Analytics and Risk Prediction (SHAP)
Uses relevant student features to predict literacy risk levels and supports interpretation of predictions.

### 4.4 Adaptive Intervention Planning and Progress Tracking (CAIRE)
Uses available assessment results and risk-related information to identify learning support priorities, recommend suitable learning activities, and track student progress.

CAIRE updates learning recommendations based on recorded performance and supports teacher review of learning plans.

---

## 5. System Architecture

The project is designed as four connected components communicating via APIs. The CAIRE component uses outputs from the other components as inputs for intervention planning. During development, sample or mock data may be used before actual component outputs are integrated.

**Architecture diagram:** `docs/conceptual-diagram.png`

---

## 6. Technologies Used

| Layer | Technology |
|---|---|
| Programming Language | Python 3.x |
| Backend Framework | FastAPI + Uvicorn |
| Frontend | React 18 + TypeScript (Vite) |
| Machine Learning | Scikit-learn (Random Forest), joblib |
| Database | MongoDB Atlas (Motor async driver) |
| Authentication | JWT (python-jose + bcrypt) |
| Version Control | Git and GitHub |

---

## 7. Team Members

| Member | Registration Number | Component |
|---|---|---|
| Samarasinghe W.P.D.N. | IT23362680 | Voice and Reading Fluency Analysis (RFCS) |
| Viduranga P.G.L. | IT23225060 | Spelling Error Pattern Detection (DESI) |
| Wijesinghe H.D.S. | IT23224834 | Behavioral Analytics and Risk Prediction (SHAP) |
| Hansamal H.K.S.S. | IT23166356 | Adaptive Intervention Engine (CAIRE) |

**Supervisor:** Ms. Tharushi Rubasinghe
**Co-Supervisor:** Ms. Sanjivi Chandrosiri

---

## 8. Prerequisites

Make sure the following are installed before running the project:

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+ and npm](https://nodejs.org/)
- [Git](https://git-scm.com/)
- A MongoDB Atlas account (or a local MongoDB instance)

---

## 9. Installation and Setup

### Step 1: Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Literacy-Screening-j26it382
```

Replace the placeholder with your actual GitHub repository URL.

---

### Step 2: Backend Setup

Navigate into the `backend` folder and set up a Python virtual environment.

```bash
cd backend
```

**Create and activate a virtual environment:**

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

**Install dependencies:**

```bash
pip install -r requirements.txt
```

**Configure environment variables:**

Create a `.env` file inside the `backend/` folder with the following content:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

> Do not commit your `.env` file to GitHub. It is already listed in `.gitignore`.

---

### Step 3: Frontend Setup

Open a **new terminal**, navigate to the `frontend` folder, and install dependencies:

```bash
cd frontend
npm install
```

---

## 10. Running the Project

You need **two separate terminals** — one for the backend and one for the frontend.

### Terminal 1 — Run the Backend (FastAPI)

```bash
cd backend

# Activate virtual environment
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

| URL | Description |
|---|---|
| `http://127.0.0.1:8000` | API Base URL |
| `http://127.0.0.1:8000/docs` | Interactive API Docs (Swagger UI) |
| `http://127.0.0.1:8000/health` | Health Check |

---

### Terminal 2 — Run the Frontend (React + Vite)

```bash
cd frontend
npm run dev
```

The frontend will be available at:

| URL | Description |
|---|---|
| `http://localhost:5173` | Main App |

> The Vite dev server is pre-configured to proxy all `/api` requests to the FastAPI backend at `http://127.0.0.1:8000`. No extra configuration is needed for local development.

---

## 11. API Endpoints (CAIRE Backend)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Root — confirms backend is running |
| GET | `/health` | Health check |
| POST | `/api/auth/...` | Authentication (login and register) |
| GET/POST | `/api/profile/...` | Profile and progress management |
| GET/POST | `/api/plan/...` | Adaptive plan and learning map |
| GET | `/api/free-activities/...` | Free learning activities |

Full interactive documentation is available at `/docs` when the backend is running.

---

## 12. ML Model

The trained Random Forest model used by the CAIRE component is located in:

```
ml_model/
+-- caire_random_forest_demo.joblib   <- Trained model file
+-- caire_train_random_forest.py      <- Training script
+-- caire_training_data.csv           <- Training dataset
```

To retrain the model:

```bash
cd ml_model
python caire_train_random_forest.py
```

---

## 13. Project Structure

```
Literacy-Screening-j26it382/
+-- backend/                    # FastAPI backend (CAIRE component)
¦   +-- main.py                 # Application entry point
¦   +-- database.py             # MongoDB connection
¦   +-- requirements.txt        # Python dependencies
¦   +-- .env                    # Environment variables (not committed)
¦   +-- models/                 # Pydantic data models
¦   +-- routers/                # API route handlers (auth, profile, plan, activities)
¦   +-- Rules/                  # Expert rule definitions
¦   +-- utils/                  # Utility functions
+-- frontend/                   # React + TypeScript frontend (Vite)
¦   +-- src/                    # Source files
¦   +-- package.json            # Node dependencies
¦   +-- vite.config.ts          # Vite and proxy configuration
¦   +-- index.html              # Entry HTML
+-- ml_model/                   # ML model training and artifacts
¦   +-- caire_random_forest_demo.joblib
¦   +-- caire_train_random_forest.py
¦   +-- caire_training_data.csv
+-- README.md
```

---

## 14. Scope and Limitations

- The system supports screening of possible reading and literacy difficulties only.
- Risk predictions are intended to support, not replace, teacher judgment.
- Data availability and quality can affect system performance.
- Sample or synthetic data may be used during prototype development.
- Model predictions and intervention recommendations require appropriate evaluation and expert validation.
- The system does not provide a clinical diagnosis of dyslexia.

---

## 15. Testing and Evaluation

The project is evaluated using suitable measures for each component:

- Classification performance — precision, recall, and F1-score where applicable.
- Evaluation of reading and spelling analysis against appropriate reference labels.
- Relevance and usefulness of learning recommendations.
- Feedback from teachers or other appropriate reviewers, when collected.
- Integration and usability testing.

---

## 16. Future Improvements

- Integrate all four components using the agreed API interfaces.
- Replace mock inputs with actual component outputs from RFCS, DESI, and SHAP.
- Improve models using suitable, verified data.
- Obtain expert feedback and validate system recommendations.
- Improve progress tracking and personalized learning plans.
- Conduct system integration and usability testing.

---

## 17. Project Status

This repository contains the active implementation for the CAIRE component of the research project. The backend (FastAPI) and frontend (React + Vite) are functional for local development. Integration with the remaining three components (RFCS, DESI, SHAP) is in progress.

For component-specific setup instructions, refer to the documentation within each component directory.
