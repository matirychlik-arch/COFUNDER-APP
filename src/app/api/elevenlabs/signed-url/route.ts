/**
 * Generates a signed ElevenLabs Conversational AI session URL.
 * Creates the Foun agent automatically on first call if ELEVENLABS_AGENT_ID is not set.
 *
 * POST body: { systemPrompt: string, voiceId: string }
 */
import { NextRequest } from "next/server";

const EL_API = "https://api.elevenlabs.io/v1";

// Module-level cache so the agent is only created once per server process.
// In production, set ELEVENLABS_AGENT_ID in env vars to skip auto-creation.
let cachedAgentId: string | null = null;

async function getOrCreateAgent(apiKey: string, appUrl: string): Promise<string> {
  if (process.env.ELEVENLABS_AGENT_ID) return process.env.ELEVENLABS_AGENT_ID;
  if (cachedAgentId) return cachedAgentId;

  const llmUrl = `${appUrl}/api/elevenlabs-llm`;

  const res = await fetch(`${EL_API}/convai/agents/create`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Foun — AI Cofunder",
      conversation_config: {
        agent: {
          prompt: { prompt: "Jesteś Foun, AI cofunder." },
          first_message: "Hej! Gotowy na rozmowę?",
          language: "pl",
        },
        llm: {
          model: "custom-llm",
          custom_llm_extra_body: {},
          custom_llm_url: llmUrl,
        },
        tts: {
          model_id: "eleven_turbo_v2_5",
        },
        stt: {
          user_input_audio_format: "pcm_16000",
        },
        turn: {
          turn_timeout: 7,
          silence_end_call_timeout: -1,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create ElevenLabs agent: ${err}`);
  }

  const data = await res.json();
  cachedAgentId = data.agent_id as string;
  console.log("[ElevenLabs] Agent created:", cachedAgentId, "LLM URL:", llmUrl);
  return cachedAgentId!;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 500 });
  }

  // Derive the app URL for the custom LLM endpoint
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const appUrl = `${proto}://${host}`;

  try {
    const agentId = await getOrCreateAgent(apiKey, appUrl);

    const res = await fetch(
      `${EL_API}/convai/conversation/get_signed_url?agent_id=${agentId}`,
      { headers: { "xi-api-key": apiKey } }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Signed URL error: ${err}`);
    }

    const { signed_url } = await res.json();
    return Response.json({ signedUrl: signed_url, agentId });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
