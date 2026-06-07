/**
 * mockBackend — Local-first API that reads/writes AsyncStorage.
 * Seeds on first launch, then persists changes.
 * All connectors delegate here when useMocks is true.
 */

import {
  getItem,
  setItem,
  isSeeded,
  markSeeded,
  STORAGE_KEYS,
} from "./storageService";
import {
  MOCK_USERS,
  MOCK_MATCHES,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  OLLAMA_MOCK_REPLIES,
} from "./seedData";
import type { MockMatch } from "./seedData";
import type {
  ChatConversation,
  ChatMessage,
  ChatHistoryResponse,
  ChatMessagesResponse,
  SendMessagePayload,
} from "../types/chat";
import type { MatchRequestPayload, MatchResponse, DayAvailability, SessionProfile } from "../types/home";

const CURRENT_USER_ID = "mock_user_current";
const CURRENT_USER_EMAIL = "demo@shakeshake.app";

// ── Delay helper ────────────────────────────────────────────────────
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Logging ──────────────────────────────────────────────────────────
function log(route: string, input?: unknown, output?: unknown) {
  console.log(
    `[MOCK] ${route}`,
    input ? { input: JSON.stringify(input).slice(0, 200) } : "",
    output ? { output: JSON.stringify(output).slice(0, 200) } : ""
  );
}

// ── Seed ────────────────────────────────────────────────────────────
let _seeded = false;

export async function initMockData(): Promise<void> {
  if (_seeded) return;
  const alreadySeeded = await isSeeded();
  if (alreadySeeded) {
    console.log("[MOCK] Seed data already present, skipping.");
    _seeded = true;
    return;
  }

  console.log("[MOCK] Seeding local storage with demo data...");
  await setItem(STORAGE_KEYS.MATCHES, MOCK_MATCHES);
  await setItem(STORAGE_KEYS.CONVERSATIONS, MOCK_CONVERSATIONS);
  await setItem(STORAGE_KEYS.MESSAGES, MOCK_MESSAGES);
  await setItem(STORAGE_KEYS.SETTINGS(CURRENT_USER_ID), {
    ollamaModel: "llama3",
    ollamaUrl: "http://localhost:11434",
  });

  // Store each seed user as a profile
  for (const user of MOCK_USERS) {
    await setItem(STORAGE_KEYS.PROFILE(user.user_id), {
      success: true,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      age_range: user.age_range,
      major: user.major,
      bio: user.bio,
    });
    await setItem(STORAGE_KEYS.IDENTITY(user.user_id), {
      success: true,
      gender: user.gender,
      orientation: user.orientation,
      religion: "prefer-not-religion",
      religion_openness: "prefer-not-discuss",
    });
    await setItem(STORAGE_KEYS.INTERESTS(user.user_id), {
      success: true,
      hobbies: user.hobbies,
      music: user.music,
      movies: user.movies,
      tv: user.tv,
      games: user.games,
    });
    await setItem(STORAGE_KEYS.PERSONALITY(user.user_id), {
      success: true,
      mbti: user.mbti,
      sbti: user.sbti,
      listener_speaker: 0.5,
      dominant_passive: 0.5,
      emotion_action: 0.5,
    });
  }

  // Create a "current user" profile from the first mock user
  const me = MOCK_USERS[0];
  await setItem(STORAGE_KEYS.PROFILE(CURRENT_USER_ID), {
    success: true,
    user_id: CURRENT_USER_ID,
    name: "You (Demo)",
    email: CURRENT_USER_EMAIL,
    age_range: me.age_range,
    major: me.major,
    bio: me.bio,
  });
  await setItem(STORAGE_KEYS.IDENTITY(CURRENT_USER_ID), {
    success: true,
    gender: me.gender,
    orientation: me.orientation,
    religion: "prefer-not-religion",
    religion_openness: "prefer-not-discuss",
  });
  await setItem(STORAGE_KEYS.INTERESTS(CURRENT_USER_ID), {
    success: true,
    hobbies: me.hobbies,
    music: me.music,
    movies: me.movies,
    tv: me.tv,
    games: me.games,
  });
  await setItem(STORAGE_KEYS.PERSONALITY(CURRENT_USER_ID), {
    success: true,
    mbti: me.mbti,
    sbti: me.sbti,
    listener_speaker: 0.5,
    dominant_passive: 0.5,
    emotion_action: 0.5,
  });

  await markSeeded();
  console.log("[MOCK] Seed complete — 20 users, 15 matches, 10 conversations, 50+ messages.");
  _seeded = true;
}

