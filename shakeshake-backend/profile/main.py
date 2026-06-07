"""
ShakeShake Profile Service
Port: 23002
Handles user profile creation, retrieval, and updates.
Also manages identity, interests, and personality data.
Uses SQLite shared with the auth service.
"""

import os
import sqlite3
import uuid
import json
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s %(message)s", datefmt="%Y-%m-%dT%H:%M:%S")
logger = logging.getLogger("profile")

app = FastAPI(title="ShakeShake Profile Service", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── SQLite ───────────────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), "shakeshake.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS users (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            email       TEXT NOT NULL UNIQUE,
            password    TEXT NOT NULL,
            age_range   TEXT NOT NULL DEFAULT '',
            major       TEXT NOT NULL DEFAULT '',
            bio         TEXT NOT NULL DEFAULT '',
            created_at  TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS identity (
            user_id            TEXT PRIMARY KEY,
            gender             TEXT NOT NULL DEFAULT '',
            orientation        TEXT NOT NULL DEFAULT '',
            religion           TEXT NOT NULL DEFAULT '',
            religion_openness  TEXT NOT NULL DEFAULT '',
            created_at         TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS interests (
            user_id    TEXT PRIMARY KEY,
            hobbies    TEXT NOT NULL DEFAULT '[]',
            music      TEXT NOT NULL DEFAULT '[]',
            movies     TEXT NOT NULL DEFAULT '[]',
            tv         TEXT NOT NULL DEFAULT '[]',
            games      TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS personality_traits (
            user_id            TEXT PRIMARY KEY,
            mbti               TEXT NOT NULL DEFAULT '',
            sbti               TEXT NOT NULL DEFAULT '',
            listener_speaker   REAL NOT NULL DEFAULT 0.5,
            dominant_passive   REAL NOT NULL DEFAULT 0.5,
            emotion_action     REAL NOT NULL DEFAULT 0.5,
            created_at         TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id      TEXT PRIMARY KEY,
            ollama_model TEXT NOT NULL DEFAULT 'llama3',
            ollama_url   TEXT NOT NULL DEFAULT 'http://localhost:11434',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)
    conn.commit()
    conn.close()
    logger.info(f"database initialised at {DB_PATH}")


init_db()


# ── Logging Middleware ─────────────────────────────────────────
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


def _parse_list(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass
    return [item.strip() for item in value.split(",") if item.strip()]


# ── Models ──────────────────────────────────────────────────────

class ProfileCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., min_length=3, max_length=120)
    password: str = ""  # optional — auth service pre-hashes
    age_range: str = ""
    major: str = ""
    bio: str = ""

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    age_range: Optional[str] = None
    major: Optional[str] = None
    bio: Optional[str] = None

class ProfileResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    age_range: Optional[str] = None
    major: Optional[str] = None
    bio: Optional[str] = None
    identity: Optional[dict] = None
    interests: Optional[dict] = None
    personality: Optional[dict] = None
    message: Optional[str] = None

class IdentityCreateRequest(BaseModel):
    gender: Optional[str] = None
    orientation: Optional[str] = None
    religion: Optional[str] = None
    religion_openness: Optional[str] = None

class IdentityResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    gender: Optional[str] = None
    orientation: Optional[str] = None
    religion: Optional[str] = None
    religion_openness: Optional[str] = None
    message: Optional[str] = None

class InterestCreateRequest(BaseModel):
    hobbies: list[str] = []
    music: list[str] = []
    movies: list[str] = []
    tv: list[str] = []
    games: list[str] = []

class InterestResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    hobbies: Optional[list[str]] = None
    music: Optional[list[str]] = None
    movies: Optional[list[str]] = None
    tv: Optional[list[str]] = None
    games: Optional[list[str]] = None
    message: Optional[str] = None

class PersonalityCreateRequest(BaseModel):
    mbti: str = ""
    sbti: str = ""
    listener_speaker: Optional[float] = None
    dominant_passive: Optional[float] = None
    emotion_action: Optional[float] = None

class PersonalityResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    mbti: Optional[str] = None
    sbti: Optional[str] = None
    listener_speaker: Optional[float] = None
    dominant_passive: Optional[float] = None
    emotion_action: Optional[float] = None
    message: Optional[str] = None


# ── Profile Routes ────────────────────────────────────────────

@app.get("/profile/health")
def health():
    return {"status": "ok", "service": "profile"}


@app.post("/profile/create", response_model=ProfileResponse)
def create_profile(payload: ProfileCreateRequest):
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    logger.info(f"create profile: {payload.email}")

    conn = get_db()
    try:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (payload.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        conn.execute(
            "INSERT INTO users (id, name, email, password, age_range, major, bio, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, payload.name, payload.email, payload.password, payload.age_range, payload.major, payload.bio, now),
        )
        # Create aux rows
        conn.execute("INSERT OR IGNORE INTO identity (user_id, created_at) VALUES (?, ?)", (user_id, now))
        conn.execute("INSERT OR IGNORE INTO interests (user_id, created_at) VALUES (?, ?)", (user_id, now))
        conn.execute("INSERT OR IGNORE INTO personality_traits (user_id, mbti, created_at) VALUES (?, ?, ?)", (user_id, "", now))
        conn.execute("INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)", (user_id,))
        conn.commit()
    finally:
        conn.close()

    logger.info(f"created user: {user_id} ({payload.email})")
    return ProfileResponse(success=True, user_id=user_id, name=payload.name, email=payload.email,
                         age_range=payload.age_range, major=payload.major, bio=payload.bio, message="Profile created")


@app.get("/profile/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: str):
    logger.info(f"get profile: {user_id}")
    conn = get_db()
    try:
        row = conn.execute("SELECT id, name, email, age_range, major, bio, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        identity = conn.execute("SELECT gender, orientation, religion, religion_openness FROM identity WHERE user_id = ?", (user_id,)).fetchone()
        interests = conn.execute("SELECT * FROM interests WHERE user_id = ?", (user_id,)).fetchone()
        personality = conn.execute("SELECT * FROM personality_traits WHERE user_id = ?", (user_id,)).fetchone()
    finally:
        conn.close()

    return ProfileResponse(
        success=True, user_id=row["id"], name=row["name"], email=row["email"],
        age_range=row["age_range"], major=row["major"], bio=row["bio"],
        identity={"gender": identity["gender"] or "", "orientation": identity["orientation"] or "",
                  "religion": identity["religion"] or "", "religion_openness": identity["religion_openness"] or ""} if identity else None,
        interests={"hobbies": _parse_list(interests["hobbies"]), "music": _parse_list(interests["music"]),
                  "movies": _parse_list(interests["movies"]), "tv": _parse_list(interests["tv"]),
                  "games": _parse_list(interests["games"])} if interests else None,
        personality={"mbti": personality["mbti"] or "", "sbti": personality["sbti"] or "",
                     "listener_speaker": personality["listener_speaker"] if personality else 0.5,
                     "dominant_passive": personality["dominant_passive"] if personality else 0.5,
                     "emotion_action": personality["emotion_action"] if personality else 0.5} if personality else None,
    )


@app.put("/profile/{user_id}", response_model=ProfileResponse)
def update_profile(user_id: str, payload: ProfileUpdateRequest):
    logger.info(f"update profile: {user_id}")
    conn = get_db()
    try:
        existing = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="User not found")

        updates = {}
        if payload.name is not None: updates["name"] = payload.name
        if payload.age_range is not None: updates["age_range"] = payload.age_range
        if payload.major is not None: updates["major"] = payload.major
        if payload.bio is not None: updates["bio"] = payload.bio

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            conn.execute(f"UPDATE users SET {set_clause} WHERE id = ?", (*updates.values(), user_id))
            conn.commit()

        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    finally:
        conn.close()

    return ProfileResponse(success=True, user_id=row["id"], name=row["name"],
                         age_range=row["age_range"], major=row["major"], bio=row["bio"], message="Profile updated")


# ── Identity Routes ────────────────────────────────────────────

@app.post("/profile/{user_id}/identity", response_model=IdentityResponse)
def save_identity(user_id: str, payload: IdentityCreateRequest):
    logger.info(f"save identity: {user_id}")
    conn = get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            """INSERT INTO identity (user_id, gender, orientation, religion, religion_openness, created_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET
                   gender = COALESCE(?, gender), orientation = COALESCE(?, orientation),
                   religion = COALESCE(?, religion), religion_openness = COALESCE(?, religion_openness)""",
            (user_id,
             payload.gender or "", payload.orientation or "",
             payload.religion or "", payload.religion_openness or "", now,
             payload.gender, payload.orientation, payload.religion, payload.religion_openness),
        )
        conn.commit()
    finally:
        conn.close()
    return IdentityResponse(success=True, message="Identity saved")


@app.get("/profile/{user_id}/identity", response_model=IdentityResponse)
def get_identity(user_id: str):
    logger.info(f"get identity: {user_id}")
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM identity WHERE user_id = ?", (user_id,)).fetchone()
    finally:
        conn.close()
    if not row:
        return IdentityResponse(success=True, gender="", orientation="", religion="", religion_openness="")
    return IdentityResponse(success=True, user_id=row["user_id"], gender=row["gender"],
                          orientation=row["orientation"], religion=row["religion"],
                          religion_openness=row["religion_openness"])


# ── Interests Routes ───────────────────────────────────────────

@app.post("/profile/{user_id}/interests", response_model=InterestResponse)
def save_interests(user_id: str, payload: InterestCreateRequest):
    logger.info(f"save interests: {user_id} hobbies={len(payload.hobbies)}")
    conn = get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            """INSERT INTO interests (user_id, hobbies, music, movies, tv, games, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET
                   hobbies = excluded.hobbies, music = excluded.music,
                   movies = excluded.movies, tv = excluded.tv, games = excluded.games""",
            (user_id, json.dumps(payload.hobbies), json.dumps(payload.music),
             json.dumps(payload.movies), json.dumps(payload.tv), json.dumps(payload.games), now),
        )
        conn.commit()
    finally:
        conn.close()
    return InterestResponse(success=True, hobbies=payload.hobbies, music=payload.music,
                          movies=payload.movies, tv=payload.tv, games=payload.games, message="Interests saved")


@app.get("/profile/{user_id}/interests", response_model=InterestResponse)
def get_interests(user_id: str):
    logger.info(f"get interests: {user_id}")
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM interests WHERE user_id = ?", (user_id,)).fetchone()
    finally:
        conn.close()
    if not row:
        return InterestResponse(success=True, hobbies=[], music=[], movies=[], tv=[], games=[])
    return InterestResponse(success=True, user_id=row["user_id"],
                          hobbies=_parse_list(row["hobbies"]), music=_parse_list(row["music"]),
                          movies=_parse_list(row["movies"]), tv=_parse_list(row["tv"]),
                          games=_parse_list(row["games"]))


# ── Personality Routes ─────────────────────────────────────────

@app.post("/profile/{user_id}/personality", response_model=PersonalityResponse)
def save_personality(user_id: str, payload: PersonalityCreateRequest):
    logger.info(f"save personality: {user_id} mbti={payload.mbti}")
    conn = get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        # Use defaults of 0.5 for INSERT, but None for COALESCE UPDATE so partial updates work
        ls_val = payload.listener_speaker if payload.listener_speaker is not None else 0.5
        dp_val = payload.dominant_passive if payload.dominant_passive is not None else 0.5
        ea_val = payload.emotion_action if payload.emotion_action is not None else 0.5

        conn.execute(
            """INSERT INTO personality_traits (user_id, mbti, sbti, listener_speaker, dominant_passive, emotion_action, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET
                   mbti = COALESCE(?, mbti), sbti = COALESCE(?, sbti),
                   listener_speaker = COALESCE(?, listener_speaker),
                   dominant_passive = COALESCE(?, dominant_passive),
                   emotion_action = COALESCE(?, emotion_action)""",
            (user_id, payload.mbti, payload.sbti, ls_val,
             dp_val, ea_val, now,
             payload.mbti or None, payload.sbti or None,
             payload.listener_speaker,
             payload.dominant_passive,
             payload.emotion_action),
        )
        conn.commit()
    finally:
        conn.close()
    return PersonalityResponse(success=True, mbti=payload.mbti, sbti=payload.sbti,
                            listener_speaker=payload.listener_speaker if payload.listener_speaker is not None else 0.5,
                            dominant_passive=payload.dominant_passive if payload.dominant_passive is not None else 0.5,
                            emotion_action=payload.emotion_action if payload.emotion_action is not None else 0.5,
                            message="Personality traits saved")


@app.get("/profile/{user_id}/personality", response_model=PersonalityResponse)
def get_personality(user_id: str):
    logger.info(f"get personality: {user_id}")
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM personality_traits WHERE user_id = ?", (user_id,)).fetchone()
    finally:
        conn.close()
    if not row:
        return PersonalityResponse(success=True, mbti="", sbti="", listener_speaker=0.5,
                                 dominant_passive=0.5, emotion_action=0.5)
    return PersonalityResponse(success=True, user_id=row["user_id"], mbti=row["mbti"], sbti=row["sbti"],
                            listener_speaker=round(row["listener_speaker"], 2),
                            dominant_passive=round(row["dominant_passive"], 2),
                            emotion_action=round(row["emotion_action"], 2))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=23002, reload=True)
