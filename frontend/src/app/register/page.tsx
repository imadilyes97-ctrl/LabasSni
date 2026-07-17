"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [nomBoutique, setNomBoutique] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomBoutique || !email || !password) {
      setError("Tous les champs sont requis");
      return;
    }
    if (password.length < 6) {
      setError("Mot de passe trop court (min 6 caractères)");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await register(nomBoutique, email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("client_id", data.client_id);
      localStorage.setItem("nom_boutique", data.nom_boutique);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-100">Créer un compte</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Commence à vendre avec l&apos;essayage virtuel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Nom de la boutique
            </label>
            <input
              type="text"
              value={nomBoutique}
              onChange={(e) => setNomBoutique(e.target.value)}
              placeholder="Ma Boutique"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-600"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 caractères"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 placeholder-zinc-600"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Inscription..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
