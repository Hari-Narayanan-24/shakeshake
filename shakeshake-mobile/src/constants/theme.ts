import { Dimensions } from "react-native";

// ── Design baseline (iPhone 14 — 390 × 844) ──────────────────────
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/** Scale proportionally to width — use for horizontal sizes, fonts, radii */
export const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;

/** Scale proportionally to height — use for vertical sizes & spacing */
export const verticalScale = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

/**
 * Blend between width-scaled and unsized.
 * factor 0 → original size, 1 → fully scaled.
 * Great for font sizes where full scaling looks odd on tablets.
 */
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

/**
 * Responsive font size with optional min/max clamping.
 * Prevents headings from becoming too large on tablets.
 */
export const responsiveFont = (size: number, min?: number, max?: number) => {
  const scaled = moderateScale(size);
  if (max && scaled > max) return max;
  if (min && scaled < min) return min;
  return scaled;
};

export const COLORS = {
  background: "#FFF5F7",
  foreground: "#1A1A2E",
  card: "#FFFFFF",
  primary: "#FF5376",
  primaryLight: "#FFA8B8",
  secondary: "#FFE5EC",
  muted: "#F5F5F7",
  mutedForeground: "#6B7280",
  border: "rgba(0,0,0,0.08)",
  white: "#FFFFFF",
  danger: "#EF4444",
};

export const SPACING = {
  screen: moderateScale(24),
  radius: moderateScale(28),
  pillRadius: 999,
};

export { THEMES, DEFAULT_THEME_ID } from "./themes";
export type { ThemeId, AppTheme } from "./themes";
