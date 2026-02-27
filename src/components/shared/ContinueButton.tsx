"use client";

import { cn } from "@/lib/utils";

interface ContinueButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function ContinueButton({
  onClick,
  label = "dalej",
  disabled = false,
  className,
}: ContinueButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full py-4 px-6 bg-[#1A1A2E] text-white rounded-xl font-medium text-base",
        "hover:bg-[#2a2a4e] active:scale-[0.98] transition-all duration-150",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
    >
      {label}
    </button>
  );
}
