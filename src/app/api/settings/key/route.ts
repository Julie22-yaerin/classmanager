import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_KEY_COOKIE, getApiKey } from "@/lib/ai";
import { OPENAI_KEY_COOKIE, getOpenAiKey } from "@/lib/transcribe";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function GET() {
  const [anthropicKey, openaiKey] = await Promise.all([getApiKey(), getOpenAiKey()]);
  return NextResponse.json({
    anthropicKeySet: Boolean(anthropicKey),
    openaiKeySet: Boolean(openaiKey),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const store = await cookies();

  if (typeof body.anthropicKey === "string" && body.anthropicKey.trim()) {
    store.set(API_KEY_COOKIE, body.anthropicKey.trim(), COOKIE_OPTS);
  }
  if (typeof body.openaiKey === "string" && body.openaiKey.trim()) {
    store.set(OPENAI_KEY_COOKIE, body.openaiKey.trim(), COOKIE_OPTS);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { key } = (await req.json().catch(() => ({ key: "all" }))) as { key?: string };
  const store = await cookies();
  if (key === "openai") {
    store.delete(OPENAI_KEY_COOKIE);
  } else if (key === "anthropic") {
    store.delete(API_KEY_COOKIE);
  } else {
    store.delete(API_KEY_COOKIE);
    store.delete(OPENAI_KEY_COOKIE);
  }
  return NextResponse.json({ ok: true });
}
