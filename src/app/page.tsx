"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getUserProfile, initStorageUser } from "@/lib/storage";
import AvatarOrb from "@/components/chat/AvatarOrb";
import Image from "next/image";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) return;

    initStorageUser(session.user.id);
    const profile = getUserProfile();
    if (profile?.onboardingCompleted) {
      router.replace("/chat");
    } else {
      router.replace("/onboarding");
    }
  }, [session, status, router]);

  // Loading
  if (status === "loading" || (status === "authenticated" && session?.user?.id)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-[#F5A623] animate-orb-breath" />
      </div>
    );
  }

  // Not signed in — show landing
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <AvatarOrb size="lg" state="breath" />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1A1A2E] tracking-tight">foun</h1>
            <p className="text-sm text-gray-500 mt-1">twój AI co-founder</p>
          </div>
        </div>

        {/* Value props */}
        <div className="w-full space-y-2 text-sm text-gray-600">
          {[
            { icon: "🧠", text: "pamięta Twój startup i łączy kropki" },
            { icon: "🎯", text: "konkretne rady, nie ogólniki" },
            { icon: "🎙️", text: "rozmawia głosem — jak prawdziwy co-founder" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
              <span className="text-lg">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Google sign-in */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all active:scale-95"
          >
            <Image
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              width={20}
              height={20}
              unoptimized
            />
            Zaloguj przez Google
          </button>

          <p className="text-xs text-gray-400 text-center">
            Twoje dane (API keys, rozmowy) są przechowywane lokalnie w tej przeglądarce.
          </p>
        </div>
      </div>
    </div>
  );
}
