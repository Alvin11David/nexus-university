# Nexus University

Multi-role university portal for students, lecturers, and registrar workflows.

## Stack

- React + TypeScript + Vite
- Firebase Auth, Firestore, Storage, Functions
- Tailwind + shadcn UI

## Prerequisites

- Node.js 20+
- npm 11+
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

## Open Source Branding Customization

Global site branding now comes from Firestore document `site_settings/branding`.

You can update these fields from the in-app settings UI (admin/registrar role):

- `siteName`: full product name used for browser title and Open Graph title
- `shortName`: compact app name shown in headers/auth screens
- `tagline`: meta description and Open Graph description
- `logoUrl`: remote image URL used in headers/auth screens and favicon
- `supportEmail`: support contact value for integrations/extensions
- `primaryColor`: hex brand color (`#RRGGBB` or `#RGB`)
- `secondaryColor`: hex accent color (`#RRGGBB` or `#RGB`)

If the document does not exist yet, the app falls back to defaults and creates/updates
the document when branding is saved from settings.

## CI

GitHub Actions workflow runs lint + build on push and pull requests:

- `.github/workflows/ci.yml`

## Production Checklist

- Replace development OTP/testing flows with real delivery channels.
- Tighten Firestore/Storage rules per collection and role.
- Configure function secrets and callback URLs in Firebase runtime config.
- Verify domain, HTTPS, and CORS policies.
