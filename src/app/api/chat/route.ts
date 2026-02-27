import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";

// ---------------------------------------------------------------------------
// Creative-request detection — routes to Claude; everything else → DeepSeek
// ---------------------------------------------------------------------------
const CREATIVE_KEYWORDS = [
  "wymyśl", "wymyślmy", "wymyślcie", "zaproponuj", "zaproponujmy",
  "brainstorm", "kreatywnie", "kreatywny", "out of the box", "nieszablonowo",
  "coś szalonego", "szalony pomysł", "wild idea", "a co gdyby", "co gdybym",
  "co gdybyśmy", "innowacyjnie", "innowacyjny", "od zera", "od nowa",
  "zdumiej mnie", "zaskocz mnie", "nieoczywisty", "pivotuj", "pivot",
  "odwróćmy", "wywróćmy", "jakie masz pomysły", "jakie pomysły",
  "daj mi pomysły", "kreatywna strategia",
];

function isCreativeRequest(
  messages: { role: string; content: string }[],
  visionerMode: boolean
): boolean {
  if (visionerMode) return true;
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) return false;
  const text = lastUserMsg.content.toLowerCase();
  return CREATIVE_KEYWORDS.some((kw) => text.includes(kw));
}

// ---------------------------------------------------------------------------
// Streaming with DeepSeek (OpenAI-compatible)
// ---------------------------------------------------------------------------
async function streamDeepSeek(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  apiKey: string
): Promise<ReadableStream> {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      stream: true,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek error: ${err}`);
  }

  const encoder = new TextEncoder();
  const body = response.body!;
  const reader = body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // ignore malformed chunk
            }
          }
        }
      }
      controller.close();
    },
  });
}

// ---------------------------------------------------------------------------
// Streaming with Anthropic Claude
// ---------------------------------------------------------------------------
async function streamClaude(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  apiKey: string
): Promise<ReadableStream> {
  const client = new Anthropic({ apiKey });
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      systemPrompt,
      deepseekApiKey,
      anthropicApiKey,
      visionerMode,
    } = await req.json();

    if (!deepseekApiKey) {
      return new Response(JSON.stringify({ error: "Brak klucza DeepSeek API" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const useClaudeForCreative =
      !!anthropicApiKey && isCreativeRequest(messages, !!visionerMode);

    let readable: ReadableStream;
    if (useClaudeForCreative) {
      readable = await streamClaude(messages, systemPrompt, anthropicApiKey!);
    } else {
      readable = await streamDeepSeek(messages, systemPrompt, deepseekApiKey);
    }

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
