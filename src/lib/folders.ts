import type { Folder } from "@/types";

export const DEFAULT_FOLDERS: Folder[] = [
  {
    slug: "ideacja",
    label: "Ideacja",
    emoji: "💡",
    colorClass: "bg-violet-100",
    textColorClass: "text-violet-700",
    isDefault: true,
  },
  {
    slug: "produkt",
    label: "Produkt",
    emoji: "🛠️",
    colorClass: "bg-blue-100",
    textColorClass: "text-blue-700",
    isDefault: true,
  },
  {
    slug: "marketing",
    label: "Marketing",
    emoji: "📣",
    colorClass: "bg-emerald-100",
    textColorClass: "text-emerald-700",
    isDefault: true,
  },
  {
    slug: "finanse",
    label: "Finanse",
    emoji: "💰",
    colorClass: "bg-amber-100",
    textColorClass: "text-amber-700",
    isDefault: true,
  },
  {
    slug: "zespol",
    label: "Zespół",
    emoji: "👥",
    colorClass: "bg-pink-100",
    textColorClass: "text-pink-700",
    isDefault: true,
  },
  {
    slug: "fundraising",
    label: "Fundraising",
    emoji: "🚀",
    colorClass: "bg-orange-100",
    textColorClass: "text-orange-700",
    isDefault: true,
  },
  {
    slug: "operacje",
    label: "Operacje",
    emoji: "⚙️",
    colorClass: "bg-slate-100",
    textColorClass: "text-slate-700",
    isDefault: true,
  },
];

export function getFolderBySlug(slug: string, customFolders: Folder[] = []): Folder | undefined {
  return [...DEFAULT_FOLDERS, ...customFolders].find((f) => f.slug === slug);
}

export const FOLDER_COLORS = [
  { colorClass: "bg-violet-100", textColorClass: "text-violet-700", label: "Fioletowy" },
  { colorClass: "bg-blue-100", textColorClass: "text-blue-700", label: "Niebieski" },
  { colorClass: "bg-emerald-100", textColorClass: "text-emerald-700", label: "Zielony" },
  { colorClass: "bg-amber-100", textColorClass: "text-amber-700", label: "Żółty" },
  { colorClass: "bg-pink-100", textColorClass: "text-pink-700", label: "Różowy" },
  { colorClass: "bg-orange-100", textColorClass: "text-orange-700", label: "Pomarańczowy" },
  { colorClass: "bg-slate-100", textColorClass: "text-slate-700", label: "Szary" },
];
