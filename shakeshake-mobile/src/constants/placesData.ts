import type { PlaceCategory, PlaceSuggestion } from "../types/explore";

// ── Super-category metadata ──────────────────────────────────────
export const SUPER_CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  Restaurants: { emoji: "🍽️", color: "#E67E22" },
  Hangouts:    { emoji: "🎉", color: "#9B59B6" },
  Activities:  { emoji: "⚡", color: "#E74C3C" },
};

// Category metadata: icon + color + label + superCategory
export const categoryMeta: Record<
  PlaceCategory,
  { icon: string; color: string; emoji: string; superCategory: string }
> = {
  Coffee:       { icon: "coffee",       color: "#8B4513", emoji: "☕",  superCategory: "Restaurants" },
  Food:         { icon: "utensils",     color: "#E67E22", emoji: "🍽",  superCategory: "Restaurants" },
  Drinks:       { icon: "wine",         color: "#9B59B6", emoji: "🍹", superCategory: "Restaurants" },
  Walking:      { icon: "navigation",   color: "#27AE60", emoji: "🚶", superCategory: "Hangouts" },
  Shopping:     { icon: "shopping-bag", color: "#1ABC9C", emoji: "🛍", superCategory: "Hangouts" },
  Art:          { icon: "palette",      color: "#C0392B", emoji: "🎨", superCategory: "Hangouts" },
  Movies:       { icon: "film",         color: "#8E44AD", emoji: "🎬", superCategory: "Hangouts" },
  Karaoke:      { icon: "mic",          color: "#E84393", emoji: "🎤", superCategory: "Hangouts" },
  Clubbing:     { icon: "moon",         color: "#6C5CE7", emoji: "🪩", superCategory: "Hangouts" },
  "Night walk": { icon: "moon",         color: "#2C3E50", emoji: "🌙", superCategory: "Hangouts" },
  "Board games":{ icon: "grid",         color: "#F1C40F", emoji: "🎲", superCategory: "Hangouts" },
  Study:        { icon: "book-open",    color: "#2980B9", emoji: "📚", superCategory: "Activities" },
  Gym:          { icon: "activity",     color: "#E74C3C", emoji: "💪", superCategory: "Activities" },
  Concerts:     { icon: "music",        color: "#E91E63", emoji: "🎵", superCategory: "Activities" },
  Events:       { icon: "calendar",     color: "#F39C12", emoji: "🎉", superCategory: "Activities" },
  Hiking:       { icon: "compass",      color: "#2ECC71", emoji: "🥾", superCategory: "Activities" },
};

/** Get all super-category names */
export function getSuperCategories(): string[] {
  return Object.keys(SUPER_CATEGORY_META);
}

/** Get sub-categories for a given super-category */
export function getCategoriesForSuper(superCat: string): PlaceCategory[] {
  return (Object.keys(categoryMeta) as PlaceCategory[]).filter(
    (cat) => categoryMeta[cat].superCategory === superCat
  );
}

