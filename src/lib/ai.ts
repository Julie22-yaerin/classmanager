import OpenAI from "openai";

export const MAIN_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
export const PERCEPTION_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

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
      "X-Title": "School AI",
    },
  });
}

export function getMainClient(): OpenAI {
  return client("main");
}

export function getPerceptionClient(): OpenAI {
  return client("perception");
}
