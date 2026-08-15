import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isTag, type Mode } from "@/lib/types";
import { identifyClass } from "@/lib/classRouter";
import { processMessage, type Attachment } from "@/lib/processors";
import { MissingApiKeyError } from "@/lib/ai";

const MAX_BASE64_LEN = 20 * 1024 * 1024; // ~15MB original file

interface ChatRequestBody {
  tag: string;
  content: string;
  classId: string | null;
  mode: Mode;
  attachment: Attachment | null;
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isTag(body.tag)) {
    return NextResponse.json({ error: "A valid tag is required" }, { status: 400 });
  }
  const content = typeof body.content === "string" ? body.content : "";
  const mode: Mode = body.mode === "exam" ? "exam" : "daily";
  const attachment = body.attachment ?? null;

  if (!content.trim() && !attachment) {
    return NextResponse.json({ error: "Provide text or an attachment" }, { status: 400 });
  }
  if (attachment && attachment.base64.length > MAX_BASE64_LEN) {
    return NextResponse.json({ error: "File too large (max ~15MB)" }, { status: 413 });
  }

  try {
    let classId = body.classId;
    if (!classId) {
      const routed = await identifyClass(content || `[${attachment?.sourceType ?? "file"} attachment: ${attachment?.fileName ?? ""}]`);
      if (routed.needsClarification || !routed.classId) {
        const classes = await prisma.class.findMany({ include: { teacher: true }, orderBy: { createdAt: "asc" } });
        return NextResponse.json({
          needsClassSelection: true,
          reason: routed.reason,
          classes,
        });
      }
      classId = routed.classId;
    }

    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const userMessage = await prisma.chatMessage.create({
      data: {
        classId,
        role: "user",
        tag: body.tag,
        mode,
        content,
        fileName: attachment?.fileName ?? null,
      },
    });

    const result = await processMessage({ classId, tag: body.tag, content, mode, attachment });

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        classId,
        role: "assistant",
        mode,
        content: result.reply,
        materialId: result.materialId,
      },
    });

    return NextResponse.json({
      classId,
      userMessage,
      assistantMessage,
      topic: result.topic,
    });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message, code: "MISSING_API_KEY" }, { status: 401 });
    }
    console.error("chat processing failed", err);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get("classId");
  const messages = await prisma.chatMessage.findMany({
    where: classId ? { classId } : undefined,
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return NextResponse.json({ messages });
}
