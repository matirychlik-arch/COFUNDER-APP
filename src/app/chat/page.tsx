"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types";
import { getUserProfile } from "@/lib/storage";
import ChatHome from "@/components/chat/ChatHome";

export default function ChatPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const p = getUserProfile();
    if (!p?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
  }, [router]);

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-[#F5A623] animate-orb-breath" />
      </div>
    );
  }

  return <ChatHome profile={profile} onProfileUpdate={handleProfileUpdate} />;
}
