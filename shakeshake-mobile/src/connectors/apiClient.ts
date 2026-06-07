import { connectorConfig } from "./config";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
};

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// ── Auth token management ──────────────────────────────────────────
let authToken: string | null = null;

/** Store the JWT token after sign-in */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Get current token (useful for debugging) */
export function getAuthToken(): string | null {
  return authToken;
}

/** Clear the stored token (on logout) */
export function clearAuthToken() {
  authToken = null;
}

/**
 * Send a request to the backend with full logging.
 * @param baseUrl  The service root URL (e.g. Metro proxy URL or gateway URL)
 * @param route    The endpoint path (e.g. "/auth/sign-in")
 * @param options  Method, body, headers
 */
export async function apiRequest<TResponse>(
  baseUrl: string,
  route: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  const method = options.method ?? "GET";
  const cleanRoute = route.startsWith("/") ? route : `/${route}`;
  const url = `${baseUrl}${cleanRoute}`;

  // When mocks are on, the connectors themselves handle mock data
  // (they have richer mock implementations). This is a safety net
  // only — if a connector forgets its mock check, we return a
  // generic stub here instead of making a real network call.
  if (connectorConfig.useMocks) {
    console.log(`[MOCK API] ${method} ${cleanRoute}  (mock mode active)`);
    await wait(350);
    return { success: true, route: cleanRoute } as TResponse;
  }

  const startTime = Date.now();
  const bodySummary = options.body
    ? JSON.stringify(options.body).slice(0, 200) + (JSON.stringify(options.body).length > 200 ? "..." : "")
    : "";

  console.log(`[API] → ${method} ${url}`);
  if (bodySummary) console.log(`[API]   Body: ${bodySummary}`);

  try {
    // Add a timeout so requests don't hang forever when backend is down
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.headers ?? {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const elapsed = Date.now() - startTime;
    const statusEmoji = response.ok ? "✅" : "❌";

    let data: unknown = null;
    const responseText = await response.text();
    if (responseText) {
      try { data = JSON.parse(responseText); } catch { data = responseText; }
    }

    const dataSummary = responseText
      ? responseText.slice(0, 150) + (responseText.length > 150 ? "..." : "")
      : "(empty)";

    console.log(`[API] ← ${statusEmoji} ${response.status} (${elapsed}ms) ${dataSummary}`);

    if (!response.ok) {
      const errorMsg = (data as Record<string, unknown>)?.message
        || (data as Record<string, unknown>)?.detail
        || `HTTP ${response.status}`;
      throw new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
    }

    return data as TResponse;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[API] ❌ FAIL ${method} ${url} (${elapsed}ms)`, errMsg);

    // Provide a more helpful error message for common connectivity issues
    if (errMsg.includes("Network request failed") || errMsg.includes("Failed to fetch")) {
      throw new Error(
        `Cannot reach backend at ${baseUrl}. ` +
        "Make sure ngrok is running (./start-ngrok.sh) and EXPO_PUBLIC_API_BASE_URL is set in .env."
      );
    }
    if (errMsg.includes("aborted") || errMsg.includes("AbortError")) {
      throw new Error(
        `Request to ${url} timed out after 15s. The backend may be down or unreachable.`
      );
    }

    throw err;
  }
}
