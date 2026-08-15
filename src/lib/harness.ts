import type OpenAI from "openai";
import { getMainClient, MAIN_MODEL } from "@/lib/ai";

export const MAIN_FALLBACK_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface StructuredCallParams {
  system: string;
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  tool: OpenAI.Chat.Completions.ChatCompletionFunctionTool;
  model?: string;
  maxAttempts?: number;
}

export interface StructuredCallResult<T> {
  result: T;
  usage: TokenUsage;
  modelUsed: string;
}

/**
 * Shared harness around a forced-tool-call completion: retries once with a
 * sharper reminder if the model replies without calling the tool (small/free
 * models occasionally do this), and falls back to a free model if the
 * primary model call fails outright (provider error, rate limit, etc.) so
 * one bad request or an exhausted budget doesn't take the feature down.
 * Always returns token usage so callers can meter it.
 */
export async function structuredCompletion<T>(params: StructuredCallParams): Promise<StructuredCallResult<T>> {
  const model = params.model ?? MAIN_MODEL;
  const maxAttempts = params.maxAttempts ?? 2;
  const toolName = params.tool.function.name;

  const client = getMainClient();
  const messages = [{ role: "system" as const, content: params.system }, ...params.messages];

  let lastError: unknown;
  for (const attemptModel of [model, MAIN_FALLBACK_MODEL]) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const completion = await client.chat.completions.create({
          model: attemptModel,
          messages:
            attempt === 1
              ? messages
              : [...messages, { role: "user" as const, content: `You must call the \`${toolName}\` tool with valid arguments. Call it now.` }],
          tools: [params.tool],
          tool_choice: { type: "function", function: { name: toolName } },
        });

        const message = completion.choices[0]?.message;
        const toolCall = message?.tool_calls?.[0];
        if (toolCall?.type === "function") {
          const result = JSON.parse(toolCall.function.arguments) as T;
          return {
            result,
            usage: {
              promptTokens: completion.usage?.prompt_tokens ?? 0,
              completionTokens: completion.usage?.completion_tokens ?? 0,
            },
            modelUsed: attemptModel,
          };
        }
        lastError = new Error("Model did not call the required tool.");
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Structured completion failed after retries.");
}
