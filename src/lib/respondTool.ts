import type OpenAI from "openai";

/**
 * Every tag processor asks the model for the same shaped output via a
 * forced tool call, so memory updates / deadlines / exam analysis are
 * structured instead of scraped out of prose.
 */
export const RESPOND_TOOL: OpenAI.Chat.Completions.ChatCompletionFunctionTool = {
  type: "function",
  function: {
    name: "respond",
    description: "Return the chat reply plus any structured updates to class memory that this input justifies.",
    parameters: {
      type: "object",
      properties: {
        reply: {
          type: "string",
          description: "The message to show the student in chat.",
        },
        topic: {
          type: ["string", "null"],
          description: "Primary topic this input relates to, if identifiable.",
        },
        memory_updates: {
          type: ["object", "null"],
          description: "Fields to merge into this class's persistent memory. Omit/null any field that isn't newly learned.",
          properties: {
            curriculum_note: { type: ["string", "null"], description: "New sentence(s) to append to the running curriculum summary." },
            teacher_persona: { type: ["string", "null"], description: "Updated read on the teacher's persona/expectations." },
            teaching_style: { type: ["string", "null"], description: "Updated read on how the teacher teaches." },
            question_style: { type: ["string", "null"], description: "Updated read on how the teacher phrases questions." },
            assessment_patterns: { type: ["string", "null"], description: "Updated read on how the teacher grades/tests." },
            topic_priorities: {
              type: ["array", "null"],
              description: "Ranked topics this class emphasizes. Replaces the prior list when present.",
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
          },
        },
        deadlines: {
          type: ["array", "null"],
          description: "Tasks/dates/deadlines extracted from this input, if any.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              due_date: { type: ["string", "null"], description: "ISO 8601 date, or null if no date was given." },
              notes: { type: ["string", "null"] },
            },
            required: ["title", "due_date"],
          },
        },
        exam_analysis: {
          type: ["object", "null"],
          description: "Only for Past Exam inputs: structural analysis of the exam.",
          properties: {
            topics: { type: "array", items: { type: "string" } },
            difficulty: { type: "string" },
            mark_distribution: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  topic: { type: "string" },
                  marks: { type: "number" },
                },
                required: ["topic", "marks"],
              },
            },
            recurring_patterns: { type: "string" },
          },
        },
      },
      required: ["reply", "topic", "memory_updates", "deadlines", "exam_analysis"],
    },
  },
};

export interface RespondToolInput {
  reply: string;
  topic: string | null;
  memory_updates: {
    curriculum_note?: string | null;
    teacher_persona?: string | null;
    teaching_style?: string | null;
    question_style?: string | null;
    assessment_patterns?: string | null;
    topic_priorities?: { topic: string; weight: number; reason: string }[] | null;
  } | null;
  deadlines: { title: string; due_date: string | null; notes?: string | null }[] | null;
  exam_analysis: {
    topics: string[];
    difficulty: string;
    mark_distribution: { topic: string; marks: number }[];
    recurring_patterns: string;
  } | null;
}
