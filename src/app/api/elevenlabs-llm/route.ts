/**
 * OpenAI-compatible LLM endpoint for ElevenLabs Conversational AI.
 * ElevenLabs calls this endpoint with the conversation history and expects
 * an SSE stream in OpenAI chat completions format.
 *
 * Configure in ElevenLabs agent as "Custom LLM" with URL:
 *   https://<your-domain>/api/elevenlabs-llm
 */
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";

const CREATIVE_KEYWORDS = [
  "wymyśl", "wymyślmy", "zaproponuj", "brainstorm", "kreatywnie",
  "a co gdyby", "co gdybym", "innowacyjnie", "zdumiej mnie", "pivot",
];

function isCreative(messages: { role: string; content: string }[]): boolean {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last) return false;
  const t = last.content.toLowerCase();
  return CREATIVE_KEYWORDS.some((kw) => t.includes(kw));
}

/** Format a single delta chunk as OpenAI SSE */
function sseChunk(content: string): string {
  const payload = JSON.stringify({
    choices: [{ delta: { content }, finish_reason: null, index: 0 }],
  });
  return `data: ${payload}\n\n`;
}

const SSE_DONE = "data: [DONE]\n\n";

async function streamDeepSeek(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<ReadableStream> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "deepseek-chat", stream: true, max_tokens: 512, messages }),
  });

  if (!res.ok) throw new Error(`DeepSeek ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(ctrl) {
      const enc = new TextEncoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t || t === "data: [DONE]") continue;
          if (t.startsWith("data: ")) {
            try {
              const delta = JSON.parse(t.slice(6)).choices?.[0]?.delta?.content;
              if (delta) ctrl.enqueue(enc.encode(sseChunk(delta)));
            } catch { /* ignore malformed */ }
          }
        }
      }
      ctrl.enqueue(new TextEncoder().encode(SSE_DONE));
      ctrl.close();
    },
  });
}

async function streamClaude(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<ReadableStream> {
  // Extract system message if present
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const client = new Anthropic({ apiKey });
  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001", // fastest model for voice
    max_tokens: 512,
    system: systemMsg?.content,
    messages: chatMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const enc = new TextEncoder();
  return new ReadableStream({
    async start(ctrl) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          ctrl.enqueue(enc.encode(sseChunk(chunk.delta.text)));
        }
      }
      ctrl.enqueue(enc.encode(SSE_DONE));
      ctrl.close();
    },
  });
}

export async function POST(req: NextRequest) {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!deepseekKey) {
    return new Response(JSON.stringify({ error: "DEEPSEEK_API_KEY not set" }), { status: 500 });
  }

  try {
    const body = await req.json();
    // ElevenLabs sends { messages: [...] } in OpenAI format
    const messages: { role: string; content: string }[] = body.messages ?? [];

    const useClaudeForCreative = !!anthropicKey && isCreative(messages);
    const stream = useClaudeForCreative
      ? await streamClaude(messages, anthropicKey!)
      : await streamDeepSeek(messages, deepseekKey);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error" }),
      { status: 500 }
    );
  }
}
