import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CHAT_MODEL } from "@/lib/ai";
import { buildClassMemoryContext, buildStudentProfileContext, type ClassContextInput, type ProfileContextInput } from "@/lib/aiContext";

const EXAM_REPORT_TOOL: Anthropic.Tool = {
  name: "exam_report",
  description: "Structured exam-prep report synthesized from everything known about this class.",
  input_schema: {
    type: "object",
    properties: {
      topic_priority: {
        type: "array",
        items: {
          type: "object",
          properties: {
            topic: { type: "string" },
            weight: { type: "integer", minimum: 1, maximum: 5 },
            reason: { type: "string" },
          },
          required: ["topic", "weight", "reason"],
        },
      },
      question_pattern_analysis: { type: "string" },
      mark_distribution: {
        type: "array",
        items: {
          type: "object",
          properties: { topic: { type: "string" }, estimated_percent: { type: "number" } },
          required: ["topic", "estimated_percent"],
        },
      },
      weak_areas: {
        type: "array",
        items: {
          type: "object",
          properties: { topic: { type: "string" }, evidence: { type: "string" } },
          required: ["topic", "evidence"],
        },
      },
      mock_exam: { type: "string", description: "A full mock exam in markdown, matching this teacher's style." },
      review_sheet: { type: "string", description: "A rapid-review / memory sheet in markdown." },
      caveat: { type: "string", description: "Reminder that this is not a guarantee of actual exam content." },
    },
    required: [
      "topic_priority",
      "question_pattern_analysis",
      "mark_distribution",
      "weak_areas",
      "mock_exam",
      "review_sheet",
      "caveat",
    ],
  },
};

export interface ExamReportOutput {
  topic_priority: { topic: string; weight: number; reason: string }[];
  question_pattern_analysis: string;
  mark_distribution: { topic: string; estimated_percent: number }[];
  weak_areas: { topic: string; evidence: string }[];
  mock_exam: string;
  review_sheet: string;
  caveat: string;
}

export interface MaterialSummary {
  tag: string;
  topic: string | null;
  excerpt: string;
  analysis: string | null;
}

export interface GenerateExamReportInput {
  cls: ClassContextInput;
  profile: ProfileContextInput | null;
  pastExams: MaterialSummary[];
  homework: MaterialSummary[];
  otherMaterials: MaterialSummary[];
}

function summarize(items: MaterialSummary[]): string {
  return (
    items.map((m) => `- [${m.tag}] topic=${m.topic ?? "?"} :: ${m.excerpt.slice(0, 400)}${m.analysis ? ` :: analysis=${m.analysis}` : ""}`).join("\n") ||
    "(none yet)"
  );
}

export async function generateExamReport(input: GenerateExamReportInput): Promise<ExamReportOutput> {
  const system = [
    "You generate exam-prep intelligence for one class, combining everything accumulated about it so far.",
    "Never claim certainty about future exam questions — priorities and patterns are informed guesses, say so.",
    "Always respond by calling the `exam_report` tool.",
    "\n--- Class memory ---",
    buildClassMemoryContext(input.cls),
    "\n--- Student profile ---",
    buildStudentProfileContext(input.profile),
  ].join("\n");

  const userContent = [
    `Past exams (${input.pastExams.length}):\n${summarize(input.pastExams)}`,
    `Homework history (${input.homework.length}):\n${summarize(input.homework)}`,
    `Other materials/notes (${input.otherMaterials.length}):\n${summarize(input.otherMaterials)}`,
    "\nProduce: topic priority ranking, question-pattern analysis, estimated mark distribution, weak-area detection, a full mock exam matching this teacher's style, and a rapid review/memory sheet.",
  ].join("\n\n");

  const client = await getAnthropicClient();
  const message = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 4096,
    system,
    tools: [EXAM_REPORT_TOOL],
    tool_choice: { type: "tool", name: "exam_report" },
    messages: [{ role: "user", content: userContent }],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Model did not return a structured exam report.");
  }
  return toolUse.input as ExamReportOutput;
}
