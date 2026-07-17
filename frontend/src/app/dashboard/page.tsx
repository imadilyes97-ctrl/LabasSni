"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getDashboardProduits,
  createDashboardProduit,
  deleteDashboardProduit,
  getDashboardCredits,
  getDashboardStats,
  getDashboardConfig,
  updateDashboardConfig,
  type DashboardProduit,
  type DashboardCredits,
  type DashboardStats,
  type DashboardConfig,
} from "@/lib/api";

type Tab = "produits" | "config" | "stats" | "credits";

/* ── Types des plans (fallback si API ne les renvoie pas) ── */
const DEFAULT_PLANS = [
  { name: "Starter", price: "19€", credits: 50 },
  { name: "Pro", price: "49€", credits: 200 },
  { name: "Business", price: "99€", credits: 500 },
];

/* ── Helpers ── */
function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function computeChange(arr: number[]): { label: string; up: boolean } | null {
  if (arr.length < 2) return null;
  const prev = arr[arr.length - 2];
  const curr = arr[arr.length - 1];
  if (prev === 0) return { label: "Nouveau", up: true };
  const pct = Math.round(((curr - prev) / prev) * 100);
  const sign = pct >= 0 ? "+" : "";
  return { label: `${sign}${pct}%`, up: pct >= 0 };
}

const PRODUCT_TYPE_OPTIONS = [
  "t-shirt",
  "chemise",
  "veste",
  "manteau",
  "pull",
  "pantalon",
  "jean",
  "short",
  "jupe",
  "robe",
  "basket",
  "chaussures",
  "accessoire",
  "tenue_complete",
];

/* ── Composable Toast ── */
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed right-6 top-6 z-50 rounded-xl px-5 py-3 text-sm font-medium shadow-lg transition-all ${
        type === "success"
          ? "bg-emerald-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {message}
    </div>
  );
}

