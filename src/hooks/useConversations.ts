"use client";

import { useState, useEffect, useCallback } from "react";
import type { Conversation, Message, SessionRecap } from "@/types";
import {
  getAllConversations,
  getConversation,
  saveConversation,
  deleteConversation,
} from "@/lib/storage";
import { generateId } from "@/lib/utils";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const reload = useCallback(() => {
    setConversations(getAllConversations());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const createConversation = useCallback(
    (folderSlug: string, visionerModeActive: boolean): Conversation => {
      const conv: Conversation = {
        id: generateId(),
        folderSlug,
        messages: [],
        recap: null,
        status: "active",
        visionerModeActive,
        startedAt: new Date().toISOString(),
        endedAt: null,
      };
      saveConversation(conv);
      reload();
      return conv;
    },
    [reload]
  );

  const addMessage = useCallback(
    (conversationId: string, message: Message) => {
      const conv = getConversation(conversationId);
      if (!conv) return;
      conv.messages.push(message);
      saveConversation(conv);
      reload();
    },
    [reload]
  );

  const updateLastAssistantMessage = useCallback(
    (conversationId: string, content: string) => {
      const conv = getConversation(conversationId);
      if (!conv) return;
      const lastMsg = conv.messages[conv.messages.length - 1];
      if (lastMsg?.role === "assistant") {
        lastMsg.content = content;
        saveConversation(conv);
        reload();
      }
    },
    [reload]
  );

  const endConversation = useCallback(
    (conversationId: string, recap: SessionRecap) => {
      const conv = getConversation(conversationId);
      if (!conv) return;
      conv.status = "ended";
      conv.recap = recap;
      conv.endedAt = new Date().toISOString();
      saveConversation(conv);
      reload();
    },
    [reload]
  );

  const remove = useCallback(
    (conversationId: string) => {
      deleteConversation(conversationId);
      reload();
    },
    [reload]
  );

  return {
    conversations,
    createConversation,
    addMessage,
    updateLastAssistantMessage,
    endConversation,
    remove,
    reload,
  };
}
