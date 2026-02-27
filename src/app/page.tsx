"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllProjects, setActiveProject } from "@/lib/storage";
import type { ProjectMeta } from "@/types";
import AvatarOrb from "@/components/chat/AvatarOrb";
import { Plus, ChevronRight } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const all = getAllProjects();
    setProjects(all);
    setReady(true);
  }, []);

  const openProject = (id: string) => {
    setActiveProject(id);
    router.push("/chat");
  };

  const newProject = () => {
    router.push("/onboarding");
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-[#F5A623] animate-orb-breath" />
      </div>
    );
  }

  // First visit — no projects yet
  if (projects.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <div className="w-full max-w-sm flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-3">
            <AvatarOrb size="lg" state="breath" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-[#1A1A2E] tracking-tight">foun</h1>
              <p className="text-sm text-gray-500 mt-1">twój AI co-founder</p>
            </div>
          </div>

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

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={newProject}
              className="w-full py-4 bg-[#1A1A2E] text-white rounded-2xl text-sm font-medium hover:bg-[#2a2a4e] transition-all active:scale-95"
            >
              stwórz swój profil
            </button>
            <p className="text-xs text-gray-400 text-center">
              dane przechowywane lokalnie w tej przeglądarce
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Has projects — show selector
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3">
          <AvatarOrb size="lg" state="breath" />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1A1A2E] tracking-tight">foun</h1>
            <p className="text-sm text-gray-500 mt-1">wybierz projekt</p>
          </div>
        </div>

        <div className="space-y-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => openProject(project.id)}
              className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 hover:bg-amber-50 border-2 border-transparent hover:border-[#F5A623] rounded-2xl transition-all active:scale-[0.98] group"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-[#1A1A2E]">{project.company}</p>
                <p className="text-xs text-gray-400 mt-0.5">{project.name}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#F5A623] transition-colors" />
            </button>
          ))}
        </div>

        <button
          onClick={newProject}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-[#F5A623] hover:text-[#F5A623] transition-all"
        >
          <Plus size={16} />
          nowy projekt
        </button>
      </div>
    </div>
  );
}
