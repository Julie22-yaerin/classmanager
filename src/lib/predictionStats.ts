import type { PredictionDoc, PredictionSource } from "@/lib/firestore/types";

export interface AccuracyBucket {
  resolvedCount: number;
  accuracy: number | null;
}

function scoreOf(status: PredictionDoc["status"]): number {
  return status === "correct" ? 1 : status === "partial" ? 0.5 : 0;
}

export function computeAccuracy(predictions: PredictionDoc[]): AccuracyBucket {
  const resolved = predictions.filter((p) => p.status !== "pending");
  if (resolved.length === 0) return { resolvedCount: 0, accuracy: null };
  const score = resolved.reduce((sum, p) => sum + scoreOf(p.status), 0);
  return { resolvedCount: resolved.length, accuracy: Math.round((score / resolved.length) * 100) };
}

const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
const SOURCES: PredictionSource[] = ["examMode", "teacherSimulator", "patternFinder"];

export type CalibrationByConfidence = Record<(typeof CONFIDENCE_LEVELS)[number], AccuracyBucket>;
export type CalibrationBySource = Record<PredictionSource, CalibrationByConfidence>;

function emptyByConfidence(): CalibrationByConfidence {
  return { high: { resolvedCount: 0, accuracy: null }, medium: { resolvedCount: 0, accuracy: null }, low: { resolvedCount: 0, accuracy: null } };
}

// Breaks resolved predictions down by confidence level (and, within that, by
// source feature) so the calibration question can actually be answered: does
// "high confidence" predict higher accuracy, or is it just a stronger-sounding
// guess? Only resolved predictions count — pending ones have no outcome yet.
export function computeCalibration(predictions: PredictionDoc[]): { byConfidence: CalibrationByConfidence; bySource: CalibrationBySource } {
  const byConfidence = emptyByConfidence();
  const bySource: CalibrationBySource = {
    examMode: emptyByConfidence(),
    teacherSimulator: emptyByConfidence(),
    patternFinder: emptyByConfidence(),
  };

  for (const level of CONFIDENCE_LEVELS) {
    byConfidence[level] = computeAccuracy(predictions.filter((p) => p.confidence === level));
  }
  for (const source of SOURCES) {
    for (const level of CONFIDENCE_LEVELS) {
      bySource[source][level] = computeAccuracy(predictions.filter((p) => p.source === source && p.confidence === level));
    }
  }

  return { byConfidence, bySource };
}
