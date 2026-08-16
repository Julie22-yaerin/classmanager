import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { runChatCompletion, type ChatAttachment } from "@/lib/aiChat";
import { transcribeAudio } from "@/lib/transcribe";
import { isTag, isHomeworkMode, type Mode } from "@/lib/types";
import { MissingApiKeyError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rateLimit";
import { logSecurityEvent } from "@/lib/securityLog";
import { requireReasonableBody } from "@/lib/requestGuard";
import { enforceQuota, trackUsage } from "@/lib/quota";
import type { ClassContextInput, ProfileContextInput } from "@/lib/aiContext";

const MAX_BASE64_LEN = 20 * 1024 * 1024; // ~15MB original file
const MAX_TEXT_LEN = 20000;

interface ChatRequestBody {
  cls: ClassContextInput;
  profile: ProfileContextInput | null;
  tag: string;
  content: string;
  mode: Mode;
  homeworkMode: string | null;
  attachment: ChatAttachment | null;
}

export async function POST(req: NextRequest) {
  let uid: string;
  let idToken: string;
  try {
    ({ uid, idToken } = await verifyIdToken(req.headers.get("authorization")));
  } catch (err) {
    if (err instanceof InvalidAuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }

  const rate = checkRateLimit(uid, "chat");
  if (!rate.allowed) {
    logSecurityEvent("rate_limit_exceeded", { uid, route: "chat" });
    return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const tooLarge = requireReasonableBody(req);
  if (tooLarge) return tooLarge;

  const overQuota = await enforceQuota(idToken, uid);
  if (overQuota) return overQuota;

  try {
    const body = (await req.json()) as ChatRequestBody;
    if (!isTag(body.tag)) {
      return NextResponse.json({ error: "A valid tag is required" }, { status: 400 });
    }
    const content = (typeof body.content === "string" ? body.content : "").slice(0, MAX_TEXT_LEN);
    const mode: Mode = body.mode === "exam" ? "exam" : "daily";
    const attachment = body.attachment ?? null;
    const homeworkMode = isHomeworkMode(body.homeworkMode) ? body.homeworkMode : null;

    if (!content.trim() && !attachment) {
      return NextResponse.json({ error: "Provide text or an attachment" }, { status: 400 });
    }
    if (attachment) {
      if (attachment.base64.length > MAX_BASE64_LEN) {
        return NextResponse.json({ error: "File too large (max ~15MB)" }, { status: 413 });
      }
      if (!isAllowedMimeType(attachment.sourceType, attachment.mimeType)) {
        logSecurityEvent("rejected_upload_type", { uid, mimeType: attachment.mimeType });
        return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
      }
    }
    if (!body.cls) {
      return NextResponse.json({ error: "Class context is required" }, { status: 400 });
    }

    let transcript: string | null = null;
    if (attachment?.sourceType === "audio") {
      transcript = await transcribeAudio(attachment);
      if (!transcript && !content.trim()) {
        return NextResponse.json({
          reply:
            "I saved the recording, but couldn't transcribe it automatically right now. Paste the transcript (or your " +
            "own notes from the recording) as text with the same Class Recording tag and I'll process it.",
          topic: null,
          memory_updates: null,
          deadlines: null,
          exam_analysis: null,
          evidence_signals: null,
          reference_suggestions: null,
          usedTranscript: null,
          skippedProcessing: true,
        });
      }
    }

    const result = await runChatCompletion({
      cls: body.cls,
      profile: body.profile ?? null,
      tag: body.tag,
      content,
      mode,
      homeworkMode,
      attachment,
      transcript,
    });

    await trackUsage(idToken, uid, result.usage);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      logSecurityEvent("missing_api_key", { uid });
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 503 });
    }
    console.error("chat processing failed", err);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  pdf: ["application/pdf"],
  // Only wav/mp3 are transcribable (the perception model's input_audio format is limited to these).
  audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav"],
};

function isAllowedMimeType(sourceType: string, mimeType: string): boolean {
  return ALLOWED_MIME_TYPES[sourceType]?.includes(mimeType) ?? false;
}
