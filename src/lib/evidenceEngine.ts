import type { EvidenceSignalDoc, TopicStateDoc, TpsTier, ConfidenceTier } from "@/lib/firestore/types";
import type { SignalType } from "@/lib/types";

/**
 * P0 deterministic scoring engine for the evidence-signal pipeline.
 *
 * Everything here is plain arithmetic over EvidenceSignalDocs — no LLM call
 * touches a probability, weight, or confidence number. The model's only job
 * (see respondTool.ts) is extracting typed, traceable observations; this
 * file turns those observations into scores.
 *
 * Known P0 simplifications (documented rather than hidden):
 * - EvidenceQualityScore drops the spec's CrossSourceAgreement term at the
 *   per-signal level (it's inherently a topic-level property) and folds it
 *   into `sourceDiversity` on the topic state instead.
 * - The P_exam logistic's beta weights are a fixed starting prior, not
 *   fitted to real outcome data — there's no calibration history yet. They
 *   should be re-estimated once the Prediction Ledger has enough resolved
 *   predictions tied to these topic states to fit against (P1).
 * - Confidence uses 4 of the spec's 6 components (EQS, count, diversity,
 *   freshness) — ModelAgreement and TemporalStability need multi-run/
 *   historical data this pipeline doesn't collect yet.
 * - `coverage` (spec section B) needs curriculum-graph integration to mean
 *   anything (a numerator without a denominator is fabricated precision),
 *   so it's left out of TopicStateDoc entirely for P0.
 * - Horizon-based confidence decay is skipped: these are standing
 *   topic-level scores, not predictions tied to one specific exam date.
 */

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

const RECENCY_HALF_LIFE_DAYS = 14;

export function computeRecency(createdAt: string, now: Date = new Date()): number {
  const ageMs = now.getTime() - new Date(createdAt).getTime();
  const ageDays = Math.max(0, ageMs / 86_400_000);
  return clamp01(Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS));
}

const SOURCE_RELIABILITY: Record<EvidenceSignalDoc["sourceType"], number> = {
  material: 0.9, // grounded in an uploaded document (past exam, slides, notes)
  chat: 0.6, // a student's freeform description of what happened
};

/** Evidence Quality Score for a single signal, ∈ [0,1]. */
export function computeEQS(signal: EvidenceSignalDoc, now: Date = new Date()): number {
  const sourceReliability = SOURCE_RELIABILITY[signal.sourceType];
  const temporalRelevance = computeRecency(signal.createdAt, now);
  return clamp01(
    0.35 * sourceReliability +
      0.25 * clamp01(signal.extractionConfidence) +
      0.2 * clamp01(signal.specificity) +
      0.2 * temporalRelevance,
  );
}

const E_TYPES: SignalType[] = ["TEACHER_EMPHASIS", "TEACHER_REPETITION", "TEACHER_WARNING", "TEACHER_REVIEW", "SLIDE_EMPHASIS"];
const H_TYPES: SignalType[] = ["EXAM_HISTORY", "TOPIC_RECURRENCE"];
const C_TYPES: SignalType[] = ["CURRICULUM_CENTRALITY", "SYLLABUS_POSITION"];
const P_TYPES: SignalType[] = ["DEADLINE_PROXIMITY", "ASSESSMENT_ANNOUNCEMENT"];
const A_TYPES: SignalType[] = ["HOMEWORK_ASSIGNMENT", "HOMEWORK_DIFFICULTY"];
const Q_TYPES: SignalType[] = ["QUESTION_PATTERN"];
const D_TYPES: SignalType[] = ["STUDENT_PERFORMANCE"];

/** All type clusters that count toward source diversity (excludes OTHER and LECTURE_COVERAGE, which feed no component). */
const DIVERSITY_CLUSTERS = [E_TYPES, H_TYPES, C_TYPES, P_TYPES, A_TYPES, Q_TYPES, D_TYPES];

function eqsWeightedAverage(signals: EvidenceSignalDoc[], types: SignalType[], now: Date): number {
  const matching = signals.filter((s) => types.includes(s.signalType));
  if (matching.length === 0) return 0;
  let weightSum = 0;
  let scoreSum = 0;
  for (const s of matching) {
    const eqs = computeEQS(s, now);
    weightSum += eqs;
    scoreSum += eqs * clamp01(s.strength);
  }
  return weightSum > 0 ? clamp01(scoreSum / weightSum) : 0;
}

export interface TopicStateComputation {
  teacherEmphasis: number;
  historicalFrequency: number;
  curriculumCentrality: number;
  recentActivity: number;
  assessmentProximity: number;
  homeworkAlignment: number;
  questionPatternSimilarity: number;
  studentRisk: number;
  sourceDiversity: number;
  signalCount: number;
  tps: number;
  tpsTier: TpsTier;
  pExam: number;
  confidence: number;
  confidenceTier: ConfidenceTier;
}

