"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OptionButtonProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

export default function OptionButton({ label, description, selected, onClick }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 flex items-center justify-between gap-3",
        selected
          ? "border-[#F5A623] bg-amber-50 text-[#1A1A2E]"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <div>
        <span className="font-medium text-sm">{label}</span>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      {selected && (
        <div className="w-5 h-5 rounded-full bg-[#F5A623] flex items-center justify-center flex-shrink-0">
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}
