"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile, ProjectMeta } from "@/types";
import {
  getUserProfile,
  updateUserProfile,
  resetConversations,
  resetAllData,
  getActiveProjectId,
  getAllProjects,
  setActiveProject,
  deleteProject,
  updateProjectMeta,
} from "@/lib/storage";
import { AlertTriangle, CheckCircle, Download, FolderOpen, Plus, Trash2 } from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState<"conversations" | "project" | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState<string | null>(null);

  useEffect(() => {
    const projectId = getActiveProjectId();
    if (!projectId) { router.replace("/"); return; }

    const p = getUserProfile();
    if (!p) { router.replace("/onboarding"); return; }

    setProfile(p);
    setActiveId(projectId);
    setProjects(getAllProjects());
  }, [router]);

  const update = (field: keyof UserProfile, value: string | boolean) => {
    setProfile((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const save = () => {
    if (!profile) return;
    updateUserProfile(profile);
    // Keep project meta in sync with profile name/company
    if (activeId) {
      updateProjectMeta(activeId, { name: profile.name, company: profile.companyName });
      setProjects(getAllProjects());
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetConversations = () => {
    resetConversations();
    setConfirmReset(null);
    alert("Historia rozmów wyczyszczona.");
  };

  const handleDeleteCurrentProject = () => {
    resetAllData();
    router.replace("/");
  };

  const handleSwitchProject = (id: string) => {
    setActiveProject(id);
    router.push("/chat");
  };

  const handleDeleteOtherProject = (id: string) => {
    deleteProject(id);
    setProjects(getAllProjects());
    setConfirmDeleteProject(null);
  };

  const handleExportProfile = () => {
    if (!profile) return;
    const json = JSON.stringify(profile, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `foun-profil-${profile.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

          {/* Projects */}
          <section className="space-y-4 border-t border-gray-100 pt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <FolderOpen size={14} />
              projekty
            </h2>

            <div className="space-y-2">
              {projects.map((project) => {
                const isActive = project.id === activeId;
                return (
                  <div
                    key={project.id}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all",
                      isActive
                        ? "border-[#F5A623] bg-amber-50"
                        : "border-gray-100 bg-gray-50"
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A1A2E]">{project.company}</p>
                      <p className="text-xs text-gray-400">{project.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <span className="text-xs text-[#F5A623] font-medium">aktywny</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSwitchProject(project.id)}
                            className="text-xs text-gray-500 hover:text-[#1A1A2E] px-2 py-1 rounded-lg hover:bg-white transition-colors"
                          >
                            przełącz
                          </button>
                          {confirmDeleteProject === project.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => setConfirmDeleteProject(null)}
                                className="text-xs text-gray-400 px-2 py-1 rounded-lg"
                              >
                                anuluj
                              </button>
                              <button
                                onClick={() => handleDeleteOtherProject(project.id)}
                                className="text-xs text-red-500 px-2 py-1 rounded-lg hover:bg-red-50"
                              >
                                usuń
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteProject(project.id)}
                              className="text-gray-300 hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => router.push("/onboarding")}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#F5A623] hover:text-[#F5A623] transition-all"
            >
              <Plus size={14} />
              nowy projekt
            </button>
          </section>

          {/* Export profile */}
          <section className="space-y-3 border-t border-gray-100 pt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">backup danych</h2>
            <div className="p-4 border-2 border-gray-100 rounded-xl flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#1A1A2E]">eksportuj profil</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pobierz JSON z ustawieniami projektu. Przydatne przy migracji danych.
                </p>
              </div>
              <button
                onClick={handleExportProfile}
                className="flex items-center gap-2 px-3 py-2 border-2 border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:border-gray-300 transition-colors flex-shrink-0"
              >
                <Download size={14} />
                pobierz
              </button>
            </div>
          </section>

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
                  usuwa wszystkie rozmowy z tego projektu. Nie można cofnąć.
                </p>
                {confirmReset === "conversations" ? (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmReset(null)} className="flex-1 py-2 border-2 border-gray-200 rounded-xl text-xs text-gray-600">anuluj</button>
                    <button onClick={handleResetConversations} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-medium">tak, usuń</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmReset("conversations")} className="py-2 px-4 border-2 border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50 transition-colors">
                    wyczyść historię
                  </button>
                )}
              </div>

              <div className="p-4 border-2 border-red-100 rounded-xl">
                <p className="text-sm font-medium text-[#1A1A2E]">usuń ten projekt</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">
                  usuwa profil, rozmowy i dane tego projektu. Nie można cofnąć.
                </p>
                {confirmReset === "project" ? (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmReset(null)} className="flex-1 py-2 border-2 border-gray-200 rounded-xl text-xs text-gray-600">anuluj</button>
                    <button onClick={handleDeleteCurrentProject} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-medium">tak, usuń projekt</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmReset("project")} className="py-2 px-4 bg-red-500 text-white rounded-xl text-xs font-medium hover:bg-red-600 transition-colors">
                    usuń projekt
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
