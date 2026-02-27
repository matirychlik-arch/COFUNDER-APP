"use client";

import ContinueButton from "@/components/shared/ContinueButton";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeatureSlideProps {
  title: string;
  subtitle?: string;
  features: Feature[];
  onNext: () => void;
  continueLabel?: string;
}

export default function FeatureSlide({ title, subtitle, features, onNext, continueLabel }: FeatureSlideProps) {
  return (
    <div className="flex flex-col min-h-screen px-8 py-12 max-w-lg mx-auto">
      <div className="flex-1 flex flex-col gap-8 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#F5A623] animate-orb-breath" />
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-[#1A1A2E]">{title}</h2>
            {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {features.map((f, i) => (
            <div key={i} className="flex gap-4 items-start">
              <span className="text-2xl flex-shrink-0">{f.icon}</span>
              <div>
                <p className="font-semibold text-[#1A1A2E] text-sm">{f.title}</p>
                <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ContinueButton onClick={onNext} label={continueLabel ?? "rozumiem"} />
    </div>
  );
}
