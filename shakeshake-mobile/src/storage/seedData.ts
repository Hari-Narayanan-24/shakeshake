/**
 * seedData — 100+ mock records for the offline demo.
 * Typed to match connector response shapes.
 */

import type { ChatConversation, ChatMessage } from "../types/chat";
import type { OverlappingSlot } from "../types/home";

// ── Helper ───────────────────────────────────────────────────────────
const id = (prefix: string, i: number) => `${prefix}_${i}`;

// ── User profiles (20 users) ────────────────────────────────────────
export interface MockUser {
  user_id: string;
  name: string;
  email: string;
  password: string;
  age_range: string;
  major: string;
  bio: string;
  gender: string;
  orientation: string;
  mbti: string;
  sbti: string;
  mood: string;
  hobbies: string[];
  music: string[];
  movies: string[];
  tv: string[];
  games: string[];
}

const FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Riley", "Casey",
  "Morgan", "Quinn", "Avery", "Blake", "Taylor",
  "Charlie", "Dakota", "Emerson", "Finley", "Harper",
  "Kai", "Logan", "Peyton", "Reese", "Sage",
];

const MAJORS = [
  "Computer Science", "Psychology", "Business", "Art & Design", "Biology",
  "English Literature", "Engineering", "Music", "Philosophy", "Film Studies",
  "Mathematics", "Sociology", "Communications", "Political Science", "Data Science",
  "Architecture", "Chemistry", "History", "Economics", "Environmental Science",
];

const BIOS = [
  "Coffee addict ☕ | Always looking for a study buddy",
  "Plant mom 🌿 | Yoga enthusiast | Love deep convos at 2am",
  "Gamer by night, student by day 🎮",
  "Music is my therapy 🎵 | Open to spontaneous adventures",
  "Bookworm 📚 | Café explorer | Tell me your favorite book",
  "Fitness junkie 💪 | Marathon runner | Health science nerd",
  "Artist & dreamer 🎨 | Looking for creative souls",
  "Tech geek who loves hiking 🏔️",
  "Film buff 🎬 | Let's debate cinema over tacos",
  "Quiet but funny once you know me 😄",
  "Adventure seeker 🧗 | Skydiving certified",
  "Cooking experiments every weekend 🍳",
  "Language lover 🌍 | Fluent in 3, learning 2 more",
  "Startup founder in progress 🚀",
  "Dog person 🐕 | If you have a dog we're already friends",
  "Night owl 🦉 | Best ideas happen after midnight",
  "Sports fan 🏀 | March Madness is my Super Bowl",
  "Sustainability advocate 🌱 | Minimalism lifestyle",
  "Comedy lover 😂 | Open mic nights are my jam",
  "Wanderlust never stops ✈️ | 12 countries and counting",
];

const HOBBIES_POOL = [
  "Reading", "Gaming", "Cooking", "Hiking", "Yoga",
  "Photography", "Painting", "Dancing", "Writing", "Coding",
  "Running", "Swimming", "Cycling", "Meditation", "Travel",
  "Coffee Tasting", "Volunteering", "Gardening", "Podcasting", "Board Games",
];

const MUSIC_POOL = [
  "Indie", "K-Pop", "Hip-Hop", "R&B", "EDM",
  "Rock", "Jazz", "Classical", "Pop", "Lo-Fi",
  "Alternative", "Country", "Reggaeton", "Afrobeats", "Metal",
];

const MOVIES_POOL = [
  "Sci-Fi", "Horror", "Rom-Com", "Action", "Drama",
  "Thriller", "Animation", "Documentary", "Comedy", "Fantasy",
  "Mystery", "Musical", "War", "Western", "Noir",
];

const TV_POOL = [
  "Anime", "Reality TV", "Sitcoms", "True Crime", "Fantasy",
  "Drama Series", "Talk Shows", "Sports", "Documentaries", "Comedy",
];

const GAMES_POOL = [
  "League of Legends", "Valorant", "Minecraft", "Chess", "Tetris",
  "Fortnite", "Overwatch", "Stardew Valley", "Among Us", "Genshin Impact",
  "Apex Legends", "Mario Kart", "Pokémon", "Animal Crossing", "FIFA",
];

const MOOD_POOL = ["Chill", "Social", "Tired", "Bored", "Excited", "Calm", "Lonely"];
const MBTIS = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
const SBTIS = ["Alpha", "Beta", "Gamma", "Delta", "Omega"];
const AGE_RANGES = ["18-20", "21-24", "25-30"];
const GENDERS = ["male", "female", "non-binary", "prefer-not-gender"];
const ORIENTATIONS = ["straight", "gay", "bisexual", "queer", "prefer-not-orientation"];

