"""
Matching engine orchestrator.
Coordinates time filtering, scoring, LLM phrase generation, and match creation.
"""

import os
import sqlite3
import uuid
import logging
from datetime import datetime, timezone

from matching.time_overlap import compute_time_overlap
from matching.scoring import compute_composite_score
from matching.phrases import generate_catch_phrase, compute_semantic_score
from storage.json_store import (
    upsert_session,
    get_active_sessions,
    create_match,
)
from models import (
    DayAvailability,
    MatchResultResponse,
    OverlappingSlot,
    SessionProfilePayload,
)

logger = logging.getLogger(__name__)

MATCH_THRESHOLD = 60.0  # Minimum match percentage

# Path to profile service DB
PROFILE_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "..", "profile", "shakeshake.db"
)


def _get_profile_data(user_id: str) -> dict:
    """Load interests and personality data from the profile SQLite DB."""
    result: dict = {"interests": None, "personality": None, "name": None}

    if not os.path.exists(PROFILE_DB_PATH):
        return result

    try:
        conn = sqlite3.connect(PROFILE_DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")

        user = conn.execute("SELECT name FROM users WHERE id = ?", (user_id,)).fetchone()
        if user:
            result["name"] = user["name"]

        interests = conn.execute(
            "SELECT * FROM interests WHERE user_id = ?", (user_id,)
        ).fetchone()
        if interests:
            result["interests"] = dict(interests)

        personality = conn.execute(
            "SELECT * FROM personality_traits WHERE user_id = ?", (user_id,)
        ).fetchone()
        if personality:
            result["personality"] = dict(personality)

        conn.close()
    except Exception as e:
        logger.warning(f"Failed to read profile for {user_id}: {e}")

    return result


def find_best_match(
    requesting_user_id: str,
    session_profile: SessionProfilePayload,
    availability: list[DayAvailability],
) -> MatchResultResponse:
    """
    Main matching entry point.

    1. Save the requesting user's session
    2. Find candidates with overlapping availability
    3. Score each candidate
    4. Return the best match above threshold (or no match)
    """
    # 1. Save session
    session_dict = session_profile.model_dump()
    avail_dict = [a.model_dump() for a in availability]
    upsert_session(requesting_user_id, session_dict, avail_dict)

    # 2. Get active sessions (other users)
    active_sessions = get_active_sessions(max_age_hours=4)
    if requesting_user_id in active_sessions:
        del active_sessions[requesting_user_id]

    if not active_sessions:
        return MatchResultResponse(
            success=True,
            matched=False,
            message="No other users shaking right now — be the first! 🥳",
        )

    # 3. Load requesting user's profile
    profile_a = _get_profile_data(requesting_user_id)

    # 4. Score each candidate
    candidates: list[tuple[str, dict, dict, float, list[OverlappingSlot]]] = []

    for candidate_id, candidate_data in active_sessions.items():
        candidate_avail = [DayAvailability(**d) for d in candidate_data.get("availability", [])]

        # Hard filter: time overlap
        overlaps = compute_time_overlap(availability, candidate_avail)
        if not overlaps:
            continue

        candidate_session = candidate_data.get("sessionProfile", {})
        profile_b = _get_profile_data(candidate_id)

        # Semantic similarity (own words)
        semantic_score = compute_semantic_score(
            session_profile.ownWords,
            candidate_session.get("ownWords"),
        )

        # Composite score
        score = compute_composite_score(
            session_dict,
            candidate_session,
            profile_a,
            profile_b,
            semantic_score,
        )

        if score >= MATCH_THRESHOLD:
            candidates.append((candidate_id, candidate_session, profile_b, score, overlaps))

    # 5. Pick best match
    if not candidates:
        return MatchResultResponse(
            success=True,
            matched=False,
            message="No vibe match right now — shake again later! 🫶",
        )

    candidates.sort(key=lambda x: x[3], reverse=True)
    best_id, best_session, best_profile, best_score, best_overlaps = candidates[0]

    # 6. Generate catch phrase
    catch_phrase = generate_catch_phrase(session_dict, best_session, best_score)

    # 7. Create match record
    match_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    match_data = {
        "matchId": match_id,
        "userA": requesting_user_id,
        "userAName": profile_a.get("name", "User"),
        "userB": best_id,
        "userBName": best_profile.get("name", "User"),
        "matchPercentage": best_score,
        "catchPhrase": catch_phrase,
        "overlappingSlots": [o.model_dump() for o in best_overlaps],
        "status": "pending",
        "createdAt": now,
    }
    create_match(match_data)

    # 8. Build shared interests from session data
    shared = list(
        set(session_profile.activities or []) & set(best_session.get("activities", []))
    )

    return MatchResultResponse(
        success=True,
        matched=True,
        matchId=match_id,
        matchedUserId=best_id,
        matchedUserName=best_profile.get("name", "User"),
        matchPercentage=best_score,
        message=catch_phrase,
        sharedInterests=shared if shared else None,
        catchPhrase=catch_phrase,
        overlappingSlots=best_overlaps,
    )
