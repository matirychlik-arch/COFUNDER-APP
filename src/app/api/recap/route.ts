import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildRecapPrompt } from "@/lib/anthropic";
import type { UserProfile } from "@/types";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // API keys come from server environment — never from the client
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!deepseekApiKey && !anthropicApiKey) {
      return NextResponse.json(
        { error: "Brak klucza API — ustaw DEEPSEEK_API_KEY lub ANTHROPIC_API_KEY w Vercel." },
        { status: 500 }
      );
    }

    const {
      messages,
      profile,
      folderLabel,
    }: {
      messages: { role: string; content: string }[];
      profile: UserProfile;
      folderLabel: string;
    } = await req.json();

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
