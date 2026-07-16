/** Client API pour le backend lebeSsni */

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
  type_produit: string,
  mode: string = "article_unique",
  style_rendu: string = "studio catalogue",
  orientation: string = "portrait 3:4"
): Promise<{ image_url: string; id: string }> {
  const form = new FormData();
  form.append("person_image", personImage);
  form.append("product_image", productImage);
  form.append("request", JSON.stringify({
    mode,
    type_produit,
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
  upload_state?: string
): Promise<{ reply: string; suggested_actions: string[] }> {
  const res = await fetch(`${API_BASE}/api/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, upload_state }),
  });
  if (!res.ok) throw new Error("Erreur assistant");
  return res.json();
}
