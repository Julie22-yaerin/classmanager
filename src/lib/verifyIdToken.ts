import { createRemoteJWKSet, jwtVerify } from "jose";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export class InvalidAuthError extends Error {
  constructor(message = "Missing or invalid authentication.") {
    super(message);
    this.name = "InvalidAuthError";
  }
}

/**
 * Verifies a Firebase Auth ID token without the Admin SDK (no service
 * account available) — checks the RS256 signature against Google's public
 * JWKS, plus issuer/audience/expiry. Returns the Firebase uid.
 */
export async function verifyIdToken(authHeader: string | null): Promise<string> {
  if (!authHeader?.startsWith("Bearer ")) throw new InvalidAuthError();
  if (!PROJECT_ID) throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured on the server.");

  const token = authHeader.slice("Bearer ".length);
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    if (!payload.sub) throw new InvalidAuthError();
    return payload.sub;
  } catch {
    throw new InvalidAuthError();
  }
}
