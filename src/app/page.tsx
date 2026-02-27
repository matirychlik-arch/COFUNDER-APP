"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, saveUserProfile } from "@/lib/storage";
import type { UserProfile } from "@/types";
import AvatarOrb from "@/components/chat/AvatarOrb";

type Screen = "loading" | "welcome";

export default function RootPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("loading");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    const profile = getUserProfile();
    if (profile?.onboardingCompleted) {
      router.replace("/chat");
    } else {
      setScreen("welcome");
    }
  }, [router]);

  const handleImport = () => {
    setImportError("");
    try {
      const parsed = JSON.parse(importText) as UserProfile;
      if (!parsed.name || !parsed.onboardingCompleted) {
        setImportError("Nieprawidłowy plik profilu. Upewnij się, że eksportowałeś go z ustawień.");
        return;
      }
      saveUserProfile(parsed);
      router.replace("/chat");
    } catch {
      setImportError("Nieprawidłowy JSON. Wklej dokładnie to, co skopiowałeś z ustawień.");
    }
  };

  if (screen === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-[#F5A623] animate-orb-breath" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <AvatarOrb size="lg" state="breath" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1A1A2E]">foun</h1>
            <p className="text-sm text-gray-500 mt-1">twój AI co-founder</p>
          </div>
        </div>

        {!showImport ? (
          <>
            {/* New user */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => router.push("/onboarding")}
                className="w-full py-4 bg-[#1A1A2E] text-white rounded-2xl text-sm font-medium hover:bg-opacity-90 transition-all active:scale-95 shadow-sm"
              >
                zaczynam od nowa
              </button>

              <button
                onClick={() => setShowImport(true)}
                className="w-full py-4 border-2 border-gray-200 text-gray-600 rounded-2xl text-sm font-medium hover:border-gray-300 transition-all active:scale-95"
              >
                mam już konto — przywróć profil
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center max-w-xs">
              Twoje dane są przechowywane lokalnie w przeglądarce. Żeby przenieść profil między urządzeniami, użyj eksportu w ustawieniach.
            </p>
          </>
        ) : (
          <>
            {/* Import profile */}
            <div className="w-full flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-[#1A1A2E] mb-1">wklej swój profil</p>
                <p className="text-xs text-gray-400 mb-3">
                  Skopiuj JSON z <strong>Ustawienia → Eksportuj profil</strong> i wklej poniżej.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => { setImportText(e.target.value); setImportError(""); }}
                  rows={6}
                  placeholder='{"name":"Jan","companyName":"...", ...}'
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none text-xs font-mono resize-none"
                />
                {importError && (
                  <p className="text-xs text-red-500 mt-1">{importError}</p>
                )}
              </div>

              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="w-full py-4 bg-[#1A1A2E] text-white rounded-2xl text-sm font-medium hover:bg-opacity-90 transition-all disabled:opacity-40"
              >
                przywróć profil
              </button>

              <button
                onClick={() => { setShowImport(false); setImportText(""); setImportError(""); }}
                className="w-full py-3 text-gray-400 text-sm"
              >
                ← wróć
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
