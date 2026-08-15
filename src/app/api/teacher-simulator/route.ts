import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { generateTeacherSimulation, type GenerateTeacherSimulationInput } from "@/lib/teacherSimulator";
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

  const rate = checkRateLimit(uid, "teacher-simulator");
  if (!rate.allowed) {
    logSecurityEvent("rate_limit_exceeded", { uid, route: "teacher-simulator" });
    return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const tooLarge = requireReasonableBody(req);
  if (tooLarge) return tooLarge;

  const overQuota = await enforceQuota(idToken, uid);
  if (overQuota) return overQuota;

  try {
    const body = (await req.json()) as GenerateTeacherSimulationInput;
    if (!body.cls) return NextResponse.json({ error: "Class context is required" }, { status: 400 });

    const { simulation, usage } = await generateTeacherSimulation(body);
    await trackUsage(idToken, uid, usage);
    return NextResponse.json({ simulation });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      logSecurityEvent("missing_api_key", { uid });
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 503 });
    }
    console.error("teacher simulation failed", err);
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 });
  }
}
