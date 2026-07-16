"use client";

import type { TryOnResponse } from "@/lib/types";

interface ResultViewerProps {
  result: TryOnResponse;
  onReset: () => void;
}

export function ResultViewer({ result, onReset }: ResultViewerProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
      <div className="mb-2 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
        ✅ Généré
      </div>
      <h3 className="mb-4 text-lg font-semibold text-zinc-100">
        Résultat de l&apos;essayage
      </h3>

      {result.image_url && (
        <div className="mx-auto mb-4 max-w-sm overflow-hidden rounded-xl border border-zinc-700">
          <img
            src={result.image_url}
            alt="Rendu essayage virtuel"
            className="w-full"
          />
        </div>
      )}

      {result.validation_checklist && (
        <div className="mb-4 grid grid-cols-2 gap-2 text-left text-xs text-zinc-400">
          {Object.entries(result.validation_checklist).map(([key, val]) => (
            <span key={key} className="flex items-center gap-1">
              {val ? "✅" : "⚠️"}{" "}
              {key
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          ))}
        </div>
      )}

      {result.message && (
        <p className="mb-4 text-sm text-zinc-400">{result.message}</p>
      )}

      <button
        onClick={onReset}
        className="rounded-xl bg-zinc-800 px-6 py-2.5 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-700"
      >
        Nouvel essayage
      </button>
    </div>
  );
}
