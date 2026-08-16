import { callApi } from "@/lib/apiClient";
import { toClassContext, toProfileContext } from "@/lib/mappers";
import { createMaterial } from "@/lib/firestore/materials";
import { createDeadlines } from "@/lib/firestore/deadlines";
import { applyMemoryUpdate, appendImportantDates } from "@/lib/firestore/classes";
import { recordEvidenceSignals, recomputeTopicState } from "@/lib/firestore/evidenceSignals";
import { recordReferenceItems } from "@/lib/firestore/referenceItems";
import { clamp01 } from "@/lib/evidenceEngine";
import { slugifyTopic, type Tag, type Mode, type HomeworkMode } from "@/lib/types";
import { tagSourceForDeadlines } from "@/lib/processors/instructions";
import type { ClassDoc, UserProfile } from "@/lib/firestore/types";
import type { RunChatResult } from "@/lib/aiChat";
import type { PendingAttachment } from "@/lib/fileToAttachment";

export interface ChatTurnPayload {
  tag: Tag;
  content: string;
  mode: Mode;
  homeworkMode: HomeworkMode | null;
  attachment: PendingAttachment | null;
}

export interface ChatTurnOutcome {
  result: RunChatResult & { skippedProcessing?: boolean };
  materialId: string | null;
}

/**
 * Runs one AI turn against a class and persists everything it produces —
 * the material record, memory updates, deadlines, evidence signals, and
 * reference suggestions. Shared by the chat page and the Materials upload
 * flow so both entry points get identical processing: the AI pipeline
 * doesn't know or care whether an attachment arrived from a conversation or
 * a direct library upload.
 */
export async function runAndPersistChatTurn(
  uid: string,
  cls: ClassDoc,
  classId: string,
  profile: UserProfile | null,
  payload: ChatTurnPayload,
): Promise<ChatTurnOutcome> {
  const result = await callApi<RunChatResult & { skippedProcessing?: boolean }>("/api/chat", {
    cls: toClassContext(cls),
    profile: toProfileContext(profile),
    tag: payload.tag,
    content: payload.content,
    mode: payload.mode,
    homeworkMode: payload.tag === "Homework" ? payload.homeworkMode : null,
    attachment: payload.attachment,
  });

  let materialId: string | null = null;
  if (result.skippedProcessing) {
    return { result, materialId };
  }

  const material = await createMaterial(uid, {
    classId,
    className: `${cls.subject} · ${cls.teacherName}`,
    tag: payload.tag,
    sourceType: payload.attachment?.sourceType ?? "text",
    rawContent: payload.content || null,
    extractedText: result.usedTranscript,
    topic: result.topic,
    analysis: result.exam_analysis as unknown as Record<string, unknown> | null,
    fileName: payload.attachment?.fileName ?? null,
    mimeType: payload.attachment?.mimeType ?? null,
    timeline: null,
    createdAt: new Date().toISOString(),
  });
  materialId = material.id;

  await applyMemoryUpdate(uid, classId, cls, result.memory_updates);
  if (result.deadlines?.length) {
    const sourceType = tagSourceForDeadlines(payload.tag);
    const now = new Date().toISOString();
    await createDeadlines(
      uid,
      result.deadlines.map((d) => ({
        classId,
        className: cls.subject,
        teacherName: cls.teacherName,
        title: d.title,
        dueDate: d.due_date,
        sourceType,
        notes: d.notes ?? null,
        done: false,
        createdAt: now,
      })),
    );
    await appendImportantDates(
      uid,
      classId,
      cls,
      result.deadlines.map((d) => ({ title: d.title, date: d.due_date, source: sourceType })),
    );
  }

  // Evidence scoring and reference saving are auxiliary — if either fails (a
  // rules rejection, a size-limit violation, an offline client), the caller
  // should still get the reply the model already produced, not lose it
  // because a background write rejected.
  if (result.evidence_signals?.length) {
    try {
      const evidenceNow = new Date().toISOString();
      await recordEvidenceSignals(
        uid,
        result.evidence_signals.map((s) => ({
          classId,
          topicId: slugifyTopic(s.topic),
          topicLabel: s.topic,
          signalType: s.signal_type,
          rawEvidence: s.raw_evidence,
          normalizedEvidence: s.normalized_evidence,
          strength: clamp01(s.strength),
          specificity: clamp01(s.specificity),
          extractionConfidence: clamp01(s.extraction_confidence),
          sourceType: "chat",
          materialId,
          createdAt: evidenceNow,
        })),
      );
      const touchedTopics = new Map(result.evidence_signals.map((s) => [slugifyTopic(s.topic), s.topic]));
      await Promise.all([...touchedTopics].map(([topicId, topicLabel]) => recomputeTopicState(uid, classId, topicId, topicLabel)));
    } catch (evidenceErr) {
      console.error("evidence signal persistence failed", evidenceErr);
    }
  }

  if (result.reference_suggestions?.length) {
    try {
      const referenceNow = new Date().toISOString();
      await recordReferenceItems(
        uid,
        result.reference_suggestions.slice(0, 3).map((r) => ({
          classId,
          className: `${cls.subject} · ${cls.teacherName}`,
          topic: r.topic,
          title: r.title,
          resourceType: r.resource_type,
          description: r.description,
          searchQuery: r.search_query,
          createdAt: referenceNow,
        })),
      );
    } catch (referenceErr) {
      console.error("reference item persistence failed", referenceErr);
    }
  }

  return { result, materialId };
}
