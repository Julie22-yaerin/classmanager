import { prisma } from "@/lib/db";
import { getAnthropicClient, CHAT_MODEL } from "@/lib/ai";
import { buildClassMemoryContext, buildStudentProfileContext, getSingletonStudentProfile } from "@/lib/memory";
import type Anthropic from "@anthropic-ai/sdk";

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

export async function generateExamReport(classId: string): Promise<ExamReportOutput> {
  const cls = await prisma.class.findUniqueOrThrow({ where: { id: classId }, include: { teacher: true } });
  const materials = await prisma.material.findMany({ where: { classId }, orderBy: { createdAt: "desc" }, take: 60 });
  const profile = await getSingletonStudentProfile();

  const pastExams = materials.filter((m) => m.tag === "PastExam");
  const homework = materials.filter((m) => m.tag === "Homework");
  const otherMaterials = materials.filter((m) => !["PastExam", "Homework"].includes(m.tag));

  const summarize = (items: typeof materials) =>
    items
      .map((m) => `- [${m.tag}] topic=${m.topic ?? "?"} :: ${(m.extractedText ?? m.rawContent ?? "").slice(0, 400)}${m.analysis ? ` :: analysis=${m.analysis}` : ""}`)
      .join("\n") || "(none yet)";

  const system = [
    "You generate exam-prep intelligence for one class, combining everything accumulated about it so far.",
    "Never claim certainty about future exam questions — priorities and patterns are informed guesses, say so.",
    "Always respond by calling the `exam_report` tool.",
    "\n--- Class memory ---",
    buildClassMemoryContext(cls),
    "\n--- Student profile ---",
    buildStudentProfileContext(profile),
  ].join("\n");

  const userContent = [
    `Past exams (${pastExams.length}):\n${summarize(pastExams)}`,
    `Homework history (${homework.length}):\n${summarize(homework)}`,
    `Other materials/notes (${otherMaterials.length}):\n${summarize(otherMaterials)}`,
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
  const output = toolUse.input as ExamReportOutput;

  await prisma.examReport.create({
    data: {
      classId,
      topicPriority: JSON.stringify(output.topic_priority),
      patternAnalysis: output.question_pattern_analysis,
      markDistribution: JSON.stringify(output.mark_distribution),
      weakAreas: JSON.stringify(output.weak_areas),
      mockExam: output.mock_exam,
      reviewSheet: output.review_sheet,
    },
  });

  if (output.topic_priority.length) {
    await prisma.class.update({
      where: { id: classId },
      data: { topicPriorities: JSON.stringify(output.topic_priority) },
    });
  }

  return output;
}
