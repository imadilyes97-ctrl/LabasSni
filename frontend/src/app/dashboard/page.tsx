"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getDashboardConfig,
  updateDashboardConfig,
  type DashboardConfig,
} from "@/lib/api";

type Tab = "widget" | "config";

/* ===================================================================
   PAGE PRINCIPALE
   =================================================================== */

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("widget");
  const [authChecked, setAuthChecked] = useState(false);

  // Auth guard — rediriger vers /login si pas de token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-indigo-500" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "widget", label: "🪟 Widget" },
    { key: "config", label: "⚙️ Configuration" },
  ];

  return (
    <div className="min-h-screen bg-surface text-white">
      {/* Top bar */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-100">lebeSsni</h1>
          <span className="text-sm text-zinc-500">Vendeur · Dashboard</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Tabs */}
        <nav className="mb-8 flex gap-2 border-b border-zinc-800">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-indigo-500 text-indigo-300"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        {tab === "widget" && <WidgetTab />}
        {tab === "config" && <ConfigTab />}
      </div>
    </div>
  );
}

/* ===================================================================
   CONFIG TAB
   =================================================================== */

function ConfigTab() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const TON_OPTIONS = [
    "Chaleureux et rassurant",
    "Elégant et premium",
    "Décontracté et amical",
  ];

  const RETENTION_OPTIONS = ["24h", "48h", "72h"];

  useEffect(() => {
    (async () => {
      setLoading(true);
      setDemo(false);
      try {
        const data = await getDashboardConfig();
        setConfig(data);
      } catch {
        setDemo(true);
        setConfig({
          ton_assistant: "Chaleureux et rassurant",
          duree_retention: "24h",
          pixel_meta: "",
          pixel_tiktok: "",
          webhook_url: "",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await updateDashboardConfig(config);
      setConfig(updated);
      setToast({ message: "Configuration enregistrée", type: "success" });
    } catch {
      setToast({
        message: "Erreur lors de l'enregistrement",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof DashboardConfig, value: string) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-indigo-500" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="max-w-lg space-y-6">
      {toast && (
        <div className={`fixed right-6 top-6 z-50 rounded-xl px-5 py-3 text-sm font-medium shadow-lg transition-all ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-3 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-200">Configuration</h2>
        {demo && (
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
            Mode démo — données non synchronisées
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Ton de l&apos;assistant
          </label>
          <select
            value={config.ton_assistant}
            onChange={(e) => update("ton_assistant", e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500"
          >
            {TON_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Durée de rétention des photos
          </label>
          <select
            value={config.duree_retention}
            onChange={(e) => update("duree_retention", e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500"
          >
            {RETENTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Pixel Meta (optionnel)
          </label>
          <input
            type="text"
            value={config.pixel_meta}
            onChange={(e) => update("pixel_meta", e.target.value)}
            placeholder="Votre pixel ID"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Pixel TikTok (optionnel)
          </label>
          <input
            type="text"
            value={config.pixel_tiktok}
            onChange={(e) => update("pixel_tiktok", e.target.value)}
            placeholder="Votre pixel ID"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Webhook URL (optionnel)
          </label>
          <input
            type="text"
            value={config.webhook_url}
            onChange={(e) => update("webhook_url", e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-600"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

/* ===================================================================
   WIDGET TAB — Installation & configuration
   =================================================================== */

function WidgetTab() {
  const [nomBoutique, setNomBoutique] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [bgColor, setBgColor] = useState("#0a0a0f");
  const [textColor, setTextColor] = useState("#f4f4f5");
  const [ctaText, setCtaText] = useState("Voir le rendu");
  const [hideChat, setHideChat] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const [radius, setRadius] = useState("12");
  const [copied, setCopied] = useState(false);

  // Récupérer le nom de la boutique depuis le localStorage
  useEffect(() => {
    const stored = localStorage.getItem("nom_boutique");
    if (stored) setNomBoutique(stored);
  }, []);

  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const baseUrl = origin || "https://labas-sni.vercel.app";

  const scriptCode = useMemo(() => {
    const attrs = [];
    if (nomBoutique) attrs.push(`data-boutique="${nomBoutique}"`);
    if (primaryColor !== "#4f46e5") attrs.push(`data-primary="${primaryColor}"`);
    if (bgColor !== "#0a0a0f") attrs.push(`data-bg="${bgColor}"`);
    if (textColor !== "#f4f4f5") attrs.push(`data-text="${textColor}"`);
    if (ctaText !== "Voir le rendu") attrs.push(`data-btn-text="${ctaText}"`);
    if (hideChat) attrs.push('data-hide-chat="true"');
    const attrStr = attrs.join("\n  ");
    return `<script src="${baseUrl}/widget.js"\n  ${attrStr}>\x3C/script>`;
  }, [baseUrl, nomBoutique, primaryColor, bgColor, textColor, ctaText, hideChat]);

  const widgetUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (nomBoutique) params.set("boutique", nomBoutique);
    if (primaryColor !== "#4f46e5") params.set("primary_color", primaryColor);
    if (bgColor !== "#0a0a0f") params.set("bg_color", bgColor);
    if (textColor !== "#f4f4f5") params.set("text_color", textColor);
    if (ctaText !== "Voir le rendu") params.set("cta_text", ctaText);
    if (hideChat) params.set("hide_chat", "true");
    params.set("hide_header", "true");
    const qs = params.toString();
    return `${baseUrl}/widget-frame${qs ? "?" + qs : ""}`;
  }, [baseUrl, nomBoutique, primaryColor, bgColor, textColor, ctaText, hideChat]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-200">
          🪟 Installation du Widget
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Colle ce script sur ta page produit. Le widget détecte automatiquement le produit,
          ajoute un bouton flottant "Essayez-moi !", et ouvre une popup.
          <strong className="text-zinc-300"> Aucune configuration dans le dashboard nécessaire.</strong>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── Configurateur ── */}
        <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="text-sm font-semibold text-zinc-300">Personnalisation</h3>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nom de la boutique</label>
            <input type="text" value={nomBoutique}
              onChange={(e) => setNomBoutique(e.target.value)}
              placeholder="Ma Boutique"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-600" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Couleur principale</label>
              <input type="color" value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Fond popup</label>
              <input type="color" value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Texte</label>
              <input type="color" value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Texte du bouton flottant</label>
            <input type="text" value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={hideChat}
              onChange={(e) => setHideChat(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 accent-indigo-500" />
            <span className="text-sm text-zinc-400">Cacher le chat dans la popup</span>
          </label>
        </div>

        {/* ── Aperçu + Code ── */}
        <div className="space-y-5">
          {/* Bouton preview (simulé) */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
            style={{ minHeight: 200 }}>
            <div className="text-xs text-zinc-500 mb-3">🎯 À quoi ça ressemble sur ta page produit</div>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/30 p-6">
              <div className="text-center">
                <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">🖼️</div>
                <p className="text-sm text-zinc-500">Page produit du vendeur</p>
                <p className="text-xs text-zinc-600 mt-1">Le widget ajoute un bouton flottant en bas à droite</p>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 rounded-full shadow-lg flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white"
              style={{ background: primaryColor }}>
              👕 Essayez-moi !
            </div>
          </div>

          {/* Code embed (SCRIPT) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
              <span className="text-xs text-zinc-500">📋 Code à copier (script)</span>
              <button onClick={() => copyCode(scriptCode)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  copied ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}>
                {copied ? "✅ Copié !" : "Copier"}
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-xs text-zinc-400 font-mono leading-relaxed">{scriptCode}</pre>
          </div>

          {/* Instructions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h4 className="text-sm font-medium text-zinc-300 mb-2">📖 Comment ça marche</h4>
            <ol className="space-y-2 text-sm text-zinc-400 list-decimal list-inside">
              <li>Copie le script ci-dessus</li>
              <li>Colle-le dans la page produit de ton site (avant <code className="text-zinc-300">&lt;/body&gt;</code>)</li>
              <li>Le bouton <strong className="text-zinc-300">👕 Essayez-moi !</strong> apparaîtra en bas à droite</li>
              <li>Le widget <strong className="text-zinc-300">détecte automatiquement</strong> la photo du produit et son nom depuis la page</li>
              <li>Les clients uploadent leur photo → voient le rendu → peuvent acheter</li>
              <li><strong className="text-zinc-300">Zéro configuration</strong> - pas besoin d'ajouter les produits dans le dashboard</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Option iframe (alternative) */}
      <details className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-400 hover:text-zinc-200">
          🔧 Alternative : utiliser une iframe directe
        </summary>
        <div className="border-t border-zinc-800 p-4 space-y-3">
          <p className="text-xs text-zinc-500">Si tu préfères intégrer le widget directement dans ta page (sans bouton flottant), utilise ce code :</p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-400 font-mono leading-relaxed">{`<iframe
  src="${widgetUrl}"
  width="100%"
  height="700px"
  style="border:none; border-radius:12px; overflow:hidden;"
  loading="lazy"
  allow="camera"
></iframe>`}</pre>
          <button onClick={() => copyCode(
            `<iframe\n  src="${widgetUrl}"\n  width="100%"\n  height="700px"\n  style="border:none; border-radius:12px; overflow:hidden;"\n  loading="lazy"\n  allow="camera"\n></iframe>`
          )} className="rounded-lg bg-zinc-800 px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors">Copier l'iframe</button>
        </div>
      </details>

      {/* Paramètres avancés (URL) */}
      <details className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-400 hover:text-zinc-200">
          🔧 Paramètres avancés du widget
        </summary>
        <div className="border-t border-zinc-800 px-4 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs">
                <th className="text-left pb-2 pr-4">data-*</th>
                <th className="text-left pb-2 pr-4">Exemple</th>
                <th className="text-left pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              {[
                ["data-boutique", "Ma Boutique", "Nom de la boutique affiché"],
                ["data-primary", "#6366f1", "Couleur principale du bouton"],
                ["data-bg", "#0a0a0f", "Couleur de fond de la popup"],
                ["data-text", "#f4f4f5", "Couleur du texte"],
                ["data-btn-text", "Essayez-moi", "Texte du bouton flottant"],
                ["data-ton", "chaleureux", "Ton de l'assistant"],
                ["data-lang", "fr", "Langue (fr, en, ar)"],
                ["data-logo", "https://...", "URL du logo"],
                ["data-hide-chat", "true", "Cacher le chat"],
                ["data-product-image", "https://...", "Forcer l'image produit"],
                ["data-product-name", "T-Shirt", "Forcer le nom produit"],
                ["data-product-type", "t-shirt", "Forcer le type produit"],
                ["data-position", "bottom-right", "Position du bouton"],
              ].map(([param, exemple, desc]) => (
                <tr key={param}>
                  <td className="pb-1.5 pr-4 text-zinc-300 font-mono text-xs">{param}</td>
                  <td className="pb-1.5 pr-4 text-zinc-500 text-xs">{exemple}</td>
                  <td className="pb-1.5 text-zinc-500 text-xs">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
