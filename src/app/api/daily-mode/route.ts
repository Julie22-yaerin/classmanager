import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { generateDailyPlan, type DailyInputItem } from "@/lib/dailyMode";
import { MissingApiKeyError } from "@/lib/ai";
import type { ProfileContextInput } from "@/lib/aiContext";

interface Body {
  items: DailyInputItem[];
  profile: ProfileContextInput | null;
}

export async function POST(req: NextRequest) {
  try {
    await verifyIdToken(req.headers.get("authorization"));
    const body = (await req.json()) as Body;
    const plan = await generateDailyPlan(body.items ?? [], body.profile ?? null);
    return NextResponse.json({ plan });
  } catch (err) {
    if (err instanceof InvalidAuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 401 });
    }
    console.error("daily plan generation failed", err);
    return NextResponse.json({ error: "Failed to generate daily plan" }, { status: 500 });
  }
}
