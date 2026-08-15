import { getMainClient, MAIN_MODEL } from "@/lib/ai";
import type { TokenUsage } from "@/lib/harness";

export interface RoutableClass {
  id: string;
  subject: string;
  grade: string;
  teacherName: string;
}

export interface ClassRouterResult {
  classId: string | null;
  needsClarification: boolean;
  reason: string;
  usage: TokenUsage;
}

/**
 * Identify which class a chat input belongs to, given the caller's list of
 * classes (loaded client-side from Firestore). Pure — no DB access here.
 */
export async function identifyClass(content: string, classes: RoutableClass[]): Promise<ClassRouterResult> {
  const zeroUsage: TokenUsage = { promptTokens: 0, completionTokens: 0 };

  if (classes.length === 0) {
    return { classId: null, needsClarification: true, reason: "No classes exist yet — create one first.", usage: zeroUsage };
  }
  if (classes.length === 1) {
    return { classId: classes[0].id, needsClarification: false, reason: "Only one class exists.", usage: zeroUsage };
  }

  const listing = classes
    .map((c, i) => `${i + 1}. id=${c.id} — ${c.subject} (Grade ${c.grade}), teacher ${c.teacherName}`)
    .join("\n");

  const client = getMainClient();
  const completion = await client.chat.completions.create({
    model: MAIN_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You route a student's message to the correct class. Reply ONLY with strict JSON: " +
          `{"classId": string|null, "confident": boolean}. classId must be one of the listed ids, or null if unclear.`,
      },
      {
        role: "user",
        content: `Classes:\n${listing}\n\nStudent message:\n${content}\n\nWhich class does this belong to?`,
      },
    ],
  });

  const usage: TokenUsage = {
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
  };

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    return { classId: null, needsClarification: true, reason: "Could not determine the class — please pick one.", usage };
  }

  try {
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text) as { classId: string | null; confident: boolean };
    if (parsed.classId && parsed.confident && classes.some((c) => c.id === parsed.classId)) {
      return { classId: parsed.classId, needsClarification: false, reason: "Matched by content.", usage };
    }
  } catch {
    // fall through to clarification
  }

  return { classId: null, needsClarification: true, reason: "Ambiguous — please pick a class.", usage };
}
