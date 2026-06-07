// ── Mood & Connection Types ────────────────────────────────────

export type MoodOption =
  | "Chill"
  | "Social"
  | "Tired"
  | "Bored"
  | "Excited"
  | "Calm"
  | "Lonely";

export type ConnectionPreference =
  | "study-buddy"
  | "gym-partner"
  | "date"
  | "mentor"
  | "collaborator"
  | "friend"
  | "roommate"
  | "anyone";

export type CalendarEventType = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
};

export type CalendarPermissionStatus = "granted" | "denied" | "undetermined";

// ── Shake State ───────────────────────────────────────────────────

export type ShakeState = "idle" | "shaking" | "dna-loading" | "matched";

// ── Time Slots ────────────────────────────────────────────────────

export type TimeSlot = {
  startHour: number; // 0–23
  startMinute: number; // 0 or 30 (half-hour granularity)
  durationHours: number; // 0.5 – 12
};

// ── Match ──────────────────────────────────────────────────────────

export type OverlappingSlot = {
  date: string; // YYYY-MM-DD
  startHour: number;
  startMinute: number;
  durationHours: number;
};

export type MatchResult = {
  matched: boolean;
  matchId?: string;
  matchedUserId?: string;
  matchedUserName?: string;
  matchPercentage?: number; // 0–100
  message: string;
  sharedInterests?: string[];
  catchPhrase?: string;
  overlappingSlots?: OverlappingSlot[];
};

export type MatchRequestPayload = {
  userId: string;
  sessionProfile: SessionProfile;
  availability: DayAvailability[];
};

export type MatchResponse = {
  success: boolean;
  matched?: boolean;
  matchId?: string;
  matchedUserId?: string;
  matchedUserName?: string;
  matchPercentage?: number;
  message?: string;
  sharedInterests?: string[];
  catchPhrase?: string;
  overlappingSlots?: OverlappingSlot[];
};

// ── Weekly Availability ────────────────────────────────────────────

export type DayAvailability = {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  dateNumber: number;
  isAvailable: boolean; // derived: true when timeSlots.length > 0
  timeSlots: TimeSlot[];
};

// ── Session Profile ────────────────────────────────────────────────

export type SessionProfile = {
  mood?: string;
  energy?: string;
  goal?: string;
  companyType?: string;
  companyFeel?: string;
  activities?: string[];
  vibeType?: string;
  relaxation?: string;
  weekend?: string;
  moment?: string;
  topicType?: number; // 0–1 slider
  calmToEnergetic?: number; // 0–1 slider
  shareToReserve?: number; // 0–1 slider
  avoid?: string[];
  ownWords?: string;
};

export type SessionQuestionType = "single-select" | "multi-select" | "slider";

export type SessionQuestion = {
  id: string;
  label: string;
  type: SessionQuestionType;
  mandatory: boolean;
  options?: string[];
  sliderMin?: string;
  sliderMax?: string;
};
