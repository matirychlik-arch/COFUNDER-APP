"use client";

import { useState, useRef, useCallback } from "react";
import {
  createWhisperRecorder,
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  type WhisperRecorderInstance,
  type SpeechRecognitionInstance,
} from "@/lib/speech";
import { fetchTTS, playAudio, stopAudio, speakWithBrowser, getVoiceId, stripMarkdown } from "@/lib/elevenlabs";
import type { FounVoice } from "@/types";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

interface UseVoiceOptions {
  founVoice?: FounVoice;
  onTranscript: (text: string) => void;
  onSpeak?: (text: string) => void;
  onError?: (err: string) => void;
}

export function useVoice({
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

  // Streaming TTS queue state
  const ttsQueueRef = useRef<string[]>([]);
  const ttsActiveRef = useRef(false);
  const ttsBufRef = useRef("");          // sentence accumulation buffer
  const ttsStreamDoneRef = useRef(true); // true when AI stream is finished
  const ttsVoiceIdRef = useRef("");

  const toggleAutoMode = useCallback(() => {
    autoModeRef.current = !autoModeRef.current;
    setAutoMode(autoModeRef.current);
  }, []);

  // Whisper STT is always available (key is server-side); browser fallback otherwise
  const isSupported = true;

  const startListening = useCallback(() => {
    setLiveTranscript("");
    interimRef.current = "";
    setAudioLevel(0);
    setVoiceState("listening");

    // Try Whisper first (server-side key); fall back to Web Speech API if unsupported
    if (typeof window !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function") {
      const rec = createWhisperRecorder(
        (transcript) => {
          setLiveTranscript(transcript);
          setVoiceState("thinking");
          onTranscript(transcript);
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
    } else if (isSpeechRecognitionSupported()) {
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
    } else {
      setVoiceState("idle");
      onError?.("Brak obsługi mikrofonu w tej przeglądarce.");
    }
  }, [onTranscript, onError]);

  const stopListening = useCallback(() => {
    whisperRef.current?.stop();
    legacyRef.current?.stop();
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      setVoiceState("speaking");
      setLiveTranscript("");
      onSpeak?.(text);

      const voiceId = getVoiceId(founVoice);
      const clean = stripMarkdown(text);

      const done = () => {
        if (autoModeRef.current) {
          setTimeout(() => startListening(), 400);
        } else {
          setVoiceState("idle");
        }
      };

      // Try ElevenLabs TTS (server-side key); fall back to browser TTS
      const buffer = await fetchTTS(clean, { voiceId });
      if (buffer) {
        playAudio(buffer, done);
        return;
      }

      speakWithBrowser(clean, done);
    },
    [founVoice, onSpeak, startListening]
  );

  // ── Streaming TTS (sentence-by-sentence) ──────────────────────────────────
  // Uses a ref so recursive calls always see the latest closure values
  const runTTSQueue = useRef<() => void>(() => {});
  runTTSQueue.current = async () => {
    if (ttsActiveRef.current) return;
    if (ttsQueueRef.current.length === 0) {
      // Queue empty — if AI stream is also done, wrap up
      if (ttsStreamDoneRef.current) {
        if (autoModeRef.current) {
          setTimeout(() => startListening(), 400);
        } else {
          setVoiceState("idle");
        }
      }
      return;
    }

    ttsActiveRef.current = true;
    const sentence = ttsQueueRef.current.shift()!;

    const buffer = await fetchTTS(sentence, { voiceId: ttsVoiceIdRef.current });
    ttsActiveRef.current = false;

    if (buffer) {
      setVoiceState("speaking");
      playAudio(buffer, () => runTTSQueue.current());
    } else {
      // ElevenLabs unavailable — show error and reset
      ttsQueueRef.current = [];
      ttsStreamDoneRef.current = true;
      setVoiceState("idle");
      onError?.("ElevenLabs TTS nie działa — sprawdź klucz i otwórz /api/tts-test w przeglądarce");
    }
  };

  /** Call before starting the AI stream. Resets queue and sets state to "thinking". */
  const startTTSStream = useCallback(() => {
    ttsVoiceIdRef.current = getVoiceId(founVoice);
    ttsQueueRef.current = [];
    ttsActiveRef.current = false;
    ttsBufRef.current = "";
    ttsStreamDoneRef.current = false;
    setVoiceState("thinking");
  }, [founVoice]);

  /** Feed each text chunk from the AI stream. Extracts complete sentences and queues them. */
  const feedTTSChunk = useCallback((chunk: string) => {
    ttsBufRef.current += chunk;
    // Match complete sentences ending in . ! ? … or newline
    const re = /[^.!?…\n]+[.!?…\n]+/g;
    let m: RegExpExecArray | null;
    let last = 0;
    while ((m = re.exec(ttsBufRef.current)) !== null) {
      const sentence = stripMarkdown(m[0]).trim();
      if (sentence.length > 4) {
        ttsQueueRef.current.push(sentence);
        last = re.lastIndex;
      }
    }
    ttsBufRef.current = ttsBufRef.current.slice(last);
    runTTSQueue.current();
  }, []);

  /** Call when AI stream ends. Flushes any remaining buffered text. */
  const endTTSStream = useCallback(() => {
    const remaining = stripMarkdown(ttsBufRef.current).trim();
    if (remaining.length > 0) ttsQueueRef.current.push(remaining);
    ttsBufRef.current = "";
    ttsStreamDoneRef.current = true;
    runTTSQueue.current();
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const abort = useCallback(() => {
    whisperRef.current?.abort();
    legacyRef.current?.abort();
    stopAudio();
    // Clear streaming TTS queue
    ttsQueueRef.current = [];
    ttsActiveRef.current = false;
    ttsBufRef.current = "";
    ttsStreamDoneRef.current = true;
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
    startTTSStream,
    feedTTSChunk,
    endTTSStream,
  };
}
