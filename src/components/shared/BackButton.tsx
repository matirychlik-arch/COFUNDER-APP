"use client";

import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
}

export default function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
      aria-label="Wróć"
    >
      <ChevronLeft size={22} />
    </button>
  );
}
