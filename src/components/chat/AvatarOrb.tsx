"use client";

import { cn } from "@/lib/utils";

type OrbState = "idle" | "listening" | "thinking" | "speaking" | "breath";

interface AvatarOrbProps {
  state?: OrbState;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-28 h-28",
  xl: "w-40 h-40",
};

const STATE_ANIMATION = {
  idle: "animate-orb-breath",
  listening: "animate-orb-pulse",
  thinking: "animate-orb-spin",
  speaking: "animate-orb-pulse",
  breath: "animate-orb-breath",
};

export default function AvatarOrb({ state = "breath", size = "md", className }: AvatarOrbProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-[#F5A623] flex-shrink-0",
        SIZE_MAP[size],
        STATE_ANIMATION[state],
        state === "speaking" && "animate-orb-glow",
        state === "listening" && "animate-orb-ring",
        className
      )}
    />
  );
}
