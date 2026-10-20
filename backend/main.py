"""
CAIRE — FastAPI Main Application
Component: Adaptive Intervention Planning & Progress Tracking
Team Member: H.K.S.S. Hansamal — IT23166356
Project: AI-Assisted Adaptive English Learning System for Primary Students in Sri Lanka
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import auth, profile
from database import connect_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="CAIRE API",
    description=(
        "Adaptive Intervention Planning & Progress Tracking — "
        "AI-Assisted English Learning System for Sri Lankan Primary Students (Grade 3-5)"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS Middleware ─────────────────────────────────────────────────────────
# Allow the React development server and any deployed frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile & Progress"])


# ─── Root & Health ──────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message": "CAIRE Backend is running!",
        "project": "AI-Assisted Adaptive English Learning System",
        "component": "Adaptive Intervention Planning & Progress Tracking (CAIRE)",
        "team_member": "H.K.S.S. Hansamal - IT23166356",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "CAIRE API"}
