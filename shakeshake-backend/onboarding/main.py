"""
ShakeShake Onboarding Service
Port: 23001
Handles interest selection, personality, and onboarding completion.
Persists data to the shared profile SQLite DB.
"""

import os
import sqlite3
import json
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s %(message)s", datefmt="%Y-%m-%dT%H:%M:%S")
logger = logging.getLogger("onboarding")

app = FastAPI(title="ShakeShake Onboarding Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Shared DB path ────────────────────────────────────────────────
PROFILE_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "profile", "shakeshake.db")
os.makedirs(os.path.dirname(PROFILE_DB_PATH), exist_ok=True)


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(PROFILE_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


# ── Logging Middleware ─────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = datetime.now(timezone.utc).timestamp()
    method = request.method
    url = request.url.path
    logger.info(f"➡️  {method} {url}")
    response = await call_next(request)
    duration_ms = (datetime.now(timezone.utc).timestamp() - start) * 1000
    icon = "🟢" if response.status_code < 400 else "🟡" if response.status_code < 500 else "🔴"
    logger.info(f"{icon} {method} {url} → {response.status_code} ({duration_ms:.0f}ms)")
    return response


# ── Models ──────────────────────────────────────────────────────────

class OnboardingCompletionRequest(BaseModel):
    userId: str = ""  # frontend sends camelCase
    interests: list[str] = []
    hobbies: list[str] = []
    music: list[str] = []
    movies: list[str] = []
    tv: list[str] = []
    games: list[str] = []
    personality: str = ""

class SuccessResponse(BaseModel):
    success: bool
    message: Optional[str] = None


# ── Routes ────────────────────────────────────────────────────────────

@app.post("/onboarding/complete", response_model=SuccessResponse)
def complete_onboarding(payload: OnboardingCompletionRequest):
    logger.info(f"complete onboarding: userId={payload.userId} interests={len(payload.interests)} personality={payload.personality}")

    if payload.userId:
        conn = _get_db()
        try:
            now = datetime.now(timezone.utc).isoformat()

            # Merge interests: legacy flat list → hobbies, or use categorized fields
            hobbies = payload.hobbies if payload.hobbies else payload.interests  # backwards compat
            music = payload.music
            movies = payload.movies
            tv = payload.tv
            games = payload.games

            # Save interests (upsert all categories)
            conn.execute(
                """INSERT INTO interests (user_id, hobbies, music, movies, tv, games, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(user_id) DO UPDATE SET
                       hobbies = excluded.hobbies,
                       music = CASE WHEN excluded.music = '[]' THEN interests.music ELSE excluded.music END,
                       movies = CASE WHEN excluded.movies = '[]' THEN interests.movies ELSE excluded.movies END,
                       tv = CASE WHEN excluded.tv = '[]' THEN interests.tv ELSE excluded.tv END,
                       games = CASE WHEN excluded.games = '[]' THEN interests.games ELSE excluded.games END""",
                (payload.userId, json.dumps(hobbies), json.dumps(music),
                 json.dumps(movies), json.dumps(tv), json.dumps(games), now),
            )

            # Save personality if provided
            if payload.personality:
                conn.execute(
                    """INSERT INTO personality_traits (user_id, mbti, sbti, listener_speaker, dominant_passive, emotion_action, created_at)
                       VALUES (?, ?, '', 0.5, 0.5, 0.5, ?)
                       ON CONFLICT(user_id) DO UPDATE SET mbti = excluded.mbti""",
                    (payload.userId, payload.personality, now),
                )

            conn.commit()
        finally:
            conn.close()

    return SuccessResponse(success=True, message="Onboarding complete.")


@app.get("/onboarding/health")
def health():
    return {"status": "ok", "service": "onboarding"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=23001, reload=True)
