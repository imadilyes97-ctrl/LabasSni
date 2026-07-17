import { NextRequest, NextResponse } from "next/server";
import type { TryOnResponse } from "@/lib/types";

const MAX_IMAGE_SIZE_MB = parseInt(
  process.env.MAX_IMAGE_SIZE_MB || "10",
  10
);
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const personImage = formData.get("person_image") as File | null;
    const productImage = formData.get("product_image") as File | null;
    const requestJson = formData.get("request") as string | null;

    if (!personImage || !productImage) {
      return NextResponse.json(
        { error: "person_image et product_image requis" },
        { status: 400 }
      );
    }

    // Valider les deux images
    for (const [name, file] of [
      ["person_image", personImage],
      ["product_image", productImage],
    ] as const) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `${name} doit être une image` },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `${name} trop volumineuse (max ${MAX_IMAGE_SIZE_MB}MB)`,
          },
          { status: 400 }
        );
      }
    }

    // Options de génération (JSON embarqué dans le form)
    let options: Record<string, string> = {
      mode: "article_unique",
      type_produit: "vêtement",
      zone_corps: "haut du corps",
      style_rendu: "studio catalogue",
      orientation: "portrait 3:4",
    };
    if (requestJson) {
      try {
        const parsed = JSON.parse(requestJson);
        options = { ...options, ...parsed };
      } catch {
        // JSON invalide — on garde les valeurs par défaut
      }
    }

    // TODO: Appel RunPod Serverless — implémentation à venir
    // Pour l'instant, mock "success" pour ne pas bloquer le build
    const id = crypto.randomUUID();

    const response: TryOnResponse = {
      id,
      status: "termine",
      mode: options.mode as TryOnResponse["mode"],
      message: "Génération réussie (mock)",
      validation_checklist: {
        visage_fidele: true,
        produit_fidele: true,
        mode_respecte: true,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const id = crypto.randomUUID();
    const response: TryOnResponse = {
      id,
      status: "echoue",
      mode: "article_unique",
      error:
        error instanceof Error ? error.message : "Erreur génération",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
