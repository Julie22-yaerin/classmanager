import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { generatePatternReport, NoPastExamsError, type GeneratePatternReportInput } from "@/lib/patternFinder";
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

  const rate = checkRateLimit(uid, "pattern-finder");
  if (!rate.allowed) {
    logSecurityEvent("rate_limit_exceeded", { uid, route: "pattern-finder" });
    return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const tooLarge = requireReasonableBody(req);
  if (tooLarge) return tooLarge;

  const overQuota = await enforceQuota(idToken, uid);
  if (overQuota) return overQuota;

  try {
    const body = (await req.json()) as GeneratePatternReportInput;
    if (!body.cls) return NextResponse.json({ error: "Class context is required" }, { status: 400 });

    const { report, usage } = await generatePatternReport(body);
    await trackUsage(idToken, uid, usage);
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof NoPastExamsError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof MissingApiKeyError) {
      logSecurityEvent("missing_api_key", { uid });
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 503 });
    }
    console.error("pattern report generation failed", err);
    return NextResponse.json({ error: "Failed to generate pattern report" }, { status: 500 });
  }
}
