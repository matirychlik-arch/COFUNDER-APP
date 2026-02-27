"use client";

import OptionButton from "./OptionButton";
import ContinueButton from "@/components/shared/ContinueButton";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface QuestionStepProps {
  question: string;
  subtitle?: string;
  options: Option[];
  selected: string | string[];
  multiSelect?: boolean;
  onSelect: (value: string | string[]) => void;
  onNext: () => void;
}

export default function QuestionStep({
  question,
  subtitle,
  options,
  selected,
  multiSelect = false,
  onSelect,
  onNext,
}: QuestionStepProps) {
  const selectedArr = Array.isArray(selected) ? selected : [selected];

  const toggle = (value: string) => {
    if (multiSelect) {
      const arr = selectedArr.includes(value)
        ? selectedArr.filter((v) => v !== value)
        : [...selectedArr, value];
      onSelect(arr);
    } else {
      onSelect(value);
    }
  };

  const canContinue = multiSelect ? selectedArr.length > 0 : !!selected;

  return (
    <div className="flex flex-col min-h-screen px-8 py-6 max-w-lg mx-auto">
      <div className="flex-1 flex flex-col gap-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-semibold text-[#1A1A2E] leading-snug">{question}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>

        <div className="flex flex-col gap-3">
          {options.map((opt) => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={selectedArr.includes(opt.value)}
              onClick={() => toggle(opt.value)}
            />
          ))}
        </div>
      </div>

      <div className="pt-6">
        <ContinueButton onClick={onNext} disabled={!canContinue} />
      </div>
    </div>
  );
}
