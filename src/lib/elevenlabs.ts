// ElevenLabs TTS integration
// Voice model: eleven_multilingual_v2 (supports Polish)
// Default voice: "Foun" - we use a warm, energetic male Polish-capable voice
// Users can override with their own voice ID in settings

export const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Adam - clear, natural English/multilingual
export const TTS_MODEL = "eleven_multilingual_v2";

export interface TTSOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
}

export async function fetchTTS(
  text: string,
  apiKey: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer | null> {
  const {
    voiceId = DEFAULT_VOICE_ID,
    stability = 0.6,
    similarityBoost = 0.8,
    style = 0.3,
    speakerBoost = true,
  } = options;

  try {
    const response = await fetch(`/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voiceId,
        apiKey,
        stability,
        similarityBoost,
        style,
        speakerBoost,
      }),
    });

    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

let currentAudio: HTMLAudioElement | null = null;

export function playAudio(buffer: ArrayBuffer, onEnd?: () => void): void {
  stopAudio();
  const blob = new Blob([buffer], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  currentAudio = new Audio(url);
  currentAudio.onended = () => {
    URL.revokeObjectURL(url);
    onEnd?.();
  };
  currentAudio.onerror = () => {
    URL.revokeObjectURL(url);
    onEnd?.();
  };
  currentAudio.play().catch(() => onEnd?.());
}

export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

// Fallback: browser SpeechSynthesis
export function speakWithBrowser(text: string, onEnd?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pl-PL";
  utterance.rate = 1.1;
  utterance.pitch = 1.0;

  // Prefer Polish voice if available
  const voices = window.speechSynthesis.getVoices();
  const polishVoice = voices.find((v) => v.lang.startsWith("pl"));
  if (polishVoice) utterance.voice = polishVoice;

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}
