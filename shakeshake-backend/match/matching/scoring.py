"""
Deterministic scoring functions for matching.
Each function takes two user data dicts and returns a 0-1 score.
"""

from matching.compat_tables import (
    score_avoidance,
    score_company_feel,
    score_company_type,
    score_goal,
    score_mbti,
    score_mood,
    score_vibe,
)


def _jaccard(set_a: list[str], set_b: list[str]) -> float:
    """Jaccard similarity between two lists of strings."""
    a = set(set_a)
    b = set(set_b)
    if not a and not b:
        return 0.5
    if not a or not b:
        return 0.3
    return len(a & b) / len(a | b)


def _slider_distance(a: float | None, b: float | None) -> float:
    """Inverse distance between two slider values (0-1). 1.0 = identical."""
    if a is None or b is None:
        return 0.5
    return 1.0 - abs(a - b)


def score_activities(act_a: list[str], act_b: list[str]) -> float:
    return _jaccard(act_a, act_b)


def score_interests(
    interests_a: dict | None, interests_b: dict | None
) -> float:
    """Score overlap across hobbies, music, movies, tv, games from profile DB."""
    if not interests_a or not interests_b:
        return 0.5
    scores = []
    for key in ["hobbies", "music", "movies", "tv", "games"]:
        a = interests_a.get(key, "").split(",") if isinstance(interests_a.get(key), str) else interests_a.get(key, [])
        b = interests_b.get(key, "").split(",") if isinstance(interests_b.get(key), str) else interests_b.get(key, [])
        a = [x.strip() for x in a if x.strip()]
        b = [x.strip() for x in b if x.strip()]
        scores.append(_jaccard(a, b))
    return sum(scores) / len(scores) if scores else 0.5


def score_personality(
    personality_a: dict | None, personality_b: dict | None
) -> float:
    """Score based on MBTI + personality sliders from profile DB."""
    if not personality_a or not personality_b:
        return 0.5
    mbti_score = score_mbti(personality_a.get("mbti"), personality_b.get("mbti"))
    ls = _slider_distance(personality_a.get("listener_speaker"), personality_b.get("listener_speaker"))
    dp = _slider_distance(personality_a.get("dominant_passive"), personality_b.get("dominant_passive"))
    ea = _slider_distance(personality_a.get("emotion_action"), personality_b.get("emotion_action"))
    return (mbti_score + ls + dp + ea) / 4


def score_sliders(session_a: dict, session_b: dict) -> float:
    """Score compatibility of session profile sliders (topicType, calmToEnergetic, shareToReserve)."""
    scores = [
        _slider_distance(session_a.get("topicType"), session_b.get("topicType")),
        _slider_distance(session_a.get("calmToEnergetic"), session_b.get("calmToEnergetic")),
        _slider_distance(session_a.get("shareToReserve"), session_b.get("shareToReserve")),
    ]
    return sum(scores) / len(scores)


# ── Composite Score ────────────────────────────────────────────────

# Weights for each dimension (must sum to 1.0)
WEIGHTS = {
    "goal":       0.20,
    "mood":       0.15,
    "vibe":       0.15,
    "activities": 0.10,
    "company":    0.10,
    "personality":0.10,
    "own_words":  0.10,
    "avoidance":  0.05,
    "interests":  0.05,
}


def compute_composite_score(
    session_a: dict,
    session_b: dict,
    profile_a: dict | None = None,
    profile_b: dict | None = None,
    semantic_score: float = 0.5,
) -> float:
    """
    Compute weighted composite match score (0–100).
    profile_a/b are the user profile dicts from the profile DB (interests, personality).
    semantic_score is the LLM-based own-words similarity (0–1).
    """
    scores = {
        "goal":       score_goal(session_a.get("goal"), session_b.get("goal")),
        "mood":       score_mood(session_a.get("mood"), session_b.get("mood")),
        "vibe":       score_vibe(session_a.get("vibeType"), session_b.get("vibeType")),
        "activities": score_activities(session_a.get("activities", []), session_b.get("activities", [])),
        "company":    (
            score_company_type(session_a.get("companyType"), session_b.get("companyType"))
            + score_company_feel(session_a.get("companyFeel"), session_b.get("companyFeel"))
        ) / 2,
        "personality": score_personality(
            profile_a.get("personality") if profile_a else None,
            profile_b.get("personality") if profile_b else None,
        ),
        "own_words":  semantic_score,
        "avoidance":  score_avoidance(
            session_a.get("avoid", []), session_b,
            session_b.get("avoid", []), session_a,
        ),
        "interests":  score_interests(
            profile_a.get("interests") if profile_a else None,
            profile_b.get("interests") if profile_b else None,
        ),
    }

    composite = sum(scores[dim] * WEIGHTS[dim] for dim in WEIGHTS)
    return round(composite * 100, 1)
