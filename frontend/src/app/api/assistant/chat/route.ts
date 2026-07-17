import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  message: string;
  upload_state?: string;
  ton?: string;
  boutique?: string;
  tenant_id?: string;
}

interface ChatResponse {
  reply: string;
  suggested_actions: string[];
}

function getReply(
  message: string,
  uploadState?: string | null,
  _ton?: string | null,
  _boutique?: string | null
): string {
  if (!uploadState || uploadState === "initial") {
    return (
      "👋 Bienvenue sur l'essayage virtuel ! Prends une photo de toi " +
      "(de face, bien éclairée). 🔒 Ta photo est utilisée uniquement " +
      "pour la génération et supprimée après 24h."
    );
  }

  if (uploadState === "uploading") {
    return "📸 Parfait ! J'analyse ta photo... Prêt à voir le rendu ?";
  }

  if (uploadState === "generating") {
    return (
      "✨ Génération en cours ! Ça peut prendre jusqu'à 30 secondes " +
      "la première fois."
    );
  }

  const lower = message.toLowerCase();

  if (
    lower.includes("confidentialité") ||
    lower.includes("privé") ||
    lower.includes("privée")
  ) {
    return (
      "🔒 Ta photo est utilisée uniquement pour générer l'aperçu. " +
      "Supprimée automatiquement après 24h. Jamais partagée."
    );
  }

  if (
    lower.includes("erreur") ||
    lower.includes("échec") ||
    lower.includes("marche pas")
  ) {
    return (
      "😅 Désolé, un problème est survenu. Essaie avec une photo " +
      "bien éclairée, de face, visage visible. Tu veux réessayer ?"
    );
  }

  if (
    lower.includes("résultat") ||
    lower.includes("vois") ||
    lower.includes("rendu")
  ) {
    return (
      "✨ Voici un aperçu généré par IA — le rendu réel peut " +
      "légèrement varier. Tu peux ajouter au panier, voir d'autres " +
      "tailles/couleurs, ou réessayer avec une autre photo."
    );
  }

  if (
    lower.includes("livraison") ||
    lower.includes("prix") ||
    lower.includes("taille")
  ) {
    return (
      "📞 Pour les questions de livraison, taille ou prix, " +
      "le service client pourra te renseigner !"
    );
  }

  return (
    "📸 C'est simple : upload ta photo, choisis le produit, " +
    "et on génère le rendu en quelques secondes. " +
    "Besoin d'aide ? Dis-moi !"
  );
}

function getActions(reply: string): string[] {
  if (
    reply.includes("confidentialité") ||
    reply.includes("supprimée")
  ) {
    return ["Uploader ma photo", "Voir les produits"];
  }
  if (reply.includes("réessayer")) {
    return [
      "Prendre une nouvelle photo",
      "Choisir un autre produit",
    ];
  }
  if (reply.includes("aperçu")) {
    return [
      "Ajouter au panier",
      "Réessayer",
      "Voir d'autres tailles",
    ];
  }
  return [
    "Uploader ma photo",
    "Comment ça marche ?",
    "Confidentialité ?",
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const message = body.message || "";
    const uploadState = body.upload_state || null;
    const ton = body.ton || null;
    const boutique = body.boutique || null;

    const reply = getReply(message, uploadState, ton, boutique);
    const suggested_actions = getActions(reply);

    const response: ChatResponse = { reply, suggested_actions };
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        reply:
          "😅 Désolé, je n'ai pas compris. Peux-tu reformuler ?",
        suggested_actions: [
          "Uploader ma photo",
          "Comment ça marche ?",
        ],
      },
      { status: 200 }
    );
  }
}
