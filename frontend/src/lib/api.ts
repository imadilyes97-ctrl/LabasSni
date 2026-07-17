/** Client API pour lebeSsni */

import type { TryOnResponse } from "@/lib/types";

/* ── Auth API ── */

export async function register(nom_boutique: string, email: string, password: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom_boutique, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Erreur inscription");
  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Erreur connexion");
  return data;
}

export async function getMe() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch("/api/auth/me", { headers });
  if (!res.ok) throw new Error("Non authentifié");
  return res.json();
}

/* ── TryOn API ── */

export async function generateTryOn(
  personImage: File,
  productType: string = "vêtement",
  mode: string = "article_unique"
): Promise<TryOnResponse> {
  const form = new FormData();
  form.append("person_image", personImage);
  form.append("request", JSON.stringify({ mode, type_produit: productType }));

  const res = await fetch("/api/tryon/generate", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erreur génération");
  }
  return res.json();
}

export async function assistantChat(
  message: string,
  upload_state?: string,
  ton?: string,
  boutique?: string
): Promise<{ reply: string; suggested_actions: string[] }> {
  const res = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, upload_state, ton, boutique }),
  });
  if (!res.ok) throw new Error("Erreur assistant");
  return res.json();
}

/* ── Dashboard Config API ── */

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface DashboardConfig {
  ton_assistant: string; duree_retention: string; pixel_meta: string; pixel_tiktok: string; webhook_url: string;
}

export async function getDashboardConfig(): Promise<DashboardConfig> {
  const res = await fetch("/api/dashboard/config", { headers: { ...authHeaders() } });
  if (res.status === 401) { if (typeof window !== "undefined") window.location.href = "/login"; throw new Error("Non authentifié"); }
  if (!res.ok) throw new Error("Erreur chargement configuration");
  return res.json();
}

export async function updateDashboardConfig(data: Partial<DashboardConfig>): Promise<DashboardConfig> {
  const res = await fetch("/api/dashboard/config", {
    method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (res.status === 401) { if (typeof window !== "undefined") window.location.href = "/login"; throw new Error("Non authentifié"); }
  if (!res.ok) throw new Error("Erreur mise à jour configuration");
  return res.json();
}
