"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Conversation, Message, SessionRecap, UserProfile } from "@/types";
import { getFolderBySlug } from "@/lib/folders";
import { getCustomFolders, getConversation, saveConversation } from "@/lib/storage";
import { useChat } from "@/hooks/useChat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";
import SessionEndModal from "./SessionEndModal";
import VisionerToggle from "@/components/layout/VisionerToggle";
import AvatarOrb from "./AvatarOrb";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TextChatProps {
  conversation: Conversation;
  profile: UserProfile;
  onVoiceMode: () => void;
}

export default function TextChat({ conversation, profile, onVoiceMode }: TextChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [showRecap, setShowRecap] = useState(false);
  const [visionerMode, setVisionerMode] = useState(conversation.visionerModeActive || profile.visionerMode);
  const bottomRef = useRef<HTMLDivElement>(null);

  const folder = getFolderBySlug(conversation.folderSlug, getCustomFolders());
  const folderLabel = folder?.label ?? conversation.folderSlug;

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessage = (msg: Message) => {
    setMessages((prev) => {
      const updated = [...prev, msg];
      const conv = getConversation(conversation.id);
      if (conv) {
        conv.messages = updated;
        saveConversation(conv);
      }
      return updated;
    });
  };

  const updateLastAssistant = (content: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      const lastIdx = updated.findLastIndex((m) => m.role === "assistant");
      if (lastIdx >= 0) {
        updated[lastIdx] = { ...updated[lastIdx], content };
        const conv = getConversation(conversation.id);
        if (conv) {
          conv.messages = updated;
          saveConversation(conv);
        }
      }
      return updated;
    });
  };

  const { sendMessage, isStreaming, abort } = useChat({
    profile,
    folderLabel,
    visionerMode,
    onMessageSaved: saveMessage,
    onAssistantUpdate: updateLastAssistant,
  });

  const handleSend = async (text: string) => {
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    await sendMessage(text, history);
  };

  const handleSessionEnd = (recap: SessionRecap) => {
    const conv = getConversation(conversation.id);
    if (conv) {
      conv.status = "ended";
      conv.recap = recap;
      conv.endedAt = new Date().toISOString();
      saveConversation(conv);
    }
    router.push("/chat");
  };

  const toggleVisioner = () => {
    const newVal = !visionerMode;
    setVisionerMode(newVal);
    const conv = getConversation(conversation.id);
    if (conv) {
      conv.visionerModeActive = newVal;
      saveConversation(conv);
    }
  };

  const isFirstMessage = messages.length === 0;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-lg">{folder?.emoji ?? "💬"}</span>
            <span className="font-medium text-sm text-[#1A1A2E]">{folderLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <VisionerToggle enabled={visionerMode} onToggle={toggleVisioner} />
          {messages.length >= 2 && (
            <button
              onClick={() => setShowRecap(true)}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
            >
              zakończ sesję
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {isFirstMessage ? (
          <div className="flex flex-col items-center gap-4 pt-10 px-6 text-center animate-fade-in">
            <AvatarOrb size="lg" state="breath" />
            <div>
              <p className="text-lg font-semibold text-[#1A1A2E]">
                {visionerMode ? "🔥 " : ""}
                {folderLabel}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {visionerMode
                  ? "tryb wizjonera aktywny — challengujemy założenia"
                  : `cześć! o czym rozmawiamy dziś w temacie "${folderLabel}"?`}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} userName={profile.name} />
            ))}
            {isStreaming && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onVoiceMode={profile.elevenLabsApiKey ? onVoiceMode : undefined}
        isStreaming={isStreaming}
        onStop={abort}
        hasElevenLabsKey={!!profile.elevenLabsApiKey}
      />

      {/* Recap modal */}
      {showRecap && (
        <SessionEndModal
          messages={messages}
          profile={profile}
          folderSlug={conversation.folderSlug}
          onConfirm={handleSessionEnd}
          onCancel={() => setShowRecap(false)}
        />
      )}
    </div>
  );
}
