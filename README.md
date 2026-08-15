# School AI — DRM v0.3

One chat that learns how each student's teachers, classes, curriculum, and assessment style actually work.

## Core idea

- **Onboarding**: create teachers, then the classes they teach (grade, subject, textbook/materials).
- **One chat**: every message is tagged (`Homework`, `Past Exam`, `Class Recording`, `Material`, `Notes`, `Teacher Announcement`) and routed to the right class.
- **Routing pipeline**: Chat input → tag → identify class → tag-specific processor → update class memory → respond.
- **Class memory**: curriculum, teacher persona/teaching/question style, assessment patterns, topic priorities, homework history, past exams, transcripts, and important dates — all continuously updated from new input.
- **Student profile**: a global, cross-class profile (academic level, explanation/communication style, learning preferences, weaknesses) that responses adapt to.
- **Daily Mode**: default mode for everyday schoolwork — homework, notes, deadlines, quick questions.
- **Exam Mode**: on a class's page, generates topic priority, question-pattern analysis, mark distribution, weak-area detection, a mock exam, and a rapid review sheet from everything accumulated for that class. Never claims certainty about actual future exam content.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite (`better-sqlite3` driver adapter)
- Anthropic Claude (Messages API, tool-use for structured memory updates) — BYOK
- Optional: OpenAI Whisper for Class Recording audio transcription — BYOK

## Running locally

```bash
npm install
cp .env.example .env
npx prisma migrate deploy   # or: npm run db:migrate
npm run dev
```

Open http://localhost:3000, then go to **Settings** and add your Anthropic API key (required for chat) and, optionally, an OpenAI API key (only used to transcribe audio recordings — without it, paste a transcript instead). Keys are stored in an httpOnly cookie on your device and used server-side only.

Then go to **Teachers & Classes** to onboard a teacher and a class, and start chatting.

## Notes on scope

This is the MVP described in DRM v0.3: teacher/class creation, one unified chat, tagging, PDF/image/audio input, class memory, teacher/class analysis, Daily Mode, and Exam Mode. Group projects, integrations, social features, marketplace, and extra dashboards are intentionally out of scope.
