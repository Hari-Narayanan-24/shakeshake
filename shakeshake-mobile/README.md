# ShakeShake Mobile - Expo React Native App

This project is a fresh React Native + Expo conversion of the Figma/Vite workflow you uploaded.

Original design flow converted:

```text
Welcome -> Interests -> Personality -> Account Creation -> Success
```

The old uploaded zip was a React web project. This folder is a new mobile project, so you can run it in Expo Go.

---

## 1. How to run

```bash
cd shakeshake-mobile
npm install
npx expo start
```

Then scan the QR code using Expo Go.

If phone connection fails, use tunnel mode:

```bash
npx expo start --tunnel
```

---

## 2. Folder structure

```text
shakeshake-mobile/
├── App.tsx
├── app.json
├── package.json
├── .env.example
└── src/
    ├── components/
    ├── constants/
    ├── connectors/
    ├── screens/
    └── types/
```

---

## 3. Main files explained

### `App.tsx`

This is the main controller of the app.

It keeps track of:

- current screen
- selected interests
- selected personality
- account form data
- loading state

When button actions happen, it calls connector functions from `src/connectors/`.

---

### `src/screens/WelcomeScreen.tsx`

First screen.

Contains:

- pink gradient background
- heart icon
- `shakeshake` title
- `Get Started` button
- `Sign In` button

---

### `src/screens/InterestsScreen.tsx`

Second screen.

Contains:

- progress bar step 1
- interest grid
- minimum 3 selection rule
- Continue button

When Continue is clicked, it calls:

```ts
onboardingConnector.saveInterests(selectedInterests)
```

---

### `src/screens/PersonalityScreen.tsx`

Third screen.

Contains:

- progress bar step 2
- personality options
- Back button
- Continue button

When Continue is clicked, it calls:

```ts
onboardingConnector.savePersonality(selectedPersonality)
```

---

### `src/screens/AccountScreen.tsx`

Fourth screen.

Contains:

- name input
- email input
- password input
- Create Account button

When Create Account is clicked, it calls:

```ts
authConnector.createAccount(payload)
```

---

### `src/screens/SuccessScreen.tsx`

Final screen.

Shows:

- welcome message
- number of interests selected
- selected personality vibe
- Start Exploring button

---

## 4. Connectors folder

You asked to keep backend API connection separately. So all backend route logic is inside:

```text
src/connectors/
├── apiClient.ts
├── authConnector.ts
├── config.ts
├── index.ts
└── onboardingConnector.ts
```

### `src/connectors/apiClient.ts`

Common fetch wrapper.

Every backend API call goes through this file.

### `src/connectors/authConnector.ts`

Authentication-related routes.

Currently used routes:

```ts
POST /auth/register
POST /auth/sign-in
```

### `src/connectors/onboardingConnector.ts`

Onboarding-related routes.

Currently used routes:

```ts
POST /onboarding/interests
POST /onboarding/personality
POST /onboarding/complete
```

You can change these route names later based on your backend team routes.

---

## 5. How to connect real backend

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000
EXPO_PUBLIC_USE_MOCKS=false
```

Important: if running on your phone, do not use `localhost` for backend. Use your laptop IP address, for example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000
```

Then restart Expo:

```bash
npx expo start -c
```

---

## 6. Mock mode

By default the project uses mock API mode:

```env
EXPO_PUBLIC_USE_MOCKS=true
```

So the app works even without backend.

When backend is ready, change it to:

```env
EXPO_PUBLIC_USE_MOCKS=false
```

---

## 7. How to add next pages

Create a screen file:

```text
src/screens/HomeScreen.tsx
```

Then add its screen name in:

```text
src/types/onboarding.ts
```

Then render it inside:

```text
App.tsx
```

For backend connection, create or update connector functions inside:

```text
src/connectors/
```

Rule to remember:

```text
Screen = UI only
Connector = backend/API only
App.tsx = connects screen flow together
```
