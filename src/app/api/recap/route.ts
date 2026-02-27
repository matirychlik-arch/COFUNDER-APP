import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildRecapPrompt } from "@/lib/anthropic";
import type { UserProfile } from "@/types";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      profile,
      folderLabel,
      deepseekApiKey,
      anthropicApiKey,
    }: {
      messages: { role: string; content: string }[];
      profile: UserProfile;
      folderLabel: string;
      deepseekApiKey?: string;
      anthropicApiKey?: string;
    } = await req.json();

    if (!deepseekApiKey && !anthropicApiKey) {
      return NextResponse.json({ error: "Brak klucza API" }, { status: 401 });
    }

    const prompt = buildRecapPrompt(messages, profile, folderLabel);
    let text = "";

    if (anthropicApiKey) {
      // Prefer Anthropic for structured JSON recap (more reliable output)
      const client = new Anthropic({ apiKey: anthropicApiKey });
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      text = response.content[0].type === "text" ? response.content[0].text : "";
    } else {
      // Fallback: DeepSeek
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!response.ok) throw new Error("DeepSeek recap error");
      const data = await response.json();
      text = data.choices?.[0]?.message?.content ?? "";
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Nie udało się wygenerować podsumowania");

    const recap = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recap);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
