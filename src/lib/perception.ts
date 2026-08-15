import type OpenAI from "openai";
import { getPerceptionClient, PERCEPTION_MODEL } from "@/lib/ai";
import type { ChatAttachment } from "@/lib/aiChat";

const OCR_PROMPT =
  "Transcribe every word of readable text in this file verbatim, in reading order. " +
  "After the transcription, on new lines, briefly describe any diagrams, graphs, or figures that aren't captured as text. " +
  "Do not solve or explain anything — just extract.";

/**
 * Runs OCR/extraction on an image or PDF attachment via the perception
 * model. Returns null only on a hard failure (caller should surface that
 * rather than silently drop the attachment).
 */
export async function extractFromDocument(attachment: ChatAttachment): Promise<string | null> {
  const client = getPerceptionClient();

  const contentPart: OpenAI.Chat.Completions.ChatCompletionContentPart =
    attachment.sourceType === "image"
      ? { type: "image_url", image_url: { url: `data:${attachment.mimeType};base64,${attachment.base64}` } }
      : ({ type: "file", file: { filename: attachment.fileName, file_data: `data:application/pdf;base64,${attachment.base64}` } } as OpenAI.Chat.Completions.ChatCompletionContentPart);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "user", content: [{ type: "text", text: OCR_PROMPT }, contentPart] },
  ];

  const completion = await client.chat.completions.create({ model: PERCEPTION_MODEL, messages });
  return completion.choices[0]?.message?.content ?? null;
}

/**
 * Attempts to transcribe audio via the perception model. Returns null if
 * transcription isn't available right now (e.g. the OpenRouter account has
 * no credit for audio input) — callers should fall back to asking for a
 * pasted transcript rather than treating this as a hard error.
 */
export async function transcribeAudio(attachment: ChatAttachment): Promise<string | null> {
  const client = getPerceptionClient();
  const format: "wav" | "mp3" = attachment.mimeType.includes("mp3") || attachment.mimeType.includes("mpeg") ? "mp3" : "wav";

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: [
        { type: "text", text: "Transcribe this audio verbatim. Only output the transcript, nothing else." },
        { type: "input_audio", input_audio: { data: attachment.base64, format } },
      ],
    },
  ];

  try {
    const completion = await client.chat.completions.create({ model: PERCEPTION_MODEL, messages });
    return completion.choices[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}
