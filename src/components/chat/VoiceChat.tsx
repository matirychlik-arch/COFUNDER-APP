"use client";

import { useState, useRef } from "react";
import type { Conversation, Message, UserProfile } from "@/types";
import { getFolderBySlug } from "@/lib/folders";
import { getCustomFolders, getConversation, saveConversation } from "@/lib/storage";
import { buildSystemPrompt } from "@/lib/anthropic";
import { generateId } from "@/lib/utils";
import { useVoice } from "@/hooks/useVoice";
import AvatarOrb from "./AvatarOrb";
import { X, Mic, MicOff } from "lucide-react";
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

export default function VoiceChat({ conversation, profile, onClose }: VoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [latestResponse, setLatestResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const accumulatedRef = useRef("");

  const folder = getFolderBySlug(conversation.folderSlug, getCustomFolders());
  const folderLabel = folder?.label ?? conversation.folderSlug;

  const { voiceState, liveTranscript, isSupported, startListening, speakText, abort } = useVoice({
    elevenLabsApiKey: profile.elevenLabsApiKey,
    onTranscript: handleTranscript,
    onError: (err) => setError(err),
  });

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

    // Save to storage
    const conv = getConversation(conversation.id);
    if (conv) {
      conv.messages = updatedMessages;
      saveConversation(conv);
    }

    // Call Claude
    try {
      const systemPrompt = buildSystemPrompt(profile, folderLabel, conversation.visionerModeActive);
      const history = updatedMessages.map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          systemPrompt,
          apiKey: profile.anthropicApiKey,
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
          const chunk = decoder.decode(value, { stream: true });
          accumulatedRef.current += chunk;
          setLatestResponse(accumulatedRef.current);
        }
      }

      const aiText = accumulatedRef.current;
      const aiMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: aiText,
        createdAt: new Date().toISOString(),
        isVoice: true,
      };

      const withAI = [...updatedMessages, aiMsg];
      setMessages(withAI);

      const conv2 = getConversation(conversation.id);
      if (conv2) {
        conv2.messages = withAI;
        saveConversation(conv2);
      }

      // Speak the response
      await speakText(aiText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd");
    }
  }

  const handleMicPress = () => {
    if (voiceState === "listening") return;
    if (voiceState === "speaking") {
      abort();
      return;
    }
    startListening();
  };

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-4 p-8">
        <X
          className="absolute top-6 right-6 text-gray-400 cursor-pointer"
          size={24}
          onClick={onClose}
        />
        <p className="text-center text-gray-500 max-w-xs">
          Twoja przeglądarka nie obsługuje rozpoznawania mowy.
          <br />
          Użyj <strong>Chrome</strong> lub <strong>Edge</strong> dla trybu głosowego.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-[#1A1A2E] text-white rounded-xl text-sm"
        >
          wróć do czatu
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-between py-12 px-8">
      {/* Close */}
      <button
        onClick={() => { abort(); onClose(); }}
        className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
      >
        <X size={16} />
      </button>

      {/* Folder */}
      <div className="flex items-center gap-2">
        <span className="text-sm">{folder?.emoji}</span>
        <span className="text-sm text-gray-500">{folderLabel}</span>
      </div>

      {/* Central Orb */}
      <div className="flex flex-col items-center gap-6">
        <AvatarOrb size="xl" state={voiceState} />

        <div className="text-center space-y-2 min-h-16">
          <p className="text-[#1A1A2E] font-medium">{STATE_LABELS[voiceState]}</p>

          {voiceState === "listening" && liveTranscript && (
            <p className="text-sm text-gray-400 max-w-xs">{liveTranscript}</p>
          )}

          {voiceState === "speaking" && latestResponse && (
            <p className="text-sm text-gray-600 max-w-xs leading-relaxed line-clamp-4">
              {latestResponse}
            </p>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>
        )}
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleMicPress}
          disabled={voiceState === "thinking"}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200",
            voiceState === "listening"
              ? "bg-red-500 text-white scale-110"
              : voiceState === "speaking"
              ? "bg-gray-200 text-gray-600"
              : voiceState === "thinking"
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[#F5A623] text-white hover:bg-amber-500"
          )}
        >
          {voiceState === "listening" ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <p className="text-xs text-gray-400">
          {voiceState === "idle" && "naciśnij i mów"}
          {voiceState === "listening" && "naciśnij aby zatrzymać"}
          {voiceState === "speaking" && "naciśnij aby zatrzymać"}
          {voiceState === "thinking" && "czekaj..."}
        </p>
      </div>
    </div>
  );
}
