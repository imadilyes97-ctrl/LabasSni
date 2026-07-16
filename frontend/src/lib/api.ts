/** Client API pour le backend lebeSsni */

import type { TryOnResponse, DetectionResult, AssistantMessage } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function detectMode(
  type_produit: string,
  nombre_produits: number = 1,
  session_active: boolean = false
): Promise<{ mode: string; zone_corps: string; raison: string }> {
  const form = new FormData();
  form.append("type_produit", type_produit);
  form.append("nombre_produits", String(nombre_produits));
  form.append("session_active", String(session_active));

  const res = await fetch(`${API_BASE}/api/tryon/detect-mode`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Erreur détection mode");
  return res.json();
}

export async function generateTryOn(
  personImage: File,
  productImage: File,
  productType: string = "vêtement",
  mode: string = "article_unique",
  style_rendu: string = "studio catalogue",
  orientation: string = "portrait 3:4"
): Promise<TryOnResponse> {
  const form = new FormData();
  form.append("person_image", personImage);
  form.append("product_image", productImage);
  form.append("request", JSON.stringify({
    mode,
    type_produit: productType,
    zone_corps: "haut du corps",
    style_rendu,
    orientation,
  }));

  const res = await fetch(`${API_BASE}/api/tryon/generate`, {
    method: "POST",
    body: form,
  });
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
  const res = await fetch(`${API_BASE}/api/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, upload_state, ton, boutique }),
  });
  if (!res.ok) throw new Error("Erreur assistant");
  return res.json();
}

/* ── Dashboard API ── */

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface DashboardProduit {
  id: number;
  nom: string;
  product_type: string;
  image_url: string;
  generations_count: number;
  landing_slug: string;
}

export async function getDashboardProduits(): Promise<DashboardProduit[]> {
  const res = await fetch(`${API_BASE}/api/dashboard/produits`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Non authentifié");
  }
  if (!res.ok) throw new Error("Erreur chargement produits");
  return res.json();
}

export async function createDashboardProduit(data: {
  nom: string;
  description?: string;
  product_type: string;
  image_url: string;
}): Promise<DashboardProduit> {
  const res = await fetch(`${API_BASE}/api/dashboard/produits`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Non authentifié");
  }
  if (!res.ok) throw new Error("Erreur création produit");
  return res.json();
}

export async function deleteDashboardProduit(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/dashboard/produits/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Non authentifié");
  }
  if (!res.ok) throw new Error("Erreur suppression produit");
}

export interface DashboardCredits {
  plan: string;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  billing_period_start: string;
  billing_period_end: string;
  plans_disponibles?: { name: string; price: string; credits: number }[];
}

export async function getDashboardCredits(): Promise<DashboardCredits> {
  const res = await fetch(`${API_BASE}/api/dashboard/credits`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Non authentifié");
  }
  if (!res.ok) throw new Error("Erreur chargement crédits");
  return res.json();
}

export interface DashboardStats {
  visiteurs: number;
  generations: number;
  clics_achat: number;
  evolution: { date: string; visiteurs: number; generations: number; clics_achat: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/api/dashboard/stats`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Non authentifié");
  }
  if (!res.ok) throw new Error("Erreur chargement statistiques");
  return res.json();
}

export interface DashboardConfig {
  ton_assistant: string;
  duree_retention: string;
  pixel_meta: string;
  pixel_tiktok: string;
  webhook_url: string;
}

export async function getDashboardConfig(): Promise<DashboardConfig> {
  const res = await fetch(`${API_BASE}/api/dashboard/config`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Non authentifié");
  }
  if (!res.ok) throw new Error("Erreur chargement configuration");
  return res.json();
}

export async function updateDashboardConfig(
  data: Partial<DashboardConfig>
): Promise<DashboardConfig> {
  const res = await fetch(`${API_BASE}/api/dashboard/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Non authentifié");
  }
  if (!res.ok) throw new Error("Erreur mise à jour configuration");
  return res.json();
}
