// ElevenLabs TTS integration
// Model: eleven_turbo_v2_5 (fast, supports Polish natively)
// Voices: Zosia (female) 21m00Tcm4TlvDq8ikWAM | Adam (male) pNInz6obpgDQGcFmaJgB

import { FOUN_VOICES, type FounVoice } from "@/types";

export const TTS_MODEL = "eleven_turbo_v2_5";

/** Remove markdown symbols that sound bad when spoken aloud */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")      // **bold**
    .replace(/\*(.+?)\*/g, "$1")           // *italic*
    .replace(/#+\s+/g, "")                // ## headings
    .replace(/`[^`]*`/g, "")              // `code`
    .replace(/\[(.+?)\]\([^)]*\)/g, "$1") // [link](url)
    .replace(/^\s*[-*+]\s+/gm, "")        // bullet points
    .replace(/^\s*\d+\.\s+/gm, "")        // numbered lists
    .replace(/\n{2,}/g, ". ")             // double newlines → pause
    .replace(/\n/g, " ")
    .trim();
}

export function getVoiceId(founVoice: FounVoice | undefined): string {
  return FOUN_VOICES[founVoice ?? "male"].id;
}

export interface TTSOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
}

export async function fetchTTS(
  text: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer | null> {
  const {
    voiceId = FOUN_VOICES.male.id,
    stability = 0.38,
    similarityBoost = 0.75,
    style = 0.48,
    speakerBoost = true,
  } = options;

  try {
    // API key is handled server-side — do NOT send it from the client
    const response = await fetch(`/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voiceId,
        stability,
        similarityBoost,
        style,
        speakerBoost,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: response.status }));
      console.error("[TTS] ElevenLabs błąd:", response.status, errData);
      return null;
    }
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

  const voices = window.speechSynthesis.getVoices();
  const polishVoice = voices.find((v) => v.lang.startsWith("pl"));
  if (polishVoice) utterance.voice = polishVoice;

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}
