"use client";

import { useState } from "react";

type Tab = "produits" | "config" | "stats" | "credits";

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("produits");

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
          <span className="text-sm text-zinc-500">Vendeur · Demo</span>
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

function ProduitsTab() {
  const [products] = useState([
    { id: "1", name: "T-shirt Noir", type: "t-shirt", landing: "lebessni.com/p/1", generations: 12 },
    { id: "2", name: "Baskets Blanches", type: "basket", landing: "lebessni.com/p/2", generations: 8 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-200">Mes produits</h2>
        <button className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
          + Nouveau produit
        </button>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
            <div>
              <p className="font-medium text-zinc-200">{p.name}</p>
              <p className="text-xs text-zinc-500">{p.type} · Landing: {p.landing}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-500">{p.generations} générations</span>
              <button className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors">
                Widget
              </button>
              <button className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors">
                Landing
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigTab() {
  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-lg font-semibold text-zinc-200">Configuration</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Ton de l&apos;assistant</label>
          <select className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500">
            <option>Chaleureux et rassurant</option>
            <option>Élégant et premium</option>
            <option>Décontracté et amical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Durée de rétention des photos</label>
          <select className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500">
            <option>24 heures</option>
            <option>48 heures</option>
            <option>72 heures</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Pixel Meta (optionnel)</label>
          <input type="text" placeholder="Votre pixel ID" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-600" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Pixel TikTok (optionnel)</label>
          <input type="text" placeholder="Votre pixel ID" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-600" />
        </div>

        <button className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function StatsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-200">Statistiques</h2>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Visiteurs", value: "156", change: "+12%", up: true },
          { label: "Générations", value: "89", change: "+8%", up: true },
          { label: "Clics achat", value: "23", change: "-3%", up: false },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{s.value}</p>
            <p className={`mt-1 text-xs ${s.up ? "text-emerald-400" : "text-red-400"}`}>{s.change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">Évolution des générations (7 jours)</h3>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {[40, 65, 45, 80, 55, 70, 89].map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-indigo-500/60 transition-all hover:bg-indigo-500"
                style={{ height: `${v}%` }}
              />
              <span className="text-[10px] text-zinc-600">J{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreditsTab() {
  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-lg font-semibold text-zinc-200">Crédits</h2>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-sm text-zinc-500">Crédits restants</p>
        <p className="text-4xl font-bold text-zinc-100 my-2">42</p>
        <p className="text-xs text-zinc-600">sur 100 ce mois-ci</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-[42%] rounded-full bg-indigo-500" />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Plans disponibles</h3>
        <div className="space-y-3">
          {[
            { name: "Starter", price: "19€", credits: 50 },
            { name: "Pro", price: "49€", credits: 200 },
            { name: "Business", price: "99€", credits: 500 },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-200">{p.name}</p>
                <p className="text-xs text-zinc-500">{p.credits} crédits/mois</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-zinc-200">{p.price}</span>
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
