/**
 * Metro configuration for ShakeShake Mobile.
 *
 * API calls go through ngrok (EXPO_PUBLIC_API_BASE_URL in .env),
 * so no proxy middleware is needed.
 *
 * Metro serves assets/api-url.txt which start-ngrok.sh keeps updated
 * with the current ngrok HTTPS URL. The app reads this at runtime so
 * new tunnel URLs take effect without restarting Expo.
 */

const { getDefaultConfig } = require("expo/metro-config");
const http = require("http");

const projectRoot = __dirname;
const defaultConfig = getDefaultConfig(projectRoot);

// ── Serve current ngrok URL at /api-url.txt ─────────────────────────
//
// The app fetches this at startup to get the latest ngrok URL without
// needing to rebuild the JS bundle. start-ngrok.sh writes the URL to
// both .env AND assets/api-url.txt, but /api-url.txt is always current
// because Metro serves it directly (not cached in the bundle).
const fs = require("fs");
const path = require("path");
const URL_FILE = path.join(projectRoot, "assets", "api-url.txt");

defaultConfig.server = defaultConfig.server || {};
defaultConfig.server.enhanceMiddleware = (metroMiddleware) => {
  return (req, res, next) => {
    // Serve the current ngrok URL at /api-url.txt
    if (req.url === "/api-url.txt" || req.url === "/api-url.txt/") {
      try {
        const url = fs.readFileSync(URL_FILE, "utf8").trim();
        res.writeHead(200, {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(url);
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("not-configured");
      }
      return;
    }

    // Serve a health endpoint so the app can verify Metro is reachable
    if (req.url === "/metro-health" || req.url === "/metro-health/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "metro" }));
      return;
    }

    metroMiddleware(req, res, next);
  };
};

module.exports = defaultConfig;
