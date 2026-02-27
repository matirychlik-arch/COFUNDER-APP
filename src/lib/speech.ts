// Whisper-based speech recognition via MediaRecorder + OpenAI API
// Falls back to Web Speech API when no OpenAI key is provided

export type SpeechStatus = "idle" | "listening" | "processing" | "error";

export interface WhisperRecorderInstance {
  start: () => void;
  stop: () => void;
  abort: () => void;
  getAudioLevel: () => number; // 0-1 normalised volume
}

/** Create a Whisper-powered recorder. Requires an OpenAI API key.
 *  onResult is called once, after stop(), with the final transcript.
 *  onAudioLevel is called ~10×/s with a normalised 0-1 level.
 */
export function createWhisperRecorder(
  apiKey: string,
  onResult: (transcript: string) => void,
  onEnd: () => void,
  onError: (error: string) => void,
  onAudioLevel?: (level: number) => void
): WhisperRecorderInstance | null {
  if (typeof window === "undefined") return null;
  if (!navigator.mediaDevices?.getUserMedia) {
    onError("Brak dostępu do mikrofonu.");
    return null;
  }

  let mediaRecorder: MediaRecorder | null = null;
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let levelInterval: ReturnType<typeof setInterval> | null = null;
  let chunks: Blob[] = [];
  let aborted = false;

  const startAudioLevel = (stream: MediaStream) => {
    if (!onAudioLevel) return;
    audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    levelInterval = setInterval(() => {
      if (!analyser) return;
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      onAudioLevel(Math.min(avg / 128, 1));
    }, 80);
  };

  const cleanup = () => {
    if (levelInterval) clearInterval(levelInterval);
    audioCtx?.close().catch(() => {});
    audioCtx = null;
    analyser = null;
    onAudioLevel?.(0);
  };

  const instance: WhisperRecorderInstance = {
    start: () => {
      aborted = false;
      chunks = [];

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (aborted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          startAudioLevel(stream);

          // Pick best supported mime type
          const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find(
            (m) => MediaRecorder.isTypeSupported(m)
          ) ?? "";

          mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };

          mediaRecorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            cleanup();

            if (aborted || chunks.length === 0) {
              onEnd();
              return;
            }

            const blob = new Blob(chunks, { type: mime || "audio/webm" });

            // Skip near-silent recordings (< 2KB is likely silence)
            if (blob.size < 2000) {
              onEnd();
              return;
            }

            try {
              const form = new FormData();
              form.append("audio", blob, "audio.webm");
              form.append("apiKey", apiKey);

              const res = await fetch("/api/stt", { method: "POST", body: form });
              const data = await res.json();

              if (!res.ok) throw new Error(data.error ?? "STT error");
              if (data.text?.trim()) {
                onResult(data.text.trim());
              }
            } catch (err) {
              onError(err instanceof Error ? err.message : "Błąd transkrypcji");
            } finally {
              onEnd();
            }
          };

          mediaRecorder.start(250); // collect chunks every 250 ms
        })
        .catch(() => {
          cleanup();
          onError("Brak dostępu do mikrofonu. Sprawdź uprawnienia przeglądarki.");
        });
    },

    stop: () => {
      if (mediaRecorder?.state === "recording") {
        mediaRecorder.stop();
      }
    },

    abort: () => {
      aborted = true;
      if (mediaRecorder?.state === "recording") {
        mediaRecorder.stop();
      }
      cleanup();
    },

    getAudioLevel: () => {
      if (!analyser) return 0;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      return Math.min(avg / 128, 1);
    },
  };

  return instance;
}

// ---------------------------------------------------------------------------
// Legacy Web Speech API wrapper (fallback when no OpenAI key)
// ---------------------------------------------------------------------------

export interface SpeechRecognitionInstance {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function createSpeechRecognition(
  onResult: (transcript: string, isFinal: boolean) => void,
  onEnd: () => void,
  onError: (error: string) => void
): SpeechRecognitionInstance | null {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError("Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj Chrome lub Edge.");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition = new (SpeechRecognition as new () => any)();
  recognition.lang = "pl-PL";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      onResult(finalTranscript, true);
    } else if (interimTranscript) {
      onResult(interimTranscript, false);
    }
  };

  recognition.onend = () => onEnd();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    const messages: Record<string, string> = {
      "no-speech": "Nie wykryto mowy. Spróbuj ponownie.",
      "audio-capture": "Brak dostępu do mikrofonu.",
      "not-allowed": "Dostęp do mikrofonu odrzucony.",
      "network": "Błąd sieci przy rozpoznawaniu mowy.",
    };
    onError(messages[event.error] || `Błąd: ${event.error}`);
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch {
        // already started
      }
    },
    stop: () => recognition.stop(),
    abort: () => recognition.abort(),
  };
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}
