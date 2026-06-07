"""
ShakeShake Backend — Service Registry
Each service runs on its own port in the 23000-23999 range.
"""

SERVICES = {
    "auth":       {"port": 23000, "module": "auth.main:app"},
    "onboarding": {"port": 23001, "module": "onboarding.main:app"},
    "profile":    {"port": 23002, "module": "profile.main:app"},
    "match":      {"port": 23003, "module": "match.main:app"},
    "gateway":    {"port": 23010, "module": "gateway.main:app"},
}
