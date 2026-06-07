"""
Compatibility lookup tables for mood, vibe, company type, and goal matching.
These provide deterministic scoring for structured session profile fields.
"""

# ── Mood Compatibility ─────────────────────────────────────────────
# Higher = more compatible. Range 0.0 – 1.0.
# Key insight: similar energy levels match better.

MOOD_COMPAT: dict[str, dict[str, float]] = {
    "Chill":    {"Chill": 1.0, "Calm": 0.9, "Social": 0.6, "Excited": 0.3, "Tired": 0.7, "Bored": 0.5, "Lonely": 0.6},
    "Social":   {"Social": 1.0, "Excited": 0.8, "Chill": 0.6, "Calm": 0.4, "Tired": 0.2, "Bored": 0.6, "Lonely": 0.8},
    "Tired":    {"Tired": 0.7, "Chill": 0.7, "Calm": 0.8, "Bored": 0.5, "Lonely": 0.5, "Social": 0.2, "Excited": 0.1},
    "Bored":    {"Bored": 0.5, "Social": 0.6, "Excited": 0.7, "Chill": 0.5, "Tired": 0.5, "Calm": 0.4, "Lonely": 0.5},
    "Excited":  {"Excited": 1.0, "Social": 0.8, "Bored": 0.7, "Chill": 0.3, "Calm": 0.2, "Tired": 0.1, "Lonely": 0.4},
    "Calm":     {"Calm": 1.0, "Chill": 0.9, "Tired": 0.8, "Bored": 0.4, "Lonely": 0.6, "Social": 0.4, "Excited": 0.2},
    "Lonely":   {"Lonely": 0.6, "Social": 0.8, "Calm": 0.6, "Chill": 0.6, "Bored": 0.5, "Tired": 0.5, "Excited": 0.4},
}


def score_mood(mood_a: str | None, mood_b: str | None) -> float:
    if not mood_a or not mood_b:
        return 0.5
    if mood_a in MOOD_COMPAT and mood_b in MOOD_COMPAT[mood_a]:
        return MOOD_COMPAT[mood_a][mood_b]
    if mood_b in MOOD_COMPAT and mood_a in MOOD_COMPAT[mood_b]:
        return MOOD_COMPAT[mood_b][mood_a]
    return 0.5


# ── Vibe Compatibility ─────────────────────────────────────────────

VIBE_ADJACENT: dict[str, list[str]] = {
    "Chill":       ["Low-key", "Calm"],
    "Fun":         ["Adventurous", "Active"],
    "Focused":     ["Deep", "Active"],
    "Deep":        ["Focused", "Creative"],
    "Active":      ["Fun", "Adventurous"],
    "Creative":    ["Deep", "Adventurous"],
    "Adventurous": ["Fun", "Active", "Creative"],
    "Low-key":     ["Chill", "Calm"],
}


def score_vibe(vibe_a: str | None, vibe_b: str | None) -> float:
    if not vibe_a or not vibe_b:
        return 0.5
    if vibe_a == vibe_b:
        return 1.0
    adj = VIBE_ADJACENT.get(vibe_a, [])
    if vibe_b in adj:
        return 0.7
    return 0.3


# ── Goal Compatibility ─────────────────────────────────────────────

GOAL_COMPAT_GROUPS: list[list[str]] = [
    # Goals within the same group are highly compatible
    ["Long-term romance", "Short-term romance"],
    ["Friends", "Chat friend", "Growth companion"],
    ["Activity buddy", "Event buddy", "Food buddy", "Study buddy"],
]

# Complementary goal pairs (not same, but work well together)
GOAL_COMPLEMENTARY: list[tuple[str, str]] = [
    ("Activity buddy", "Friends"),
    ("Growth companion", "Friends"),
    ("Food buddy", "Chat friend"),
    ("Event buddy", "Friends"),
]


def score_goal(goal_a: str | None, goal_b: str | None) -> float:
    if not goal_a or not goal_b:
        return 0.5
    if goal_a == goal_b:
        return 1.0
    for group in GOAL_COMPAT_GROUPS:
        if goal_a in group and goal_b in group:
            return 0.8
    for a, b in GOAL_COMPLEMENTARY:
        if (goal_a == a and goal_b == b) or (goal_a == b and goal_b == a):
            return 0.7
    return 0.2


# ── Company Type Compatibility ─────────────────────────────────────

COMPANY_COMPLEMENTARY: list[tuple[str, str]] = [
    ("Listener", "Be Listener"),
    ("Adviser", "Be Adviser"),
    ("Listener", "Mutual"),
    ("Adviser", "Mutual"),
    ("Be Listener", "Mutual"),
    ("Be Adviser", "Mutual"),
]


