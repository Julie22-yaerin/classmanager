import type OpenAI from "openai";
import { SIGNAL_TYPES, type SignalType, RESOURCE_TYPES, type ResourceType } from "@/lib/types";

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
        evidence_signals: {
          type: ["array", "null"],
          description:
            "Structured evidence for the deterministic prediction engine — raw, typed observations, NOT a priority judgment (never output a weight or importance score here). For each distinct piece of evidence about a topic — the teacher stressing it, it recurring on past exams, a deadline tied to it, homework about it, etc — emit one entry. Never invent evidence that isn't traceable to this input. Omit entirely (null) if this input contains no such evidence.",
          items: {
            type: "object",
            properties: {
              topic: { type: "string", description: "The topic this evidence is about." },
              signal_type: {
                type: "string",
                enum: [...SIGNAL_TYPES],
                description: "Best-fitting category for this evidence.",
              },
              raw_evidence: { type: "string", description: "Verbatim or near-verbatim quote/paraphrase of the evidence from the input." },
              normalized_evidence: { type: "string", description: "One short, plain sentence summarizing what this evidence shows." },
              strength: { type: "number", minimum: 0, maximum: 1, description: "How strongly this evidence indicates the topic's importance, 0-1." },
              specificity: { type: "number", minimum: 0, maximum: 1, description: "How concrete and specific this evidence is vs vague, 0-1." },
              extraction_confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Your own confidence that you extracted this evidence correctly from the input, 0-1.",
              },
            },
            required: ["topic", "signal_type", "raw_evidence", "normalized_evidence", "strength", "specificity", "extraction_confidence"],
          },
        },
        reference_suggestions: {
          type: ["array", "null"],
          description:
            "Only when the student is asking to find a study resource (Reference tag): 1-3 suggested resources. You cannot browse the " +
            "internet — never invent a URL or claim a specific video/article exists. Give a search query instead, so the student finds a " +
            "real, current resource themselves. Omit entirely (null) otherwise.",
          minItems: 1,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              topic: { type: "string", description: "The topic this resource is for." },
              title: { type: "string", description: "A short, descriptive title for the suggestion (not a claimed real resource name)." },
              resource_type: { type: "string", enum: [...RESOURCE_TYPES], description: "Kind of resource this is." },
              description: { type: "string", description: "One sentence: why this fits the topic and this student." },
              search_query: { type: "string", description: "A concrete, well-formed query to paste into a search engine or YouTube." },
            },
            required: ["topic", "title", "resource_type", "description", "search_query"],
          },
        },
      },
      required: ["reply", "topic", "memory_updates", "deadlines", "exam_analysis", "evidence_signals", "reference_suggestions"],
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
  evidence_signals:
    | {
        topic: string;
        signal_type: SignalType;
        raw_evidence: string;
        normalized_evidence: string;
        strength: number;
        specificity: number;
        extraction_confidence: number;
      }[]
    | null;
  reference_suggestions:
    | {
        topic: string;
        title: string;
        resource_type: ResourceType;
        description: string;
        search_query: string;
      }[]
    | null;
}