/** Aggregates a topic's evidence signals into its component scores. */
export function computeTopicComponents(signals: EvidenceSignalDoc[], now: Date = new Date()) {
  const teacherEmphasis = eqsWeightedAverage(signals, E_TYPES, now);
  const historicalFrequency = eqsWeightedAverage(signals, H_TYPES, now);
  const curriculumCentrality = eqsWeightedAverage(signals, C_TYPES, now);
  const assessmentProximity = eqsWeightedAverage(signals, P_TYPES, now);
  const homeworkAlignment = eqsWeightedAverage(signals, A_TYPES, now);
  const questionPatternSimilarity = eqsWeightedAverage(signals, Q_TYPES, now);
  const studentRisk = eqsWeightedAverage(signals, D_TYPES, now);

  // Recent activity isn't type-scoped — it's "how much has this topic come
  // up lately," i.e. the recency-weighted density of all evidence for it.
  const recentActivity =
    signals.length === 0 ? 0 : clamp01(signals.reduce((sum, s) => sum + computeRecency(s.createdAt, now), 0) / signals.length);

  const presentClusters = DIVERSITY_CLUSTERS.filter((cluster) => signals.some((s) => cluster.includes(s.signalType))).length;
  const sourceDiversity = clamp01(presentClusters / DIVERSITY_CLUSTERS.length);

  return {
    teacherEmphasis,
    historicalFrequency,
    curriculumCentrality,
    recentActivity,
    assessmentProximity,
    homeworkAlignment,
    questionPatternSimilarity,
    studentRisk,
    sourceDiversity,
  };
}

export function tpsTierOf(tps: number): TpsTier {
  if (tps >= 90) return "Critical";
  if (tps >= 75) return "High";
  if (tps >= 55) return "Medium";
  if (tps >= 30) return "Low";
  return "Minimal";
}

/** Topic Priority Score, ∈ [0,100]. */
export function computeTPS(c: ReturnType<typeof computeTopicComponents>): number {
  const weighted =
    0.2 * c.teacherEmphasis +
    0.15 * c.historicalFrequency +
    0.15 * c.curriculumCentrality +
    0.15 * c.recentActivity +
    0.15 * c.assessmentProximity +
    0.1 * c.homeworkAlignment +
    0.1 * c.studentRisk;
  return Math.round(clamp01(weighted) * 100);
}

// Fixed starting prior — see file header. Ordered by the spec's implied
// importance (teacher emphasis and historical frequency dominate).
const LOGISTIC_BETA = { b0: -1.5, E: 2.2, H: 1.8, C: 1.0, R: 0.8, P: 1.4, A: 0.6, Q: 1.6 };

/** Predicted exam probability for a topic, ∈ [0,1], via logistic regression over the component scores. */
export function computePExam(c: ReturnType<typeof computeTopicComponents>): number {
  const z =
    LOGISTIC_BETA.b0 +
    LOGISTIC_BETA.E * c.teacherEmphasis +
    LOGISTIC_BETA.H * c.historicalFrequency +
    LOGISTIC_BETA.C * c.curriculumCentrality +
    LOGISTIC_BETA.R * c.recentActivity +
    LOGISTIC_BETA.P * c.assessmentProximity +
    LOGISTIC_BETA.A * c.homeworkAlignment +
    LOGISTIC_BETA.Q * c.questionPatternSimilarity;
  return clamp01(1 / (1 + Math.exp(-z)));
}

export function confidenceTierOf(confidence: number): ConfidenceTier {
  if (confidence >= 0.9) return "Very Strong";
  if (confidence >= 0.75) return "Strong";
  if (confidence >= 0.55) return "Moderate";
  if (confidence >= 0.35) return "Weak";
  return "Insufficient";
}

/** Confidence in the topic's scores, ∈ [0,1] — see file header for which spec components are approximated. */
export function computeConfidence(signals: EvidenceSignalDoc[], c: ReturnType<typeof computeTopicComponents>, now: Date = new Date()): number {
  if (signals.length === 0) return 0;
  const avgEQS = signals.reduce((sum, s) => sum + computeEQS(s, now), 0) / signals.length;
  const countScore = clamp01(signals.length / 8); // saturates once a topic has ~8 independent signals
  const freshness = clamp01(signals.reduce((sum, s) => sum + computeRecency(s.createdAt, now), 0) / signals.length);
  return clamp01(0.35 * avgEQS + 0.25 * countScore + 0.25 * c.sourceDiversity + 0.15 * freshness);
}

/** Full pipeline: raw evidence signals for one topic → every derived score. */
export function computeTopicState(signals: EvidenceSignalDoc[], now: Date = new Date()): TopicStateComputation {
  const components = computeTopicComponents(signals, now);
  const tps = computeTPS(components);
  const pExam = computePExam(components);
  const confidence = computeConfidence(signals, components, now);
  return {
    ...components,
    signalCount: signals.length,
    tps,
    tpsTier: tpsTierOf(tps),
    pExam,
    confidence,
    confidenceTier: confidenceTierOf(confidence),
  };
}

/** Which single component contributes most to a topic's TPS — used for a deterministic one-line rationale, not an LLM-generated one. */
export function dominantComponent(state: Pick<TopicStateDoc, "teacherEmphasis" | "historicalFrequency" | "curriculumCentrality" | "recentActivity" | "assessmentProximity" | "homeworkAlignment" | "studentRisk">): string {
  const entries: [string, number][] = [
    ["teacher emphasis", state.teacherEmphasis],
    ["exam history", state.historicalFrequency],
    ["curriculum centrality", state.curriculumCentrality],
    ["recent activity", state.recentActivity],
    ["an upcoming assessment", state.assessmentProximity],
    ["homework alignment", state.homeworkAlignment],
    ["student risk", state.studentRisk],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][1] > 0 ? entries[0][0] : "limited evidence";
}
