import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";

export const API_KEY_COOKIE = "cm_anthropic_key";
export const CHAT_MODEL = "claude-sonnet-4-5";

export async function getApiKey(): Promise<string | null> {
  const store = await cookies();
  const fromCookie = store.get(API_KEY_COOKIE)?.value;
  if (fromCookie) return fromCookie;
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  return null;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "No Anthropic API key configured. Add one in Settings before chatting.",
    );
    this.name = "MissingApiKeyError";
  }
}

export async function getAnthropicClient(): Promise<Anthropic> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new MissingApiKeyError();
  return new Anthropic({ apiKey });
}
