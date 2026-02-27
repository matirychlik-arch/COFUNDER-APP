"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Conversation, UserProfile } from "@/types";
import { getConversation, getUserProfile } from "@/lib/storage";
import TextChat from "@/components/chat/TextChat";
import VoiceChat from "@/components/chat/VoiceChat";
import AvatarOrb from "@/components/chat/AvatarOrb";

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const p = getUserProfile();
    if (!p?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }

    const conv = getConversation(conversationId);
    if (!conv) {
      router.replace("/chat");
      return;
    }

    setProfile(p);
    setConversation(conv);
    setIsLoaded(true);
  }, [conversationId, router]);

  if (!isLoaded || !conversation || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AvatarOrb size="md" state="breath" />
      </div>
    );
  }

  if (voiceMode) {
    return (
      <VoiceChat
        conversation={conversation}
        profile={profile}
        onClose={() => setVoiceMode(false)}
      />
    );
  }

  return (
    <TextChat
      conversation={conversation}
      profile={profile}
      onVoiceMode={() => setVoiceMode(true)}
    />
  );
}
