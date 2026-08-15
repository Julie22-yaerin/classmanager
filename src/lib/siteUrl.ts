const FALLBACK_SITE_URL = "https://classmanager-production-75e7.up.railway.app";

// A bare domain (no scheme) in NEXT_PUBLIC_SITE_URL is an easy dashboard-env-var
// typo and throws ERR_INVALID_URL when passed to `new URL()` — which crashes
// the entire build when used in metadataBase. Normalize and fall back instead
// of taking the whole site down over a missing "https://".
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return FALLBACK_SITE_URL;
  const withScheme = /^https?:\/\//.test(configured) ? configured : `https://${configured}`;
  try {
    return new URL(withScheme).toString().replace(/\/$/, "");
  } catch {
    console.warn(`NEXT_PUBLIC_SITE_URL "${configured}" is not a valid URL — falling back to ${FALLBACK_SITE_URL}`);
    return FALLBACK_SITE_URL;
  }
}