/* ── Modal Nouveau Produit ── */
function ProduitModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [nom, setNom] = useState("");
  const [productType, setProductType] = useState("t-shirt");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError("Le nom est requis");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createDashboardProduit({
        nom: nom.trim(),
        product_type: productType,
        image_url: imageUrl.trim(),
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur création produit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">
          Nouveau produit
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: T-shirt Noir Premium"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Type de produit
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500"
            >
              {PRODUCT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-600"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 px-5 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "Création..." : "Créer le produit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Toast de confirmation ── */
function ConfirmDeleteModal({
  productName,
  onConfirm,
  onCancel,
  loading,
}: {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-zinc-100 mb-2">
          Supprimer le produit ?
        </h3>
        <p className="text-sm text-zinc-400 mb-5">
          Tu vas supprimer <strong className="text-zinc-200">{productName}</strong>. Cette action est
          irreversible.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-zinc-700 px-5 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Bannière mode démo ── */
function DemoSpan() {
  return (
    <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
      Mode démo — les données ne sont pas synchronisées
    </span>
  );
}

/* ===================================================================
   PAGE PRINCIPALE
   =================================================================== */

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("produits");
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
    { key: "produits", label: "📦 Produits" },
    { key: "config", label: "⚙️ Configuration" },
    { key: "stats", label: "📊 Statistiques" },
    { key: "credits", label: "💰 Crédits" },
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
        {tab === "produits" && <ProduitsTab />}
        {tab === "config" && <ConfigTab />}
        {tab === "stats" && <StatsTab />}
        {tab === "credits" && <CreditsTab />}
      </div>
    </div>
  );
}

/* ===================================================================
   PRODUITS TAB
   =================================================================== */

function ProduitsTab() {
  const [produits, setProduits] = useState<DashboardProduit[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    nom: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProduits = useCallback(async () => {
    setLoading(true);
    setDemo(false);
    try {
      const data = await getDashboardProduits();
      setProduits(data);
    } catch {
      setDemo(true);
      setProduits([
        {
          id: 1,
          nom: "T-shirt Noir",
          product_type: "t-shirt",
          image_url: "",
          generations_count: 12,
          landing_slug: "lebessni.com/p/1",
        },
        {
          id: 2,
          nom: "Baskets Blanches",
          product_type: "basket",
          image_url: "",
          generations_count: 8,
          landing_slug: "lebessni.com/p/2",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProduits();
  }, [fetchProduits]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDashboardProduit(deleteTarget.id);
      setProduits((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setToast({ message: "Produit supprimé", type: "success" });
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : "Erreur suppression",
        type: "error",
      });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          productName={deleteTarget.nom}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      {showModal && (
        <ProduitModal
          onClose={() => setShowModal(false)}
          onCreated={fetchProduits}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-zinc-200">Mes produits</h2>
          {demo && <DemoSpan />}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          + Nouveau produit
        </button>
      </div>

      <div className="space-y-3">
        {produits.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4"
          >
            <div>
              <p className="font-medium text-zinc-200">{p.nom}</p>
              <p className="text-xs text-zinc-500">
                {p.product_type} · Landing: {p.landing_slug}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-500">
                {p.generations_count} générations
              </span>
              <button className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors">
                Widget
              </button>
              <button className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors">
                Landing
              </button>
              <button
                onClick={() => setDeleteTarget({ id: p.id, nom: p.nom })}
                className="rounded-lg border border-red-800/50 px-3 py-1 text-xs text-red-400 hover:bg-red-900/30 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
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
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-200">Configuration</h2>
        {demo && <DemoSpan />}
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
   STATS TAB
   =================================================================== */

function StatsTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setDemo(false);
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch {
        setDemo(true);
        setStats({
          visiteurs: 156,
          generations: 89,
          clics_achat: 23,
          evolution: [
            { date: "J1", visiteurs: 10, generations: 3, clics_achat: 1 },
            { date: "J2", visiteurs: 25, generations: 8, clics_achat: 2 },
            { date: "J3", visiteurs: 18, generations: 5, clics_achat: 1 },
            { date: "J4", visiteurs: 40, generations: 12, clics_achat: 4 },
            { date: "J5", visiteurs: 30, generations: 10, clics_achat: 3 },
            { date: "J6", visiteurs: 50, generations: 15, clics_achat: 5 },
            { date: "J7", visiteurs: 65, generations: 20, clics_achat: 7 },
          ],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-indigo-500" />
      </div>
    );
  }

  if (!stats) return null;

  const genValues = stats.evolution.map((e) => e.generations);
  const barMax = Math.max(...genValues, 1);
  const genChange = computeChange(genValues);
  const visChange = computeChange(stats.evolution.map((e) => e.visiteurs));
  const clicChange = computeChange(stats.evolution.map((e) => e.clics_achat));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-200">Statistiques</h2>
        {demo && <DemoSpan />}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Visiteurs",
            value: stats.visiteurs,
            change: visChange,
          },
          {
            label: "Générations",
            value: stats.generations,
            change: genChange,
          },
          {
            label: "Clics achat",
            value: stats.clics_achat,
            change: clicChange,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
          >
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">
              {s.value.toLocaleString()}
            </p>
            {s.change && (
              <p
                className={`mt-1 text-xs ${
                  s.change.up ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {s.change.label}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">
          Évolution des générations (7 jours)
        </h3>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {stats.evolution.map((e, i) => {
            const pct = (e.generations / barMax) * 100;
            return (
              <div
                key={i}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t bg-indigo-500/60 transition-all hover:bg-indigo-500"
                  style={{ height: `${pct}%` }}
                  title={`${e.generations} générations`}
                />
                <span className="text-[10px] text-zinc-600">
                  {e.date.length > 5
                    ? formatDate(e.date)
                    : e.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===================================================================
   CREDITS TAB
   =================================================================== */

function CreditsTab() {
  const [credits, setCredits] = useState<DashboardCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setDemo(false);
      try {
        const data = await getDashboardCredits();
        setCredits(data);
      } catch {
        setDemo(true);
        setCredits({
          plan: "Starter",
          credits_total: 100,
          credits_used: 58,
          credits_remaining: 42,
          billing_period_start: "2026-07-01",
          billing_period_end: "2026-07-31",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-indigo-500" />
      </div>
    );
  }

  if (!credits) return null;

  const usedPct =
    credits.credits_total > 0
      ? Math.round((credits.credits_used / credits.credits_total) * 100)
      : 0;

  const plansDisponibles =
    credits.plans_disponibles && credits.plans_disponibles.length > 0
      ? credits.plans_disponibles
      : DEFAULT_PLANS;

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-200">Crédits</h2>
        {demo && <DemoSpan />}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-sm text-zinc-500">Crédits restants</p>
        <p className="text-4xl font-bold text-zinc-100 my-2">
          {credits.credits_remaining}
        </p>
        <p className="text-xs text-zinc-600">
          sur {credits.credits_total} ce mois-ci · Plan {credits.plan}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        {credits.billing_period_start && (
          <p className="mt-3 text-[11px] text-zinc-600">
            Période : {formatDate(credits.billing_period_start)} —{" "}
            {formatDate(credits.billing_period_end)}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">
          Plans disponibles
        </h3>
        <div className="space-y-3">
          {plansDisponibles.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800/30 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-200">{p.name}</p>
                <p className="text-xs text-zinc-500">
                  {p.credits} crédits/mois
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-zinc-200">
                  {p.price}
                </span>
                <button className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors">
                  Choisir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
