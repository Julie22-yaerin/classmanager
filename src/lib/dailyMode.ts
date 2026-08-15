import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CHAT_MODEL } from "@/lib/ai";
import { buildStudentProfileContext, type ProfileContextInput } from "@/lib/aiContext";

function itemSchema() {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      className: { type: "string" },
      reason: { type: "string" },
      estimated_minutes: { type: "integer" },
      sourceId: { type: "string", description: "The id of the source deadline/material item, if this came from the input list." },
    },
    required: ["title", "className", "reason", "estimated_minutes"],
  };
}

const DAILY_TOOL: Anthropic.Tool = {
  name: "daily_plan",
  description: "Today's schoolwork triaged into Must / Should / Can Ignore, each with an estimated time.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "One or two sentences: what does the student actually need to do today." },
      must: { type: "array", items: itemSchema() },
      should: { type: "array", items: itemSchema() },
      can_ignore: { type: "array", items: itemSchema() },
    },
    required: ["summary", "must", "should", "can_ignore"],
  },
};

export interface DailyPlanItem {
  title: string;
  className: string;
  reason: string;
  estimated_minutes: number;
  sourceId?: string;
}

export interface DailyPlanOutput {
  summary: string;
  must: DailyPlanItem[];
  should: DailyPlanItem[];
  can_ignore: DailyPlanItem[];
}

export interface DailyInputItem {
  id: string;
  kind: "deadline" | "homework";
  title: string;
  className: string;
  teacherName: string;
  dueDate: string | null;
  notes: string | null;
}

export async function generateDailyPlan(items: DailyInputItem[], profile: ProfileContextInput | null): Promise<DailyPlanOutput> {
  const system = [
    "You triage a student's outstanding schoolwork across all their classes into Must / Should / Can Ignore for TODAY, " +
      "each with a realistic estimated time in minutes. Goal: minimize wasted academic effort — be decisive, not exhaustive.",
    "Must = has a real deadline soon or blocks something else. Should = worth doing but not urgent. Can Ignore = low value right now or no real deadline.",
    "Always respond by calling the `daily_plan` tool.",
    "\n--- Student profile ---",
    buildStudentProfileContext(profile),
  ].join("\n");

  const today = new Date().toISOString().slice(0, 10);
  const listing =
    items
      .map((i) => `- id=${i.id} [${i.kind}] "${i.title}" — ${i.className} (${i.teacherName})${i.dueDate ? `, due ${i.dueDate}` : ", no due date"}${i.notes ? ` — ${i.notes}` : ""}`)
      .join("\n") || "(nothing outstanding)";

  const userContent = `Today's date: ${today}\n\nOutstanding items:\n${listing}\n\nTriage these into today's plan.`;

  const client = await getAnthropicClient();
  const message = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 2048,
    system,
    tools: [DAILY_TOOL],
    tool_choice: { type: "tool", name: "daily_plan" },
    messages: [{ role: "user", content: userContent }],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Model did not return a structured daily plan.");
  }
  return toolUse.input as DailyPlanOutput;
}
