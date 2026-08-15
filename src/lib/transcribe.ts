import { transcribeAudio as perceptionTranscribe } from "@/lib/perception";
import type { ChatAttachment } from "@/lib/aiChat";

/**
 * Transcribes audio via the perception model. Returns null if transcription
 * isn't available right now (e.g. no OpenRouter credit for audio input) —
 * callers fall back to asking the student to paste a transcript.
 */
export async function transcribeAudio(attachment: ChatAttachment): Promise<string | null> {
  return perceptionTranscribe(attachment);
}
