"use client";

import type { TryonMode } from "@/lib/types";

interface ModeSelectorProps {
  mode: TryonMode;
  onChange: (mode: TryonMode) => void;
}

const MODES: { value: TryonMode; label: string; desc: string }[] = [
  {
    value: "article_unique",
    label: "Article unique",
    desc: "Un seul produit à essayer",
  },
  {
    value: "tenue_complete",
    label: "Tenue complète",
    desc: "Plusieurs produits ensemble",
  },
  {
    value: "sequentiel",
    label: "Ajout progressif",
    desc: "Un par un, en gardant les précédents",
  },
];

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${
            mode === m.value
              ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
              : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"
          }`}
        >
          <div className="font-medium">{m.label}</div>
          <div className="text-[11px] opacity-60">{m.desc}</div>
        </button>
      ))}
    </div>
  );
}
