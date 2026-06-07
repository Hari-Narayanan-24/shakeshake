"""
ShakeShake Auth Service
Port: 23000
Handles user registration, sign-in, and settings.
Reads/writes user data from the shared profile SQLite DB.
"""

import os
import sqlite3
import uuid
import hashlib
import hmac
import time
import base64
import json
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s %(message)s", datefmt="%Y-%m-%dT%H:%M:%S")
logger = logging.getLogger("auth")

app = FastAPI(title="ShakeShake Auth Service", version="2.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Shared DB path ──────────────────────────────────────────────
PROFILE_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "profile", "shakeshake.db")
JWT_SECRET = os.environ.get("JWT_SECRET", "shakeshake-dev-secret-change-me")
JWT_EXPIRY_SECONDS = 7 * 24 * 3600

os.makedirs(os.path.dirname(PROFILE_DB_PATH), exist_ok=True)


# ── Logging Middleware ────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    method = request.method
    url = request.url.path
    logger.info(f"➡️  {method} {url}")
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000
    icon = "🟢" if response.status_code < 400 else "🟡" if response.status_code < 500 else "🔴"
    logger.info(f"{icon} {method} {url} → {response.status_code} ({duration_ms:.0f}ms)")
    return response


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(PROFILE_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _hash_password(password: str) -> str:
    salt = uuid.uuid4().hex
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${hashed}"


def _verify_password(password: str, stored: str) -> bool:
    if "$" not in stored:
        return password == stored
    salt, hashed = stored.split("$", 1)
    return hashlib.sha256((salt + password).encode()).hexdigest() == hashed


def _create_jwt(user_id: str, email: str) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    now = int(time.time())
    payload_data = {"userId": user_id, "email": email, "iat": now, "exp": now + JWT_EXPIRY_SECONDS}
    payload = base64.urlsafe_b64encode(json.dumps(payload_data).encode()).decode().rstrip("=")
    sig_input = f"{header}.{payload}"
    signature = hmac.new(JWT_SECRET.encode(), sig_input.encode(), hashlib.sha256).hexdigest()
    return f"{header}.{payload}.{signature}"


# ── Models ──────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    age_range: str = "18-20"
    major: str = ""
    bio: str = ""

class RegisterResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    name: Optional[str] = None
    token: Optional[str] = None
    message: Optional[str] = None

class SignInRequest(BaseModel):
    email: str
    password: str

class SignInResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user_id: Optional[str] = None
    name: Optional[str] = None
    message: Optional[str] = None

class SettingsResponse(BaseModel):
    success: bool
    ollamaModel: Optional[str] = None
    ollamaUrl: Optional[str] = None

class SettingsUpdateRequest(BaseModel):
    ollamaModel: Optional[str] = None
    ollamaUrl: Optional[str] = None


# ── Auth Routes ────────────────────────────────────────────────

@app.post("/auth/register", response_model=RegisterResponse)
def register(payload: RegisterRequest):
    logger.info(f"register attempt: {payload.email}")
    conn = _get_db()
    try:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (payload.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user_id = str(uuid.uuid4())
        password_hash = _hash_password(payload.password)
        now = datetime.now(timezone.utc).isoformat()

        conn.execute(
            "INSERT INTO users (id, name, email, password, age_range, major, bio, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, payload.name, payload.email, password_hash, payload.age_range, payload.major, payload.bio, now),
        )
        # Create auxiliary rows in the same transaction so everything succeeds or fails together
        conn.execute("INSERT OR IGNORE INTO identity (user_id, created_at) VALUES (?, ?)", (user_id, now))
        conn.execute("INSERT OR IGNORE INTO interests (user_id, created_at) VALUES (?, ?)", (user_id, now))
        conn.execute("INSERT OR IGNORE INTO personality_traits (user_id, mbti, created_at) VALUES (?, ?, ?)", (user_id, "", now))
        conn.execute("INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)", (user_id,))
        conn.commit()
    finally:
        conn.close()

    token = _create_jwt(user_id, payload.email)
    logger.info(f"registered user: {user_id} ({payload.email})")
    return RegisterResponse(success=True, user_id=user_id, name=payload.name, token=token, message="Account created")


@app.post("/auth/sign-in", response_model=SignInResponse)
def sign_in(payload: SignInRequest):
    logger.info(f"sign-in attempt: {payload.email}")
    conn = _get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (payload.email,)).fetchone()
    finally:
        conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="No account found with this email")

    if not _verify_password(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Wrong password")

    # Upgrade legacy plain-text password
    if "$" not in user["password"] and user["password"] == payload.password:
        conn = _get_db()
        try:
            conn.execute("UPDATE users SET password = ? WHERE id = ?", (_hash_password(payload.password), user["id"]))
            conn.commit()
        finally:
            conn.close()

    token = _create_jwt(user["id"], user["email"])
    logger.info(f"signed in: {user['id']} ({payload.email})")
    return SignInResponse(success=True, token=token, user_id=user["id"], name=user["name"], message="Signed in")


# ── Settings Routes (frontend sends settings to port 23000) ──

@app.get("/settings/{user_id}", response_model=SettingsResponse)
def get_settings(user_id: str):
    logger.info(f"get settings: {user_id}")
    conn = _get_db()
    try:
        row = conn.execute("SELECT ollama_model, ollama_url FROM user_settings WHERE user_id = ?", (user_id,)).fetchone()
    finally:
        conn.close()
    return SettingsResponse(
        success=True,
        ollamaModel=row["ollama_model"] if row else "llama3",
        ollamaUrl=row["ollama_url"] if row else "http://localhost:11434",
    )


@app.put("/settings/{user_id}")
def update_settings(user_id: str, payload: SettingsUpdateRequest):
    logger.info(f"update settings: {user_id} model={payload.ollamaModel} url={payload.ollamaUrl}")
    conn = _get_db()
    try:
        conn.execute("""
            INSERT INTO user_settings (user_id, ollama_model, ollama_url)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                ollama_model = COALESCE(?, ollama_model),
                ollama_url = COALESCE(?, ollama_url)
        """, (
            user_id,
            payload.ollamaModel or "llama3", payload.ollamaUrl or "http://localhost:11434",
            payload.ollamaModel, payload.ollamaUrl,
        ))
        conn.commit()
    finally:
        conn.close()
    return {"success": True}


@app.get("/auth/health")
def health():
    return {"status": "ok", "service": "auth"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=23000, reload=True)
