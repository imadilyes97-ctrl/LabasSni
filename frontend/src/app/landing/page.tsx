"use client";

import { useState, useEffect, useCallback } from "react";
import Script from "next/script";
import { PhotoUploader } from "@/components/widget/PhotoUploader";
import { ResultViewer } from "@/components/widget/ResultViewer";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "";
const hasMeta = !!META_PIXEL_ID;
const hasTikTok = !!TIKTOK_PIXEL_ID;

function trackMetaEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", event, data);
  }
}

function trackTikTokEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as any).ttq) {
    (window as any).ttq.track(event, data);
  }
}

export default function LandingPage() {
  const [personPhoto, setPersonPhoto] = useState<string | null>(null);
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ image_url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!personFile) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("person_image", personFile);
      form.append("request", JSON.stringify({ mode: "article_unique", type_produit: "vêtement" }));
      const res = await fetch("/api/tryon/generate", { method: "POST", body: form });
      if (!res.ok) throw new Error("Erreur");
      setResult(await res.json());
      trackMetaEvent("SubmitApplication");
      trackTikTokEvent("SubmitApplication");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = useCallback(() => {
    trackMetaEvent("Purchase");
    trackTikTokEvent("Purchase");
  }, []);

  // Fire ViewContent / PageView once on mount
  useEffect(() => {
    if (hasMeta) {
      trackMetaEvent("ViewContent", { content_type: "landing" });
    }
    if (hasTikTok) {
      trackTikTokEvent("ViewContent", { content_type: "landing" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Meta Pixel Script */}
      {hasMeta && (
        <>
          <Script
            id="meta-pixel-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* TikTok Pixel Script */}
      {hasTikTok && (
        <Script
          id="tiktok-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)));}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.load=function(t,e){var n=document.createElement("script");n.type="text/javascript";n.async=!0;
              n.src="https://analytics.tiktok.com/i18n/pixel/events.js?sdkid="+t+"&lib="+e;
              var o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(n,o);};
              ttq.load('${TIKTOK_PIXEL_ID}');
              ttq.page();
            }(window, document, 'ttq');
            `,
          }}
        />
      )}

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mx-auto inline-block rounded-full border border-zinc-700 bg-zinc-900/50 px-4 py-1 text-xs text-zinc-400 mb-6">
            🔥 Essayage virtuel IA
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-6xl">
            Vois le rendu{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              avant d&apos;acheter
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-zinc-500">
            Uploade ta photo et découvre comment ce produit tombe sur toi — en quelques secondes, sans inscription.
          </p>
        </div>
      </section>

      {/* Try-On Section */}
      <section className="mx-auto max-w-2xl px-6 py-12">
        {result ? (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-zinc-700">
              <img src={result.image_url} alt="Rendu" className="w-full" />
            </div>
            <p className="text-center text-sm text-zinc-500">
              Voici un aperçu généré par IA — le rendu réel peut légèrement varier
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setResult(null)}
                className="rounded-xl bg-zinc-800 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={handleBuyClick}
                className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Acheter maintenant →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto max-w-xs">
              <PhotoUploader
                label="Ta photo"
                description="De face, bien éclairé(e)"
                preview={personPhoto || undefined}
                onChange={(f) => {
                  setPersonFile(f);
                  setPersonPhoto(URL.createObjectURL(f));
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !personFile}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white
                         transition-all hover:bg-indigo-500 disabled:opacity-40"
            >
              {loading ? "Génération..." : "Voir le rendu"}
            </button>

            {error && (
              <div className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="border-t border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { icon: "📸", title: "1. Uploade ta photo", desc: "Prends une photo de face, bien éclairée" },
              { icon: "✨", title: "2. L'IA génère le rendu", desc: "Notre IA habille ta photo en temps réel" },
              { icon: "🛍️", title: "3. Achete en confiance", desc: "Plus de doute — tu vois le résultat avant" },
            ].map((f) => (
              <div key={f.title} className="text-center">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-200">{f.title}</h3>
                <p className="text-sm text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RGPD */}
      <section className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-xs text-zinc-600">
          🔒 Ta photo est utilisée uniquement pour générer l&apos;essayage. Elle est supprimée automatiquement après 24h.
          Jamais partagée, jamais réutilisée. Consulte notre{" "}
          <a href="/privacy" className="text-zinc-400 underline underline-offset-2 hover:text-zinc-300">
            politique de confidentialité
          </a>.
        </p>
      </section>
    </div>
  );
}
