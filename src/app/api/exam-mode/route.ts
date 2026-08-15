import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { generateExamReport, type GenerateExamReportInput } from "@/lib/examMode";
import { MissingApiKeyError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rateLimit";
import { logSecurityEvent } from "@/lib/securityLog";
import { requireReasonableBody } from "@/lib/requestGuard";

export async function POST(req: NextRequest) {
  let uid: string;
  try {
    uid = await verifyIdToken(req.headers.get("authorization"));
  } catch (err) {
    if (err instanceof InvalidAuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }

  const rate = checkRateLimit(uid, "exam-mode");
  if (!rate.allowed) {
    logSecurityEvent("rate_limit_exceeded", { uid, route: "exam-mode" });
    return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const tooLarge = requireReasonableBody(req);
  if (tooLarge) return tooLarge;

  try {
    const body = (await req.json()) as GenerateExamReportInput;
    if (!body.cls) return NextResponse.json({ error: "Class context is required" }, { status: 400 });

    const report = await generateExamReport(body);
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      logSecurityEvent("missing_api_key", { uid });
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 503 });
    }
    console.error("exam report generation failed", err);
    return NextResponse.json({ error: "Failed to generate exam report" }, { status: 500 });
  }
}
