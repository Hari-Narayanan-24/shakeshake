#!/usr/bin/env bash
#
# start-ngrok.sh — Start ngrok tunnel, write URL to .env + api-url.txt
#
# This script:
#   1. Checks the gateway is running on port 23010
#   2. Kills any old ngrok processes
#   3. Starts a fresh ngrok tunnel to port 23010
#   4. Writes the HTTPS URL to .env AND assets/api-url.txt
#   5. assets/api-url.txt is read by the app at runtime, so new
#      ngrok URLs take effect WITHOUT restarting Expo
#
# Usage:  bash start-ngrok.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
URL_FILE="$SCRIPT_DIR/assets/api-url.txt"

# ── Check if gateway is running ──────────────────────────────────────
if ! curl -s http://127.0.0.1:23010/gateway/health &>/dev/null; then
  echo "❌ Gateway not running on port 23010."
  echo "   Start it first:  cd shakeshake-backend && python start_all.py"
  exit 1
fi
echo "✅ Gateway is running on port 23010"

# ── Kill any existing ngrok processes ────────────────────────────────
echo "🔄 Killing old ngrok processes..."
pkill -f "ngrok" 2>/dev/null || true
sleep 2

# ── Start ngrok ──────────────────────────────────────────────────────
echo "🚀 Starting ngrok tunnel for port 23010..."
npx ngrok http 23010 --log=stderr &>/dev/null &

# ── Wait for the public URL ──────────────────────────────────────────
echo "⏳ Waiting for ngrok tunnel URL..."
URL=""
for i in $(seq 1 25); do
  sleep 1
  URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null \
    | grep -oP '"public_url":"\K[^"]+' \
    | grep -v "tcp://" \
    | head -1 || echo "")
  if [ -n "$URL" ]; then
    break
  fi
done

if [ -z "$URL" ]; then
  echo "❌ Could not get ngrok URL after 25s."
  echo "   Check: https://dashboard.ngrok.com/tunnels"
  exit 1
fi

echo "✅ ngrok tunnel active: $URL"

# ── Write URL to assets/api-url.txt (runtime — no Expo restart needed) ──
echo -n "$URL" > "$URL_FILE"
echo "📝 Written to assets/api-url.txt: $URL"

# ── Write URL to .env (for next Expo build) ──────────────────────────
if grep -q "EXPO_PUBLIC_API_BASE_URL=" "$ENV_FILE"; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|EXPO_PUBLIC_API_BASE_URL=.*|EXPO_PUBLIC_API_BASE_URL=$URL|" "$ENV_FILE"
  else
    sed -i "s|EXPO_PUBLIC_API_BASE_URL=.*|EXPO_PUBLIC_API_BASE_URL=$URL|" "$ENV_FILE"
  fi
else
  echo "EXPO_PUBLIC_API_BASE_URL=$URL" >> "$ENV_FILE"
fi
echo "📝 Written to .env: EXPO_PUBLIC_API_BASE_URL=$URL"

# ── Verify backend is reachable ──────────────────────────────────────
sleep 2
HEALTH=$(curl -s "$URL/gateway/health" 2>/dev/null || echo "")
if echo "$HEALTH" | grep -q "ok"; then
  echo "✅ Backend health check PASSED"
else
  echo "⚠️  Backend health check failed — check that all services are running"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ ngrok tunnel is LIVE!"
echo ""
echo "  URL:          $URL"
echo "  Health:       $URL/gateway/health"
echo "  Auth:         $URL/auth/sign-in"
echo "  Profile:      $URL/profile/create"
echo "  Match:        $URL/match/shake"
echo ""
echo "  Now start Expo:"
echo "    npx expo start --tunnel -c"
echo ""
echo "  Or use the all-in-one command:"
echo "    npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
