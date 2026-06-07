/**
 * StorageService — thin typed wrapper around AsyncStorage.
 * All keys are namespaced to avoid collisions.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Storage key constants ───────────────────────────────────────────
export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: "ss_auth_token",
  CURRENT_USER_ID: "ss_current_user_id",

  // Onboarding flag
  ONBOARDING_COMPLETE: "ss_onboarding_complete",

  // User profiles  (key = ss_profile:{userId})
  PROFILE: (userId: string) => `ss_profile:${userId}`,
  // Identity     (key = ss_identity:{userId})
  IDENTITY: (userId: string) => `ss_identity:${userId}`,
  // Interests    (key = ss_interests:{userId})
  INTERESTS: (userId: string) => `ss_interests:${userId}`,
  // Personality  (key = ss_personality:{userId})
  PERSONALITY: (userId: string) => `ss_personality:${userId}`,

  // Settings  (key = ss_settings:{userId})
  SETTINGS: (userId: string) => `ss_settings:${userId}`,

  // Theme
  THEME_ID: "ss_theme_id",

  // Collections — stored as JSON arrays
  MATCHES: "ss_matches",
  CONVERSATIONS: "ss_conversations",
  MESSAGES: "ss_messages", // all messages keyed by matchId

  // Registered users list (array of { userId, email })
  REGISTERED_USERS: "ss_registered_users",

  // Per-user session data (mood, availability) saved before matching
  SESSION_DATA: (userId: string) => `ss_session:${userId}`,

  // Pending match notifications per user (array of match objects)
  PENDING_MATCHES: (userId: string) => `ss_pending_matches:${userId}`,

  // Seed flag (so we only seed once)
  SEEDED: "ss_seeded",
} as const;

// ── Typed helpers ───────────────────────────────────────────────────

export async function getItem<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function getAllKeys(): Promise<string[]> {
  return [...(await AsyncStorage.getAllKeys())];
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.clear();
}

/** Get all items whose keys start with a prefix */
export async function getCollectionByPrefix<T>(prefix: string): Promise<T[]> {
  const allKeys = await AsyncStorage.getAllKeys();
  const matching = allKeys.filter((k) => k.startsWith(prefix));
  if (matching.length === 0) return [];
  const raws = await AsyncStorage.multiGet(matching);
  return raws
    .map(([, v]) => {
      if (!v) return null;
      try { return JSON.parse(v) as T; } catch { return null; }
    })
    .filter(Boolean) as T[];
}

/** Check if seed data has been written before */
export async function isSeeded(): Promise<boolean> {
  return (await AsyncStorage.getItem(STORAGE_KEYS.SEEDED)) === "true";
}

/** Mark seed as done */
export async function markSeeded(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SEEDED, "true");
}
