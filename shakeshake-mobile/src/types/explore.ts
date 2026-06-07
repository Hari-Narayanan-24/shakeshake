// ── Places / Explore Types ──────────────────────────────────────

export type PlaceCategory =
  | "Coffee"
  | "Food"
  | "Drinks"
  | "Walking"
  | "Study"
  | "Gym"
  | "Movies"
  | "Concerts"
  | "Events"
  | "Shopping"
  | "Art"
  | "Hiking"
  | "Board games"
  | "Karaoke"
  | "Clubbing"
  | "Night walk";

export type PlaceSuggestion = {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  rating: number; // 1–5
  imageUrl?: string;
  moodMatch: string[]; // which moods this place fits
  vibeTags: string[];
  distance?: string; // e.g. "0.5 mi"
  priceLevel?: number; // 1–4
};

export type ExploreResponse = {
  success: boolean;
  places: PlaceSuggestion[];
  location?: { lat: number; lng: number };
};
