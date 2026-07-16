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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <div className="h-2 w-2 rounded-full bg-indigo-500" />
        <span className="text-sm font-medium text-zinc-300">
          Assistant essayage
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
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
            >
              <p className="whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </p>

              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.suggested_actions.map((action) => (
                    <button
                      key={action}
                      onClick={() => onSend(action)}
                      className="rounded-full border border-zinc-600 px-2.5 py-0.5 text-[11px]
                                 text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Pose ta question..."
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5
                       text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-all
                       focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-indigo-500/20 px-4 py-2.5 text-sm font-medium
                       text-indigo-300 transition-all hover:bg-indigo-500/30
                       disabled:opacity-40"
          >
            {loading ? "..." : "→"}
          </button>
        </div>
      </div>
    </div>
  );
}
