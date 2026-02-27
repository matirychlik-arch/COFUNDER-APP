import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // API key comes from server environment — never from the client
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Brak klucza ElevenLabs API — ustaw ELEVENLABS_API_KEY w Vercel." }), {
        status: 500,
      });
    }

    const { text, voiceId, stability, similarityBoost, style, speakerBoost } =
      await req.json();

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: stability ?? 0.5,
            similarity_boost: similarityBoost ?? 0.85,
            style: style ?? 0.35,
            use_speaker_boost: speakerBoost ?? true,
          },
        }),
      }
    );

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "ElevenLabs API error" }), {
        status: response.status,
      });
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
