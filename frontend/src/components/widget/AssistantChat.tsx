"use client";

import { useState, useRef, useEffect } from "react";
import type { AssistantMessage } from "@/lib/types";

interface AssistantChatProps {
  messages: AssistantMessage[];
  loading: boolean;
  onSend: (message: string) => void;
}

export function AssistantChat({
  messages,
  loading,
  onSend,
}: AssistantChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputId = "assistant-chat-input";
  const messagesId = "assistant-chat-messages";

  // prefers-reduced-motion pour l'auto-scroll
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    bottomRef.current?.scrollIntoView({
      behavior: prefersReduced ? "instant" : "smooth",
    });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <section
      aria-label="Assistant essayage virtuel"
      className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <div className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
        <span className="text-sm font-medium text-zinc-300">
          Assistant essayage
        </span>
      </div>

      {/* Messages — region live pour annonces aux SR */}
      <div
        id={messagesId}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-indigo-500/20 text-indigo-200"
                  : "bg-zinc-800 text-zinc-300"
              }`}
              role={msg.role === "assistant" ? "status" : undefined}
            >
              <p className="whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </p>

              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5" role="list">
                  {msg.suggested_actions.map((action) => (
                    <li key={action}>
                      <button
                        onClick={() => onSend(action)}
                        className="rounded-full border border-zinc-600 px-2.5 py-0.5 text-[11px]
                                   text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200
                                   focus-visible:outline-2 focus-visible:outline-indigo-500"
                      >
                        {action}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Pose ta question à l&apos;assistant
          </label>
          <input
            id={inputId}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Pose ta question..."
            aria-disabled={loading}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5
                       text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-all
                       focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20
                       disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Envoyer"
            className="rounded-xl bg-indigo-500/20 px-4 py-2.5 text-sm font-medium
                       text-indigo-300 transition-all hover:bg-indigo-500/30
                       focus-visible:outline-2 focus-visible:outline-indigo-500
                       disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center gap-1" aria-live="polite">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-300/30 border-t-indigo-300" />
                <span className="sr-only">Envoi en cours...</span>
              </span>
            ) : (
              "→"
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
