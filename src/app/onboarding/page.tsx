"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { initStorageUser } from "@/lib/storage";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Sync storage namespace
  if (session?.user?.id) initStorageUser(session.user.id);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) { router.replace("/"); }
  }, [session, status, router]);

  if (status === "loading" || !session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-[#F5A623] animate-orb-breath" />
      </div>
    );
  }

  const defaultName = session.user.name?.split(" ")[0] ?? "";
  return <OnboardingWizard defaultName={defaultName} />;
}
