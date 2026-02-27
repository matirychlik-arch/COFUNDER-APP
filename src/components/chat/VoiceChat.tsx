"use client";

import { useState, useRef, useEffect } from "react";
import type { Conversation, Message, UserProfile } from "@/types";
import { FOUN_VOICES } from "@/types";
import { getFolderBySlug } from "@/lib/folders";
import { getCustomFolders, getConversation, saveConversation } from "@/lib/storage";
import { buildSystemPrompt } from "@/lib/anthropic";
import { generateId } from "@/lib/utils";
import { useVoice } from "@/hooks/useVoice";
import AvatarOrb from "./AvatarOrb";
import VisionerToggle from "@/components/layout/VisionerToggle";
import { X, Mic, MicOff, Repeat2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceChatProps {
  conversation: Conversation;
  profile: UserProfile;
  onClose: () => void;
}

const STATE_LABELS: Record<string, string> = {
  idle: "twoja kolej...",
  listening: "słucham...",
  thinking: "myślę...",
  speaking: "Foun mówi...",
};

/** Animated waveform bars driven by audioLevel (0-1) */
function AudioWaveform({ level, active }: { level: number; active: boolean }) {
  const bars = 5;
  return (
    <div className="flex items-center gap-1 h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const phase = Math.sin((Date.now() / 300 + i * 1.2)) * 0.5 + 0.5;
        const height = active ? Math.max(0.15, level * phase) : 0.15;
        return (
          <div
            key={i}
            className="w-1 rounded-full bg-[#F5A623] transition-all duration-75"
            style={{ height: `${8 + height * 24}px`, opacity: active ? 0.9 : 0.3 }}
          />
        );
      })}
    </div>
  );
}

export default function VoiceChat({ conversation, profile, onClose }: VoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [latestResponse, setLatestResponse] = useState("");
  const [visionerMode, setVisionerMode] = useState(conversation.visionerModeActive);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const accumulatedRef = useRef("");

  // Waveform animation tick
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, []);

  const folder = getFolderBySlug(conversation.folderSlug, getCustomFolders());
  const folderLabel = folder?.label ?? conversation.folderSlug;
  const founName = FOUN_VOICES[profile.founVoice ?? "male"].name;

  const { voiceState, liveTranscript, audioLevel, autoMode, isSupported, startListening, stopListening, speakText, abort, toggleAutoMode } = useVoice({
    founVoice: profile.founVoice,
    onTranscript: handleTranscript,
    onError: (err) => setError(err),
  });

  const toggleVisioner = () => {
    const newVal = !visionerMode;
    setVisionerMode(newVal);
    const conv = getConversation(conversation.id);
    if (conv) {
      conv.visionerModeActive = newVal;
      saveConversation(conv);
    }
  };

  async function handleTranscript(text: string) {
    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      isVoice: true,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    const conv = getConversation(conversation.id);
    if (conv) { conv.messages = updatedMessages; saveConversation(conv); }

    try {
      const systemPrompt = buildSystemPrompt(profile, folderLabel, visionerMode);
      const history = updatedMessages.map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          systemPrompt,
          visionerMode,
        }),
      });

      if (!response.ok) throw new Error("Błąd API");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      accumulatedRef.current = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulatedRef.current += decoder.decode(value, { stream: true });
          setLatestResponse(accumulatedRef.current);
        }
      }

      const aiText = accumulatedRef.current;
      const aiMsg: Message = { id: generateId(), role: "assistant", content: aiText, createdAt: new Date().toISOString(), isVoice: true };
      const withAI = [...updatedMessages, aiMsg];
      setMessages(withAI);

      const conv2 = getConversation(conversation.id);
      if (conv2) { conv2.messages = withAI; saveConversation(conv2); }

      await speakText(aiText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd");
    }
  }

  const handleMicPress = () => {
    if (voiceState === "listening") { stopListening(); return; }
    if (voiceState === "speaking") { abort(); return; }
    startListening();
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-4 p-8">
        <X className="absolute top-6 right-6 text-gray-400 cursor-pointer" size={24} onClick={onClose} />
        <p className="text-center text-gray-500 max-w-xs">
          Twoja przeglądarka nie obsługuje rozpoznawania mowy.<br />
          Użyj <strong>Chrome</strong> lub <strong>Edge</strong> dla trybu głosowego.
        </p>
        <button onClick={onClose} className="px-6 py-2 bg-[#1A1A2E] text-white rounded-xl text-sm">wróć do czatu</button>
      </div>
    );
  }

  const isListening = voiceState === "listening";
  const isSpeaking = voiceState === "speaking";

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-between py-10 px-6">
      {/* ── Top bar ── */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          {folder && <span className="text-sm">{folder.emoji}</span>}
          <span className="text-sm text-gray-400">{folderLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Wizjoner toggle — always visible in voice mode */}
          <VisionerToggle enabled={visionerMode} onToggle={toggleVisioner} compact />
          <button
            onClick={handleFullscreen}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
            title="pełny ekran"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={() => { abort(); onClose(); }}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Central section ── */}
      <div className="flex flex-col items-center gap-6 flex-1 justify-center w-full max-w-sm">
        {/* Orb with glow wrapper */}
        <div className={cn(
          "relative flex items-center justify-center",
          isSpeaking && "orb-glow",
        )}>
          <AvatarOrb size="xl" state={voiceState} />
        </div>

        {/* State label */}
        <p className="text-[#1A1A2E] font-medium text-base">{STATE_LABELS[voiceState]}</p>

        {/* Waveform — visible during listening */}
        <div className="h-10 flex items-center justify-center">
          {isListening && (
            // eslint-disable-next-line react-hooks/exhaustive-deps
            <AudioWaveform level={audioLevel} active={isListening} key={tick} />
          )}
          {isSpeaking && (
            <AudioWaveform level={0.6} active={true} key={tick} />
          )}
        </div>

        {/* Live transcript — visible while listening AND while thinking (Whisper returns after stop) */}
        {(isListening || voiceState === "thinking") && liveTranscript && (
          <p className="text-sm text-gray-500 text-center max-w-xs animate-fade-in italic">
            &bdquo;{liveTranscript}&rdquo;
          </p>
        )}

        {/* Foun response preview */}
        {isSpeaking && latestResponse && (
          <p className="text-sm text-amber-600 text-center max-w-xs leading-relaxed line-clamp-3 animate-fade-in">
            {latestResponse}
          </p>
        )}

        {error && (
          <p className="text-red-400 text-xs text-center max-w-xs">{error}</p>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Auto-mode toggle */}
        <button
          onClick={toggleAutoMode}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all",
            autoMode
              ? "bg-amber-100 text-amber-700 border border-amber-300"
              : "bg-gray-100 text-gray-500 border border-transparent"
          )}
        >
          <Repeat2 size={14} />
          tryb ciągły {autoMode ? "on" : "off"}
        </button>

        {/* Mic button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleMicPress}
            disabled={voiceState === "thinking"}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
              isListening
                ? "bg-red-500 text-white scale-110 shadow-red-200"
                : isSpeaking
                ? "bg-gray-200 text-gray-600"
                : voiceState === "thinking"
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#F5A623] text-white hover:bg-amber-500 shadow-amber-200"
            )}
          >
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          <p className="text-xs text-gray-400">
            {voiceState === "idle" && "naciśnij i mów"}
            {isListening && "naciśnij aby wysłać"}
            {isSpeaking && `${founName} mówi — naciśnij aby zatrzymać`}
            {voiceState === "thinking" && "czekam na odpowiedź..."}
          </p>
        </div>
      </div>
    </div>
  );
}
