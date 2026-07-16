"use client";

import { useState } from "react";
import { useTryOn } from "@/hooks/useTryOn";
import { useAssistant } from "@/hooks/useAssistant";
import { PhotoUploader } from "./PhotoUploader";
import { ModeSelector } from "./ModeSelector";
import { ResultViewer } from "./ResultViewer";
import { AssistantChat } from "./AssistantChat";

interface TryOnWidgetProps {
  productType?: string;
  ton?: string;
  boutique?: string;
}

export function TryOnWidget({ productType, ton, boutique }: TryOnWidgetProps) {
  const t = useTryOn(productType);
  const a = useAssistant(ton, boutique);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:py-8">
      <div className="relative lg:grid lg:grid-cols-[1fr_360px] lg:gap-6">
        {/* Main — Upload + Try-On */}
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
              {boutique ? `${boutique} — ` : ""}Essayage Virtuel
            </h1>
            <p className="text-sm text-zinc-500">
              Uploade ta photo et découvre le rendu en quelques secondes
            </p>
          </header>

          {/* Mode selector */}
          <ModeSelector mode={t.mode} onChange={t.setMode} />

          {/* Upload side by side */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <PhotoUploader
              label="Ta photo"
              description="De face, bien éclairé(e)"
              preview={t.upload.personPreview}
              onChange={t.setPersonPhoto}
            />
            <PhotoUploader
              label="Le produit"
              description="Photo du vêtement"
              preview={t.upload.productPreview}
              onChange={t.setProductPhoto}
            />
          </div>

          {/* Submit */}
          <button
            onClick={t.submit}
            disabled={t.loading}
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white
                       transition-all hover:bg-indigo-500 active:scale-[0.98]
                       focus-visible:outline-2 focus-visible:outline-indigo-400
                       disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Génération en cours...
              </span>
            ) : (
              "Voir le rendu"
            )}
          </button>

          {/* Skeleton loader pendant génération */}
          {t.loading && (
            <div className="animate-pulse space-y-3">
              <div className="h-6 w-24 rounded-full bg-zinc-800" />
              <div className="h-4 w-40 rounded bg-zinc-800" />
              <div className="aspect-[3/4] max-w-sm rounded-xl bg-zinc-800" />
            </div>
          )}

          {/* Error */}
          {t.error && (
            <div
              role="alert"
              className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400"
            >
              <p className="font-medium">⚠️ Oups, une erreur est survenue</p>
              <p className="mt-1 text-red-400/80">{t.error}</p>
              <button
                onClick={t.reset}
                className="mt-2 text-xs font-medium text-red-300 underline underline-offset-2
                           hover:text-red-200 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Result */}
          {t.result && !t.loading && (
            <ResultViewer result={t.result} onReset={t.reset} />
          )}
        </div>

        {/* Desktop sidebar chat */}
        <div className="hidden lg:block">
          <div className="sticky top-8 h-[calc(100vh-4rem)]">
            <AssistantChat
              messages={a.messages}
              loading={a.loading}
              onSend={a.send}
            />
          </div>
        </div>
      </div>

      {/* Mobile FAB + Drawer chat */}
      <div className="fixed bottom-6 right-4 z-50 lg:hidden">
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full
                       bg-indigo-600 text-white shadow-lg shadow-indigo-600/30
                       transition-all hover:bg-indigo-500 active:scale-95
                       focus-visible:outline-2 focus-visible:outline-indigo-400"
            aria-label="Ouvrir l'assistant"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile chat drawer overlay */}
      {chatOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setChatOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 top-[15%] animate-slide-up">
            <div className="flex h-full flex-col rounded-t-3xl border border-zinc-800 bg-surface">
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm font-medium text-zinc-300">
                  Assistant
                </span>
                <button
                  onClick={() => setChatOpen(false)}
                  className="rounded-lg p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Fermer l'assistant"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 px-4 pb-4">
                <AssistantChat
                  messages={a.messages}
                  loading={a.loading}
                  onSend={a.send}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
