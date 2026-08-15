const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Minimal server-side Firestore REST access using the caller's own Firebase
 * ID token as the Bearer credential — no service account needed. Firestore
 * accepts a user's ID token as OAuth credentials and enforces the same
 * firestore.rules, so this can only ever read/write that user's own data
 * (rules already scope users/{uid} to request.auth.uid == uid).
 */

interface FirestoreFields {
  [key: string]: { integerValue?: string; stringValue?: string; nullValue?: null };
}

function decodeFields(fields: FirestoreFields | undefined): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  if (!fields) return out;
  for (const [key, value] of Object.entries(fields)) {
    if (value.integerValue !== undefined) out[key] = Number(value.integerValue);
    else if (value.stringValue !== undefined) out[key] = value.stringValue;
    else out[key] = null;
  }
  return out;
}

export async function getUserDocFields(idToken: string, uid: string): Promise<Record<string, string | number | null>> {
  const res = await fetch(`${BASE}/users/${uid}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (res.status === 404) return {};
  if (!res.ok) throw new Error(`Firestore read failed: ${res.status}`);
  const json = (await res.json()) as { fields?: FirestoreFields };
  return decodeFields(json.fields);
}

export async function patchUserDocFields(idToken: string, uid: string, fields: Record<string, number | string>): Promise<void> {
  const encoded: FirestoreFields = {};
  const mask: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    encoded[key] = typeof value === "number" ? { integerValue: String(Math.trunc(value)) } : { stringValue: value };
    mask.push(`updateMask.fieldPaths=${encodeURIComponent(key)}`);
  }

  const res = await fetch(`${BASE}/users/${uid}?${mask.join("&")}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: encoded }),
  });
  if (!res.ok) throw new Error(`Firestore write failed: ${res.status}`);
}