function pick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const MOCK_USERS: MockUser[] = Array.from({ length: 20 }, (_, i) => ({
  user_id: id("mock_user", i + 1),
  name: FIRST_NAMES[i],
  email: `${FIRST_NAMES[i].toLowerCase()}@demo.com`,
  password: "demo123",
  age_range: AGE_RANGES[i % 3],
  major: MAJORS[i],
  bio: BIOS[i],
  gender: GENDERS[i % 4],
  orientation: ORIENTATIONS[i % 5],
  mbti: MBTIS[i % 16],
  sbti: SBTIS[i % 5],
  mood: MOOD_POOL[i % MOOD_POOL.length],
  hobbies: pick(HOBBIES_POOL, 3 + (i % 4)),
  music: pick(MUSIC_POOL, 2 + (i % 3)),
  movies: pick(MOVIES_POOL, 2 + (i % 3)),
  tv: pick(TV_POOL, 2 + (i % 3)),
  games: pick(GAMES_POOL, 1 + (i % 3)),
}));

// ── Matches (15) ───────────────────────────────────────────────────
export interface MockMatch {
  matchId: string;
  userId: string;
  matchedUserId: string;
  matchedUserName: string;
  matchPercentage: number;
  message: string;
  sharedInterests: string[];
  catchPhrase: string;
  overlappingSlots: OverlappingSlot[];
  createdAt: string;
}

const MATCH_CATCH_PHRASES = [
  "Coffee runs + chill vibes? Yes please! ☕",
  "Book nerds unite — study date at the library? 📚",
  "Gym buddies who also game? Rare combo! 💪🎮",
  "Late-night music sessions + ramen? Say less 🎵🍜",
  "Adventure partners in crime! 🧗‍♀️",
  "Deep 2am convos + hot cocoa? Perfect 🌙",
  "Your vibe checks out — let's create something! 🎨",
  "Fitness + philosophy? Your mind AND body match 🧠💪",
  "Plant lovers who travel? Dream team 🌿✈️",
  "Cooking rival + taste-tester duo 🍳",
  "Movie marathon buddies — you pick first 🎬",
  "Language exchange + café hopping? 🌍☕",
  "Yoga + meditation + brunch? Peak Sunday 🧘",
  "Startup brainstorming + pizza nights 🚀🍕",
  "Spontaneous road trip partner? 🚗",
];

export const MOCK_MATCHES: MockMatch[] = Array.from({ length: 15 }, (_, i) => {
  const user = MOCK_USERS[i + 1]; // skip index 0 (current user)
  const matchedUser = MOCK_USERS[(i + 5) % 20];
  const shared = user.hobbies.filter((h) => matchedUser.hobbies.includes(h));
  return {
    matchId: id("mock_match", i + 1),
    userId: id("mock_user", 0), // current user
    matchedUserId: user.user_id,
    matchedUserName: user.name,
    matchPercentage: 60 + Math.floor(Math.random() * 35), // 60-94%
    message: "Vibe matched! 💥",
    sharedInterests: shared.length > 0 ? shared : [user.hobbies[0], matchedUser.hobbies[0]],
    catchPhrase: MATCH_CATCH_PHRASES[i % MATCH_CATCH_PHRASES.length],
    overlappingSlots: [
      {
        date: "2026-06-07",
        startHour: 10 + (i % 6),
        startMinute: (i % 2) * 30,
        durationHours: 1 + (i % 2),
      },
      {
        date: "2026-06-08",
        startHour: 14,
        startMinute: 0,
        durationHours: 2,
      },
    ],
    createdAt: new Date(Date.now() - (15 - i) * 86400000).toISOString(),
  };
});

