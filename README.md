Nexus University Portal

A modern, scalable multi-role university management platform designed to streamline workflows for students, lecturers, and registrars. The system provides a centralized interface for academic operations, communication, and administrative management.

Technology Stack
Frontend: React, TypeScript, Vite
Backend & Services: Firebase (Authentication, Firestore, Storage) and Django REST API
UI & Styling: Tailwind CSS, shadcn/ui
Prerequisites

Ensure the following are installed and configured:

Node.js (v20 or later)
npm (v12 or later)
A Firebase project with:
Authentication enabled
Firestore database enabled
Cloud Storage enabled
Local Development Setup

1. Install Dependencies
   npm ci
2. Configure Environment Variables

Create a local environment file:

cp .env.example .env

Update the .env file with your Firebase configuration:

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATOR=false
VITE_API_BASE_URL=http://localhost:8000 3. Run Development Server
npm run dev
Available Scripts
Command Description
npm run dev Start development server
npm run lint Run ESLint for code quality checks
npm run build Build application for production
npm run preview Preview production build locally
Firebase Configuration Notes
Firebase client setup:
src/integrations/firebase/client.ts
Django backend source:
backend/
Security rules:
Firestore → firestore.rules
Storage → storage.rules

Backend Migration Notes

The first Django slice now handles student record validation and OTP flows.
Firebase Auth remains in place for sign-in and account creation while the backend migration continues.
Branding & Customization

Global branding is dynamically managed via Firestore:

Document Path:

site_settings/branding

Administrators or registrars can configure branding directly from the in-app settings interface.

Supported Fields
siteName – Full application name (browser title, Open Graph)
shortName – Compact name used in headers and authentication screens
tagline – Application description (SEO and metadata)
logoUrl – URL for logo and favicon
supportEmail – Contact email for support
primaryColor – Main brand color (Hex format)
secondaryColor – Accent color (Hex format)

If the branding document does not exist, the system automatically falls back to default values and creates the document upon saving settings.

Continuous Integration

A GitHub Actions workflow is configured to maintain code quality and build integrity:

Runs on push and pull requests
Executes linting and production build
Configuration file:
.github/workflows/ci.yml