// Generate mock places for a given category
function mockPlaces(category: PlaceCategory): PlaceSuggestion[] {
  const base: Record<PlaceCategory, Array<{ name: string; addr: string; moods: string[]; vibes: string[] }>> = {
    Coffee: [
      { name: "The Cozy Bean", addr: "42 Oak Ave", moods: ["Chill", "Calm", "Social"], vibes: ["Chill", "Low-key"] },
      { name: "Brew & Bond", addr: "118 Main St", moods: ["Social", "Excited"], vibes: ["Social", "Fun"] },
      { name: "Dark Roast Café", addr: "7 Elm Street", moods: ["Chill", "Focused", "Creative"], vibes: ["Focused", "Deep"] },
      { name: "Sunrise Sip", addr: "305 Maple Dr", moods: ["Calm", "Bored", "Lonely"], vibes: ["Low-key", "Chill"] },
      { name: "Pulse Coffee", addr: "89 Park Blvd", moods: ["Excited", "Social"], vibes: ["Fun", "Active"] },
    ],
    Food: [
      { name: "Sakura Ramen", addr: "22 Cherry Ln", moods: ["Social", "Excited", "Bored"], vibes: ["Fun", "Adventurous"] },
      { name: "The Green Fork", addr: "55 Vegan Way", moods: ["Chill", "Social"], vibes: ["Chill", "Low-key"] },
      { name: "Taco Loco", addr: "310 Fiesta Blvd", moods: ["Excited", "Fun", "Social"], vibes: ["Fun", "Active"] },
      { name: "Mediterranean Moon", addr: "77 Olive St", moods: ["Social", "Excited"], vibes: ["Fun", "Adventurous"] },
      { name: "Byte Burger", addr: "9 Tech Park", moods: ["Bored", "Social"], vibes: ["Fun", "Low-key"] },
    ],
    Drinks: [
      { name: "The Velvet Lounge", addr: "88 Sunset Blvd", moods: ["Social", "Excited", "Bored"], vibes: ["Fun", "Active"] },
      { name: "Craft & Pour", addr: "14 Hops St", moods: ["Chill", "Social"], vibes: ["Chill", "Low-key"] },
      { name: "Sky Bar", addr: "500 Tower Plz", moods: ["Excited", "Social"], vibes: ["Fun", "Adventurous"] },
      { name: "Tea Leaf Tavern", addr: "23 Zen Ct", moods: ["Calm", "Chill", "Lonely"], vibes: ["Low-key", "Deep"] },
      { name: "Neon Nights", addr: "77 Club Row", moods: ["Excited", "Social"], vibes: ["Active", "Creative"] },
    ],
    Walking: [
      { name: "Riverside Trail", addr: "River Walk, N Entrance", moods: ["Chill", "Calm", "Tired"], vibes: ["Chill", "Active"] },
      { name: "Botanical Gardens", addr: "200 Garden Rd", moods: ["Calm", "Bored", "Lonely"], vibes: ["Low-key", "Chill"] },
      { name: "Lakeside Loop", addr: "Lake Shore Dr", moods: ["Chill", "Calm"], vibes: ["Chill", "Low-key"] },
      { name: "Heritage Walk", addr: "50 Old Town Sq", moods: ["Bored", "Social"], vibes: ["Low-key", "Fun"] },
      { name: "Sunset Promenade", addr: "1 Pier Rd", moods: ["Chill", "Romantic", "Tired"], vibes: ["Chill", "Low-key"] },
    ],
    Study: [
      { name: "Quiet Minds Library", addr: "101 Book Blvd", moods: ["Focused", "Tired", "Bored"], vibes: ["Focused", "Deep"] },
      { name: "The Study Hall", addr: "33 Campus Way", moods: ["Focused", "Bored"], vibes: ["Focused", "Low-key"] },
      { name: "Pages & Coffee", addr: "45 Read St", moods: ["Chill", "Focused"], vibes: ["Chill", "Focused"] },
      { name: "Brainstorm Hub", addr: "67 Idea Ave", moods: ["Creative", "Focused"], vibes: ["Creative", "Deep"] },
      { name: "Scholar's Corner", addr: "90 Academy Rd", moods: ["Focused", "Calm"], vibes: ["Focused", "Low-key"] },
      { name: "Readers Haven", addr: "12 Book Lane", moods: ["Chill", "Focused", "Calm"], vibes: ["Chill", "Deep"] },
    ],
    Gym: [
      { name: "Iron Fitness", addr: "400 Pump St", moods: ["Excited", "Focused"], vibes: ["Active", "Focused"] },
      { name: "Zen Flow Yoga", addr: "88 Calm Way", moods: ["Tired", "Calm"], vibes: ["Low-key", "Chill"] },
      { name: "CrossFit Central", addr: "55 Grind Blvd", moods: ["Excited", "Focused"], vibes: ["Active", "Energetic"] },
      { name: "Spin Studio", addr: "12 Cycle Rd", moods: ["Bored", "Excited"], vibes: ["Active", "Fun"] },
      { name: "The Strength Lab", addr: "100 Power Ave", moods: ["Focused", "Excited"], vibes: ["Focused", "Active"] },
    ],
    Movies: [
      { name: "Cinema One", addr: "1 Reel Blvd", moods: ["Chill", "Bored", "Lonely"], vibes: ["Chill", "Low-key"] },
      { name: "IMAX Experience", addr: "30 Big Screen Plz", moods: ["Excited", "Social"], vibes: ["Fun", "Active"] },
      { name: "Retro Film House", addr: "55 Vintage Ln", moods: ["Chill", "Bored", "Creative"], vibes: ["Creative", "Low-key"] },
      { name: "Downtown Cinema", addr: "77 Main St", moods: ["Social", "Bored"], vibes: ["Fun", "Low-key"] },
      { name: "Sunset Drive-In", addr: "999 Highway 1", moods: ["Chill", "Social", "Lonely"], vibes: ["Chill", "Low-key"] },
    ],
    Concerts: [
      { name: "The Loud Speaker", addr: "200 Stage Ave", moods: ["Excited", "Social"], vibes: ["Fun", "Active", "Creative"] },
      { name: "Jazz Corner", addr: "45 Blue Note Blvd", moods: ["Chill", "Social", "Creative"], vibes: ["Creative", "Chill"] },
      { name: "Open Mic Arena", addr: "88 Talent Rd", moods: ["Excited", "Social", "Creative"], vibes: ["Creative", "Fun"] },
      { name: "The Vinyl Room", addr: "33 Record Row", moods: ["Social", "Bored"], vibes: ["Fun", "Chill"] },
      { name: "Echo Chamber", addr: "100 Sound Blvd", moods: ["Excited", "Social"], vibes: ["Active", "Creative"] },
    ],
    Events: [
      { name: "Community Hall", addr: "500 Civic Center Dr", moods: ["Social", "Excited", "Bored"], vibes: ["Fun", "Active"] },
      { name: "Art District Plaza", addr: "77 Gallery Row", moods: ["Creative", "Social", "Bored"], vibes: ["Creative", "Fun"] },
      { name: "Festival Grounds", addr: "200 Fun Way", moods: ["Excited", "Social"], vibes: ["Fun", "Adventurous"] },
      { name: "Night Market", addr: "99 Bazaar St", moods: ["Social", "Excited"], vibes: ["Fun", "Active"] },
      { name: "Culture House", addr: "45 Heritage Ave", moods: ["Social", "Creative", "Bored"], vibes: ["Creative", "Deep"] },
    ],
    Shopping: [
      { name: "The Thrift Find", addr: "120 Vintage Way", moods: ["Bored", "Social", "Excited"], vibes: ["Fun", "Low-key"] },
      { name: "Mall Central", addr: "300 Retail Blvd", moods: ["Social", "Bored"], vibes: ["Fun", "Low-key"] },
      { name: "Book Nook", addr: "55 Page St", moods: ["Chill", "Bored", "Creative"], vibes: ["Chill", "Creative"] },
      { name: "Farmers Market", addr: "8 Fresh Ave", moods: ["Social", "Chill"], vibes: ["Fun", "Low-key"] },
      { name: "Boutique Row", addr: "22 Fashion Blvd", moods: ["Bored", "Social", "Excited"], vibes: ["Fun", "Adventurous"] },
    ],
    Art: [
      { name: "The Canvas Studio", addr: "44 Art Ln", moods: ["Creative", "Chill", "Bored"], vibes: ["Creative", "Deep"] },
      { name: "Gallery Nine", addr: "9 Exhibit St", moods: ["Creative", "Social", "Bored"], vibes: ["Creative", "Fun"] },
      { name: "Street Art Walk", addr: "Downtown Alley", moods: ["Creative", "Bored", "Excited"], vibes: ["Creative", "Active"] },
      { name: "Pottery Barn", addr: "15 Craft Way", moods: ["Chill", "Creative"], vibes: ["Creative", "Low-key"] },
      { name: "The Museum", addr: "100 Heritage Plz", moods: ["Bored", "Chill", "Social"], vibes: ["Deep", "Chill"] },
    ],
    Hiking: [
      { name: "Eagle Peak Trail", addr: "Trailhead, Summit Rd", moods: ["Excited", "Chill", "Tired"], vibes: ["Active", "Adventurous"] },
      { name: "Forest Loop", addr: "Woods Entrance, Green Ln", moods: ["Chill", "Calm", "Bored"], vibes: ["Chill", "Active"] },
      { name: "Cliffside Path", addr: "Coastal Rd, Mile 5", moods: ["Excited", "Bored"], vibes: ["Active", "Adventurous"] },
      { name: "Meadow Circuit", addr: "Park Entrance, Field Rd", moods: ["Chill", "Tired"], vibes: ["Low-key", "Chill"] },
      { name: "Valley View", addr: "Overlook Point, Ridge Rd", moods: ["Chill", "Bored"], vibes: ["Chill", "Adventurous"] },
    ],
    "Board games": [
      { name: "Dice & Dine", addr: "67 Fun Ct", moods: ["Chill", "Social", "Bored"], vibes: ["Fun", "Chill"] },
      { name: "Game On Café", addr: "12 Play St", moods: ["Social", "Excited", "Bored"], vibes: ["Fun", "Active"] },
      { name: "The Board Room", addr: "33 Strategy Ave", moods: ["Chill", "Focused"], vibes: ["Focused", "Chill"] },
      { name: "Tabletop Tavern", addr: "88 Roll Rd", moods: ["Social", "Bored"], vibes: ["Fun", "Low-key"] },
      { name: "Puzzle Palace", addr: "5 Brain Teaser Ln", moods: ["Chill", "Creative", "Bored"], vibes: ["Creative", "Fun"] },
    ],
    Karaoke: [
      { name: "Sing Out Loud", addr: "99 Mic Ave", moods: ["Excited", "Social", "Bored"], vibes: ["Fun", "Active"] },
      { name: "K-Studio", addr: "23 Melody Blvd", moods: ["Excited", "Social", "Bored"], vibes: ["Fun", "Active"] },
      { name: "The Voice Box", addr: "55 Harmony St", moods: ["Social", "Bored"], vibes: ["Fun", "Low-key"] },
      { name: "Starlight Lounge", addr: "77 Stage Row", moods: ["Excited", "Social"], vibes: ["Active", "Creative"] },
      { name: "Pitch Perfect", addr: "12 Tune Ave", moods: ["Excited", "Social", "Creative"], vibes: ["Fun", "Creative"] },
    ],
    Clubbing: [
      { name: "Pulse Nightclub", addr: "88 Beat Blvd", moods: ["Excited", "Social"], vibes: ["Active", "Fun"] },
      { name: "The Underground", addr: "55 Bass Ave", moods: ["Excited", "Bored"], vibes: ["Active", "Adventurous"] },
      { name: "Neon District", addr: "200 Glow St", moods: ["Excited", "Social"], vibes: ["Active", "Fun"] },
      { name: "Rhythm Room", addr: "33 Dance Blvd", moods: ["Social", "Excited"], vibes: ["Active", "Fun"] },
      { name: "After Dark", addr: "99 Midnight Ln", moods: ["Excited", "Social"], vibes: ["Active", "Adventurous"] },
    ],
    "Night walk": [
      { name: "Moonlit Boardwalk", addr: "Pier Entrance", moods: ["Chill", "Calm", "Lonely", "Tired"], vibes: ["Chill", "Low-key"] },
      { name: "Starlight Pier", addr: "End of Pier Rd", moods: ["Chill", "Calm", "Romantic"], vibes: ["Chill", "Low-key"] },
      { name: "Riverside Path", addr: "Waterfront Trail", moods: ["Chill", "Calm", "Tired"], vibes: ["Chill", "Low-key"] },
      { name: "Old Town Lights", addr: "Historic District", moods: ["Chill", "Bored", "Social"], vibes: ["Low-key", "Chill"] },
      { name: "Lantern Lane", addr: "55 Glow Ct", moods: ["Calm", "Lonely", "Chill"], vibes: ["Low-key", "Deep"] },
    ],
  };

  const places = (base[category] ?? base["Coffee"]).slice(0, 5);
  return places.map((p, i) => ({
    id: `${category.toLowerCase()}-${i}`,
    name: p.name,
    category,
    address: p.addr,
    rating: 3.5 + Math.random() * 1.5,
    moodMatch: p.moods,
    vibeTags: p.vibes,
    distance: `${(0.1 + Math.random() * 2.5).toFixed(1)} mi`,
    priceLevel: Math.ceil(Math.random() * 3),
  }));
}

