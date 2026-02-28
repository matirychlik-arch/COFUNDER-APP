"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import type { Conversation, Message, UserProfile } from "@/types";
import { FOUN_VOICES } from "@/types";
import { getFolderBySlug } from "@/lib/folders";
import { getCustomFolders, getConversation, saveConversation } from "@/lib/storage";
import { buildSystemPrompt } from "@/lib/anthropic";
import { getVoiceId } from "@/lib/elevenlabs";
import { generateId } from "@/lib/utils";
import AvatarOrb from "./AvatarOrb";
import VisionerToggle from "@/components/layout/VisionerToggle";
import { X, Phone, PhoneOff, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/hooks/useVoice";

interface VoiceChatProps {
  conversation: Conversation;
  profile: UserProfile;
  onClose: () => void;
}

const STATE_LABELS: Record<string, string> = {
  idle: "naciśnij aby zacząć",
  listening: "słucham...",
  thinking: "myślę...",
  speaking: "Foun mówi...",
};

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function VoiceChat({ conversation, profile, onClose }: VoiceChatProps) {
  const [visionerMode, setVisionerMode] = useState(conversation.visionerModeActive);
  const [error, setError] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [currentUserText, setCurrentUserText] = useState("");
  const [currentFounText, setCurrentFounText] = useState("");
  const [tick, setTick] = useState(0);

  const messagesRef = useRef<Message[]>(conversation.messages);
  const chatLogEndRef = useRef<HTMLDivElement>(null);

  // Waveform animation tick
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll conversation log
  useEffect(() => {
    chatLogEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, currentUserText, currentFounText]);

  const folder = getFolderBySlug(conversation.folderSlug, getCustomFolders());
  const folderLabel = folder?.label ?? conversation.folderSlug;
  const founName = FOUN_VOICES[profile.founVoice ?? "male"].name;

  const saveMessage = useCallback((role: "user" | "assistant", content: string) => {
    const msg: Message = {
      id: generateId(),
      role,
      content,
      createdAt: new Date().toISOString(),
      isVoice: true,
    };
    messagesRef.current = [...messagesRef.current, msg];
    const conv = getConversation(conversation.id);
    if (conv) {
      conv.messages = messagesRef.current;
      saveConversation(conv);
    }
  }, [conversation.id]);

  const conv = useConversation({
    onConnect: () => {
      setSessionActive(true);
      setVoiceState("listening");
      setError(null);
    },
    onDisconnect: () => {
      setSessionActive(false);
      setVoiceState("idle");
    },
    onMessage: ({ message, source }) => {
      if (source === "user") {
        // User transcript received
        const text = message;
        setCurrentUserText(text);
        setCurrentFounText("");
        setVoiceState("thinking");
        setChatLog((prev) => [...prev, { role: "user", text }]);
        saveMessage("user", text);
        setCurrentUserText("");
      } else {
        // Agent (Foun) response
        const text = message;
        setCurrentFounText(text);
        setVoiceState("speaking");
        setChatLog((prev) => [...prev, { role: "assistant", text }]);
        saveMessage("assistant", text);
        setCurrentFounText("");
      }
    },
    onError: (msg) => {
      setError(typeof msg === "string" ? msg : "Błąd połączenia z ElevenLabs");
      setVoiceState("idle");
    },
  });

  // Sync isSpeaking from ElevenLabs
  useEffect(() => {
    if (!sessionActive) return;
    setVoiceState(conv.isSpeaking ? "speaking" : "listening");
  }, [conv.isSpeaking, sessionActive]);

  const startSession = useCallback(async () => {
    setError(null);
    try {
      // Fetch signed URL from our server (which also creates the agent if needed)
      const res = await fetch("/api/elevenlabs/signed-url", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const { signedUrl } = await res.json();

      const systemPrompt = buildSystemPrompt(profile, folderLabel, visionerMode);
      const voiceId = getVoiceId(profile.founVoice);

      await conv.startSession({
        signedUrl,
        overrides: {
          agent: {
            prompt: { prompt: systemPrompt },
            firstMessage: `Hej ${profile.name}! Gotowy na rozmowę o ${folderLabel}?`,
            language: "pl",
          },
          tts: { voiceId },
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się połączyć");
    }
  }, [conv, profile, folderLabel, visionerMode]);

  const endSession = useCallback(async () => {
    await conv.endSession();
    setSessionActive(false);
    setVoiceState("idle");
    setChatLog([]);
  }, [conv]);

  const toggleVisioner = () => {
    const newVal = !visionerMode;
    setVisionerMode(newVal);
    const c = getConversation(conversation.id);
    if (c) { c.visionerModeActive = newVal; saveConversation(c); }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const isListening = voiceState === "listening";
  const isSpeaking = voiceState === "speaking";
  const isThinking = voiceState === "thinking";

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-between py-10 px-6">
      {/* ── Top bar ── */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          {folder && <span className="text-sm">{folder.emoji}</span>}
          <span className="text-sm text-gray-400">{folderLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <VisionerToggle enabled={visionerMode} onToggle={toggleVisioner} compact />
          <button
            onClick={handleFullscreen}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
            title="pełny ekran"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={() => { endSession(); onClose(); }}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Central section ── */}
      <div className="flex flex-col items-center gap-4 flex-1 justify-center w-full max-w-sm overflow-hidden">
        {/* Orb */}
        <div className={cn("relative flex items-center justify-center", isSpeaking && "orb-glow")}>
          <AvatarOrb size="xl" state={voiceState} />
        </div>

        {/* State label */}
        <p className="text-[#1A1A2E] font-medium text-base">{STATE_LABELS[voiceState]}</p>

        {/* Waveform bars */}
        <div className="h-8 flex items-center gap-1">
          {(isListening || isSpeaking) &&
            Array.from({ length: 5 }).map((_, i) => {
              const phase = Math.sin(Date.now() / 300 + i * 1.2) * 0.5 + 0.5;
              const h = isSpeaking ? 8 + phase * 24 : 8 + phase * 16;
              return (
                <div
                  key={`${i}-${tick}`}
                  className="w-1 rounded-full bg-[#F5A623] transition-all duration-75"
                  style={{ height: `${h}px`, opacity: 0.85 }}
                />
              );
            })}
          {isThinking && (
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Conversation log — scrollable, shows last few exchanges */}
        {sessionActive && chatLog.length > 0 && (
          <div className="w-full max-h-48 overflow-y-auto flex flex-col gap-2 mt-2">
            {chatLog.slice(-6).map((msg, i) => (
              <div
                key={i}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-gray-100 text-gray-700 rounded-br-sm"
                      : "bg-amber-50 border border-amber-100 text-amber-800 rounded-bl-sm"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {/* Live in-progress bubbles */}
            {currentUserText && (
              <div className="flex justify-end">
                <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm bg-gray-100 text-gray-700 text-sm leading-relaxed italic opacity-70">
                  {currentUserText}
                </div>
              </div>
            )}
            {currentFounText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-sm bg-amber-50 border border-amber-100 text-amber-800 text-sm leading-relaxed">
                  {currentFounText}
                  <span className="inline-block w-1 h-3 ml-1 bg-amber-400 animate-pulse rounded-sm" />
                </div>
              </div>
            )}
            <div ref={chatLogEndRef} />
          </div>
        )}

        {error && (
          <p className="text-red-400 text-xs text-center max-w-xs mt-2">{error}</p>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div className="flex flex-col items-center gap-3 w-full">
        {sessionActive ? (
          <>
            <p className="text-xs text-gray-400 text-center">
              mów swobodnie — {founName} słucha automatycznie
            </p>
            <button
              onClick={endSession}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600 transition-all duration-200"
            >
              <PhoneOff size={28} />
            </button>
            <p className="text-xs text-gray-400">zakończ rozmowę</p>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400 text-center">
              naciśnij aby połączyć się z {founName}
            </p>
            <button
              onClick={startSession}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-[#F5A623] text-white shadow-lg shadow-amber-200 hover:bg-amber-500 transition-all duration-200"
            >
              <Phone size={28} />
            </button>
            <p className="text-xs text-gray-400">rozpocznij rozmowę</p>
          </>
        )}
      </div>
    </div>
  );
}
