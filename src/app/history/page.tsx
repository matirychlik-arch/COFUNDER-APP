"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { Conversation } from "@/types";
import { getAllConversations } from "@/lib/storage";
import { formatDate, truncate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronRight, MessageSquare } from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTag, setActiveTag] = useState<string>("all");

  useEffect(() => {
    setConversations(getAllConversations());
  }, []);

  // Collect all unique tags from ended conversations
  const allTags = Array.from(
    new Set(
      conversations
        .flatMap((c) => c.recap?.tags ?? [])
        .filter(Boolean)
    )
  ).sort();

  const filtered =
    activeTag === "all"
      ? conversations
      : conversations.filter((c) => c.recap?.tags?.includes(activeTag));

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  return (
    <div className="flex min-h-screen bg-white">
      <AppSidebar />
      <main className="flex-1 ml-16">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">historia rozmów</h1>

          {/* Tag filter */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            <button
              onClick={() => setActiveTag("all")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                activeTag === "all"
                  ? "bg-[#1A1A2E] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              wszystkie ({conversations.length})
            </button>
            {allTags.map((tag) => {
              const count = conversations.filter((c) => c.recap?.tags?.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    activeTag === tag
                      ? "bg-amber-500 text-white"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  )}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>

          {/* Conversation list */}
          {sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                {activeTag === "all" ? "brak rozmów" : `brak rozmów z tagiem "${activeTag}"`}
              </p>
              <Link
                href="/chat"
                className="mt-4 inline-block px-4 py-2 bg-[#1A1A2E] text-white rounded-xl text-sm"
              >
                zacznij pierwszą sesję
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((conv) => {
                const title = conv.recap?.title ?? `Sesja ${formatDate(conv.startedAt)}`;
                const preview =
                  conv.recap?.summary ??
                  conv.messages.find((m) => m.role === "user")?.content ??
                  "Brak wiadomości";
                const msgCount = conv.messages.length;
                const tags = conv.recap?.tags ?? [];

                return (
                  <Link key={conv.id} href={`/chat/${conv.id}`} className="block">
                    <div className="p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-150 flex gap-3 items-start">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 text-lg">
                        💬
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
                          <span className="text-xs text-gray-400">
                            {msgCount} {msgCount === 1 ? "wiadomość" : "wiadomości"}
                          </span>
                          {conv.status === "active" && (
                            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                              aktywna
                            </span>
                          )}
                        </div>

                        {tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {tags.slice(0, 4).map((tag, i) => (
                              <button
                                key={i}
                                onClick={(e) => { e.preventDefault(); setActiveTag(tag); }}
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full transition-colors",
                                  activeTag === tag
                                    ? "bg-amber-500 text-white"
                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                )}
                              >
                                {tag}
                              </button>
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