/** Get mock places filtered by categories */
export function getMockPlaces(categories: PlaceCategory[]): PlaceSuggestion[] {
  return categories.flatMap((cat) => mockPlaces(cat));
}

/** Get mock places for a specific mood — returns top 5 places per matching category */
export function getMoodPlaces(mood: string | undefined): PlaceSuggestion[] {
  if (!mood) return [];

  // Map mood to best categories
  const moodCategoryMap: Record<string, PlaceCategory[]> = {
    Chill:       ["Coffee", "Walking", "Movies", "Board games", "Night walk"],
    Social:      ["Coffee", "Food", "Drinks", "Karaoke", "Events"],
    Tired:       ["Coffee", "Walking", "Night walk", "Movies"],
    Bored:       ["Shopping", "Movies", "Events", "Karaoke", "Night walk"],
    Excited:     ["Clubbing", "Concerts", "Drinks", "Events", "Karaoke"],
    Calm:        ["Walking", "Coffee", "Art", "Study", "Hiking"],
    Lonely:      ["Coffee", "Walking", "Art", "Study", "Night walk"],
    Creative:    ["Art", "Hiking", "Concerts", "Board games", "Shopping"],
    Focused:     ["Study", "Coffee", "Art", "Walking", "Board games"],
    Fun:         ["Drinks", "Clubbing", "Concerts", "Karaoke", "Events"],
  };

  const cats = moodCategoryMap[mood] ?? ["Coffee", "Food", "Walking", "Movies", "Events"];
  return getMockPlaces(cats);
}
