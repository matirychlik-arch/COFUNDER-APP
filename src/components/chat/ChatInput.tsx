"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string) => void;
  onVoiceMode?: () => void;
  isStreaming: boolean;
  onStop?: () => void;
  hasElevenLabsKey?: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  onVoiceMode,
  isStreaming,
  onStop,
  hasElevenLabsKey: _hasElevenLabsKey,
  disabled,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3">
      <div className="flex gap-3 items-end max-w-2xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="napisz do Founa..."
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none px-4 py-3 pr-12 rounded-2xl border-2 border-gray-200",
              "focus:border-[#F5A623] focus:outline-none text-sm text-[#1A1A2E]",
              "transition-colors duration-150 leading-relaxed",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "scrollbar-hide"
            )}
          />
        </div>

        <div className="flex gap-2 items-center pb-1">
          {/* Voice mode button */}
          {onVoiceMode && (
            <button
              onClick={onVoiceMode}
              title="Tryb głosowy"
              className="w-10 h-10 rounded-full bg-amber-50 text-[#F5A623] flex items-center justify-center hover:bg-amber-100 transition-colors"
            >
              <Mic size={18} />
            </button>
          )}

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              onClick={onStop}
              className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!text.trim() || disabled}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150",
                text.trim()
                  ? "bg-[#1A1A2E] text-white hover:bg-[#2a2a4e]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-gray-300 mt-2">enter = wyślij, shift+enter = nowa linia</p>
    </div>
  );
}
