// Web Speech API wrapper for Polish speech recognition
// Works natively in Chrome/Edge without API keys

export type SpeechStatus = "idle" | "listening" | "processing" | "error";

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

  const recognition = new (SpeechRecognition as new () => SpeechRecognition)();
  recognition.lang = "pl-PL";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
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

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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
