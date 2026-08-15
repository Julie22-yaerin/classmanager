# School AI — DRM v0.3 / School OS

Build a school-specific AI assistant that learns each student's teachers, classes, curriculum, and
assessment patterns, then helps the student complete daily schoolwork and prepare for exams using
the minimum necessary time.

## Core idea

- **Accounts**: email/password or Google sign-in. A 4-screen onboarding flow (goals, academic
  context, first class, AI interaction style) runs on first login.
- **One chat**: every message is tagged (`Homework`, `Past Exam`, `Class Recording`, `Material`,
  `Notes`, `Announcement`) and routed to the right class. Homework additionally has a sub-mode:
  Fast Answer / Explain / Step-by-step / Check My Work.
- **Routing pipeline**: Chat input → tag → identify class → tag-specific AI processor → update
  class memory → respond.
- **Class memory**: curriculum, teacher persona/teaching/question style, assessment patterns,
  topic priorities, homework history, past exams, transcripts, and important dates — all
  continuously updated from new input.
- **Teacher Playbook**: a class's page can generate actionable "how to deal with this teacher"
  guidance (question style, grading expectations, classroom expectations, recurring patterns) —
  strategy, not gossip.
- **Student profile**: a global, cross-class profile (academic level, explanation/communication
  style, learning preferences, weaknesses, preferred AI style) that responses adapt to.
- **Daily Mode**: a dashboard that triages every open deadline and recent homework across all
  classes into Must / Should / Can Ignore, each with an estimated time.
- **Exam Mode**: on a class's page, generates topic priority, question-pattern analysis, mark
  distribution, weak-area detection, a mock exam, and a rapid review sheet from everything
  accumulated for that class. Never claims certainty about actual future exam content.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Firebase Auth (email/password + Google) + Firestore (all app data, client SDK, scoped per user
  by Firestore Security Rules — see `firestore.rules`)
- Next.js API routes are stateless AI-compute endpoints only: they verify the caller's Firebase ID
  token (no service account needed — verified against Google's public JWKS) and call Anthropic.
  They never touch Firestore directly; the authenticated client reads/writes its own data.
- Anthropic Claude (Messages API, tool-use for structured output) — BYOK, key stored in an httpOnly
  cookie per browser
- Optional: OpenAI Whisper for Class Recording audio transcription — BYOK

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in your Firebase web app config
npm run dev
```

**Before first use**, in the [Firebase Console](https://console.firebase.google.com/) for your project:

1. **Authentication → Sign-in method** — enable Email/Password and Google.
2. **Firestore Database → Create database** (production mode, pick a region) — a fresh project has
   no Firestore database provisioned until you do this once.
3. **Firestore → Rules** — paste in the contents of `firestore.rules` from this repo (scopes every
   user to their own `users/{uid}` document tree).

Then open http://localhost:3000, sign up, go through onboarding, and in **Settings** add your
Anthropic API key (required for chat) and, optionally, an OpenAI API key (only used to transcribe
audio recordings — without it, paste a transcript instead). Keys are stored in an httpOnly cookie
on your device and used server-side only; they're per-browser, not per-account.

## Deploying to Railway

The app is stateless (all data lives in Firestore, not on the server's disk), so deployment is a
plain "Deploy from GitHub" with no volume or database provisioning needed:

1. **New Project → Deploy from GitHub repo** → select this repo/branch. Railway builds via
   Nixpacks and runs `npm run start` (see `railway.json`) automatically on every push.
2. Set the `NEXT_PUBLIC_FIREBASE_*` environment variables (from `.env.example`) in the Railway
   service's Variables tab — same values as your local `.env.local`. These are the public Firebase
   web config, safe to expose; access is controlled by Firestore Security Rules and Firebase Auth,
   not by secrecy.
3. In Firebase Console → Authentication → Settings → **Authorized domains**, add the Railway
   deployment's domain so sign-in works there.

No `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` env vars are required on the server — every user adds
their own key under **Settings** after signing in.

## Notes on scope

MVP per the spec: accounts + onboarding, unified chat, tagged uploads (text/image/PDF/audio),
class memory, Teacher Playbook, Daily Mode, and Exam Mode. ROI Study Planner, Teacher Simulator,
and Last-Minute Mode are intentionally deferred — they're additional AI workflows on top of the
same backend and data model, not architectural changes. Group projects, integrations, social
features, marketplace, and extra dashboards are out of scope.
