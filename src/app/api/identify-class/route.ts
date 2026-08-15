import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { identifyClass, type RoutableClass } from "@/lib/classRouter";
import { MissingApiKeyError } from "@/lib/ai";

interface Body {
  content: string;
  classes: RoutableClass[];
}

export async function POST(req: NextRequest) {
  try {
    await verifyIdToken(req.headers.get("authorization"));
    const body = (await req.json()) as Body;
    const result = await identifyClass(body.content ?? "", body.classes ?? []);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InvalidAuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 401 });
    }
    console.error("identify-class failed", err);
    return NextResponse.json({ error: "Failed to identify class" }, { status: 500 });
  }
}
