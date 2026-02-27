import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt, apiKey } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Brak klucza API Anthropic" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey });

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
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
