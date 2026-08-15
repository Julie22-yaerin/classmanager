import { cookies } from "next/headers";

export const OPENAI_KEY_COOKIE = "cm_openai_key";

export async function getOpenAiKey(): Promise<string | null> {
  const store = await cookies();
  const fromCookie = store.get(OPENAI_KEY_COOKIE)?.value;
  if (fromCookie) return fromCookie;
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  return null;
}

/**
 * Transcribes audio via OpenAI's Whisper endpoint. Claude has no native
 * audio-understanding endpoint, so this is the one place the pipeline
 * needs a second provider. Returns null if no OpenAI key is configured —
 * callers fall back to asking the student to paste a transcript.
 */
export async function transcribeAudio(
  fileData: Buffer,
  fileName: string,
  mimeType: string,
): Promise<string | null> {
  const apiKey = await getOpenAiKey();
  if (!apiKey) return null;

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(fileData)], { type: mimeType }), fileName);
  form.append("model", "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Transcription failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { text: string };
  return json.text;
}
