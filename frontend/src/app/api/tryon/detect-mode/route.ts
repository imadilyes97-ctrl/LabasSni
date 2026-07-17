import { NextRequest, NextResponse } from "next/server";

const PRODUCT_ZONE_MAP: Record<string, string> = {
  "t-shirt": "haut du corps",
  chemise: "haut du corps",
  veste: "haut du corps",
  manteau: "haut du corps",
  pull: "haut du corps",
  débardeur: "haut du corps",
  pantalon: "bas du corps",
  jean: "bas du corps",
  short: "bas du corps",
  jupe: "bas du corps",
  robe: "corps entier",
  combinaison: "corps entier",
  basket: "pieds",
  chaussures: "pieds",
  sandales: "pieds",
  accessoire: "haut du corps",
  bijou: "haut du corps",
  sac: "haut du corps",
  ceinture: "bas du corps",
  chapeau: "haut du corps",
};

function detectProductZone(typeProduit: string): string {
  const lower = typeProduit.toLowerCase().trim();
  for (const [key, zone] of Object.entries(PRODUCT_ZONE_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return zone;
    }
  }
  return "haut du corps";
}

function detectMode(
  typeProduit: string,
  nombreProduits: number,
  sessionActive: boolean
): { mode: string; type_produit: string; zone_corps: string; raison: string } {
  const zone = detectProductZone(typeProduit);

  if (sessionActive) {
    return {
      mode: "sequentiel",
      type_produit: typeProduit,
      zone_corps: zone,
      raison: "Session active: ajout séquentiel",
    };
  }

  if (nombreProduits >= 2) {
    return {
      mode: "tenue_complete",
      type_produit: `${nombreProduits} articles`,
      zone_corps: "corps entier",
      raison: `${nombreProduits} produits: tenue complète`,
    };
  }

  return {
    mode: "article_unique",
    type_produit: typeProduit,
    zone_corps: zone,
    raison: `1 produit (${typeProduit}): article unique`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const typeProduit = (formData.get("type_produit") as string) || "";
    const nombreProduits = parseInt(
      (formData.get("nombre_produits") as string) || "1",
      10
    );
    const sessionActive =
      (formData.get("session_active") as string) === "true";

    const result = detectMode(typeProduit, nombreProduits, sessionActive);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur détection mode" },
      { status: 400 }
    );
  }
}
