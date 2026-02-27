"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { Conversation, Folder } from "@/types";
import { getAllConversations, getCustomFolders } from "@/lib/storage";
import { DEFAULT_FOLDERS, getFolderBySlug } from "@/lib/folders";
import { formatDate, truncate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronRight, MessageSquare } from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";

export default function HistoryPage() {
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [customFolders, setCustomFolders] = useState<Folder[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    setConversations(getAllConversations());
    setCustomFolders(getCustomFolders());
  }, []);

  const allFolders = [...DEFAULT_FOLDERS, ...customFolders];

  const filtered =
    activeFilter === "all"
      ? conversations
      : conversations.filter((c) => c.folderSlug === activeFilter);

  return (
    <div className="flex min-h-screen bg-white">
      <AppSidebar />
      <main className="flex-1 ml-16">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">historia rozmów</h1>

          {/* Folder filter */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            <button
              onClick={() => setActiveFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                activeFilter === "all"
                  ? "bg-[#1A1A2E] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              wszystkie ({conversations.length})
            </button>
            {allFolders.map((f) => {
              const count = conversations.filter((c) => c.folderSlug === f.slug).length;
              if (count === 0) return null;
              return (
                <button
                  key={f.slug}
                  onClick={() => setActiveFilter(f.slug)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    activeFilter === f.slug
                      ? "bg-[#1A1A2E] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {f.emoji} {f.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Conversation list */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">brak rozmów</p>
              <Link
                href="/chat"
                className="mt-4 inline-block px-4 py-2 bg-[#1A1A2E] text-white rounded-xl text-sm"
              >
                zacznij pierwszą sesję
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((conv) => {
                const folder = getFolderBySlug(conv.folderSlug, customFolders);
                const title = conv.recap?.title ?? `Sesja ${formatDate(conv.startedAt)}`;
                const preview =
                  conv.recap?.summary ??
                  conv.messages.find((m) => m.role === "user")?.content ??
                  "Brak wiadomości";
                const msgCount = conv.messages.length;

                return (
                  <Link
                    key={conv.id}
                    href={conv.status === "active" ? `/chat/${conv.id}` : `/chat/${conv.id}`}
                    className="block"
                  >
                    <div className="p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-150 flex gap-3 items-start">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg",
                          folder?.colorClass ?? "bg-gray-100"
                        )}
                      >
                        {folder?.emoji ?? "💬"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-[#1A1A2E] text-sm leading-snug truncate">
                            {title}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatDate(conv.startedAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                          {truncate(preview, 120)}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              folder?.colorClass ?? "bg-gray-100",
                              folder?.textColorClass ?? "text-gray-600"
                            )}
                          >
                            {folder?.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {msgCount} {msgCount === 1 ? "wiadomość" : "wiadomości"}
                          </span>
                          {conv.status === "active" && (
                            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                              aktywna
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {conv.recap?.tags && conv.recap.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {conv.recap.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
