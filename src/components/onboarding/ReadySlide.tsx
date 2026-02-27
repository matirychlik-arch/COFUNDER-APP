"use client";

import ContinueButton from "@/components/shared/ContinueButton";

interface ReadySlideProps {
  name: string;
  onStart: () => void;
}

export default function ReadySlide({ name, onStart }: ReadySlideProps) {
  return (
    <div className="flex flex-col justify-between min-h-screen px-8 py-12 max-w-lg mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-8 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-[#F5A623] animate-orb-pulse mx-auto" />

        <div className="space-y-3 text-center">
          <h2 className="text-3xl font-bold text-[#1A1A2E]">gotowe, {name}!</h2>
          <p className="text-gray-500">Foun czeka. Czas budować.</p>
        </div>

        <div className="flex flex-col gap-4 mt-2">
          {[
            { icon: "🧠", text: "myśl przez decyzje razem z AI" },
            { icon: "📋", text: "planuj każdy etap budowania firmy" },
            { icon: "⚡", text: "dostępny 24/7, zna twój kontekst" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-[#1A1A2E] text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <ContinueButton onClick={onStart} label="zaczynajmy" />
    </div>
  );
}
