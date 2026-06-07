"""
ShakeShake Match Service — Pydantic request/response models
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Time Slot ──────────────────────────────────────────────────────

class TimeSlot(BaseModel):
    startHour: int = Field(..., ge=0, le=23)
    startMinute: int = Field(..., ge=0, le=30)  # 0 or 30
    durationHours: float = Field(..., gt=0, le=12)


class OverlappingSlot(BaseModel):
    date: str
    startHour: int
    startMinute: int
    durationHours: float


# ── Day Availability ───────────────────────────────────────────────

class DayAvailability(BaseModel):
    date: str
    dayLabel: str
    dateNumber: int
    isAvailable: bool
    timeSlots: list[TimeSlot] = []


# ── Session Profile ────────────────────────────────────────────────

class SessionProfilePayload(BaseModel):
    mood: Optional[str] = None
    energy: Optional[str] = None
    goal: Optional[str] = None
    companyType: Optional[str] = None
    companyFeel: Optional[str] = None
    activities: list[str] = []
    vibeType: Optional[str] = None
    relaxation: Optional[str] = None
    weekend: Optional[str] = None
    moment: Optional[str] = None
    topicType: Optional[float] = None
    calmToEnergetic: Optional[float] = None
    shareToReserve: Optional[float] = None
    avoid: list[str] = []
    ownWords: Optional[str] = None


# ── Match Requests / Responses ─────────────────────────────────────

class MatchShakeRequest(BaseModel):
    userId: str = Field(..., min_length=1)
    sessionProfile: SessionProfilePayload = Field(default_factory=SessionProfilePayload)
    availability: list[DayAvailability] = []


class MatchResultResponse(BaseModel):
    success: bool
    matched: bool = False
    matchId: Optional[str] = None
    matchedUserId: Optional[str] = None
    matchedUserName: Optional[str] = None
    matchPercentage: Optional[float] = None
    message: Optional[str] = None
    sharedInterests: Optional[list[str]] = None
    catchPhrase: Optional[str] = None
    overlappingSlots: Optional[list[OverlappingSlot]] = None


class ConnectRequest(BaseModel):
    userId: str = Field(..., min_length=1)


# ── Chat Requests / Responses ──────────────────────────────────────

class SendMessageRequest(BaseModel):
    matchId: str = Field(..., min_length=1)
    senderId: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1, max_length=2000)


class ChatMessageResponse(BaseModel):
    id: str
    matchId: str
    senderId: str
    text: str
    timestamp: str


class ChatConversationResponse(BaseModel):
    matchId: str
    userId: str
    matchedUserId: str
    matchedUserName: str
    matchPercentage: float
    catchPhrase: str
    lastMessage: Optional[ChatMessageResponse] = None
    unreadCount: int = 0
    createdAt: str


class MarkReadRequest(BaseModel):
    userId: str = Field(..., min_length=1)
