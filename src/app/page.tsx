"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/lib/storage";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const profile = getUserProfile();
    if (profile?.onboardingCompleted) {
      router.replace("/chat");
    } else {
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-[#F5A623] animate-orb-breath" />
    </div>
  );
}
