"use client";

import { useState, useCallback } from "react";
import type { AssistantMessage } from "@/lib/types";
import { assistantChat } from "@/lib/api";

export function useAssistant(ton?: string, boutique?: string) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "👋 Bienvenue sur l'essayage virtuel ! Uploade ta photo et choisis un produit pour voir le rendu en temps réel. Besoin d'aide ? Dis-moi !",
      suggested_actions: [
        "Uploader ma photo",
        "Comment ça marche ?",
        "Confidentialité ?",
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);

  const send = useCallback(async (message: string) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    try {
      const data = await assistantChat(message, undefined, ton, boutique);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          suggested_actions: data.suggested_actions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "😅 Désolé, je n'ai pas pu répondre. Réessaie !",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [ton, boutique]);

  return { messages, loading, send };
}
