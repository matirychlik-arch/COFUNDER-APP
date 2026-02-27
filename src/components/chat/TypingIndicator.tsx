"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-full bg-[#F5A623] flex-shrink-0 animate-orb-breath" />
      <div className="flex gap-1 items-center">
        <div className="w-2 h-2 rounded-full bg-gray-400 dot-bounce-1" />
        <div className="w-2 h-2 rounded-full bg-gray-400 dot-bounce-2" />
        <div className="w-2 h-2 rounded-full bg-gray-400 dot-bounce-3" />
      </div>
    </div>
  );
}