// ── Conversations (10) ─────────────────────────────────────────────
export const MOCK_CONVERSATIONS: ChatConversation[] = Array.from({ length: 10 }, (_, i) => {
  const match = MOCK_MATCHES[i];
  return {
    matchId: match.matchId,
    userId: id("mock_user", 0),
    matchedUserId: match.matchedUserId,
    matchedUserName: match.matchedUserName,
    matchPercentage: match.matchPercentage,
    catchPhrase: match.catchPhrase,
    lastMessage: {
      id: id("msg_last", i),
      matchId: match.matchId,
      senderId: i % 2 === 0 ? match.matchedUserId : id("mock_user", 0),
      text: [
        "Hey! We matched! Want to grab coffee? ☕",
        "That sounds amazing! When works for you?",
        "How about Thursday afternoon? 🤙",
        "I'm so down! Where should we meet?",
        "Let's try that new café on Main Street",
        "Perfect, see you there! 🎉",
        "Can't wait! This is going to be fun",
        "Hey, have you been to the campus art gallery?",
        "Not yet but I've heard great things!",
        "We should go together this weekend! 🖼️",
      ][i],
      timestamp: new Date(Date.now() - (10 - i) * 3600000).toISOString(),
    },
    unreadCount: i % 3 === 0 ? Math.floor(Math.random() * 4) + 1 : 0,
    createdAt: match.createdAt,
  };
});

// ── Messages (50+) ───────────────────────────────────────────────────
const MESSAGE_TEMPLATES = [
  "Hey! We matched! 🎉",
  "What's up! Your profile caught my eye",
  "Love your taste in music! 🎵",
  "Coffee or tea? This is the real question ☕",
  "Have you tried the new place downtown?",
  "That's so cool! Tell me more",
  "Haha I love that 😂",
  "Same! We have so much in common",
  "Want to study together this week?",
  "I'm free after 3pm most days",
  "Your catchphrase was perfect lol",
  "What's your go-to study spot?",
  "The library basement is underrated honestly",
  "Are you going to the campus event Friday?",
  "I heard there's free food 🍕",
  "That's all the motivation I need haha",
  "What genre are you into?",
  "Have you seen any good movies lately?",
  "I need show recommendations — what are you watching?",
  "Let's definitely plan something soon!",
  "Your hobbies sound so interesting!",
  "I've been wanting to try that too",
  "Want to be gym buddies? 💪",
  "Do you play any instruments?",
  "That's really impressive!",
  "I'm a night owl too 🦉",
  "Spontaneous adventures are the best",
  "Your dog sounds adorable! 🐕",
  "Let's grab food this weekend!",
  "I'm excited to get to know you!",
  "Travel stories? I have so many ✈️",
  "Book recs? Always looking for new reads 📚",
  "That restaurant is amazing, you'll love it",
  "Game night sounds fun! 🎮",
  "What's your major again?",
  "We should start a study group",
  "I love your energy! 🔥",
  "Plot twist: we're in the same class",
  "Small world! I was just there yesterday",
  "Your music taste is chef's kiss 👨‍🍳💋",
  "Do you prefer mornings or nights?",
  "Early bird gets the worm but night owl gets the pizza 🍕",
  "Tell me something interesting about yourself",
  "I'm a walking contradiction and I love it",
  "That meme you sent is sending me 😂",
  "Are you into podcasts too?",
  "My favorite is True Crime — don't judge 😅",
  "Let's make this happen! 🙌",
  "Your vibe is immaculate ✨",
  "Okay but seriously, when are we meeting? 😄",
  "I'll bring snacks, you bring good vibes",
  "Deal! See you soon!",
];

export const MOCK_MESSAGES: ChatMessage[] = MOCK_CONVERSATIONS.flatMap((conv, convIdx) => {
  const count = 4 + Math.floor(Math.random() * 4); // 4-7 messages per conversation
  return Array.from({ length: count }, (_, msgIdx) => ({
    id: id("msg", convIdx * 10 + msgIdx + 1),
    matchId: conv.matchId,
    senderId: msgIdx % 2 === 0 ? conv.matchedUserId : id("mock_user", 0),
    text: MESSAGE_TEMPLATES[(convIdx * 7 + msgIdx) % MESSAGE_TEMPLATES.length],
    timestamp: new Date(
      Date.now() - (count - msgIdx) * 1800000
    ).toISOString(),
  }));
});

// ── Ollama mock responses ────────────────────────────────────────────
export const OLLAMA_MOCK_REPLIES = [
  "Hey! That sounds really cool. I'd love to hear more about it! Maybe we could grab coffee and chat?",
  "Oh wow, I love that! Have you been doing it long? I just started getting into that myself.",
  "That's awesome! We should totally do that together sometime. I know a great spot!",
  "Haha that's so relatable! 😄 What made you get into it?",
  "I'm curious — what do you enjoy most about it? I've been meaning to try!",
  "That's a great perspective! I hadn't thought of it that way before.",
  "Yes! I've been looking for someone who's into that too! Small world 😊",
  "Interesting! Tell me more — I'm intrigued now. You seem really passionate about it!",
];
