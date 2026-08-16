import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { generateCurriculumGraph, NoCurriculumSignalError, type GenerateCurriculumGraphInput } from "@/lib/curriculumGraph";
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

  const rate = checkRateLimit(uid, "curriculum-graph");
  if (!rate.allowed) {
    logSecurityEvent("rate_limit_exceeded", { uid, route: "curriculum-graph" });
    return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const tooLarge = requireReasonableBody(req);
  if (tooLarge) return tooLarge;

  const overQuota = await enforceQuota(idToken, uid);
  if (overQuota) return overQuota;

  try {
    const body = (await req.json()) as GenerateCurriculumGraphInput;
    if (!body.cls) return NextResponse.json({ error: "Class context is required" }, { status: 400 });

    const { graph, usage } = await generateCurriculumGraph(body);
    await trackUsage(idToken, uid, usage);
    return NextResponse.json({ graph });
  } catch (err) {
    if (err instanceof NoCurriculumSignalError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof MissingApiKeyError) {
      logSecurityEvent("missing_api_key", { uid });
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 503 });
    }
    console.error("curriculum graph generation failed", err);
    return NextResponse.json({ error: "Failed to generate curriculum graph" }, { status: 500 });
  }
}
