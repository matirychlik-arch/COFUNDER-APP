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
      apiKey,
    }: {
      messages: { role: string; content: string }[];
      profile: UserProfile;
      folderLabel: string;
      apiKey: string;
    } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "Brak klucza API" }, { status: 401 });
    }

    const client = new Anthropic({ apiKey });
    const prompt = buildRecapPrompt(messages, profile, folderLabel);

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Nie udało się wygenerować podsumowania");
    }

    const recap = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recap);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
