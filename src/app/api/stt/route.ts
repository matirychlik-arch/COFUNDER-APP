import { NextRequest } from "next/server";

// Do NOT use edge runtime — FormData streaming requires Node.js runtime
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // API key comes from server environment — never from the client
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Brak klucza OpenAI API — ustaw OPENAI_API_KEY w Vercel." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const audio = formData.get("audio") as Blob | null;

    if (!audio) {
      return new Response(JSON.stringify({ error: "Brak pliku audio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Forward to OpenAI Whisper
    const whisperForm = new FormData();
    whisperForm.append("file", audio, "audio.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "pl");
    whisperForm.append("response_format", "json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: whisperForm,
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: `Whisper error: ${err}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify({ text: data.text ?? "" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
