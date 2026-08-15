import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { generateDailyPlan, type DailyInputItem } from "@/lib/dailyMode";
import { MissingApiKeyError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rateLimit";
import { logSecurityEvent } from "@/lib/securityLog";
import { requireReasonableBody } from "@/lib/requestGuard";
import type { ProfileContextInput } from "@/lib/aiContext";

interface Body {
  items: DailyInputItem[];
  profile: ProfileContextInput | null;
}

export async function POST(req: NextRequest) {
  let uid: string;
  try {
    uid = await verifyIdToken(req.headers.get("authorization"));
  } catch (err) {
    if (err instanceof InvalidAuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }

  const rate = checkRateLimit(uid, "daily-mode");
  if (!rate.allowed) {
    logSecurityEvent("rate_limit_exceeded", { uid, route: "daily-mode" });
    return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const tooLarge = requireReasonableBody(req);
  if (tooLarge) return tooLarge;

  try {
    const body = (await req.json()) as Body;
    const plan = await generateDailyPlan(body.items ?? [], body.profile ?? null);
    return NextResponse.json({ plan });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      logSecurityEvent("missing_api_key", { uid });
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 503 });
    }
    console.error("daily plan generation failed", err);
    return NextResponse.json({ error: "Failed to generate daily plan" }, { status: 500 });
  }
}
