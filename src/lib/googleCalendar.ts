"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TOKEN_KEY = "cm_gcal_token";
const EXPIRY_KEY = "cm_gcal_expiry";
// Google doesn't tell us the real expiry of the token it hands back via the
// client SDK, so we assume the documented default access-token lifetime and
// reconnect proactively rather than risk calling the API with a stale token.
const ASSUMED_TOKEN_LIFETIME_MS = 55 * 60 * 1000;

// Connects (or reconnects) Google Calendar access for the *current session only*.
// This is a client-side OAuth access token obtained via Firebase's Google
// sign-in with an added scope — there is no service account and no refresh
// token, matching this app's stateless-server architecture. The token lives
// only in sessionStorage (cleared when the tab closes) and expires in ~1h;
// after that, auto-sync silently stops until the user reconnects in Settings.
export async function connectGoogleCalendar(): Promise<void> {
  if (!auth.currentUser) throw new Error("Sign in first.");
  const provider = new GoogleAuthProvider();
  provider.addScope(CALENDAR_SCOPE);
  provider.setCustomParameters({ prompt: "consent" });
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) throw new Error("Google didn't grant a Calendar access token.");
  window.sessionStorage.setItem(TOKEN_KEY, credential.accessToken);
  window.sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + ASSUMED_TOKEN_LIFETIME_MS));
}

export function disconnectGoogleCalendar(): void {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(EXPIRY_KEY);
}

export function getValidCalendarToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.sessionStorage.getItem(TOKEN_KEY);
  const expiry = Number(window.sessionStorage.getItem(EXPIRY_KEY) ?? 0);
  if (!token || Date.now() >= expiry) return null;
  return token;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  /** ISO date (YYYY-MM-DD) or date-time. All-day event if no time component. */
  date: string;
}

// Best-effort: swallows failures (expired token, network, revoked access) so
// a calendar hiccup never blocks saving the deadline itself.
export async function createCalendarEvent(input: CalendarEventInput): Promise<boolean> {
  const token = getValidCalendarToken();
  if (!token) return false;

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input.date);
  const body = {
    summary: input.title,
    description: input.description,
    start: isDateOnly ? { date: input.date } : { dateTime: input.date },
    end: isDateOnly ? { date: input.date } : { dateTime: input.date },
  };

  try {
    const res = await fetch("https://www.googleapis.com/calendar/v3/events", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}
