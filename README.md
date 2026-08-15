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
  token (no service account needed — verified against Google's public JWKS), rate-limit per user,
  and call the model. They never touch Firestore directly; the authenticated client reads/writes
  its own data.
- AI models via **OpenRouter**, using two server-side keys:
  - `OPENROUTER_MAIN_API_KEY` — reasoning: chat replies, exam analysis, teacher playbook, daily
    triage, class routing. Model: `nvidia/nemotron-3-ultra-550b-a55b:free`.
  - `OPENROUTER_PERCEPTION_API_KEY` — OCR (image/PDF) and audio transcription. Model:
    `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`.
  - Both are currently pinned to free-tier OpenRouter models. Swap the model IDs in
    `src/lib/ai.ts` if the account has paid credit and you want higher-quality models instead —
    audio transcription in particular requires OpenRouter account credit even on nominally free
    models (image/PDF extraction and text reasoning don't).

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in your Firebase web app config + OpenRouter keys
npm run dev
```

**Before first use**, in the [Firebase Console](https://console.firebase.google.com/) for your project:

1. **Authentication → Sign-in method** — enable Email/Password and Google.
2. **Authentication → Settings** — turn on "Email enumeration protection" (keeps sign-in/reset
   error messages from revealing which emails have accounts).
3. **Firestore Database → Create database** (production mode, pick a region) — a fresh project has
   no Firestore database provisioned until you do this once.
4. **Firestore → Rules** — paste in the contents of `firestore.rules` from this repo (scopes every
   user to their own `users/{uid}` document tree, and caps the size of the main text fields so a
   client can't write oversized documents directly).

Then open http://localhost:3000, sign up, go through onboarding, and start chatting — the app's
own OpenRouter keys handle all AI calls, nothing to configure per-user.

## Deploying to Railway

The app is stateless (all data lives in Firestore, not on the server's disk), so deployment is a
plain "Deploy from GitHub" with no volume or database provisioning needed:

1. **New Project → Deploy from GitHub repo** → select this repo/branch. Railway builds via
   Nixpacks and runs `npm run start` (see `railway.json`) automatically on every push.
   `engines.node` in `package.json` pins a Node version new enough for Next.js.
2. Set the env vars from `.env.example` in the Railway service's Variables tab — the
   `NEXT_PUBLIC_FIREBASE_*` values (same as local `.env.local`) plus `OPENROUTER_MAIN_API_KEY` and
   `OPENROUTER_PERCEPTION_API_KEY` (mark these two as secret in Railway's UI).
3. In Firebase Console → Authentication → Settings → **Authorized domains**, add the Railway
   deployment's domain so sign-in works there.

## Security notes

- **No cookies, so CSRF doesn't apply the usual way**: auth is a Firebase ID token sent as a
  Bearer header, not an ambient cookie, so a foreign page can't ride a signed-in session — it has
  no token to attach. There's nothing to set `SameSite`/secure flags on because the app sets no
  auth cookies.
- **CORS**: no `Access-Control-Allow-Origin` header is set anywhere, so the API routes are
  same-origin only by default.
- **Uploads**: attachment MIME types are whitelisted server-side (`isAllowedMimeType` in
  `src/app/api/chat/route.ts`), independent of what the browser reports.
- **Prompt injection**: every system prompt that processes student-provided content explicitly
  instructs the model to treat that content as untrusted data, not instructions. Structured
  tool-forced output also limits blast radius — the model can only fill defined JSON fields, not
  take free-form action.
- **Rate limiting**: per-user, per-route in-memory limits on every AI-compute endpoint
  (`src/lib/rateLimit.ts`) — since the app pays for AI usage centrally now (not BYOK), this is
  what keeps one account from exhausting the shared quota.
- **Request size caps**: `src/lib/requestGuard.ts` rejects oversized bodies before they're parsed;
  attachments are separately capped at ~15MB.
- **Security event logging**: rejected uploads, rate-limit trips, and auth failures are logged as
  structured JSON via `console.warn` (`src/lib/securityLog.ts`) — captured by Railway's log tail.
- **Known gaps** (would need Firebase Admin / a service account to close, which this app
  deliberately doesn't hold): account lockout after repeated failed logins, and any server-side
  moderation of what gets written to Firestore beyond the size/ownership rules — writes go
  client → Firestore directly, so `firestore.rules` is the actual enforcement point, not the API
  layer.

## Notes on scope

MVP per the spec: accounts + onboarding, unified chat, tagged uploads (text/image/PDF/audio),
class memory, Teacher Playbook, Daily Mode, and Exam Mode. ROI Study Planner, Teacher Simulator,
and Last-Minute Mode are intentionally deferred — they're additional AI workflows on top of the
same backend and data model, not architectural changes. Group projects, integrations, social
features, marketplace, and extra dashboards are out of scope.
