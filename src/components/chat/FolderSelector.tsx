"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import type { Folder } from "@/types";
import { DEFAULT_FOLDERS, FOLDER_COLORS } from "@/lib/folders";
import { getCustomFolders, saveCustomFolder } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FolderSelectorProps {
  onSelect: (folder: Folder) => void;
  visionerMode: boolean;
}

const FOLDER_EMOJIS = ["📁", "⭐", "🎯", "💎", "🔑", "🌱", "🏆", "💫", "🧩", "🔮"];

export default function FolderSelector({ onSelect, visionerMode }: FolderSelectorProps) {
  const [customFolders, setCustomFolders] = useState<Folder[]>(() => getCustomFolders());
  const [showNew, setShowNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0]);

  const allFolders = [...DEFAULT_FOLDERS, ...customFolders];

  const handleCreateFolder = () => {
    if (!newLabel.trim()) return;
    const folder: Folder = {
      slug: generateId(),
      label: newLabel.trim(),
      emoji: newEmoji,
      colorClass: newColor.colorClass,
      textColorClass: newColor.textColorClass,
      isDefault: false,
    };
    saveCustomFolder(folder);
    setCustomFolders(getCustomFolders());
    setShowNew(false);
    setNewLabel("");
    setNewEmoji("📁");
    setNewColor(FOLDER_COLORS[0]);
    onSelect(folder);
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1A1A2E]">
          {visionerMode ? "🔥 tryb wizjonera — " : ""}
          o czym rozmawiamy?
        </h2>
        <p className="text-sm text-gray-500 mt-1">wybierz temat sesji z Founem</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {allFolders.map((folder) => (
          <button
            key={folder.slug}
            onClick={() => onSelect(folder)}
            className={cn(
              "p-4 rounded-xl text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-gray-200",
              folder.colorClass
            )}
          >
            <span className="text-2xl">{folder.emoji}</span>
            <p className={cn("font-medium text-sm mt-2", folder.textColorClass)}>{folder.label}</p>
          </button>
        ))}

        {/* Add new folder */}
        <button
          onClick={() => setShowNew(true)}
          className="p-4 rounded-xl text-left border-2 border-dashed border-gray-200 hover:border-[#F5A623] transition-all duration-150 flex flex-col items-start justify-center gap-1"
        >
          <Plus size={20} className="text-gray-400" />
          <p className="text-sm text-gray-400">nowy folder</p>
        </button>
      </div>

      {/* New folder modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1A1A2E]">nowy folder</h3>
              <button onClick={() => setShowNew(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              placeholder="nazwa folderu..."
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none text-sm"
            />

            <div>
              <p className="text-xs text-gray-500 mb-2">emoji</p>
              <div className="flex flex-wrap gap-2">
                {FOLDER_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-lg flex items-center justify-center",
                      newEmoji === e ? "bg-amber-100 ring-2 ring-[#F5A623]" : "hover:bg-gray-100"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">kolor</p>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c.colorClass}
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all",
                      c.colorClass.replace("bg-", "bg-").replace("-100", "-400"),
                      newColor.colorClass === c.colorClass ? "border-[#1A1A2E] scale-110" : "border-transparent"
                    )}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateFolder}
              disabled={!newLabel.trim()}
              className="w-full py-3 bg-[#1A1A2E] text-white rounded-xl text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Check size={16} />
              utwórz folder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
