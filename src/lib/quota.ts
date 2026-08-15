import { NextResponse } from "next/server";
import { getUserDocFields, patchUserDocFields } from "@/lib/serverFirestore";
import { logSecurityEvent } from "@/lib/securityLog";
import type { TokenUsage } from "@/lib/harness";

// "Free use" allowance per user per calendar month, per the product's
// pricing intent: 25k tokens of material fed to the model, 25k tokens of
// model output.
export const INPUT_TOKEN_LIMIT = 25_000;
export const OUTPUT_TOKEN_LIMIT = 25_000;

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface QuotaStatus {
  allowed: boolean;
  inputUsed: number;
  outputUsed: number;
}

export async function checkQuota(idToken: string, uid: string): Promise<QuotaStatus> {
  const fields = await getUserDocFields(idToken, uid);
  const period = typeof fields.usagePeriod === "string" ? fields.usagePeriod : null;
  const inputUsed = period === currentPeriod() ? Number(fields.inputTokensUsed ?? 0) : 0;
  const outputUsed = period === currentPeriod() ? Number(fields.outputTokensUsed ?? 0) : 0;

  return {
    allowed: inputUsed < INPUT_TOKEN_LIMIT && outputUsed < OUTPUT_TOKEN_LIMIT,
    inputUsed,
    outputUsed,
  };
}

export async function recordUsage(idToken: string, uid: string, usage: TokenUsage): Promise<void> {
  const fields = await getUserDocFields(idToken, uid);
  const period = typeof fields.usagePeriod === "string" ? fields.usagePeriod : null;
  const nowPeriod = currentPeriod();
  const priorInput = period === nowPeriod ? Number(fields.inputTokensUsed ?? 0) : 0;
  const priorOutput = period === nowPeriod ? Number(fields.outputTokensUsed ?? 0) : 0;

  await patchUserDocFields(idToken, uid, {
    usagePeriod: nowPeriod,
    inputTokensUsed: priorInput + usage.promptTokens,
    outputTokensUsed: priorOutput + usage.completionTokens,
  });
}

/**
 * Returns a 429 response if the user is over quota, else null. Fails open
 * (allows the request) if the quota check itself errors — e.g. Firestore
 * rules not deployed yet, or a transient Firestore REST hiccup. A metering
 * side-system being unavailable shouldn't take down the actual feature.
 */
export async function enforceQuota(idToken: string, uid: string): Promise<NextResponse | null> {
  let status: QuotaStatus;
  try {
    status = await checkQuota(idToken, uid);
  } catch (err) {
    console.error("quota check failed, allowing request", err);
    return null;
  }
  if (!status.allowed) {
    logSecurityEvent("quota_exceeded", { uid, inputUsed: status.inputUsed, outputUsed: status.outputUsed });
    return NextResponse.json(
      {
        error: "You've used this month's free AI allowance (25,000 input / 25,000 output tokens). It resets next month.",
        code: "QUOTA_EXCEEDED",
      },
      { status: 429 },
    );
  }
  return null;
}

/** Best-effort usage recording — never fails the caller's request if the write itself fails. */
export async function trackUsage(idToken: string, uid: string, usage: TokenUsage): Promise<void> {
  try {
    await recordUsage(idToken, uid, usage);
  } catch (err) {
    console.error("failed to record token usage", err);
  }
}
