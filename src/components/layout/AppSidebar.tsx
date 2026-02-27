"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  History,
  BarChart2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AvatarOrb from "@/components/chat/AvatarOrb";

const NAV_ITEMS = [
  { href: "/chat", icon: MessageSquare, label: "Czat" },
  { href: "/history", icon: History, label: "Historia" },
  { href: "/insights", icon: BarChart2, label: "Statystyki" },
  { href: "/settings", icon: Settings, label: "Ustawienia" },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 h-full bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-2 fixed left-0 top-0 bottom-0 z-20">
      {/* Logo */}
      <Link href="/chat" className="mb-4">
        <AvatarOrb size="sm" state="breath" />
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150",
                active
                  ? "bg-amber-50 text-[#F5A623]"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
