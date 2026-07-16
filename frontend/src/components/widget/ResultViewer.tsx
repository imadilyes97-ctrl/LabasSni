"use client";

import { useState } from "react";
import type { TryOnResponse } from "@/lib/types";

interface ResultViewerProps {
  result: TryOnResponse;
  onReset: () => void;
}

export function ResultViewer({ result, onReset }: ResultViewerProps) {
  const [imgError, setImgError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!result.image_url || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(result.image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lebessni-${result.id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback : ouverture dans un nouvel onglet
      window.open(result.image_url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="mb-2 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
        ✅ Généré
      </div>
      <h3 className="mb-4 text-lg font-semibold text-zinc-100">
        Résultat de l&apos;essayage
      </h3>

      {result.image_url && !imgError && (
        <div className="group/image relative mx-auto mb-4 max-w-sm overflow-hidden rounded-xl border border-zinc-700">
          <img
            src={result.image_url}
            alt="Rendu essayage virtuel — photo de la personne portant le produit"
            className="w-full transition-all group-hover/image:scale-[1.02]"
            onError={() => setImgError(true)}
          />
          {/* Overlay de téléchargement */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/0 transition-all group-hover/image:bg-black/40">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-white opacity-0
                         backdrop-blur-sm transition-all hover:bg-white/20
                         group-hover/image:opacity-100"
              aria-label="Télécharger l'image"
            >
              {downloading ? "..." : "💾 Télécharger"}
            </button>
          </div>
        </div>
      )}

      {imgError && (
        <div className="mx-auto mb-4 max-w-sm rounded-xl border border-red-800 bg-red-900/20 px-4 py-6 text-center">
          <p className="text-sm text-red-400">⚠️ Le rendu n&apos;a pas pu être chargé</p>
          <button
            onClick={handleDownload}
            className="mt-2 text-xs font-medium text-red-300 underline underline-offset-2
                       hover:text-red-200 transition-colors"
          >
            Essayer de télécharger
          </button>
        </div>
      )}

      {result.validation_checklist && (
        <div className="mb-4 grid grid-cols-2 gap-2 text-left text-xs text-zinc-400">
          {Object.entries(result.validation_checklist).map(([key, val]) => (
            <span key={key} className="flex items-center gap-1">
              <span aria-hidden="true">{val ? "✅" : "⚠️"}</span>{" "}
              <span>
                {key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </span>
          ))}
        </div>
      )}

      {result.message && (
        <p className="mb-4 text-sm text-zinc-400">{result.message}</p>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onReset}
          className="rounded-xl bg-zinc-800 px-6 py-2.5 text-sm font-medium text-zinc-200
                     transition-all hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-indigo-500"
        >
          Nouvel essayage
        </button>
      </div>
    </div>
  );
}
