import { NextRequest, NextResponse } from "next/server";

const MAX_JSON_BODY_BYTES = 25 * 1024 * 1024; // ~25MB — covers a ~15MB base64 attachment plus context

/**
 * Rejects requests whose declared Content-Length exceeds a sane cap, before
 * the body is even read. A spoofed/missing Content-Length still gets caught
 * downstream by the attachment-specific size check, but this stops the
 * cheap case (and oversized JSON bodies on routes with no attachment).
 */
export function requireReasonableBody(req: NextRequest): NextResponse | null {
  const len = req.headers.get("content-length");
  if (len && Number(len) > MAX_JSON_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }
  return null;
}
