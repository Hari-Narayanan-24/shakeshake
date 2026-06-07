import type { ComponentProps } from "react";
import type { Feather } from "@expo/vector-icons";
import type { ConnectionPreference, MoodOption } from "../types/home";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

// ── Mood options ──────────────────────────────────────────────────

export const moodOptions: Array<{ id: MoodOption; label: string; emoji: string }> = [
  { id: "Chill", label: "Chill", emoji: "😌" },
  { id: "Social", label: "Social", emoji: "🥳" },
  { id: "Tired", label: "Tired", emoji: "😴" },
  { id: "Bored", label: "Bored", emoji: "😒" },
  { id: "Excited", label: "Excited", emoji: "🤩" },
  { id: "Calm", label: "Calm", emoji: "😊" },
  { id: "Lonely", label: "Lonely", emoji: "😔" },
];

// ── Connection preference options ─────────────────────────────────

export const connectionPreferences: Array<{ id: ConnectionPreference; label: string; icon: FeatherIconName }> = [
  { id: "study-buddy", label: "Study Buddy", icon: "book-open" },
  { id: "gym-partner", label: "Gym Partner", icon: "activity" },
  { id: "date", label: "Date", icon: "heart" },
  { id: "mentor", label: "Mentor", icon: "award" },
  { id: "collaborator", label: "Collaborator", icon: "users" },
  { id: "friend", label: "Friend", icon: "smile" },
  { id: "roommate", label: "Roommate", icon: "home" },
  { id: "anyone", label: "Anyone", icon: "zap" },
];
