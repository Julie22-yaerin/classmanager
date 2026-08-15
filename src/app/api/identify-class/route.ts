import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { identifyClass, type RoutableClass } from "@/lib/classRouter";
import { MissingApiKeyError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rateLimit";
import { logSecurityEvent } from "@/lib/securityLog";
import { requireReasonableBody } from "@/lib/requestGuard";

interface Body {
  content: string;
  classes: RoutableClass[];
}

export async function POST(req: NextRequest) {
  let uid: string;
  try {
    uid = await verifyIdToken(req.headers.get("authorization"));
  } catch (err) {
    if (err instanceof InvalidAuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }

  const rate = checkRateLimit(uid, "identify-class");
  if (!rate.allowed) {
    logSecurityEvent("rate_limit_exceeded", { uid, route: "identify-class" });
    return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const tooLarge = requireReasonableBody(req);
  if (tooLarge) return tooLarge;

  try {
    const body = (await req.json()) as Body;
    const result = await identifyClass((body.content ?? "").slice(0, 2000), body.classes ?? []);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      logSecurityEvent("missing_api_key", { uid });
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 503 });
    }
    console.error("identify-class failed", err);
    return NextResponse.json({ error: "Failed to identify class" }, { status: 500 });
  }
}
