/**
 * ShakeShake API Configuration
 *
 * All backend calls go through a single HTTPS ngrok URL → gateway:23010.
 *
 * URL resolution:
 *   1. EXPO_PUBLIC_API_BASE_URL env var (baked at build time)
 *   2. Fetched from Metro's /api-url.txt at runtime (always fresh)
 *   3. Mock data fallback if nothing works
 *
 * start-ngrok.sh writes the URL to both .env AND assets/api-url.txt.
 * Metro serves /api-url.txt directly, so new ngrok URLs take effect
 * WITHOUT restarting Expo.
 */

import { Platform } from "react-native";

// ── URL state ────────────────────────────────────────────────────────

const ENV_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
let _runtimeUrl: string = ENV_URL;

/** Get the current API base URL */
export function getApiBaseUrl(): string {
  return _runtimeUrl;
}

/** Update the API base URL at runtime */
function setApiBaseUrl(url: string) {
  const clean = url.replace(/\/+$/, "");
  if (clean && clean.startsWith("http") && clean !== _runtimeUrl) {
    console.log(`[API CONFIG] 🔄 URL updated: ${_runtimeUrl || "(empty)"} → ${clean}`);
    _runtimeUrl = clean;
  }
}

// ── Fetch the latest ngrok URL from Metro ────────────────────────────
//
// Metro serves /api-url.txt which start-ngrok.sh keeps updated.
// This is checked at startup and whenever a health check fails,
// so new ngrok tunnels are picked up automatically.

async function refreshUrlFromMetro() {
  if (Platform.OS === "web") return;

  try {
    const { NativeModules } = require("react-native");
    const scriptURL: string = NativeModules.SourceCode?.scriptURL || "";
    if (!scriptURL) return;

    // Extract Metro host:port from the script URL
    const metroBase = scriptURL.replace(/^https?:\/\//, "").split("/")[0];
    if (!metroBase) return;

    const res = await fetch(`http://${metroBase}/api-url.txt`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const url = (await res.text()).trim().replace(/\/+$/, "");
      if (url && url.startsWith("https://")) {
        setApiBaseUrl(url);
      }
    }
  } catch {
    // Metro not reachable or /api-url.txt not available yet
  }
}

// Refresh the URL at startup
refreshUrlFromMetro();

// ── Mock configuration ───────────────────────────────────────────────

const envUseMocks = process.env.EXPO_PUBLIC_USE_MOCKS?.trim();
let _useMocks = envUseMocks === "true"; // OFF by default

// ── Exported config (all URLs use the same ngrok → gateway) ──────────

export const connectorConfig = {
  get authBaseUrl() { return getApiBaseUrl(); },
  get onboardingBaseUrl() { return getApiBaseUrl(); },
  get profileBaseUrl() { return getApiBaseUrl(); },
  get matchBaseUrl() { return getApiBaseUrl(); },
  get gatewayBaseUrl() { return getApiBaseUrl(); },
  get baseUrl() { return getApiBaseUrl(); },
  get useMocks() { return _useMocks; },
};

// ── Health check ─────────────────────────────────────────────────────

let _backendReachable: boolean | null = null;

export async function checkBackendHealth(): Promise<boolean> {
  // Always try to refresh the URL from Metro first
  await refreshUrlFromMetro();

  const url = getApiBaseUrl();

  if (!url) {
    console.warn("[API CONFIG] ⚠️  No API URL configured!");
    console.warn("[API CONFIG]    Run: bash start-ngrok.sh && npm start");
    if (envUseMocks !== "false") { _useMocks = true; }
    _backendReachable = false;
    return false;
  }

  try {
    const res = await fetch(`${url}/gateway/health`, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      _backendReachable = true;
      _useMocks = false;
      console.log(`[API CONFIG] ✅ Backend online: ${url}`);
      return true;
    }

    _backendReachable = false;
    console.warn(`[API CONFIG] ⚠️  Backend returned ${res.status}`);
  } catch (err) {
    _backendReachable = false;
    console.warn(`[API CONFIG] ⚠️  Backend unreachable at ${url}`);

    if (envUseMocks !== "false") {
      _useMocks = true;
      console.log("[API CONFIG] 🔄 Falling back to mock data");
    }
  }

  return _backendReachable;
}

export function isBackendReachable(): boolean | null { return _backendReachable; }
export function setUseMocks(value: boolean) { _useMocks = value; }

// ── Startup log ──────────────────────────────────────────────────────

console.log(
  `[API CONFIG] url=${_runtimeUrl || "(empty — run start-ngrok.sh)"} mocks=${_useMocks}\n` +
  `  auth     → ${_runtimeUrl || "???"}/auth/*\n` +
  `  profile  → ${_runtimeUrl || "???"}/profile/*\n` +
  `  match    → ${_runtimeUrl || "???"}/match/*\n` +
  `  gateway  → ${_runtimeUrl || "???"}/gateway/health`
);
