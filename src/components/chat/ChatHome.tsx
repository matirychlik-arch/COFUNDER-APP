"use client";

import { useRouter } from "next/navigation";
import type { Folder, UserProfile } from "@/types";
import { useConversations } from "@/hooks/useConversations";
import AvatarOrb from "./AvatarOrb";
import FolderSelector from "./FolderSelector";
import VisionerToggle from "@/components/layout/VisionerToggle";
import { updateUserProfile } from "@/lib/storage";

interface ChatHomeProps {
  profile: UserProfile;
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
}

export default function ChatHome({ profile, onProfileUpdate }: ChatHomeProps) {
  const router = useRouter();
  const { createConversation } = useConversations();

  const handleFolderSelect = (folder: Folder) => {
    const conv = createConversation(folder.slug, profile.visionerMode);
    router.push(`/chat/${conv.id}`);
  };

  const toggleVisioner = () => {
    const newVal = !profile.visionerMode;
    updateUserProfile({ visionerMode: newVal });
    onProfileUpdate({ visionerMode: newVal });
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "dzień dobry" : hour < 18 ? "cześć" : "dobry wieczór";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <span className="text-sm text-gray-400">foun</span>
        <VisionerToggle enabled={profile.visionerMode} onToggle={toggleVisioner} />
      </div>

      {/* Avatar + greeting */}
      <div className="flex flex-col items-center gap-3 pt-10 pb-6">
        <AvatarOrb size="lg" state="breath" />
        <div className="text-center">
          <p className="text-xl font-semibold text-[#1A1A2E]">
            {greeting}, {profile.name}!
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {profile.visionerMode
              ? "🔥 tryb wizjonera aktywny — challengujemy założenia"
              : "na czym skupiamy się dzisiaj?"}
          </p>
        </div>
      </div>

      {/* Folder selector */}
      <div className="flex-1">
        <FolderSelector
          onSelect={handleFolderSelect}
          visionerMode={profile.visionerMode}
        />
      </div>
    </div>
  );
}