def score_company_type(ct_a: str | None, ct_b: str | None) -> float:
    if not ct_a or not ct_b:
        return 0.5
    if ct_a == ct_b:
        return 0.8 if ct_a == "Mutual" else 0.7
    for a, b in COMPANY_COMPLEMENTARY:
        if (ct_a == a and ct_b == b) or (ct_a == b and ct_b == a):
            return 1.0
    return 0.2


# ── Company Feel Compatibility ─────────────────────────────────────

FEEL_COMPAT_GROUPS: list[list[str]] = [
    ["Listen", "Hear story"],
    ["Fun chat", "Company", "Walk"],
    ["Advice", "Small favor"],
    ["Do together", "Walk", "Company"],
]


def score_company_feel(cf_a: str | None, cf_b: str | None) -> float:
    if not cf_a or not cf_b:
        return 0.5
    if cf_a == cf_b:
        return 1.0
    for group in FEEL_COMPAT_GROUPS:
        if cf_a in group and cf_b in group:
            return 0.7
    return 0.3


# ── MBTI Compatibility ─────────────────────────────────────────────

MBTI_COMPAT: dict[str, list[str]] = {
    # Each type's best matches (rough MBTI compatibility theory)
    "INTJ": ["ENFP", "ENTP"],
    "INTP": ["ENTJ", "ENFJ"],
    "INFJ": ["ENFP", "ENTP"],
    "INFP": ["ENFJ", "ENTJ"],
    "ISTJ": ["ESFP", "ESTP"],
    "ISTP": ["ESFJ", "ESTJ"],
    "ISFJ": ["ESFP", "ESTP"],
    "ISFP": ["ENFJ", "ESFJ"],
    "ENTJ": ["INFP", "INTP"],
    "ENTP": ["INFJ", "INTJ"],
    "ENFJ": ["INFP", "INTP"],
    "ENFP": ["INFJ", "INTJ"],
    "ESTJ": ["ISTP", "ISFP"],
    "ESTP": ["ISTJ", "ISFJ"],
    "ESFJ": ["ISTP", "ISFP"],
    "ESFP": ["ISTJ", "ISFJ"],
}


def score_mbti(mbti_a: str | None, mbti_b: str | None) -> float:
    if not mbti_a or not mbti_b:
        return 0.5
    if mbti_a == mbti_b:
        return 0.7
    matches = MBTI_COMPAT.get(mbti_a, [])
    if mbti_b in matches:
        return 1.0
    # Same group (e.g., both NF, both NT) gets moderate score
    if mbti_a[1] == mbti_b[1] and mbti_a[2] == mbti_b[2]:
        return 0.6
    return 0.3


# ── Avoidance Check ────────────────────────────────────────────────

AVOID_CONFLICTS: dict[str, list[str]] = {
    "Loud":     ["Clubbing", "Concerts", "Karaoke", "Excited"],
    "Serious":  ["Focused", "Deep", "Study"],
    "Romantic": ["Long-term romance", "Short-term romance", "Drinks"],
    "Intense":  ["Gym", "Hiking", "Active", "Adventurous"],
    "Smokers":  [],  # No direct session field conflict
}


def score_avoidance(
    avoid_a: list[str], session_b: dict, avoid_b: list[str], session_a: dict
) -> float:
    """Score how well two users respect each other's avoidance preferences."""
    if not avoid_a and not avoid_b:
        return 1.0

    conflicts = 0
    total_checks = 0

    # Check A's avoid list against B's profile
    for item in avoid_a:
        conflicting = AVOID_CONFLICTS.get(item, [])
        b_data = " ".join([
            session_b.get("vibeType", ""),
            session_b.get("mood", ""),
            " ".join(session_b.get("activities", [])),
        ])
        total_checks += 1
        for c in conflicting:
            if c.lower() in b_data.lower():
                conflicts += 1
                break

    # Check B's avoid list against A's profile
    for item in avoid_b:
        conflicting = AVOID_CONFLICTS.get(item, [])
        a_data = " ".join([
            session_a.get("vibeType", ""),
            session_a.get("mood", ""),
            " ".join(session_a.get("activities", [])),
        ])
        total_checks += 1
        for c in conflicting:
            if c.lower() in a_data.lower():
                conflicts += 1
                break

    if total_checks == 0:
        return 1.0
    return max(0.0, 1.0 - (conflicts / total_checks))
