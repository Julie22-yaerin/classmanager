import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CHAT_MODEL } from "@/lib/ai";
import { RESPOND_TOOL, extractRespondToolInput, type RespondToolInput } from "@/lib/respondTool";
import { buildClassMemoryContext, buildStudentProfileContext, type ClassContextInput, type ProfileContextInput } from "@/lib/aiContext";
import { TAG_INSTRUCTIONS } from "@/lib/processors/instructions";
import { HOMEWORK_MODE_INSTRUCTIONS, type HomeworkMode, type Mode, type SourceType, type Tag } from "@/lib/types";

export interface ChatAttachment {
  fileName: string;
  mimeType: string;
  base64: string;
  sourceType: SourceType;
}

export interface RunChatInput {
  cls: ClassContextInput;
  profile: ProfileContextInput | null;
  tag: Tag;
  content: string;
  mode: Mode;
  homeworkMode: HomeworkMode | null;
  attachment: ChatAttachment | null;
  transcript: string | null; // pre-transcribed audio text, if any
}

export interface RunChatResult extends RespondToolInput {
  usedTranscript: string | null;
}

const MODE_FRAMING: Record<Mode, string> = {
  daily:
    "Daily Mode: help with the immediate task in front of the student — homework, notes, deadlines, or a quick question. " +
    "Minimize wasted effort; be direct and practical.",
  exam:
    "Exam Mode: frame the answer with exam prep in mind. Connect this input to topic priorities and known weak areas where relevant. " +
    "Never claim certainty about what will actually appear on a future exam.",
};

export async function runChatCompletion(input: RunChatInput): Promise<RunChatResult> {
  let effectiveContent = input.content;
  if (input.transcript) {
    effectiveContent = input.content ? `${input.content}\n\nTranscript:\n${input.transcript}` : input.transcript;
  }

  const instructionParts = [TAG_INSTRUCTIONS[input.tag]];
  if (input.tag === "Homework" && input.homeworkMode) {
    instructionParts.push(`Homework mode selected: ${HOMEWORK_MODE_INSTRUCTIONS[input.homeworkMode]}`);
  }

  const systemPrompt = [
    "You are the class-specific AI inside a school assistant. Every reply must be grounded in the class memory and student " +
      "profile below — this is what makes the AI feel like it actually knows this student's teachers and classes.",
    MODE_FRAMING[input.mode],
    ...instructionParts,
    "\n--- Class memory ---",
    buildClassMemoryContext(input.cls),
    "\n--- Student profile ---",
    buildStudentProfileContext(input.profile),
    "\nAlways respond by calling the `respond` tool.",
  ].join("\n");

  const contentBlocks: Anthropic.ContentBlockParam[] = [];
  if (effectiveContent.trim()) {
    contentBlocks.push({ type: "text", text: effectiveContent });
  }
  if (input.attachment?.sourceType === "image") {
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: input.attachment.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: input.attachment.base64,
      },
    });
  } else if (input.attachment?.sourceType === "pdf") {
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
  return { ...result, usedTranscript: input.transcript };
}
