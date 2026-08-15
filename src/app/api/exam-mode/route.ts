import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { generateExamReport, type GenerateExamReportInput } from "@/lib/examMode";
import { MissingApiKeyError } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    await verifyIdToken(req.headers.get("authorization"));
    const body = (await req.json()) as GenerateExamReportInput;
    if (!body.cls) return NextResponse.json({ error: "Class context is required" }, { status: 400 });

    const report = await generateExamReport(body);
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof InvalidAuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 401 });
    }
    console.error("exam report generation failed", err);
    return NextResponse.json({ error: "Failed to generate exam report" }, { status: 500 });
  }
}
