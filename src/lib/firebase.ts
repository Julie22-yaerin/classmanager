"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const hasConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

function unconfigured<T>(name: string): T {
  return new Proxy(
    {},
    {
      get(): never {
        throw new Error(`Firebase ${name} is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.`);
      },
    },
  ) as T;
}

// This "use client" module is still evaluated on the server during SSR/prerendering
// (e.g. Next.js build workers). getAuth() throws synchronously on a missing/invalid
// apiKey, which would otherwise crash the entire build. Real Firebase features are
// only ever invoked from browser-only code paths (effects/handlers), so it's safe to
// skip real initialization on the server and fall back to inert placeholders there
// (or anywhere the env vars simply aren't set).
export let firebaseApp: FirebaseApp | null = null;
export let auth: Auth;
export let db: Firestore;

if (hasConfig && typeof window !== "undefined") {
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
} else {
  auth = unconfigured<Auth>("Auth");
  db = unconfigured<Firestore>("Firestore");
}

export const googleProvider = new GoogleAuthProvider();
