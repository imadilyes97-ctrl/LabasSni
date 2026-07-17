"use client";

import { useState, useMemo } from "react";
import { PhotoUploader } from "@/components/widget/PhotoUploader";
import { useAssistant } from "@/hooks/useAssistant";

/** Lis et valide tous les paramètres de configuration du widget depuis l'URL */
function useWidgetConfig() {
  return useMemo(() => {
    if (typeof window === "undefined") return defaultConfig();
    const sp = new URLSearchParams(window.location.search);
    return {
      // Produit
      productId: sp.get("product_id") || undefined,
      productName: sp.get("product_name") || undefined,
      productType: sp.get("product_type") || undefined,
      productImage: sp.get("product_image") || undefined,

      // Branding
      boutique: sp.get("boutique") || undefined,
      logoUrl: sp.get("logo_url") || undefined,
      primaryColor: sp.get("primary_color") || "#4f46e5",
      bgColor: sp.get("bg_color") || "#0a0a0f",
      textColor: sp.get("text_color") || "#f4f4f5",
      fontFamily: sp.get("font") || "'Inter', system-ui, sans-serif",
      borderRadius: sp.get("radius") || "12",
      lang: sp.get("lang") || "fr",

      // Assistant
      ton: sp.get("ton") || undefined,

      // Texte personnalisé
      ctaText: sp.get("cta_text") || "Voir le rendu",
      title: sp.get("title") || undefined,
      subtitle: sp.get("subtitle") || undefined,
      generatingText: sp.get("generating_text") || "Génération en cours...",
      retryText: sp.get("retry_text") || "Réessayer",
      addToCartText: sp.get("add_to_cart_text") || "Ajouter au panier",

      // Comportement
      hideHeader: sp.get("hide_header") === "true",
      hideChat: sp.get("hide_chat") === "true",
      height: sp.get("height") || "700",
      width: sp.get("width") || "100%",
    };
  }, []);
}

function defaultConfig() {
  return {
    productId: undefined as string | undefined,
    productName: undefined as string | undefined,
    productType: undefined as string | undefined,
    productImage: undefined as string | undefined,
    boutique: undefined as string | undefined,
    logoUrl: undefined as string | undefined,
    primaryColor: "#4f46e5",
    bgColor: "#0a0a0f",
    textColor: "#f4f4f5",
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: "12",
    lang: "fr",
    ton: undefined as string | undefined,
    ctaText: "Voir le rendu",
    title: undefined as string | undefined,
    subtitle: undefined as string | undefined,
    generatingText: "Génération en cours...",
    retryText: "Réessayer",
    addToCartText: "Ajouter au panier",
    hideHeader: false,
    hideChat: false,
    height: "700",
    width: "100%",
  };
}

export default function WidgetFrame() {
  const config = useWidgetConfig();

  const [personPhoto, setPersonPhoto] = useState<string | null>(null);
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ image_url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const a = useAssistant(config.ton, config.boutique);

  const inlineStyle = useMemo(() => ({
    "--widget-primary": config.primaryColor,
    "--widget-bg": config.bgColor,
    "--widget-text": config.textColor,
    "--widget-font": config.fontFamily,
    "--widget-radius": `${config.borderRadius}px`,
  } as React.CSSProperties), [config]);

  const handlePersonPhoto = (file: File) => {
    setPersonFile(file);
    setPersonPhoto(URL.createObjectURL(file));
    setError(null);
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
      const form = new FormData();
      form.append("person_image", personFile);
      form.append("request", JSON.stringify({
        mode: "article_unique",
        type_produit: config.productType || "vêtement",
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={inlineStyle}
      className="flex h-full flex-col"
      data-lang={config.lang}
    >
      <style>{`
        :root {
          --primary: ${config.primaryColor};
          --bg: ${config.bgColor};
          --text: ${config.textColor};
          --radius: ${config.borderRadius}px;
        }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: ${config.fontFamily};
        }
        .widget-btn {
          background: var(--primary);
          color: white;
          border-radius: var(--radius);
        }
        .widget-btn:hover {
          filter: brightness(1.1);
        }
        .widget-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .widget-border {
          border-color: color-mix(in srgb, var(--text) 20%, transparent);
        }
      `}</style>

      {/* Header */}
      {!config.hideHeader && (
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: `${config.textColor}20` }}>
          <div className="flex items-center gap-2">
            {config.logoUrl && (
              <img src={config.logoUrl} alt={config.boutique || "Logo"} className="h-6 w-6 rounded-full object-cover" />
            )}
            <span className="text-sm font-semibold" style={{ color: config.textColor }}>
              {config.title || config.boutique || "Essayage Virtuel"}
            </span>
          </div>
          <button
            onClick={() => window.parent.postMessage("close-widget", "*")}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
            style={{ color: `${config.textColor}80` }}
            aria-label="Fermer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {result ? (
          <div className="space-y-4">
            {result.image_url && (
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: `${config.textColor}20` }}>
                <img src={result.image_url} alt="Rendu essayage" className="w-full" />
              </div>
            )}
            <p className="text-center text-sm opacity-60">
              Aperçu généré par IA — le rendu réel peut varier
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setResult(null)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: `${config.textColor}10`,
                  color: config.textColor,
                }}
              >
                {config.retryText}
              </button>
              <button
                onClick={() => window.parent.postMessage("add-to-cart", "*")}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium widget-btn"
              >
                ✅ {config.addToCartText}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Product info */}
            {config.productName && (
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: `${config.textColor}08` }}>
                {config.productImage && (
                  <img src={config.productImage} alt={config.productName} className="h-14 w-14 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium text-sm">{config.productName}</p>
                  {config.boutique && (
                    <p className="text-xs opacity-50">{config.boutique}</p>
                  )}
                </div>
              </div>
            )}

            <PhotoUploader
              label="Ta photo"
              description="De face, bien éclairé(e)"
              preview={personPhoto || undefined}
              onChange={handlePersonPhoto}
            />

            <button
              onClick={handleSubmit}
              disabled={loading || !personFile}
              className="w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] widget-btn"
            >
              {loading ? config.generatingText : config.ctaText}
            </button>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{
                background: `${config.textColor}10`,
                color: config.textColor,
                border: `1px solid ${config.textColor}20`,
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assistant chat */}
      {!config.hideChat && (
        <div className="border-t px-4 py-2" style={{ borderColor: `${config.textColor}20` }}>
          <input
            type="text"
            placeholder="Une question ?"
            className="w-full rounded-lg px-3 py-2 text-xs outline-none"
            style={{
              background: `${config.textColor}08`,
              color: config.textColor,
              border: `1px solid ${config.textColor}15`,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                a.send((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