// ── Auth ────────────────────────────────────────────────────────────

export async function mockSignIn(email: string, _password: string) {
  await wait(350);
  // Accept any email/password combo in demo mode
  const name = email.split("@")[0]?.charAt(0).toUpperCase() + email.split("@")[0]?.slice(1) || "User";

  // Look up existing registered user by email, or create a new ID
  const registeredUsers = (await getItem<Array<{ userId: string; email: string }>>(
    STORAGE_KEYS.REGISTERED_USERS
  )) || [];
  const existing = registeredUsers.find((u) => u.email === email);
  const userId = existing?.userId || `local_${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

  const token = `mock-jwt-${userId}`;
  await setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  await setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);

  const result = {
    success: true,
    token,
    user_id: userId,
    name,
  };
  log("POST /auth/sign-in", { email }, result);
  return result;
}

export async function mockRegister(payload: {
  name: string;
  email: string;
  password: string;
}) {
  await wait(400);
  // Generate a unique user ID from the email so each account is distinct
  const email = payload.email || "";
  const userId = email
    ? `local_${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}`
    : CURRENT_USER_ID;
  const token = `mock-jwt-${userId}`;

  // Save the profile locally
  await setItem(STORAGE_KEYS.PROFILE(userId), {
    success: true,
    user_id: userId,
    name: payload.name,
    email: payload.email,
    age_range: "",
    major: "",
    bio: "",
  });
  await setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  await setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);

  // Track this user in the registered users list
  const registeredUsers = (await getItem<Array<{ userId: string; email: string }>>(
    STORAGE_KEYS.REGISTERED_USERS
  )) || [];
  if (!registeredUsers.find((u) => u.userId === userId)) {
    registeredUsers.push({ userId, email: payload.email });
    await setItem(STORAGE_KEYS.REGISTERED_USERS, registeredUsers);
  }

  const result = {
    success: true,
    user_id: userId,
    name: payload.name,
    token,
  };
  log("POST /auth/register", payload, result);
  return result;
}

// ── Profile ───────────────────────────────────────────────────────────

export async function mockGetProfile(userId: string) {
  await wait(200);
  const profile = await getItem(STORAGE_KEYS.PROFILE(userId));
  if (profile) {
    log("GET /profile/:id", { userId }, profile);
    return profile;
  }
  // Return first mock user as fallback
  const fallback = MOCK_USERS[0];
  log("GET /profile/:id (fallback)", { userId }, fallback);
  return {
    success: true,
    user_id: userId,
    name: fallback.name,
    email: fallback.email,
    age_range: fallback.age_range,
    major: fallback.major,
    bio: fallback.bio,
  };
}

export async function mockCreateProfile(payload: Record<string, unknown>) {
  await wait(300);
  // Generate a unique user ID from the email so each account is distinct
  const email = (payload.email as string) || "";
  const userId = email
    ? `local_${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}`
    : CURRENT_USER_ID;

  const profile = { success: true, user_id: userId, ...payload };
  await setItem(STORAGE_KEYS.PROFILE(userId), profile);

  // Track this user in the registered users list
  const registeredUsers = (await getItem<Array<{ userId: string; email: string }>>(
    STORAGE_KEYS.REGISTERED_USERS
  )) || [];
  if (!registeredUsers.find((u) => u.userId === userId)) {
    registeredUsers.push({ userId, email });
    await setItem(STORAGE_KEYS.REGISTERED_USERS, registeredUsers);
  }

  log("POST /profile/create", payload, profile);
  return profile;
}

export async function mockUpdateProfile(
  userId: string,
  payload: Record<string, unknown>
) {
  await wait(200);
  const existing = (await getItem(STORAGE_KEYS.PROFILE(userId))) || {};
  const updated = { ...existing, ...payload };
  await setItem(STORAGE_KEYS.PROFILE(userId), updated);
  log("PUT /profile/:id", { userId, payload }, updated);
  return { success: true };
}

// ── Identity ─────────────────────────────────────────────────────────

export async function mockSaveIdentity(userId: string, payload: Record<string, unknown>) {
  await wait(200);
  const result = { success: true, message: "Identity saved" };
  await setItem(STORAGE_KEYS.IDENTITY(userId), { ...result, ...payload });
  log("POST /profile/:id/identity", { userId, payload }, result);
  return result;
}

export async function mockGetIdentity(userId: string) {
  await wait(200);
  const identity = await getItem(STORAGE_KEYS.IDENTITY(userId));
  log("GET /profile/:id/identity", { userId }, identity);
  return identity || { success: true, gender: "", orientation: "", religion: "", religion_openness: "" };
}

// ── Interests ────────────────────────────────────────────────────────

export async function mockSaveInterests(userId: string, payload: Record<string, unknown>) {
  await wait(200);
  const result = { success: true, message: "Interests saved" };
  await setItem(STORAGE_KEYS.INTERESTS(userId), { ...result, ...payload });
  log("POST /profile/:id/interests", { userId, payload }, result);
  return result;
}

export async function mockGetInterests(userId: string) {
  await wait(200);
  const interests = await getItem(STORAGE_KEYS.INTERESTS(userId));
  log("GET /profile/:id/interests", { userId }, interests);
  return interests || {
    success: true,
    hobbies: [], music: [], movies: [], tv: [], games: [],
  };
}

// ── Personality ──────────────────────────────────────────────────────

export async function mockSavePersonality(userId: string, payload: Record<string, unknown>) {
  await wait(200);
  const result = { success: true, message: "Personality saved" };
  await setItem(STORAGE_KEYS.PERSONALITY(userId), { ...result, ...payload });
  log("POST /profile/:id/personality", { userId, payload }, result);
  return result;
}

export async function mockGetPersonality(userId: string) {
  await wait(200);
  const personality = await getItem(STORAGE_KEYS.PERSONALITY(userId));
  log("GET /profile/:id/personality", { userId }, personality);
  return personality || {
    success: true,
    mbti: "", sbti: "", listener_speaker: 0.5, dominant_passive: 0.5, emotion_action: 0.5,
  };
}

// ── Match ───────────────────────────────────────────────────────────

// Helper: check if two time slots overlap
function slotsOverlap(
  a: { startHour: number; startMinute: number; durationHours: number },
  b: { startHour: number; startMinute: number; durationHours: number }
): boolean {
  const aStart = a.startHour * 60 + a.startMinute;
  const aEnd = aStart + a.durationHours * 60;
  const bStart = b.startHour * 60 + b.startMinute;
  const bEnd = bStart + b.durationHours * 60;
  return aStart < bEnd && bStart < aEnd;
}

// Generate mock availability pattern for a candidate based on their index
function getMockUserTimeSlots(userIndex: number): Array<{
  days: number[];
  slots: Array<{ startHour: number; startMinute: number; durationHours: number }>;
}> {
  const patterns = [
    { days: [0, 1, 2, 3, 4], slots: [{ startHour: 18, startMinute: 0, durationHours: 4 }] },        // weekday evenings
    { days: [0, 1, 2, 3, 4], slots: [{ startHour: 9, startMinute: 0, durationHours: 3 }] },         // weekday mornings
    { days: [0, 1, 2, 3, 4, 5, 6], slots: [{ startHour: 17, startMinute: 0, durationHours: 4 }] },  // all week evenings
    { days: [5, 6], slots: [{ startHour: 10, startMinute: 0, durationHours: 6 }] },                  // weekend day
    { days: [0, 1, 2, 3, 4, 5, 6], slots: [{ startHour: 12, startMinute: 0, durationHours: 5 }] },  // all week afternoons
  ];
  return [patterns[userIndex % patterns.length]];
}

// Mood compatibility matrix — uses exact values from sessionData options
const moodCompat: Record<string, string[]> = {
  Chill: ["Chill", "Calm", "Tired"],
  Social: ["Social", "Excited", "Lonely"],
  Tired: ["Tired", "Chill", "Calm"],
  Bored: ["Bored", "Social", "Excited"],
  Excited: ["Excited", "Social", "Bored"],
  Calm: ["Calm", "Chill", "Tired"],
  Lonely: ["Lonely", "Social", "Calm"],
};

// Fallback moods for mock users without a mood field (existing seed data)
const MOOD_FALLBACKS = ["Chill", "Social", "Tired", "Bored", "Excited", "Calm", "Lonely"];

function computeMatchScore(
  payload: MatchRequestPayload,
  candidate: typeof MOCK_USERS[0],
  currentUserMbti: string,
  candidateAvailability?: DayAvailability[]
): { score: number; sharedInterests: string[]; overlappingSlots: DayAvailability[] } {
  const profile = payload.sessionProfile;
  const activities = profile.activities ?? [];
  const mood = profile.mood ?? "";

  // ── Interest overlap (0–30 points) ──────────────────────────────────
  const candidateInterests = [
    ...candidate.hobbies, ...candidate.music, ...candidate.movies, ...candidate.tv, ...candidate.games,
  ];
  const shared = activities.filter((a) => candidateInterests.includes(a));
  const interestScore = Math.min(30, shared.length * 6);

  // ── MBTI compatibility (0–20 points) ────────────────────────────────
  const mbtiCompat: Record<string, string[]> = {
    INTJ: ["ENFP", "ENTP", "INFJ"],
    INTP: ["ENTJ", "ENFJ", "INTJ"],
    ENTJ: ["INTP", "INFP", "INFJ"],
    ENTP: ["INFJ", "INTJ", "INFP"],
    INFJ: ["ENFP", "ENTP", "INTJ"],
    INFP: ["ENFJ", "ENTJ", "ENTP"],
    ENFJ: ["INFP", "INTP", "INFJ"],
    ENFP: ["INTJ", "INFJ", "INTP"],
    ISTJ: ["ESFP", "ISFP", "ESTJ"],
    ISFJ: ["ESFP", "ESTP", "ESFJ"],
    ESTJ: ["ISFP", "INTP", "ISTP"],
    ESFJ: ["ISTP", "INTP", "ISFP"],
    ISTP: ["ESFJ", "ESTJ", "ENFJ"],
    ISFP: ["ESTJ", "ESFJ", "ENFJ"],
    ESTP: ["ISFJ", "ISTJ", "INFJ"],
    ESFP: ["ISTJ", "ISFJ", "INTJ"],
  };
  const mbtiScore = mbtiCompat[currentUserMbti]?.includes(candidate.mbti) ? 20 : 5;

  // ── Mood overlap (0–30 points) ──────────────────────────────────────
  // Compare user's mood to candidate's mood (NOT candidate.mbti!)
  const candidateIdx = parseInt(candidate.user_id.split("_").pop() || "1") - 1;
  const isRealUser = isNaN(candidateIdx);
  const candidateMood = candidate.mood || (isRealUser ? "" : MOOD_FALLBACKS[candidateIdx % MOOD_FALLBACKS.length]);

  let moodScore = 5;
  if (mood && candidateMood) {
    if (mood === candidateMood) {
      moodScore = 30; // Same mood = strongest match
    } else if (moodCompat[mood]?.includes(candidateMood)) {
      moodScore = 18; // Compatible mood
    }
  }

  // ── Time overlap (0–20 points) — actual slot comparison ─────────────
  // For real users: use their actual saved availability
  // For mock users: use generated patterns based on index
  let overlapCount = 0;
  const actualOverlappingSlots: DayAvailability[] = [];

  if (candidateAvailability && candidateAvailability.length > 0) {
    // Real user — compare actual availability day by day
    for (let dayIdx = 0; dayIdx < Math.min(payload.availability.length, candidateAvailability.length); dayIdx++) {
      const userDay = payload.availability[dayIdx];
      const candDay = candidateAvailability[dayIdx];
      if (userDay.timeSlots.length === 0 || candDay.timeSlots.length === 0) continue;
      const matchingSlots = userDay.timeSlots.filter((uSlot) =>
        candDay.timeSlots.some((cSlot) => slotsOverlap(uSlot, cSlot))
      );
      if (matchingSlots.length > 0) {
        overlapCount += matchingSlots.length;
        if (actualOverlappingSlots.length < 2) {
          actualOverlappingSlots.push({ ...userDay, timeSlots: matchingSlots });
        }
      }
    }
  } else {
    // Mock user — use generated patterns
    const candidatePatterns = isRealUser ? [] : getMockUserTimeSlots(candidateIdx);
    for (let dayIdx = 0; dayIdx < payload.availability.length; dayIdx++) {
      const userDay = payload.availability[dayIdx];
      if (userDay.timeSlots.length === 0) continue;
      const candidateSlotsForDay: Array<{ startHour: number; startMinute: number; durationHours: number }> = [];
      for (const pattern of candidatePatterns) {
        if (pattern.days.includes(dayIdx)) {
          candidateSlotsForDay.push(...pattern.slots);
        }
      }
      if (candidateSlotsForDay.length === 0) continue;
      for (const uSlot of userDay.timeSlots) {
        for (const cSlot of candidateSlotsForDay) {
          if (slotsOverlap(uSlot, cSlot)) {
            overlapCount++;
          }
        }
      }
      if (actualOverlappingSlots.length < 2) {
        const matchingSlots = userDay.timeSlots.filter((uSlot) =>
          candidateSlotsForDay.some((cSlot) => slotsOverlap(uSlot, cSlot))
        );
        if (matchingSlots.length > 0) {
          actualOverlappingSlots.push({ ...userDay, timeSlots: matchingSlots });
        }
      }
    }
  }

  const timeScore = overlapCount >= 3 ? 20 : overlapCount > 0 ? 12 : 3;

  const total = interestScore + mbtiScore + moodScore + timeScore;
  // Floor at 35 so even partial matches (same mood + some availability) surface
  return {
    score: Math.min(95, Math.max(35, total)),
    sharedInterests: shared,
    overlappingSlots: actualOverlappingSlots.length > 0
      ? actualOverlappingSlots
      : payload.availability?.filter((d) => d.timeSlots.length > 0).slice(0, 2) ?? [],
  };
}

export async function mockFindMatch(payload: MatchRequestPayload): Promise<MatchResponse> {
  await wait(800);

  const hasSlots = payload.availability?.some(
    (d: DayAvailability) => d.timeSlots.length > 0
  );
  const hasProfile = Object.values(payload.sessionProfile).some(
    (v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
  );

  if (!hasSlots) {
    const result: MatchResponse = {
      success: true,
      matched: false,
      message: "Add time slots to your availability first! 📅",
    };
    log("POST /match/shake", payload, result);
    return result;
  }

  if (!hasProfile) {
    const result: MatchResponse = {
      success: true,
      matched: false,
      message: "Fill in your check-in to help us find your vibe! ✨",
    };
    log("POST /match/shake", payload, result);
    return result;
  }

  // Save this user's session data so OTHER users can match with them later
  await setItem(STORAGE_KEYS.SESSION_DATA(payload.userId), {
    sessionProfile: payload.sessionProfile,
    availability: payload.availability,
  });

  // Look up current user's MBTI from stored personality data
  const currentUserPersonality = await getItem<Record<string, unknown>>(
    STORAGE_KEYS.PERSONALITY(payload.userId)
  );
  const currentUserMbti =
    (currentUserPersonality as Record<string, unknown>)?.mbti as string || MOCK_USERS[0].mbti;

  // ── Score MOCK users ────────────────────────────────────────────────
  let bestCandidateId = MOCK_USERS[1].user_id;
  let bestCandidateName = MOCK_USERS[1].name;
  let bestScore = 0;
  let bestShared: string[] = [];
  let bestSlots: DayAvailability[] = [];
  let bestCatchPhraseSuffix = MOCK_USERS[1].hobbies[0] ?? "coffee";

  for (let i = 1; i < MOCK_USERS.length; i++) {
    const result = computeMatchScore(payload, MOCK_USERS[i], currentUserMbti);
    if (result.score > bestScore) {
      bestScore = result.score;
      bestCandidateId = MOCK_USERS[i].user_id;
      bestCandidateName = MOCK_USERS[i].name;
      bestShared = result.sharedInterests;
      bestSlots = result.overlappingSlots;
      bestCatchPhraseSuffix = MOCK_USERS[i].hobbies[0] ?? "coffee";
    }
  }

  // ── Score REAL registered users ──────────────────────────────────────
  const registeredUsers =
    (await getItem<Array<{ userId: string; email: string }>>(
      STORAGE_KEYS.REGISTERED_USERS
    )) || [];

  for (const regUser of registeredUsers) {
    if (regUser.userId === payload.userId) continue; // skip self

    const sessionData = await getItem<{
      sessionProfile: SessionProfile;
      availability: DayAvailability[];
    }>(STORAGE_KEYS.SESSION_DATA(regUser.userId));
    if (!sessionData) continue; // user hasn't set their mood/availability yet

    // Load real user's profile data to build a candidate
    const regProfile = await getItem<Record<string, unknown>>(
      STORAGE_KEYS.PROFILE(regUser.userId)
    );
    const regPersonality = await getItem<Record<string, unknown>>(
      STORAGE_KEYS.PERSONALITY(regUser.userId)
    );
    const regInterests = await getItem<Record<string, unknown>>(
      STORAGE_KEYS.INTERESTS(regUser.userId)
    );

    // Build a candidate object compatible with computeMatchScore
    const p = regProfile as Record<string, unknown> | null;
    const ps = regPersonality as Record<string, unknown> | null;
    const i = regInterests as Record<string, unknown> | null;
    const regCandidate = {
      user_id: regUser.userId,
      name: String(p?.name ?? regUser.email.split("@")[0]),
      email: regUser.email,
      password: "",
      age_range: String(p?.age_range ?? ""),
      major: String(p?.major ?? ""),
      bio: String(p?.bio ?? ""),
      gender: "",
      orientation: "",
      mbti: String(ps?.mbti ?? "INFP"),
      sbti: String(ps?.sbti ?? "Delta"),
      mood: sessionData.sessionProfile.mood || "",
      hobbies: (i?.hobbies as string[]) || [],
      music: (i?.music as string[]) || [],
      movies: (i?.movies as string[]) || [],
      tv: (i?.tv as string[]) || [],
      games: (i?.games as string[]) || [],
    };

    // Score using the real user's actual availability for time overlap
    const realResult = computeMatchScore(
      payload, regCandidate, currentUserMbti, sessionData.availability
    );

    if (realResult.score > bestScore) {
      bestScore = realResult.score;
      bestCandidateId = regUser.userId;
      bestCandidateName = regCandidate.name;
      bestShared = realResult.sharedInterests;
      bestSlots = realResult.overlappingSlots;
      bestCatchPhraseSuffix = regCandidate.hobbies[0] || "vibes";
    }
  }

  // ── Build match result ───────────────────────────────────────────────
  const matchResult: MatchResponse = {
    success: true,
    matched: true,
    matchId: `mock_match_${Date.now()}`,
    matchedUserId: bestCandidateId,
    matchedUserName: bestCandidateName,
    matchPercentage: bestScore,
    message: "Vibe matched! 💥",
    sharedInterests: bestShared.length > 0 ? bestShared : [payload.sessionProfile.mood ?? "vibes"],
    catchPhrase: `${payload.sessionProfile.mood ?? "Chill"} vibes + ${bestCatchPhraseSuffix}? Yes please! ✨`,
    overlappingSlots: bestSlots
      .filter((d) => d.timeSlots.length > 0)
      .map((d) => ({
        date: d.date,
        startHour: d.timeSlots[0].startHour,
        startMinute: d.timeSlots[0].startMinute,
        durationHours: Math.min(d.timeSlots[0].durationHours, 2),
      })),
  };

  // Save match to local storage
  const matches = (await getItem<MockMatch[]>(STORAGE_KEYS.MATCHES)) || [];
  matches.unshift({
    matchId: matchResult.matchId!,
    userId: payload.userId,
    matchedUserId: bestCandidateId,
    matchedUserName: bestCandidateName,
    matchPercentage: bestScore,
    message: "Vibe matched! 💥",
    sharedInterests: bestShared,
    catchPhrase: matchResult.catchPhrase!,
    overlappingSlots: matchResult.overlappingSlots ?? [],
    createdAt: new Date().toISOString(),
  });
  await setItem(STORAGE_KEYS.MATCHES, matches);

  // Create a conversation
  const conversations = (await getItem<ChatConversation[]>(STORAGE_KEYS.CONVERSATIONS)) || [];
  conversations.unshift({
    matchId: matchResult.matchId!,
    userId: payload.userId,
    matchedUserId: bestCandidateId,
    matchedUserName: bestCandidateName,
    matchPercentage: bestScore,
    catchPhrase: matchResult.catchPhrase!,
    lastMessage: {
      id: `msg_${Date.now()}`,
      matchId: matchResult.matchId!,
      senderId: bestCandidateId,
      text: `Hey! We matched on ${bestShared[0] ?? "vibes"}! 🎉`,
      timestamp: new Date().toISOString(),
    },
    unreadCount: 1,
    createdAt: new Date().toISOString(),
  });
  await setItem(STORAGE_KEYS.CONVERSATIONS, conversations);

  // ── Store pending match notification for the matched real user ────────
  if (bestCandidateId.startsWith("local_")) {
    type PendingMatchNotification = {
      matchId: string; matchedByName: string; matchPercentage: number;
    };
    const pendingMatches = (await getItem<PendingMatchNotification[]>(
      STORAGE_KEYS.PENDING_MATCHES(bestCandidateId)
    )) || [];
    pendingMatches.unshift({
      matchId: matchResult.matchId!,
      matchedByName: String(
        (await getItem<Record<string, unknown>>(
          STORAGE_KEYS.PROFILE(payload.userId)
        ))?.name ?? "Someone"
      ),
      matchPercentage: bestScore,
    });
    await setItem(STORAGE_KEYS.PENDING_MATCHES(bestCandidateId), pendingMatches);
  }

  log("POST /match/shake", { userId: payload.userId }, matchResult);
  return matchResult;
}

export async function mockGetPendingMatches(userId: string): Promise<Array<{
  matchId: string; matchedByName: string; matchPercentage: number;
}>> {
  const pending = (await getItem<Array<{
    matchId: string; matchedByName: string; matchPercentage: number;
  }>>(STORAGE_KEYS.PENDING_MATCHES(userId))) || [];
  // Clear pending after reading
  if (pending.length > 0) {
    await setItem(STORAGE_KEYS.PENDING_MATCHES(userId), []);
  }
  return pending;
}

export async function mockConnectMatch(matchId: string, _userId: string) {
  await wait(350);
  const result = { success: true, message: "Match connected! 💥" };
  log(`POST /match/${matchId}/connect`, { matchId }, result);
  return result;
}

export async function mockGetMatchHistory(_userId: string) {
  await wait(350);
  const matches = (await getItem<MockMatch[]>(STORAGE_KEYS.MATCHES)) || MOCK_MATCHES;
  const result = { success: true, matches };
  log("GET /match/history/:id", { userId: _userId }, { count: matches.length });
  return result;
}

// ── Chat ────────────────────────────────────────────────────────────

export async function mockGetConversations(userId: string): Promise<ChatHistoryResponse> {
  await wait(350);
  const conversations =
    (await getItem<ChatConversation[]>(STORAGE_KEYS.CONVERSATIONS)) || MOCK_CONVERSATIONS;
  log("GET /chat/conversations/:id", { userId }, { count: conversations.length });
  return { success: true, conversations };
}

export async function mockGetMessages(matchId: string): Promise<ChatMessagesResponse> {
  await wait(350);
  const allMessages = (await getItem<ChatMessage[]>(STORAGE_KEYS.MESSAGES)) || MOCK_MESSAGES;
  const messages = allMessages.filter((m) => m.matchId === matchId);
  log("GET /chat/messages/:matchId", { matchId }, { count: messages.length });
  return { success: true, messages };
}

export async function mockSendMessage(
  payload: SendMessagePayload
): Promise<{ success: boolean; message: ChatMessage }> {
  await wait(350);
  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    matchId: payload.matchId,
    senderId: payload.senderId,
    text: payload.text,
    timestamp: new Date().toISOString(),
  };

  // Append to stored messages
  const allMessages = (await getItem<ChatMessage[]>(STORAGE_KEYS.MESSAGES)) || MOCK_MESSAGES;
  allMessages.push(newMessage);
  await setItem(STORAGE_KEYS.MESSAGES, allMessages);

  // Update conversation lastMessage
  const conversations =
    (await getItem<ChatConversation[]>(STORAGE_KEYS.CONVERSATIONS)) || MOCK_CONVERSATIONS;
  const convIdx = conversations.findIndex((c) => c.matchId === payload.matchId);
  if (convIdx >= 0) {
    conversations[convIdx] = { ...conversations[convIdx], lastMessage: newMessage };
    await setItem(STORAGE_KEYS.CONVERSATIONS, conversations);
  }

  // Simulate a reply after a short delay
  setTimeout(async () => {
    try {
      const replyText = OLLAMA_MOCK_REPLIES[Math.floor(Math.random() * OLLAMA_MOCK_REPLIES.length)];
      const reply: ChatMessage = {
        id: `msg_${Date.now()}_reply`,
        matchId: payload.matchId,
        senderId: conversations[convIdx]?.matchedUserId || "mock_user_2",
        text: replyText,
        timestamp: new Date().toISOString(),
      };
      const currentMessages = (await getItem<ChatMessage[]>(STORAGE_KEYS.MESSAGES)) || [];
      currentMessages.push(reply);
      await setItem(STORAGE_KEYS.MESSAGES, currentMessages);
    } catch (err) {
      console.warn("[MOCK] Failed to simulate reply:", err);
    }
  }, 2000);

  const result = { success: true, message: newMessage };
  log("POST /chat/send", payload, newMessage);
  return result;
}

export async function mockMarkRead(matchId: string, userId: string) {
  await wait(200);
  const conversations =
    (await getItem<ChatConversation[]>(STORAGE_KEYS.CONVERSATIONS)) || MOCK_CONVERSATIONS;
  const convIdx = conversations.findIndex((c) => c.matchId === matchId);
  if (convIdx >= 0) {
    conversations[convIdx] = { ...conversations[convIdx], unreadCount: 0 };
    await setItem(STORAGE_KEYS.CONVERSATIONS, conversations);
  }
  log(`POST /chat/mark-read/${matchId}`, { matchId, userId });
  return { success: true };
}

// ── Settings ────────────────────────────────────────────────────────

export async function mockGetSettings(userId: string) {
  await wait(200);
  const settings = await getItem(STORAGE_KEYS.SETTINGS(userId));
  log("GET /settings/:id", { userId }, settings);
  return settings || { success: true, ollamaModel: "llama3", ollamaUrl: "http://localhost:11434" };
}

export async function mockSaveSettings(userId: string, settings: Record<string, unknown>) {
  await wait(200);
  await setItem(STORAGE_KEYS.SETTINGS(userId), settings);
  log("PUT /settings/:id", { userId, settings });
  return { success: true };
}

// ── Ollama ──────────────────────────────────────────────────────────

export async function mockGenerateChatReply(prompt: string) {
  await wait(500);
  const reply = OLLAMA_MOCK_REPLIES[Math.floor(Math.random() * OLLAMA_MOCK_REPLIES.length)];
  const result = { success: true, response: reply };
  log("POST /ollama/generate", { prompt: prompt.slice(0, 80) }, reply);
  return result;
}

export async function mockCheckOllamaStatus() {
  return { success: true, online: false, models: [] };
}

// ── Onboarding ──────────────────────────────────────────────────────

export async function mockCompleteOnboarding(payload: Record<string, unknown>) {
  await wait(300);
  await setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true");
  log("POST /onboarding/complete", payload);
  return { success: true };
}

// ── Utility ────────────────────────────────────────────────────────

export { CURRENT_USER_ID, CURRENT_USER_EMAIL };
