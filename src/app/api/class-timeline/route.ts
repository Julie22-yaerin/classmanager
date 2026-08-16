import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { generateClassTimeline, NoTranscriptError, type GenerateClassTimelineInput } from "@/lib/classTimeline";
import { MissingApiKeyError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rateLimit";
import { logSecurityEvent } from "@/lib/securityLog";
import { requireReasonableBody } from "@/lib/requestGuard";
import { enforceQuota, trackUsage } from "@/lib/quota";

export async function POST(req: NextRequest) {
  let uid: string;
  let idToken: string;
  try {
    ({ uid, idToken } = await verifyIdToken(req.headers.get("authorization")));
  } catch (err) {
    if (err instanceof InvalidAuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }

  const rate = checkRateLimit(uid, "class-timeline");
  if (!rate.allowed) {
    logSecurityEvent("rate_limit_exceeded", { uid, route: "class-timeline" });
    return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const tooLarge = requireReasonableBody(req);
  if (tooLarge) return tooLarge;

  const overQuota = await enforceQuota(idToken, uid);
  if (overQuota) return overQuota;

  try {
    const body = (await req.json()) as GenerateClassTimelineInput;
    if (!body.cls) return NextResponse.json({ error: "Class context is required" }, { status: 400 });

    const { timeline, usage } = await generateClassTimeline(body);
    await trackUsage(idToken, uid, usage);
    return NextResponse.json({ timeline });
  } catch (err) {
    if (err instanceof NoTranscriptError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof MissingApiKeyError) {
      logSecurityEvent("missing_api_key", { uid });
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 503 });
    }
    console.error("class timeline generation failed", err);
    return NextResponse.json({ error: "Failed to generate class timeline" }, { status: 500 });
  }
}
