"use client";

import { useState, useCallback, useRef } from "react";
import type { Message, UserProfile } from "@/types";
import { generateId } from "@/lib/utils";
import { buildSystemPrompt } from "@/lib/anthropic";

interface UseChatOptions {
  profile: UserProfile;
  folderLabel: string;
  visionerMode: boolean;
  onMessageSaved: (msg: Message) => void;
  onAssistantUpdate: (content: string) => void;
}

export function useChat({
  profile,
  folderLabel,
  visionerMode,
  onMessageSaved,
  onAssistantUpdate,
}: UseChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, history: { role: string; content: string }[]) => {
      if (!content.trim() || isStreaming) return;

      setError(null);
      setIsStreaming(true);

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      onMessageSaved(userMsg);

      // Placeholder for streaming assistant message
      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      onMessageSaved(assistantMsg);

      const messages = [
        ...history,
        { role: "user", content: content.trim() },
      ];

      const systemPrompt = buildSystemPrompt(profile, folderLabel, visionerMode);

      try {
        abortRef.current = new AbortController();
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            systemPrompt,
            apiKey: profile.anthropicApiKey,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Błąd API" }));
          throw new Error(err.error || "Błąd połączenia z API");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            accumulated += chunk;
            onAssistantUpdate(accumulated);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Coś poszło nie tak";
        setError(message);
        onAssistantUpdate(`⚠️ ${message}`);
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, profile, folderLabel, visionerMode, onMessageSaved, onAssistantUpdate]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { sendMessage, isStreaming, error, abort };
}
