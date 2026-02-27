"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types";
import { getUserProfile, updateUserProfile, resetConversations, resetAllData } from "@/lib/storage";
import { Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showElevenKey, setShowElevenKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState<"conversations" | "account" | null>(null);

  useEffect(() => {
    const p = getUserProfile();
    if (!p) { router.replace("/onboarding"); return; }
    setProfile(p);
  }, [router]);

  const update = (field: keyof UserProfile, value: string | boolean) => {
    setProfile((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const save = () => {
    if (!profile) return;
    updateUserProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetConversations = () => {
    resetConversations();
    setConfirmReset(null);
    alert("Historia rozmów wyczyszczona.");
  };

  const handleDeleteAccount = () => {
    resetAllData();
    router.replace("/onboarding");
  };

  if (!profile) return null;

  return (
    <div className="flex min-h-screen bg-white">
      <AppSidebar />
      <main className="flex-1 ml-16">
        <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">ustawienia</h1>

          {/* Profile */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">profil</h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">imię</label>
                <input
                  value={profile.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">firma</label>
                <input
                  value={profile.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">branża</label>
                <input
                  value={profile.industry}
                  onChange={(e) => update("industry", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">cele na 6 miesięcy</label>
                <textarea
                  value={profile.goals}
                  onChange={(e) => update("goals", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none text-sm resize-none"
                />
              </div>
            </div>
          </section>

          {/* Communication style */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">styl rozmowy</h2>
            <div className="flex gap-3">
              {(["casual", "structured"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => update("communicationStyle", style)}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                    profile.communicationStyle === style
                      ? "border-[#F5A623] bg-amber-50 text-[#1A1A2E]"
                      : "border-gray-200 text-gray-500"
                  )}
                >
                  {style === "casual" ? "jak z kumplem" : "jak z konsultantem"}
                </button>
              ))}
            </div>
          </section>

          {/* API Keys */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">klucze API</h2>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                DeepSeek API Key <span className="text-red-400">*wymagany</span>
              </label>
              <div className="relative">
                <input
                  type={showDeepseekKey ? "text" : "password"}
                  value={profile.deepseekApiKey ?? ""}
                  onChange={(e) => update("deepseekApiKey", e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none text-sm font-mono"
                />
                <button onClick={() => setShowDeepseekKey(!showDeepseekKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showDeepseekKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">platform.deepseek.com — główny model AI</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Anthropic API Key <span className="text-gray-400">opcjonalny (kreatywne + Wizjoner)</span>
              </label>
              <div className="relative">
                <input
                  type={showAnthropicKey ? "text" : "password"}
                  value={profile.anthropicApiKey ?? ""}
                  onChange={(e) => update("anthropicApiKey", e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none text-sm font-mono"
                />
                <button onClick={() => setShowAnthropicKey(!showAnthropicKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showAnthropicKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">console.anthropic.com — Claude Sonnet dla brainstormingu</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                OpenAI API Key <span className="text-gray-400">opcjonalny (Whisper — lepsze rozumienie mowy)</span>
              </label>
              <div className="relative">
                <input
                  type={showOpenAiKey ? "text" : "password"}
                  value={profile.openAiApiKey ?? ""}
                  onChange={(e) => update("openAiApiKey", e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none text-sm font-mono"
                />
                <button onClick={() => setShowOpenAiKey(!showOpenAiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showOpenAiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">platform.openai.com — Whisper rozumie polski lepiej</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                ElevenLabs API Key <span className="text-gray-400">opcjonalny (głos Founa)</span>
              </label>
              <div className="relative">
                <input
                  type={showElevenKey ? "text" : "password"}
                  value={profile.elevenLabsApiKey ?? ""}
                  onChange={(e) => update("elevenLabsApiKey", e.target.value)}
                  placeholder="..."
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none text-sm font-mono"
                />
                <button onClick={() => setShowElevenKey(!showElevenKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showElevenKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">elevenlabs.io — głos Zosia lub Adam (eleven_v3)</p>
            </div>
          </section>

          {/* Save button */}
          <button
            onClick={save}
            className={cn(
              "w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
              saved
                ? "bg-emerald-500 text-white"
                : "bg-[#1A1A2E] text-white hover:bg-[#2a2a4e]"
            )}
          >
            {saved ? (
              <>
                <CheckCircle size={16} />
                zapisane!
              </>
            ) : (
              "zapisz zmiany"
            )}
          </button>

          {/* Danger zone */}
          <section className="space-y-3 border-t border-gray-100 pt-6">
            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle size={14} />
              strefa niebezpieczna
            </h2>

            <div className="space-y-3">
              <div className="p-4 border-2 border-red-100 rounded-xl">
                <p className="text-sm font-medium text-[#1A1A2E]">wyczyść historię rozmów</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">
                  usuwa wszystkie rozmowy z Founem. Nie można cofnąć.
                </p>
                {confirmReset === "conversations" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmReset(null)}
                      className="flex-1 py-2 border-2 border-gray-200 rounded-xl text-xs text-gray-600"
                    >
                      anuluj
                    </button>
                    <button
                      onClick={handleResetConversations}
                      className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-medium"
                    >
                      tak, usuń
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmReset("conversations")}
                    className="py-2 px-4 border-2 border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50 transition-colors"
                  >
                    wyczyść historię
                  </button>
                )}
              </div>

              <div className="p-4 border-2 border-red-100 rounded-xl">
                <p className="text-sm font-medium text-[#1A1A2E]">usuń wszystkie dane</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">
                  resetuje aplikację — profil, rozmowy, wszystko. Wróci do onboardingu.
                </p>
                {confirmReset === "account" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmReset(null)}
                      className="flex-1 py-2 border-2 border-gray-200 rounded-xl text-xs text-gray-600"
                    >
                      anuluj
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-medium"
                    >
                      tak, usuń wszystko
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmReset("account")}
                    className="py-2 px-4 bg-red-500 text-white rounded-xl text-xs font-medium hover:bg-red-600 transition-colors"
                  >
                    usuń wszystkie dane
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
