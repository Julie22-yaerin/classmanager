import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, InvalidAuthError } from "@/lib/verifyIdToken";
import { runChatCompletion, type ChatAttachment } from "@/lib/aiChat";
import { transcribeAudio } from "@/lib/transcribe";
import { isTag, isHomeworkMode, type Mode } from "@/lib/types";
import { MissingApiKeyError } from "@/lib/ai";
import type { ClassContextInput, ProfileContextInput } from "@/lib/aiContext";

const MAX_BASE64_LEN = 20 * 1024 * 1024; // ~15MB original file

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
  try {
    await verifyIdToken(req.headers.get("authorization"));

    const body = (await req.json()) as ChatRequestBody;
    if (!isTag(body.tag)) {
      return NextResponse.json({ error: "A valid tag is required" }, { status: 400 });
    }
    const content = typeof body.content === "string" ? body.content : "";
    const mode: Mode = body.mode === "exam" ? "exam" : "daily";
    const attachment = body.attachment ?? null;
    const homeworkMode = isHomeworkMode(body.homeworkMode) ? body.homeworkMode : null;

    if (!content.trim() && !attachment) {
      return NextResponse.json({ error: "Provide text or an attachment" }, { status: 400 });
    }
    if (attachment && attachment.base64.length > MAX_BASE64_LEN) {
      return NextResponse.json({ error: "File too large (max ~15MB)" }, { status: 413 });
    }
    if (!body.cls) {
      return NextResponse.json({ error: "Class context is required" }, { status: 400 });
    }

    let transcript: string | null = null;
    if (attachment?.sourceType === "audio") {
      transcript = await transcribeAudio(Buffer.from(attachment.base64, "base64"), attachment.fileName, attachment.mimeType);
      if (!transcript && !content.trim()) {
        return NextResponse.json({
          reply:
            "I saved the recording, but no transcription key is configured (Settings → OpenAI API key) so I can't listen to it automatically. " +
            "Paste the transcript (or your own notes from the recording) as text with the same Class Recording tag and I'll process it.",
          topic: null,
          memory_updates: null,
          deadlines: null,
          exam_analysis: null,
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

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InvalidAuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 401 });
    }
    console.error("chat processing failed", err);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
