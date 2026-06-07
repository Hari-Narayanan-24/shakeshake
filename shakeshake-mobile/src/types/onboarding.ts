export type ScreenName = "welcome" | "profile" | "identity" | "interests" | "personality" | "success";

// ── Profile (Page 1) ─────────────────────────────────────────────

export type AgeRange = "18-20" | "21-24" | "25-30";

export type ProfileForm = {
  name: string;
  email: string;
  password: string;
  ageRange: AgeRange | "";
  major: string;
  bio: string;
};

export type ProfileCreatePayload = {
  name: string;
  email: string;
  password: string;
  age_range: string;
  major: string;
  bio: string;
};

export type ProfileResponse = {
  success: boolean;
  user_id?: string;
  name?: string;
  email?: string;
  age_range?: string;
  major?: string;
  bio?: string;
  message?: string;
};

// ── Identity (Page 2) ────────────────────────────────────────────

export type GenderOption =
  | "male"
  | "female"
  | "non-binary"
  | "trans"
  | "other-gender"
  | "prefer-not-gender";

export type OrientationOption =
  | "straight"
  | "gay"
  | "lesbian"
  | "bisexual"
  | "queer"
  | "other-orientation"
  | "prefer-not-orientation";

export type ReligionOption =
  | "christian"
  | "muslim"
  | "hindu"
  | "jewish"
  | "buddhist"
  | "atheist"
  | "agnostic"
  | "other-religion"
  | "prefer-not-religion";

export type ReligionOpennessOption =
  | "very-important"
  | "somewhat-important"
  | "not-important"
  | "prefer-not-discuss";

export type IdentityForm = {
  gender: GenderOption | "";
  orientation: OrientationOption | "";
  religion: ReligionOption | "";
  religionOpenness: ReligionOpennessOption | "";
};

export type IdentityPayload = {
  gender: string;
  orientation: string;
  religion: string;
  religion_openness: string;
};

export type IdentityResponse = {
  success: boolean;
  message?: string;
};

// ── Interests & Hobbies (Page 3) ─────────────────────────────────

export type InterestForm = {
  hobbies: string[];
  music: string[];
  movies: string[];
  tv: string[];
  games: string[];
};

export type InterestPayload = {
  hobbies: string[];
  music: string[];
  movies: string[];
  tv: string[];
  games: string[];
};

export type InterestResponse = {
  success: boolean;
  message?: string;
};

// ── Personality Traits (Page 4) ──────────────────────────────────

export type PersonalityTraitsForm = {
  mbti: string;
  sbti: string;
  listenerSpeaker: number;
  dominantPassive: number;
  emotionAction: number;
};

export type PersonalityTraitsPayload = {
  mbti: string;
  sbti: string;
  listener_speaker: number;
  dominant_passive: number;
  emotion_action: number;
};

export type PersonalityTraitsResponse = {
  success: boolean;
  message?: string;
};
