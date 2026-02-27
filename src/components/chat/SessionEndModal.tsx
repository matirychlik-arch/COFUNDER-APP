"use client";

import { useState } from "react";
import type { Message, SessionRecap, UserProfile } from "@/types";
import { getFolderBySlug } from "@/lib/folders";
import { getCustomFolders } from "@/lib/storage";
import { X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import AvatarOrb from "./AvatarOrb";

type ModalState = "confirm" | "loading" | "recap";

interface SessionEndModalProps {
  messages: Message[];
  profile: UserProfile;
  folderSlug: string;
  onConfirm: (recap: SessionRecap) => void;
  onCancel: () => void;
}

export default function SessionEndModal({
  messages,
  profile,
  folderSlug,
  onConfirm,
  onCancel,
}: SessionEndModalProps) {
  const [state, setState] = useState<ModalState>("confirm");
  const [recap, setRecap] = useState<SessionRecap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const folder = getFolderBySlug(folderSlug, getCustomFolders());
  const folderLabel = folder?.label ?? folderSlug;

  const handleGenerate = async () => {
    setState("loading");
    setError(null);

    try {
      const response = await fetch("/api/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          profile,
          folderLabel,
        }),
      });

      if (!response.ok) {
        throw new Error("Nie udało się wygenerować podsumowania");
      }

      const data = await response.json();
      const recap: SessionRecap = {
        ...data,
        generatedAt: new Date().toISOString(),
      };
      setRecap(recap);
      setState("recap");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd generowania");
      setState("confirm");
    }
  };

  const toggleCheck = (i: number) =>
    setCheckedItems((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        {state === "confirm" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1A1A2E]">zakończyć sesję?</h3>
              <button onClick={onCancel}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Foun wygeneruje podsumowanie tej rozmowy — tytuł, kluczowe decyzje i następne kroki.
            </p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                anuluj
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 py-3 bg-[#1A1A2E] text-white rounded-xl text-sm font-medium hover:bg-[#2a2a4e] transition-colors"
              >
                zakończ sesję
              </button>
            </div>
          </div>
        )}

        {state === "loading" && (
          <div className="p-10 flex flex-col items-center gap-4">
            <AvatarOrb size="lg" state="thinking" />
            <p className="text-[#1A1A2E] font-medium">analizuję sesję...</p>
            <p className="text-sm text-gray-400">Foun spisuje notatki</p>
          </div>
        )}

        {state === "recap" && recap && (
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">podsumowanie sesji</p>
                <h3 className="font-bold text-lg text-[#1A1A2E] leading-snug">{recap.title}</h3>
              </div>
              <AvatarOrb size="sm" state="breath" className="flex-shrink-0 mt-1" />
            </div>

            {/* Tags */}
            {recap.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recap.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Summary */}
            <p className="text-sm text-gray-600 leading-relaxed">{recap.summary}</p>

            {/* Key decisions */}
            {recap.keyDecisions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  kluczowe decyzje
                </p>
                <ul className="space-y-2">
                  {recap.keyDecisions.map((d, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#1A1A2E]">
                      <span className="text-[#F5A623] flex-shrink-0 mt-0.5">→</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action items */}
            {recap.actionItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  następne kroki
                </p>
                <ul className="space-y-2">
                  {recap.actionItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 items-start cursor-pointer"
                      onClick={() => toggleCheck(i)}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all",
                          checkedItems[i]
                            ? "bg-[#1A1A2E] border-[#1A1A2E]"
                            : "border-gray-300"
                        )}
                      >
                        {checkedItems[i] && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          checkedItems[i] ? "line-through text-gray-400" : "text-[#1A1A2E]"
                        )}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => onConfirm(recap)}
              className="w-full py-3 bg-[#1A1A2E] text-white rounded-xl text-sm font-medium hover:bg-[#2a2a4e] transition-colors"
            >
              zapisz i zakończ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
