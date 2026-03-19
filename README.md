# Nexus University

Multi-role university portal for students, lecturers, and registrar workflows.

## Stack

- React + TypeScript + Vite
- Firebase Auth, Firestore, Storage, Functions
- Tailwind + shadcn UI

## Prerequisites

- Node.js 20+
- npm 10+
- Firebase project with Auth/Firestore/Storage enabled

## Local Setup

1. Install dependencies.

```bash
npm ci
```

2. Create a local env file.

```bash
cp .env.example .env
```

3. Fill in Firebase variables in `.env`.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATOR=false
```

4. Start the app.

```bash
npm run dev
```

## Scripts

- `npm run dev`: start development server
- `npm run lint`: run ESLint
- `npm run build`: production build
- `npm run preview`: preview production build locally

## Firebase Notes

- Frontend Firebase client is configured in `src/integrations/firebase/client.ts`.
- Cloud Functions source is in `functions/src/index.ts`.
- Firestore and Storage rules are in `firestore.rules` and `storage.rules`.

## CI

GitHub Actions workflow runs lint + build on push and pull requests:

- `.github/workflows/ci.yml`

## Production Checklist

- Replace development OTP/testing flows with real delivery channels.
- Tighten Firestore/Storage rules per collection and role.
- Configure function secrets and callback URLs in Firebase runtime config.
- Verify domain, HTTPS, and CORS policies.
