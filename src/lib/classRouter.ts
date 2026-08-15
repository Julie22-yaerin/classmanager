import { prisma } from "@/lib/db";
import { getAnthropicClient, CHAT_MODEL } from "@/lib/ai";

export interface ClassOption {
  id: string;
  grade: string;
  subject: string;
  teacher: { name: string; subject: string };
}

export interface ClassRouterResult {
  classId: string | null;
  needsClarification: boolean;
  reason: string;
}

/**
 * Identify which class a chat input belongs to. If the caller already
 * knows (user picked a class in the UI), this is skipped entirely.
 */
export async function identifyClass(content: string): Promise<ClassRouterResult> {
  const classes = await prisma.class.findMany({ include: { teacher: true } });

  if (classes.length === 0) {
    return { classId: null, needsClarification: true, reason: "No classes exist yet — create one first." };
  }
  if (classes.length === 1) {
    return { classId: classes[0].id, needsClarification: false, reason: "Only one class exists." };
  }

  const listing = classes
    .map((c, i) => `${i + 1}. id=${c.id} — ${c.subject} (Grade ${c.grade}), teacher ${c.teacher.name}`)
    .join("\n");

  const client = await getAnthropicClient();
  const message = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 300,
    system:
      "You route a student's message to the correct class. Reply ONLY with strict JSON: " +
      `{"classId": string|null, "confident": boolean}. classId must be one of the listed ids, or null if unclear.`,
    messages: [
      {
        role: "user",
        content: `Classes:\n${listing}\n\nStudent message:\n${content}\n\nWhich class does this belong to?`,
      },
    ],
  });

  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    return { classId: null, needsClarification: true, reason: "Could not determine the class — please pick one." };
  }

  try {
    const match = text.text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text.text) as { classId: string | null; confident: boolean };
    if (parsed.classId && parsed.confident && classes.some((c) => c.id === parsed.classId)) {
      return { classId: parsed.classId, needsClarification: false, reason: "Matched by content." };
    }
  } catch {
    // fall through to clarification
  }

  return { classId: null, needsClarification: true, reason: "Ambiguous — please pick a class." };
}
