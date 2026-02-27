"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserProfile } from "@/types";
import { FOUN_VOICES } from "@/types";
import { useConversations } from "@/hooks/useConversations";
import AvatarOrb from "./AvatarOrb";
import VisionerToggle from "@/components/layout/VisionerToggle";
import { updateUserProfile } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

interface ChatHomeProps {
  profile: UserProfile;
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
}

export default function ChatHome({ profile, onProfileUpdate }: ChatHomeProps) {
  const router = useRouter();
  const { conversations, createConversation } = useConversations();

  const recentConvs = conversations
    .filter((c) => c.messages.length > 0)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 3);

  const handleStart = () => {
    const conv = createConversation("general", profile.visionerMode);
    router.push(`/chat/${conv.id}`);
  };

  const toggleVisioner = () => {
    const newVal = !profile.visionerMode;
    updateUserProfile({ visionerMode: newVal });
    onProfileUpdate({ visionerMode: newVal });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "dzień dobry" : hour < 18 ? "cześć" : "dobry wieczór";
  const founName = FOUN_VOICES[profile.founVoice ?? "male"].name;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <span className="text-sm text-gray-400">foun</span>
        <VisionerToggle enabled={profile.visionerMode} onToggle={toggleVisioner} />
      </div>

      {/* Avatar + greeting */}
      <div className="flex flex-col items-center gap-4 pt-12 pb-8 px-6">
        <AvatarOrb size="lg" state="breath" />
        <div className="text-center">
          <p className="text-xl font-semibold text-[#1A1A2E]">
            {greeting}, {profile.name}!
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {profile.visionerMode
              ? "🔥 tryb wizjonera aktywny — challengujemy założenia"
              : `${founName} czeka. o czym gadamy?`}
          </p>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="mt-2 px-8 py-3 bg-[#1A1A2E] text-white rounded-2xl text-sm font-medium hover:bg-opacity-90 transition-all active:scale-95 shadow-sm"
        >
          nowa rozmowa
        </button>
      </div>

      {/* Recent conversations */}
      {recentConvs.length > 0 && (
        <div className="px-6 pb-8">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">ostatnie rozmowy</p>
          <div className="space-y-2">
            {recentConvs.map((conv) => {
              const title = conv.recap?.title ?? `Sesja ${formatDate(conv.startedAt)}`;
              const tags = conv.recap?.tags ?? [];
              return (
                <Link key={conv.id} href={`/chat/${conv.id}`} className="block">
                  <div className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={14} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A2E] truncate">{title}</p>
                      {tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(conv.startedAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
