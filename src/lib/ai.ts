import OpenAI from "openai";

// Paid OpenRouter models chosen for quality/cost once the account had credit.
// Free-tier fallbacks noted alongside in case credit runs out.
export const MAIN_MODEL = "anthropic/claude-haiku-4.5"; // ~$1/$5 per M tokens; free fallback: nvidia/nemotron-3-ultra-550b-a55b:free
export const PERCEPTION_MODEL = "google/gemini-2.5-flash-lite"; // ~$0.10/$0.40 per M tokens; free fallback: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free

export class MissingApiKeyError extends Error {
  constructor(role: "main" | "perception") {
    super(`Server is missing its OpenRouter ${role} API key (OPENROUTER_${role.toUpperCase()}_API_KEY).`);
    this.name = "MissingApiKeyError";
  }
}

function client(role: "main" | "perception"): OpenAI {
  const apiKey = role === "main" ? process.env.OPENROUTER_MAIN_API_KEY : process.env.OPENROUTER_PERCEPTION_API_KEY;
  if (!apiKey) throw new MissingApiKeyError(role);
  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/Julie22-yaerin/classmanager",
      "X-Title": "Lyceum",
    },
  });
}

export function getMainClient(): OpenAI {
  return client("main");
}

export function getPerceptionClient(): OpenAI {
  return client("perception");
}
