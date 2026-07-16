"use client";

import { useState } from "react";
import { PhotoUploader } from "@/components/widget/PhotoUploader";
import { ResultViewer } from "@/components/widget/ResultViewer";
import { AssistantChat } from "@/components/widget/AssistantChat";
import { useAssistant } from "@/hooks/useAssistant";

/** Lit les query params de l'iframe de manière synchrone (avant le premier render). */
function useWidgetParams() {
  return useState(() => {
    if (typeof window === "undefined") return { productType: undefined as string | undefined, ton: undefined as string | undefined, boutique: undefined as string | undefined };
    const sp = new URLSearchParams(window.location.search);
    return {
      productType: sp.get("product_type") || undefined,
      ton: sp.get("ton") || undefined,
      boutique: sp.get("boutique") || undefined,
    };
  })[0];
}

export default function WidgetFrame() {
  const params = useWidgetParams();

  const [personPhoto, setPersonPhoto] = useState<string | null>(null);
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ image_url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const a = useAssistant(params.ton, params.boutique);

  const handlePersonPhoto = (file: File) => {
    setPersonFile(file);
    setPersonPhoto(URL.createObjectURL(file));
    setError(null);
    a.send("J'ai uploadé ma photo");
  };

  const handleSubmit = async () => {
    if (!personFile) {
      setError("Prends d'abord une photo");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Dans l'iframe, on appelle le widget-frame API
      const form = new FormData();
      form.append("person_image", personFile);
      form.append("request", JSON.stringify({
        mode: "article_unique",
        type_produit: params.productType || "vêtement",
        zone_corps: "haut du corps",
        style_rendu: "studio catalogue",
        orientation: "portrait 3:4",
      }));

      const res = await fetch("/api/tryon/generate", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Erreur génération");
      const data = await res.json();
      setResult(data);
      a.send("J'ai vu le résultat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
      a.send("Ça n'a pas marché");
    } finally {
      setLoading(false);
    }
  };

  const closeWidget = () => {
    window.parent.postMessage("close-widget", "*");
  };

  return (
    <div className="flex h-full flex-col bg-surface text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-semibold text-zinc-200">
          {params.boutique || "lebeSsni"}
        </span>
        <button
          onClick={closeWidget}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          aria-label="Fermer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!result ? (
          <div className="space-y-4">
            <PhotoUploader
              label="Ta photo"
              description="De face, bien éclairé(e)"
              preview={personPhoto || undefined}
              onChange={handlePersonPhoto}
            />

            <button
              onClick={handleSubmit}
              disabled={loading || !personFile}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white
                         transition-all hover:bg-indigo-500 active:scale-[0.98]
                         disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Génération..." : "Voir le rendu"}
            </button>

            {error && (
              <div className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {result.image_url && (
              <div className="overflow-hidden rounded-xl border border-zinc-700">
                <img src={result.image_url} alt="Rendu essayage" className="w-full" />
              </div>
            )}
            <p className="text-center text-sm text-zinc-400">
              {result.image_url
                ? "Voici un aperçu généré par IA, le rendu réel peut légèrement varier"
                : "Résultat prêt !"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setResult(null)}
                className="flex-1 rounded-xl bg-zinc-800 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={() => window.parent.postMessage("open-widget", "*")}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
              >
                ✅ Ajouter au panier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mini assistant en bas */}
      <div className="border-t border-zinc-800 px-4 py-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Une question ?"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-300 placeholder-zinc-500 outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                a.send((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
