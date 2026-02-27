"use client";

import { useState, useRef, useCallback } from "react";
import { createSpeechRecognition, isSpeechRecognitionSupported, type SpeechRecognitionInstance } from "@/lib/speech";
import { fetchTTS, playAudio, stopAudio, speakWithBrowser, DEFAULT_VOICE_ID } from "@/lib/elevenlabs";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

interface UseVoiceOptions {
  elevenLabsApiKey?: string;
  onTranscript: (text: string) => void;
  onSpeak?: (text: string) => void;
  onError?: (err: string) => void;
}

export function useVoice({
  elevenLabsApiKey,
  onTranscript,
  onSpeak,
  onError,
}: UseVoiceOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const isSupported = isSpeechRecognitionSupported();

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.("Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj Chrome lub Edge.");
      return;
    }

    setLiveTranscript("");
    setVoiceState("listening");

    const rec = createSpeechRecognition(
      (transcript, isFinal) => {
        setLiveTranscript(transcript);
        if (isFinal) {
          recognitionRef.current?.stop();
        }
      },
      () => {
        // Recognition ended
        const finalText = liveTranscript;
        if (finalText.trim()) {
          setVoiceState("thinking");
          onTranscript(finalText);
          setLiveTranscript("");
        } else {
          setVoiceState("idle");
        }
      },
      (err) => {
        setVoiceState("idle");
        onError?.(err);
      }
    );

    recognitionRef.current = rec;
    rec?.start();
  }, [isSupported, onTranscript, onError, liveTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      setVoiceState("speaking");
      onSpeak?.(text);

      const done = () => setVoiceState("idle");

      if (elevenLabsApiKey) {
        const buffer = await fetchTTS(text, elevenLabsApiKey, {
          voiceId: DEFAULT_VOICE_ID,
        });
        if (buffer) {
          playAudio(buffer, done);
          return;
        }
      }

      // Fallback to browser TTS
      speakWithBrowser(text, done);
    },
    [elevenLabsApiKey, onSpeak]
  );

  const abort = useCallback(() => {
    recognitionRef.current?.abort();
    stopAudio();
    setVoiceState("idle");
    setLiveTranscript("");
  }, []);

  return {
    voiceState,
    liveTranscript,
    isSupported,
    startListening,
    stopListening,
    speakText,
    abort,
  };
}
