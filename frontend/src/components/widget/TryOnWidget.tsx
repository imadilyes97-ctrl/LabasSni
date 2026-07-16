"use client";

import { useTryOn } from "@/hooks/useTryOn";
import { useAssistant } from "@/hooks/useAssistant";
import { PhotoUploader } from "./PhotoUploader";
import { ModeSelector } from "./ModeSelector";
import { ResultViewer } from "./ResultViewer";
import { AssistantChat } from "./AssistantChat";

export function TryOnWidget() {
  const t = useTryOn();
  const a = useAssistant();

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      {/* Main — Upload + Try-On */}
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            Essayage Virtuel
          </h1>
          <p className="text-sm text-zinc-500">
            Uploade ta photo et découvre le rendu en quelques secondes
          </p>
        </header>

        {/* Mode selector */}
        <ModeSelector mode={t.mode} onChange={t.setMode} />

        {/* Upload side by side */}
        <div className="grid grid-cols-2 gap-4">
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

        {/* Error */}
        {t.error && (
          <div className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            ⚠️ {t.error}
          </div>
        )}

        {/* Result */}
        {t.result && !t.loading && (
          <ResultViewer result={t.result} onReset={t.reset} />
        )}
      </div>

      {/* Sidebar — Assistant Chat */}
      <AssistantChat
        messages={a.messages}
        loading={a.loading}
        onSend={a.send}
      />
    </div>
  );
}
