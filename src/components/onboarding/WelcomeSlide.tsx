"use client";

import ContinueButton from "@/components/shared/ContinueButton";

interface WelcomeSlideProps {
  onNext: () => void;
}

export default function WelcomeSlide({ onNext }: WelcomeSlideProps) {
  return (
    <div className="flex flex-col justify-between min-h-screen px-8 py-12 max-w-lg mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-6 animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-[#F5A623] animate-orb-breath" />

        <div className="space-y-4 text-[#1A1A2E]">
          <p className="text-2xl font-semibold">hej, założycielu.</p>
          <p className="text-lg text-gray-600 leading-relaxed">
            stworzyliśmy ci cofoundera
            <br />
            bo budowanie firmy to... dużo.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            czasem potrzebujesz kogoś,
            <br />
            kto myśli z tobą na głos.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            czy to przy ważnych decyzjach,
            <br />
            planowaniu produktu,
            <br />
            albo kiedy potrzebujesz odbicia myśli.
          </p>
          <p className="text-lg font-semibold text-[#1A1A2E]">jesteśmy tu dla ciebie.</p>
        </div>

        <p className="text-sm text-gray-400 italic">— zespół Foun</p>
      </div>

      <ContinueButton onClick={onNext} label="zaczynamy" />
    </div>
  );
}
