import type { ComponentProps } from "react";
import type { Feather } from "@expo/vector-icons";
import type {
  AgeRange,
  GenderOption,
  OrientationOption,
  ReligionOpennessOption,
  ReligionOption,
} from "../types/onboarding";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

// ── Profile page options (Page 1) ────────────────────────────────

export const ageRanges: Array<{ id: AgeRange; label: string }> = [
  { id: "18-20", label: "18–20" },
  { id: "21-24", label: "21–24" },
  { id: "25-30", label: "25–30" },
];

export const majors: Array<{ id: string; label: string }> = [
  { id: "computer-science", label: "Computer Science" },
  { id: "medicine", label: "Medicine" },
  { id: "design", label: "Design" },
  { id: "business", label: "Business" },
  { id: "engineering", label: "Engineering" },
  { id: "arts", label: "Arts" },
  { id: "law", label: "Law" },
  { id: "other", label: "Other" },
];

// ── Identity page options (Page 2) ───────────────────────────────

export const genders: Array<{ id: GenderOption; label: string }> = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "non-binary", label: "Non-binary" },
  { id: "trans", label: "Trans" },
  { id: "other-gender", label: "Other" },
  { id: "prefer-not-gender", label: "Prefer not to say" },
];

export const orientations: Array<{ id: OrientationOption; label: string }> = [
  { id: "straight", label: "Straight" },
  { id: "gay", label: "Gay" },
  { id: "lesbian", label: "Lesbian" },
  { id: "bisexual", label: "Bisexual" },
  { id: "queer", label: "Queer" },
  { id: "other-orientation", label: "Other" },
  { id: "prefer-not-orientation", label: "Prefer not to say" },
];

export const religions: Array<{ id: ReligionOption; label: string }> = [
  { id: "christian", label: "Christian" },
  { id: "muslim", label: "Muslim" },
  { id: "hindu", label: "Hindu" },
  { id: "jewish", label: "Jewish" },
  { id: "buddhist", label: "Buddhist" },
  { id: "atheist", label: "Atheist" },
  { id: "agnostic", label: "Agnostic" },
  { id: "other-religion", label: "Other" },
  { id: "prefer-not-religion", label: "Prefer not to say" },
];

export const religionOpenness: Array<{ id: ReligionOpennessOption; label: string }> = [
  { id: "very-important", label: "Very important" },
  { id: "somewhat-important", label: "Somewhat important" },
  { id: "not-important", label: "Not important" },
  { id: "prefer-not-discuss", label: "Prefer not to discuss" },
];

// ── Interests & Hobbies (Page 3) ─────────────────────────────────

export const hobbies: Array<{ id: string; label: string; icon: FeatherIconName }> = [
  { id: "games", label: "Games", icon: "command" },
  { id: "books", label: "Books", icon: "book-open" },
  { id: "movies", label: "Movies", icon: "film" },
  { id: "tv", label: "TV", icon: "tv" },
  { id: "music", label: "Music", icon: "music" },
  { id: "events", label: "Events", icon: "calendar" },
  { id: "food", label: "Food", icon: "coffee" },
  { id: "walks", label: "Walks", icon: "map-pin" },
];

export const musicGenres: Array<{ id: string; label: string }> = [
  { id: "pop", label: "Pop" },
  { id: "rnb", label: "R&B" },
  { id: "hiphop", label: "Hip-hop" },
  { id: "kpop", label: "K-pop" },
  { id: "indie", label: "Indie" },
  { id: "rock", label: "Rock" },
  { id: "electronic", label: "Electronic" },
  { id: "lofi", label: "Lo-fi" },
];

export const movieGenres: Array<{ id: string; label: string }> = [
  { id: "romcom", label: "Rom-com" },
  { id: "action", label: "Action" },
  { id: "horror", label: "Horror" },
  { id: "scifi", label: "Sci-fi" },
  { id: "ghibli", label: "Ghibli" },
  { id: "marvel", label: "Marvel" },
  { id: "indie-film", label: "Indie" },
  { id: "docs", label: "Docs" },
];

export const tvGenres: Array<{ id: string; label: string }> = [
  { id: "sitcoms", label: "Sitcoms" },
  { id: "kdramas", label: "K-dramas" },
  { id: "crime", label: "Crime" },
  { id: "reality", label: "Reality" },
  { id: "anime", label: "Anime" },
  { id: "british", label: "British" },
  { id: "netflix", label: "Netflix" },
  { id: "mystery", label: "Mystery" },
];

export const gameGenres: Array<{ id: string; label: string }> = [
  { id: "fortnite", label: "Fortnite" },
  { id: "roblox", label: "Roblox" },
  { id: "cod", label: "COD" },
  { id: "sims", label: "Sims" },
  { id: "mario", label: "Mario" },
  { id: "minecraft", label: "Minecraft" },
  { id: "valorant", label: "Valorant" },
  { id: "subway", label: "Subway Surfers" },
];

// ── Personality Traits (Page 4) ──────────────────────────────────

// Catchy phrases — one is randomly picked each time
export const personalityPhrases = [
  "What makes you, you?",
  "Decode your vibe",
  "Let's read your energy",
];

export const mbtiOptions: Array<{ id: string; label: string }> = [
  { id: "INTJ", label: "INTJ — Architect" },
  { id: "INTP", label: "INTP — Logician" },
  { id: "ENTJ", label: "ENTJ — Commander" },
  { id: "ENTP", label: "ENTP — Debater" },
  { id: "INFJ", label: "INFJ — Advocate" },
  { id: "INFP", label: "INFP — Mediator" },
  { id: "ENFJ", label: "ENFJ — Protagonist" },
  { id: "ENFP", label: "ENFP — Campaigner" },
  { id: "ISTJ", label: "ISTJ — Logistician" },
  { id: "ISFJ", label: "ISFJ — Defender" },
  { id: "ESTJ", label: "ESTJ — Executive" },
  { id: "ESFJ", label: "ESFJ — Consul" },
  { id: "ISTP", label: "ISTP — Virtuoso" },
  { id: "ISFP", label: "ISFP — Adventurer" },
  { id: "ESTP", label: "ESTP — Entrepreneur" },
  { id: "ESFP", label: "ESFP — Entertainer" },
  { id: "other", label: "Other" },
  { id: "unknown", label: "Not sure — take the test" },
];

export const sbtiOptions: Array<{ id: string; label: string }> = [
  { id: "type-a", label: "Type A — Ambitious" },
  { id: "type-b", label: "Type B — Relaxed" },
  { id: "type-c", label: "Type C — Detail-oriented" },
  { id: "type-d", label: "Type D — Cautious" },
  { id: "custom", label: "Custom" },
  { id: "not-sure", label: "Not sure — take the test" },
];

export const MBTI_INFO = "MBTI (Myers-Briggs Type Indicator) is a personality framework that sorts people into 16 types based on 4 dimensions: Introversion/Extraversion, Sensing/Intuition, Thinking/Feeling, and Judging/Perceiving. Don't know yours? Take the free test at 16personalities.com";

export const SBTI_INFO = "SBTI (Social Behavior Type Indicator) categorizes how you interact socially — Type A (driven), Type B (easy-going), Type C (perfectionist), or Type D (reserved). Not sure? Try the test at sbti-test.com";
