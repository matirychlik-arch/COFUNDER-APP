"use client";

import { useState, useRef, useCallback } from "react";
import {
  createWhisperRecorder,
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  type WhisperRecorderInstance,
  type SpeechRecognitionInstance,
} from "@/lib/speech";
import { fetchTTS, playAudio, stopAudio, speakWithBrowser, getVoiceId } from "@/lib/elevenlabs";
import type { FounVoice } from "@/types";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

interface UseVoiceOptions {
  elevenLabsApiKey?: string;
  openAiApiKey?: string;
  founVoice?: FounVoice;
  onTranscript: (text: string) => void;
  onSpeak?: (text: string) => void;
  onError?: (err: string) => void;
}

export function useVoice({
  elevenLabsApiKey,
  openAiApiKey,
  founVoice,
  onTranscript,
  onSpeak,
  onError,
}: UseVoiceOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [autoMode, setAutoMode] = useState(false);

  const whisperRef = useRef<WhisperRecorderInstance | null>(null);
  const legacyRef = useRef<SpeechRecognitionInstance | null>(null);
  const interimRef = useRef("");
  const autoModeRef = useRef(false);

  const toggleAutoMode = useCallback(() => {
    autoModeRef.current = !autoModeRef.current;
    setAutoMode(autoModeRef.current);
  }, []);

  const isSupported = !!openAiApiKey || isSpeechRecognitionSupported();

  const startListening = useCallback(() => {
    setLiveTranscript("");
    interimRef.current = "";
    setAudioLevel(0);
    setVoiceState("listening");

    if (openAiApiKey) {
      const rec = createWhisperRecorder(
        openAiApiKey,
        (transcript) => {
          setLiveTranscript(transcript);
          setVoiceState("thinking");
          onTranscript(transcript);
          // liveTranscript is cleared when speakText() starts
        },
        () => {
          setVoiceState((s) => (s === "listening" ? "idle" : s));
          setAudioLevel(0);
        },
        (err) => {
          setVoiceState("idle");
          setAudioLevel(0);
          onError?.(err);
        },
        (level) => setAudioLevel(level)
      );
      whisperRef.current = rec;
      rec?.start();
    } else {
      const rec = createSpeechRecognition(
        (transcript, isFinal) => {
          setLiveTranscript(transcript);
          interimRef.current = transcript;
          if (isFinal) {
            legacyRef.current?.stop();
          }
        },
        () => {
          const finalText = interimRef.current;
          if (finalText.trim()) {
            setVoiceState("thinking");
            onTranscript(finalText);
            setLiveTranscript("");
            interimRef.current = "";
          } else {
            setVoiceState("idle");
          }
        },
        (err) => {
          setVoiceState("idle");
          onError?.(err);
        }
      );
      legacyRef.current = rec;
      rec?.start();
    }
  }, [openAiApiKey, onTranscript, onError]);

  const stopListening = useCallback(() => {
    whisperRef.current?.stop();
    legacyRef.current?.stop();
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      setVoiceState("speaking");
      setLiveTranscript(""); // clear user transcript when Foun starts speaking
      onSpeak?.(text);

      const voiceId = getVoiceId(founVoice);

      const done = () => {
        if (autoModeRef.current) {
          setTimeout(() => startListening(), 400);
        } else {
          setVoiceState("idle");
        }
      };

      if (elevenLabsApiKey) {
        const buffer = await fetchTTS(text, elevenLabsApiKey, { voiceId });
        if (buffer) {
          playAudio(buffer, done);
          return;
        }
      }

      speakWithBrowser(text, done);
    },
    [elevenLabsApiKey, founVoice, onSpeak, startListening]
  );

  const abort = useCallback(() => {
    whisperRef.current?.abort();
    legacyRef.current?.abort();
    stopAudio();
    setVoiceState("idle");
    setLiveTranscript("");
    setAudioLevel(0);
    interimRef.current = "";
  }, []);

  return {
    voiceState,
    liveTranscript,
    audioLevel,
    autoMode,
    isSupported,
    startListening,
    stopListening,
    speakText,
    abort,
    toggleAutoMode,
  };
}
