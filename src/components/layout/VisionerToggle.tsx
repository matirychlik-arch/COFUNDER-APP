"use client";

import { cn } from "@/lib/utils";

interface VisionerToggleProps {
  enabled: boolean;
  onToggle: () => void;
  compact?: boolean; // icon-only on small screens
}

export default function VisionerToggle({ enabled, onToggle, compact = false }: VisionerToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
        compact ? "px-2 py-1.5" : "px-3 py-1.5",
        enabled
          ? "bg-[#1A1A2E] text-amber-400 border-[#1A1A2E] shadow-sm"
          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
      )}
      title={enabled ? "Tryb Wizjonera aktywny — kliknij aby wyłączyć" : "Włącz Tryb Wizjonera — odważniejsze pomysły"}
    >
      <span className="text-sm">{enabled ? "🔥" : "💡"}</span>
      {!compact && <span>wizjoner</span>}
      <div
        className={cn(
          "w-6 h-3 rounded-full transition-colors duration-200 relative flex-shrink-0",
          enabled ? "bg-amber-400" : "bg-gray-300"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-2 h-2 rounded-full bg-white transition-transform duration-200",
            enabled ? "translate-x-3.5" : "translate-x-0.5"
          )}
        />
      </div>
    </button>
  );
}
