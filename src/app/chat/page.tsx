"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { UserProfile } from "@/types";
import { getUserProfile, initStorageUser } from "@/lib/storage";
import ChatHome from "@/components/chat/ChatHome";

export default function ChatPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Sync storage namespace on each render (idempotent)
  if (session?.user?.id) initStorageUser(session.user.id);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) { router.replace("/"); return; }

    initStorageUser(session.user.id);
    const p = getUserProfile();
    if (!p?.onboardingCompleted) { router.replace("/onboarding"); return; }
    setProfile(p);
  }, [session, status, router]);

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  if (status === "loading" || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-[#F5A623] animate-orb-breath" />
      </div>
    );
  }

  return <ChatHome profile={profile} onProfileUpdate={handleProfileUpdate} />;
}
