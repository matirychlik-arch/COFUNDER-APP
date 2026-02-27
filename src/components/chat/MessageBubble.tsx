"use client";

import ReactMarkdown from "react-markdown";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  userName?: string;
}

export default function MessageBubble({ message, userName: _userName }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1 animate-fade-in">
        <div className="max-w-[78%] bg-[#1A1A2E] text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 py-1 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-[#F5A623] flex-shrink-0 mt-1" />
      <div
        className={cn(
          "max-w-[82%] text-[#1A1A2E] text-sm leading-relaxed",
          !message.content && "opacity-0"
        )}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-sm">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ children }) => (
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
