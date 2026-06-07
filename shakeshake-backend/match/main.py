"""
ShakeShake Match Service
Port: 23003
Intelligent matching powered by scoring engine.
Also handles chat message persistence and Ollama AI proxy.
"""

import os
import sys
import uuid
import json
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

# Ensure the match directory is on sys.path for imports
sys.path.insert(0, os.path.dirname(__file__))

from models import (
    ChatConversationResponse,
    ChatMessageResponse,
    ConnectRequest,
    MarkReadRequest,
    MatchResultResponse,
    MatchShakeRequest,
    SendMessageRequest,
)
from matching.engine import find_best_match
from storage.json_store import (
    add_message,
    get_conversations_for_user,
    get_match,
    get_matches_for_user,
    get_messages,
    mark_read,
    update_match_status,
)

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s %(message)s", datefmt="%Y-%m-%dT%H:%M:%S")
logger = logging.getLogger("match")

app = FastAPI(title="ShakeShake Match Service", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# ── Logging Middleware ────────────────────────────────────────────
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


# ── Match Routes ────────────────────────────────────────────────

@app.post("/match/shake", response_model=MatchResultResponse)
def match_shake(payload: MatchShakeRequest):
    """Find a match based on time overlap, session profile compatibility, and profile data."""
    logger.info(f"shake: userId={payload.userId} mood={payload.sessionProfile.mood} avail={len(payload.availability)} days")
    result = find_best_match(
        requesting_user_id=payload.userId,
        session_profile=payload.sessionProfile,
        availability=payload.availability,
    )
    if result.matched:
        logger.info(f"matched: {payload.userId} ↔ {result.matchedUserId} ({result.matchPercentage}%)")
    else:
        logger.info(f"no match for {payload.userId}: {result.message}")
    return result


@app.post("/match/{match_id}/connect")
def connect_match(match_id: str, payload: ConnectRequest):
    match = get_match(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    update_match_status(match_id, "connected")
    logger.info(f"connected match: {match_id}")
    return {"success": True, "message": "Match connected! 💥"}


@app.get("/match/history/{user_id}")
def match_history(user_id: str):
    matches = get_matches_for_user(user_id)
    logger.info(f"match history: {user_id} → {len(matches)} matches")
    return {
        "success": True,
        "matches": [
            {
                "matchId": m["matchId"],
                "matchedUserId": m.get("userB") if m.get("userA") == user_id else m.get("userA"),
                "matchedUserName": m.get("userBName") if m.get("userA") == user_id else m.get("userAName"),
                "matchPercentage": m.get("matchPercentage", 0),
                "catchPhrase": m.get("catchPhrase", ""),
                "sharedInterests": m.get("sharedInterests", []),
                "status": m.get("status", "pending"),
                "createdAt": m.get("createdAt", ""),
            }
            for m in matches
        ],
    }


# ── Chat Routes ──────────────────────────────────────────────────

@app.post("/chat/send")
def send_message(payload: SendMessageRequest):
    match = get_match(payload.matchId)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    msg = {
        "id": str(uuid.uuid4()),
        "matchId": payload.matchId,
        "senderId": payload.senderId,
        "text": payload.text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    add_message(payload.matchId, msg)
    logger.info(f"sent message: {msg['id']} in {payload.matchId} from {payload.senderId}")
    return {"success": True, "message": msg}


@app.get("/chat/messages/{match_id}")
def get_chat_messages(match_id: str):
    messages = get_messages(match_id)
    logger.info(f"get messages: {match_id} → {len(messages)} messages")
    return {"success": True, "messages": messages}


@app.get("/chat/conversations/{user_id}")
def get_chat_conversations(user_id: str):
    conversations = get_conversations_for_user(user_id)
    logger.info(f"get conversations: {user_id} → {len(conversations)} conversations")
    return {"success": True, "conversations": conversations}


@app.post("/chat/mark-read/{match_id}")
def mark_chat_read(match_id: str, payload: MarkReadRequest):
    mark_read(match_id, payload.userId)
    logger.info(f"mark-read: {match_id} for {payload.userId}")
    return {"success": True}


# ── Ollama Routes (frontend sends to port 23003) ───────────────

@app.post("/ollama/generate")
async def ollama_generate(request: Request):
    """Proxy to Ollama API for AI chat replies."""
    import httpx

    body = await request.json()
    prompt = body.get("prompt", "")
    context = body.get("context", "")
    model = body.get("model")
    user_id = body.get("userId")

    # Default Ollama settings
    ollama_url = "http://localhost:11434"
    ollama_model = "llama3"

    # Try to read user settings from profile DB
    if user_id:
        try:
            db_path = os.path.join(os.path.dirname(__file__), "..", "profile", "shakeshake.db")
            if os.path.exists(db_path):
                import sqlite3
                conn = sqlite3.connect(db_path)
                conn.row_factory = sqlite3.Row
                row = conn.execute("SELECT ollama_model, ollama_url FROM user_settings WHERE user_id = ?", (user_id,)).fetchone()
                conn.close()
                if row:
                    ollama_url = row["ollama_url"] or ollama_url
                    ollama_model = row["ollama_model"] or ollama_model
        except Exception as e:
            logger.warning(f"could not read settings for {user_id}: {e}")

    if model:
        ollama_model = model

    logger.info(f"ollama generate: model={ollama_model} url={ollama_url} prompt_len={len(prompt)}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            ollama_res = await client.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": ollama_model,
                    "prompt": f"{context}\n\n{prompt}" if context else prompt,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 300},
                },
            )
        if ollama_res.status_code != 200:
            logger.error(f"ollama API error: {ollama_res.status_code}")
            return {"success": False, "message": "Ollama is not available. Make sure Ollama is running."}

        data = ollama_res.json()
        response_text = data.get("response", "")
        logger.info(f"ollama response: {len(response_text)} chars ({ollama_model})")
        return {"success": True, "response": response_text, "model": ollama_model}

    except Exception as e:
        logger.error(f"ollama connection failed: {e}")
        return {"success": False, "message": f"Cannot connect to Ollama: {e}"}


@app.get("/ollama/status")
async def ollama_status(userId: Optional[str] = None):
    """Check if Ollama is running and list available models.
    Optionally checks the user's custom Ollama URL if userId is provided."""
    import httpx

    # Default Ollama URL
    ollama_url = "http://localhost:11434"

    # Try to read user's custom Ollama URL from settings
    if userId:
        try:
            db_path = os.path.join(os.path.dirname(__file__), "..", "profile", "shakeshake.db")
            if os.path.exists(db_path):
                import sqlite3
                conn = sqlite3.connect(db_path)
                conn.row_factory = sqlite3.Row
                row = conn.execute("SELECT ollama_url FROM user_settings WHERE user_id = ?", (userId,)).fetchone()
                conn.close()
                if row and row["ollama_url"]:
                    ollama_url = row["ollama_url"]
        except Exception as e:
            logger.warning(f"could not read settings for {userId}: {e}")

    logger.info(f"ollama status check: url={ollama_url}")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{ollama_url}/api/tags")
        if res.status_code != 200:
            logger.info("ollama offline")
            return {"success": False, "online": False, "models": [], "url": ollama_url}

        data = res.json()
        models = [m["name"] for m in data.get("models", [])]
        logger.info(f"ollama online: {len(models)} models: {', '.join(models)}")
        return {"success": True, "online": True, "models": models, "url": ollama_url}
    except Exception as e:
        logger.info(f"ollama offline: {e}")
        return {"success": False, "online": False, "models": [], "url": ollama_url}


# ── Health ───────────────────────────────────────────────────────

@app.get("/match/health")
def health():
    return {"status": "ok", "service": "match", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=23003, reload=True)
