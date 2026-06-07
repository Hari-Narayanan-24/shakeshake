"""
JSON file storage with thread-safe read/write.
All data is stored in JSON files keyed by userId or matchId.
"""

import json
import os
import threading
from datetime import datetime, timezone
from typing import Any

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

# Thread lock to prevent concurrent write corruption
_lock = threading.Lock()


def _path(name: str) -> str:
    os.makedirs(DATA_DIR, exist_ok=True)
    return os.path.join(DATA_DIR, name)


def _load(name: str) -> dict:
    p = _path(name)
    if not os.path.exists(p):
        return {}
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(name: str, data: dict) -> None:
    p = _path(name)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ── Sessions ───────────────────────────────────────────────────────

def upsert_session(user_id: str, session_profile: dict, availability: list) -> None:
    """Save or update a user's active session (profile + availability)."""
    with _lock:
        sessions = _load("sessions.json")
        sessions[user_id] = {
            "sessionProfile": session_profile,
            "availability": availability,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
        _save("sessions.json", sessions)


def get_active_sessions(max_age_hours: float = 4.0) -> dict:
    """Return all sessions that are not older than max_age_hours."""
    with _lock:
        sessions = _load("sessions.json")

    now = datetime.now(timezone.utc)
    active = {}
    for uid, data in sessions.items():
        try:
            updated = datetime.fromisoformat(data["updatedAt"])
            if (now - updated).total_seconds() < max_age_hours * 3600:
                active[uid] = data
        except (KeyError, ValueError):
            continue

    # Prune stale sessions
    with _lock:
        _save("sessions.json", active)

    return active


def get_session(user_id: str) -> dict | None:
    """Get a single user's session."""
    with _lock:
        sessions = _load("sessions.json")
    return sessions.get(user_id)


# ── Matches ────────────────────────────────────────────────────────

def create_match(match_data: dict) -> None:
    """Store a new match record."""
    with _lock:
        matches = _load("matches.json")
        matches[match_data["matchId"]] = match_data
        _save("matches.json", matches)


def get_match(match_id: str) -> dict | None:
    with _lock:
        matches = _load("matches.json")
    return matches.get(match_id)


def update_match_status(match_id: str, status: str) -> None:
    with _lock:
        matches = _load("matches.json")
        if match_id in matches:
            matches[match_id]["status"] = status
            _save("matches.json", matches)


def get_matches_for_user(user_id: str) -> list[dict]:
    with _lock:
        matches = _load("matches.json")
    return [
        m for m in matches.values()
        if m.get("userA") == user_id or m.get("userB") == user_id
    ]


# ── Chat Messages ──────────────────────────────────────────────────

def add_message(match_id: str, message: dict) -> None:
    """Append a message to a conversation."""
    with _lock:
        chats = _load("chats.json")
        if match_id not in chats:
            chats[match_id] = []
        chats[match_id].append(message)
        _save("chats.json", chats)


def get_messages(match_id: str) -> list[dict]:
    with _lock:
        chats = _load("chats.json")
    return chats.get(match_id, [])


def get_conversations_for_user(user_id: str) -> list[dict]:
    """Build conversation list from matches + chats for a given user."""
    with _lock:
        matches = _load("matches.json")
        chats = _load("chats.json")
        last_reads = _load("last_reads.json")

    user_matches = [
        m for m in matches.values()
        if m.get("userA") == user_id or m.get("userB") == user_id
    ]

    conversations = []
    for m in user_matches:
        other_id = m["userB"] if m["userA"] == user_id else m["userA"]
        other_name = m.get("userBName") if m["userA"] == user_id else m.get("userAName", "User")
        msgs = chats.get(m["matchId"], [])
        last_msg = msgs[-1] if msgs else None

        # Unread count
        last_read_ts = last_reads.get(user_id, {}).get(m["matchId"], "")
        unread = 0
        if last_read_ts:
            for msg in msgs:
                if msg["senderId"] != user_id and msg["timestamp"] > last_read_ts:
                    unread += 1
        else:
            unread = sum(1 for msg in msgs if msg["senderId"] != user_id)

        conversations.append({
            "matchId": m["matchId"],
            "userId": user_id,
            "matchedUserId": other_id,
            "matchedUserName": other_name,
            "matchPercentage": m.get("matchPercentage", 0),
            "catchPhrase": m.get("catchPhrase", ""),
            "lastMessage": last_msg,
            "unreadCount": unread,
            "createdAt": m.get("createdAt", ""),
        })
    return conversations


def mark_read(match_id: str, user_id: str) -> None:
    """Mark all messages in a conversation as read for a user."""
    with _lock:
        last_reads = _load("last_reads.json")
        if user_id not in last_reads:
            last_reads[user_id] = {}
        last_reads[user_id][match_id] = datetime.now(timezone.utc).isoformat()
        _save("last_reads.json", last_reads)
