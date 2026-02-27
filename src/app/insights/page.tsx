"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Conversation } from "@/types";
import { getAllConversations, initStorageUser } from "@/lib/storage";
import { DEFAULT_FOLDERS } from "@/lib/folders";
import { getWeekRange } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MessageSquare, Zap, BookOpen } from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";
import { cn } from "@/lib/utils";

export default function InsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  if (session?.user?.id) initStorageUser(session.user.id);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) { router.replace("/"); return; }
    initStorageUser(session.user.id);
    setConversations(getAllConversations());
  }, [session, status, router]);

  const { start, end, label } = getWeekRange(weekOffset);

  const weekConvs = conversations.filter((c) => {
    const d = new Date(c.startedAt);
    return d >= start && d <= end;
  });

  const totalMessages = weekConvs.reduce((sum, c) => sum + c.messages.length, 0);
  const totalActionItems = weekConvs.reduce(
    (sum, c) => sum + (c.recap?.actionItems.length ?? 0),
    0
  );

  // Folder breakdown
  const folderBreakdown = DEFAULT_FOLDERS.map((f) => {
    const count = weekConvs.filter((c) => c.folderSlug === f.slug).length;
    return { ...f, count };
  }).filter((f) => f.count > 0);

  // All time stats
  const allTimeSessions = conversations.length;
  const allTimeMessages = conversations.reduce((s, c) => s + c.messages.length, 0);

  return (
    <div className="flex min-h-screen bg-white">
      <AppSidebar />
      <main className="flex-1 ml-16">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">statystyki</h1>
          <p className="text-sm text-gray-500 mb-8">
            twoje postępy z Founem w liczbach
          </p>

          {/* Week navigator */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <p className="font-medium text-[#1A1A2E] text-sm">{label}</p>
            <button
              onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
              disabled={weekOffset === 0}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Week stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "sesje", value: weekConvs.length, icon: MessageSquare, color: "text-[#F5A623]" },
              { label: "wiadomości", value: totalMessages, icon: BookOpen, color: "text-blue-500" },
              { label: "action items", value: totalActionItems, icon: Zap, color: "text-emerald-500" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-4 rounded-2xl border border-gray-100 text-center">
                <Icon size={20} className={cn("mx-auto mb-2", color)} />
                <p className="text-2xl font-bold text-[#1A1A2E]">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Folder breakdown for this week */}
          {folderBreakdown.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                tematy tego tygodnia
              </h2>
              <div className="space-y-2">
                {folderBreakdown.map((f) => (
                  <div key={f.slug} className="flex items-center gap-3">
                    <span className="text-lg w-7">{f.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#1A1A2E]">{f.label}</span>
                        <span className="text-xs text-gray-400">{f.count} sesji</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", f.colorClass.replace("-100", "-400"))}
                          style={{
                            width: `${Math.round((f.count / weekConvs.length) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All time stats */}
          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              ogólnie
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "wszystkich sesji", value: allTimeSessions },
                { label: "wszystkich wiadomości", value: allTimeMessages },
                {
                  label: "zakończone sesje",
                  value: conversations.filter((c) => c.status === "ended").length,
                },
                {
                  label: "action items łącznie",
                  value: conversations.reduce(
                    (s, c) => s + (c.recap?.actionItems.length ?? 0),
                    0
                  ),
                },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-2xl font-bold text-[#1A1A2E]">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {conversations.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <BarChart2Icon />
              <p className="text-sm mt-3">
                statystyki pojawią się po pierwszej rozmowie z Founem
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function BarChart2Icon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mx-auto opacity-30"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
