import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Diagnostic endpoint — hit in browser: GET /api/tts-test
 * Returns ElevenLabs key status + list of accessible voices.
 */
export async function GET(_req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return Response.json({ status: "NO_KEY", message: "Brak ELEVENLABS_API_KEY w .env.local" });
  }

  const voicesRes = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });

  if (!voicesRes.ok) {
    const body = await voicesRes.text().catch(() => "");
    return Response.json({
      status: "AUTH_ERROR",
      http_status: voicesRes.status,
      message: "Klucz ElevenLabs nieprawidłowy lub wygasł",
      elevenlabs_error: body,
      key_prefix: apiKey.slice(0, 6) + "...",
    });
  }

  const data = await voicesRes.json() as { voices: { voice_id: string; name: string; category: string }[] };
  const voices = data.voices ?? [];

  return Response.json({
    status: "OK",
    key_prefix: apiKey.slice(0, 6) + "...",
    voice_count: voices.length,
    voices: voices.slice(0, 10).map((v) => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
    })),
  });
}
