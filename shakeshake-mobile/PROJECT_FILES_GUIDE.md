# File-by-file guide for Hari

## Simple mental model

```text
App.tsx decides which page to show.
Screens show UI.
Components are reusable UI blocks.
Connectors call backend APIs.
Constants store common colors/data.
Types store TypeScript shapes.
```

## Backend connector rule

Do not write `fetch()` directly inside screens.

Correct pattern:

```text
screen button click
  -> App.tsx handler
  -> connector function
  -> apiClient fetch call
  -> backend route
```

This keeps frontend clean and makes it easy to give route changes to backend team.

## Files you will modify most

### For changing API routes

```text
src/connectors/authConnector.ts
src/connectors/onboardingConnector.ts
```

### For changing colors

```text
src/constants/theme.ts
```

### For changing interest/personality options

```text
src/constants/onboardingData.ts
```

### For changing page design

```text
src/screens/*.tsx
```

### For adding a new page

1. Add screen file in `src/screens/`
2. Add new screen name type in `src/types/onboarding.ts`
3. Add state/render logic in `App.tsx`
4. Add connector function if backend is needed

## Example: change register API route

Open:

```text
src/connectors/authConnector.ts
```

Change this:

```ts
"/auth/register"
```

to your backend route:

```ts
"/api/v1/users/register"
```

No UI screen code needs to change.
