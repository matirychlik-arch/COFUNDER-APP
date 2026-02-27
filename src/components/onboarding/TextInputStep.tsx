"use client";

import { useRef, useEffect } from "react";
import ContinueButton from "@/components/shared/ContinueButton";

interface TextInputStepProps {
  question: string;
  subtitle?: string;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  type?: "text" | "password" | "email";
  hint?: string;
}

export default function TextInputStep({
  question,
  subtitle,
  value,
  onChange,
  onNext,
  placeholder = "",
  multiline = false,
  required = true,
  type = "text",
  hint,
}: TextInputStepProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const canContinue = !required || value.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline && canContinue) {
      e.preventDefault();
      onNext();
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-8 py-6 max-w-lg mx-auto">
      <div className="flex-1 flex flex-col gap-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-semibold text-[#1A1A2E] leading-snug">{question}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>

        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F5A623] focus:outline-none resize-none text-[#1A1A2E] text-base transition-colors"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F5A623] focus:outline-none text-[#1A1A2E] text-base transition-colors"
          />
        )}

        {hint && <p className="text-xs text-gray-400 leading-relaxed">{hint}</p>}
      </div>

      <div className="pt-6">
        <ContinueButton onClick={onNext} disabled={!canContinue} />
      </div>
    </div>
  );
}
