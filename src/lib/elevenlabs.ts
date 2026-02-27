// ElevenLabs TTS integration
// Model: eleven_v3 (highest quality, supports Polish)
// Voices: Zosia (female) lcMyyd2HUfFzxdCaC4Ta | Adam (male) EOVAuWqgSZN2Oel78Psj

import { FOUN_VOICES, type FounVoice } from "@/types";

export const TTS_MODEL = "eleven_multilingual_v2";

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
  apiKey: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer | null> {
  const {
    voiceId = FOUN_VOICES.male.id,
    stability = 0.5,
    similarityBoost = 0.85,
    style = 0.35,
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

  const voices = window.speechSynthesis.getVoices();
  const polishVoice = voices.find((v) => v.lang.startsWith("pl"));
  if (polishVoice) utterance.voice = polishVoice;

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}
