import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { generateTeacherPlaybook, type GeneratePlaybookInput } from "@/lib/teacherPlaybook";
import { MissingApiKeyError } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    await verifyIdToken(req.headers.get("authorization"));
    const body = (await req.json()) as GeneratePlaybookInput;
    if (!body.cls) return NextResponse.json({ error: "Class context is required" }, { status: 400 });

    const playbook = await generateTeacherPlaybook(body);
    return NextResponse.json({ playbook });
  } catch (err) {
    if (err instanceof InvalidAuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 401 });
    }
    console.error("teacher playbook generation failed", err);
    return NextResponse.json({ error: "Failed to generate teacher playbook" }, { status: 500 });
  }
}
