import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return nanoid();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "dziś";
  if (days === 1) return "wczoraj";
  if (days < 7) return `${days} dni temu`;

  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}

export function formatDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getWeekRange(offset = 0): { start: Date; end: Date; label: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const label =
    offset === 0
      ? "ten tydzień"
      : offset === -1
      ? "poprzedni tydzień"
      : `${monday.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}`;

  return { start: monday, end: sunday, label };
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

export function getAgeNumber(age: string): number {
  switch (age) {
    case "18-24": return 21;
    case "25-30": return 27;
    case "31-40": return 35;
    case "41+": return 45;
    default: return 28;
  }
}
