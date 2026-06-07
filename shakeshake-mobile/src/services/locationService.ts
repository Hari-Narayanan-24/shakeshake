/**
 * LocationService — GPS location access with permission handling.
 */

import * as Location from "expo-location";

// ── Types ───────────────────────────────────────────────────────────

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export type LocationPermissionStatus = "granted" | "denied" | "undetermined";

// ── Cache ─────────────────────────────────────────────────────────────

let cachedLocation: LocationCoords | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60_000; // 1 minute cache for GPS

// ── Request permission ─────────────────────────────────────────────

export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status;
}

export async function getCurrentPermissionStatus(): Promise<LocationPermissionStatus> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status;
}

// ── Get current location ───────────────────────────────────────────────

export async function getCurrentLocation(): Promise<LocationCoords | null> {
  const now = Date.now();

  // Return cached location if fresh
  if (cachedLocation && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedLocation;
  }

  const status = await getCurrentPermissionStatus();

  if (status !== "granted") {
    // Try requesting permission
    const requestStatus = await requestLocationPermission();
    if (requestStatus !== "granted") {
      console.log("[LOCATION] Permission denied, using last known location or default");
      return cachedLocation ?? null;
    }
  }

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // ~100m accuracy, good for places
    });

    cachedLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    lastFetchTime = now;
    console.log(
      `[LOCATION] Got position: ${cachedLocation.latitude.toFixed(5)}, ${cachedLocation.longitude.toFixed(5)}`
    );
    return cachedLocation;
  } catch (err) {
    console.warn("[LOCATION] Failed to get location:", err);
    return cachedLocation; // Return last known
  }
}

// ── Get last known location ───────────────────────────────────────────

export function getLastKnownLocation(): LocationCoords | null {
  return cachedLocation;
}
