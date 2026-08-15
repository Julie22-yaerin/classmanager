import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { getAnthropicClient, CHAT_MODEL } from "@/lib/ai";
import { RESPOND_TOOL, extractRespondToolInput } from "@/lib/respondTool";
import { buildClassMemoryContext, buildStudentProfileContext, applyMemoryUpdates, applyDeadlines, getSingletonStudentProfile } from "@/lib/memory";
import { transcribeAudio } from "@/lib/transcribe";
import { TAG_INSTRUCTIONS, tagSourceForDeadlines } from "@/lib/processors/instructions";
import type { Mode, SourceType, Tag } from "@/lib/types";

export interface Attachment {
  fileName: string;
  mimeType: string;
  base64: string;
  sourceType: SourceType;
}

export interface ProcessMessageInput {
  classId: string;
  tag: Tag;
  content: string;
  mode: Mode;
  attachment: Attachment | null;
}

export interface ProcessMessageResult {
  reply: string;
  topic: string | null;
  materialId: string;
}

const MODE_FRAMING: Record<Mode, string> = {
  daily:
    "Daily Mode: help with the immediate task in front of the student — homework, notes, deadlines, or a quick question. " +
    "Minimize wasted effort; be direct and practical.",
  exam:
    "Exam Mode: frame the answer with exam prep in mind. Connect this input to topic priorities and known weak areas where relevant. " +
    "Never claim certainty about what will actually appear on a future exam.",
};

export async function processMessage(input: ProcessMessageInput): Promise<ProcessMessageResult> {
  const cls = await prisma.class.findUniqueOrThrow({
    where: { id: input.classId },
    include: { teacher: true },
  });
  const profile = await getSingletonStudentProfile();

  let effectiveContent = input.content;
  let extractedText: string | null = null;

  if (input.attachment?.sourceType === "audio") {
    const transcript = await transcribeAudio(
      Buffer.from(input.attachment.base64, "base64"),
      input.attachment.fileName,
      input.attachment.mimeType,
    );
    if (transcript) {
      extractedText = transcript;
      effectiveContent = input.content ? `${input.content}\n\nTranscript:\n${transcript}` : transcript;
    } else if (!input.content.trim()) {
      const material = await prisma.material.create({
        data: {
          classId: input.classId,
          tag: input.tag,
          sourceType: "audio",
          fileName: input.attachment.fileName,
          mimeType: input.attachment.mimeType,
          fileData: input.attachment.base64,
        },
      });
      return {
        reply:
          "I saved the recording, but no transcription key is configured (Settings → OpenAI API key) so I can't listen to it automatically. " +
          "Paste the transcript (or your own notes from the recording) as text with the same Class Recording tag and I'll process it.",
        topic: null,
        materialId: material.id,
      };
    }
  }

  const systemPrompt = [
    "You are the class-specific AI inside a school assistant. Every reply must be grounded in the class memory and student " +
      "profile below — this is what makes the AI feel like it actually knows this student's teachers and classes.",
    MODE_FRAMING[input.mode],
    TAG_INSTRUCTIONS[input.tag],
    "\n--- Class memory ---",
    buildClassMemoryContext(cls),
    "\n--- Student profile ---",
    buildStudentProfileContext(profile),
    "\nAlways respond by calling the `respond` tool.",
  ].join("\n");

  const contentBlocks: Anthropic.ContentBlockParam[] = [];
  if (effectiveContent.trim()) {
    contentBlocks.push({ type: "text", text: effectiveContent });
  }
  if (input.attachment && input.attachment.sourceType === "image") {
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: input.attachment.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: input.attachment.base64,
      },
    });
  } else if (input.attachment && input.attachment.sourceType === "pdf") {
    contentBlocks.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: input.attachment.base64 },
    });
  }
  if (contentBlocks.length === 0) {
    contentBlocks.push({ type: "text", text: "(no content provided)" });
  }

  const client = await getAnthropicClient();
  const message = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    tools: [RESPOND_TOOL],
    tool_choice: { type: "tool", name: "respond" },
    messages: [{ role: "user", content: contentBlocks }],
  });

  const result = extractRespondToolInput(message);

  const material = await prisma.material.create({
    data: {
      classId: input.classId,
      tag: input.tag,
      sourceType: input.attachment?.sourceType ?? "text",
      rawContent: input.content || null,
      extractedText,
      topic: result.topic,
      analysis: result.exam_analysis ? JSON.stringify(result.exam_analysis) : null,
      fileName: input.attachment?.fileName ?? null,
      mimeType: input.attachment?.mimeType ?? null,
      fileData: input.attachment?.base64 ?? null,
    },
  });

  await applyMemoryUpdates(input.classId, result.memory_updates);
  await applyDeadlines(input.classId, result.deadlines, tagSourceForDeadlines(input.tag));

  return { reply: result.reply, topic: result.topic, materialId: material.id };
}
