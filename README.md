# ShakeShake

ShakeShake is a React Native + Expo social matching app backed by a local FastAPI microservice stack. The project includes onboarding, profile building, shake-to-match discovery, chat, place exploration, theme customization, and optional AI-assisted replies.

## What is in this repo

- `shakeshake-mobile/` - the Expo mobile app
- `shakeshake-backend/` - FastAPI microservices plus a gateway
- `shakeshake-backend/logs/` - runtime logs for each backend service
- `shakeshake-backend/profile/shakeshake.db` - shared SQLite database
- `shakeshake-backend/match/data/` - JSON-backed match and chat data

## Main features

- Multi-step onboarding for profile, identity, interests, and personality
- Home screen with weekly availability, shake detection, and match animation
- Matching flow based on profile data and available time slots
- Explore screen with category-based and mood-based place suggestions
- Chat conversations for matched users
- Profile editing, theme switching, and AI endpoint settings
- Local mock mode so the app can run without the backend

## Tech stack

### Mobile

- Expo 54
- React Native 0.81
- React 19
- TypeScript
- React Navigation
- AsyncStorage

### Backend

- FastAPI
- Uvicorn
- Pydantic
- SQLite
- JSON file persistence
- HTTPX

### Optional tools

- ngrok for testing the backend on a physical device
- Ollama-compatible endpoint for AI reply generation

## Project structure

```text
shakeshake/
|-- README.md
|-- shakeshake-backend/
|   |-- auth/
|   |-- onboarding/
|   |-- profile/
|   |-- match/
|   |-- gateway/
|   |-- logs/
|   `-- start_all.py
`-- shakeshake-mobile/
    |-- App.tsx
    |-- app.json
    |-- package.json
    |-- .env.example
    |-- assets/
    `-- src/
```

## Prerequisites

- Node.js and npm
- Python and pip
- Expo Go, Android emulator, iOS simulator, or web browser
- ngrok if you want to expose the backend to a phone
- Bash if you want to run `shakeshake-mobile/start-ngrok.sh` on Windows

## Quick start

### Option 1: Run the mobile app in mock mode

Use this when you want to demo the app without starting the backend.

1. Create `shakeshake-mobile/.env` from `shakeshake-mobile/.env.example` if needed, then set:

```env
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_USE_MOCKS=true
```

2. Start the app:

```powershell
cd shakeshake-mobile
npm install
npm start
```

3. Open the app in Expo Go, Android, iOS, or web.

## Full local development

### 1. Install backend dependencies

The backend is split into services, each with its own `requirements.txt`.

```powershell
cd shakeshake-backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r auth\requirements.txt
pip install -r onboarding\requirements.txt
pip install -r profile\requirements.txt
pip install -r match\requirements.txt
pip install -r gateway\requirements.txt
```

### 2. Start all backend services

```powershell
cd shakeshake-backend
python start_all.py
```

The gateway health endpoint should be available at:

```text
http://localhost:23010/gateway/health
```

### 3. Configure the mobile app

Create or update `shakeshake-mobile/.env` so it points at the gateway:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:23010
EXPO_PUBLIC_USE_MOCKS=false
```

Use the right host for your device:

- Web or iOS simulator: `http://localhost:23010`
- Android emulator: `http://10.0.2.2:23010`
- Physical device: `http://<your-computer-ip>:23010` or use ngrok

### 4. Start Expo

```powershell
cd shakeshake-mobile
npm install
npm start
```

The `start` script runs `expo start --tunnel -c`.

## Testing on a physical phone with ngrok

The mobile app includes a helper script that starts an ngrok tunnel for the backend gateway and writes the public URL into both `.env` and `assets/api-url.txt`.

1. Start the backend:

```powershell
cd shakeshake-backend
python start_all.py
```

2. Start ngrok from the mobile app folder:

```bash
cd shakeshake-mobile
bash start-ngrok.sh
```

3. Start Expo:

```powershell
cd shakeshake-mobile
npm start
```

Notes:

- `assets/api-url.txt` lets the app refresh the backend URL at runtime from Metro.
- On Windows, run the script from Git Bash or WSL if `bash` is not available in PowerShell.

## Backend services

The mobile app should talk to the gateway on port `23010`. The gateway forwards requests to the correct service based on the route prefix.

| Service | Port | Responsibility | Example routes |
| --- | --- | --- | --- |
| Auth | `23000` | Registration, sign-in, user settings | `/auth/register`, `/auth/sign-in`, `/settings/{user_id}` |
| Onboarding | `23001` | Final onboarding completion | `/onboarding/complete` |
| Profile | `23002` | Profile, identity, interests, personality | `/profile/create`, `/profile/{user_id}` |
| Match | `23003` | Matching, chat, AI proxy | `/match/shake`, `/chat/send`, `/ollama/status` |
| Gateway | `23010` | Single entry point for the app | `/gateway/health` |

## Environment variables

The mobile app uses `shakeshake-mobile/.env`.

- `EXPO_PUBLIC_API_BASE_URL` - base URL for the backend gateway
- `EXPO_PUBLIC_USE_MOCKS` - `true` forces local mock data, `false` uses real APIs

The app also reads `shakeshake-mobile/assets/api-url.txt` at runtime when available, which is useful when ngrok URLs change.

## Data and persistence

- Mobile mock mode stores seeded demo data in AsyncStorage
- Auth, onboarding, and profile services share `shakeshake-backend/profile/shakeshake.db`
- Match and chat data are stored under `shakeshake-backend/match/data/`
- Service logs are written to `shakeshake-backend/logs/`

## Useful commands

### Mobile

```powershell
cd shakeshake-mobile
npm start
npm run android
npm run ios
npm run web
npm run ngrok
```

### Backend

```powershell
cd shakeshake-backend
python start_all.py
```

## Notes for working in this repo

- `shakeshake-mobile/README.md` contains older mobile-specific notes
- `shakeshake-mobile/PROJECT_FILES_GUIDE.md` is a helpful file-by-file guide for frontend edits
- The frontend keeps API logic inside `src/connectors/` instead of calling `fetch()` directly from screens
- If you are using a real phone, do not point the app at `localhost`


## Projected Prototype Link developed using Manus.Ai
https://spontyapp-mgma6et3.manus.space/


