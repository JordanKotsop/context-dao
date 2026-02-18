import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface InferenceRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
}

export interface InferenceResponse {
  response: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
}

export async function runInference(
  request: InferenceRequest
): Promise<InferenceResponse> {
  const model = request.model ?? "claude-sonnet-4-6";
  const maxTokens = request.maxTokens ?? 2048;

  const start = Date.now();

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: request.systemPrompt,
    messages: [{ role: "user", content: request.userPrompt }],
  });

  const latency = Date.now() - start;

  const responseText = message.content
    .filter((block) => block.type === "text")
    .map((block) => {
      if (block.type === "text") return block.text;
      return "";
    })
    .join("\n");

  return {
    response: responseText,
    model: message.model,
    tokens_in: message.usage.input_tokens,
    tokens_out: message.usage.output_tokens,
    latency_ms: latency,
  };
}
